import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  cloneRoom,
  createLiveSnapshot,
  createLocalRoom,
  createMockMessages,
  createMockRooms,
  createSystemMessage,
} from '@/lib/mockMultiplayer';
import { trackAchievementEvent } from '@/services/achievementService';
import type { GameConfig } from '@/types/game';
import type { ChatMessage, Room, RoomResultEntry, SocketEventName } from '@/types/socket';

type ConnectionState = 'connecting' | 'connected' | 'offline';

const CLIENT_ID = `local_${Math.random().toString(36).slice(2, 10)}`;

const cloneRooms = (rooms: Room[]) => rooms.map((room) => cloneRoom(room));

const buildResultsFromRoom = (room: Room): RoomResultEntry[] =>
  [...room.players]
    .sort((left, right) => right.score - left.score || right.progress - left.progress || left.latency - right.latency)
    .map((player, index) => ({
      playerId: player.id,
      playerName: player.name,
      placement: index + 1,
      score: player.score,
      duration: Number((32 + index * 2.1).toFixed(2)),
      progress: player.progress,
      isHost: player.isHost,
      role: 'player',
    }));

const normalizeRoomAfterUpdate = (room: Room): Room => ({
  ...room,
  spectators: room.spectators ?? [],
  spectatorCount: room.spectatorCount ?? room.spectators?.length ?? 0,
  liveSnapshots: room.liveSnapshots ?? [],
  results: room.results,
});

export const useSocket = (url = 'http://localhost:3000') => {
  const socketRef = useRef<Socket | null>(null);
  const initialRooms = useMemo(() => cloneRooms(createMockRooms()), []);
  const initialMessages = useMemo(() => createMockMessages(initialRooms), [initialRooms]);

  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [remoteRooms, setRemoteRooms] = useState<Room[]>([]);
  const [remoteCurrentRoom, setRemoteCurrentRoom] = useState<Room | null>(null);
  const [remoteMessages, setRemoteMessages] = useState<ChatMessage[]>([]);
  const [localRooms, setLocalRooms] = useState<Room[]>(initialRooms);
  const [localMessagesByRoom, setLocalMessagesByRoom] = useState<Record<string, ChatMessage[]>>(initialMessages);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const isConnected = connectionState === 'connected';
  const usingRemoteData = isConnected && remoteRooms.length > 0;

  useEffect(() => {
    const nextSocket = io(url, {
      transports: ['websocket'],
      autoConnect: true,
      reconnectionAttempts: 1,
      timeout: 2500,
    });

    nextSocket.on('connect', () => {
      setConnectionState('connected');
      setLastError(null);
    });

    nextSocket.on('connect_error', (error) => {
      setConnectionState('offline');
      setLastError(error.message || 'Connection failed');
    });

    nextSocket.on('disconnect', () => {
      setConnectionState('offline');
    });

    nextSocket.on('room:list', (data: Room[]) => {
      setRemoteRooms(data.map(normalizeRoomAfterUpdate));
    });

    nextSocket.on('room:update', (data: Room) => {
      const nextRoom = normalizeRoomAfterUpdate(data);
      setRemoteCurrentRoom(nextRoom);
      setRemoteRooms((current) => {
        const found = current.some((room) => room.id === nextRoom.id);
        if (!found) {
          return [nextRoom, ...current];
        }
        return current.map((room) => (room.id === nextRoom.id ? nextRoom : room));
      });
    });

    nextSocket.on('room:join', (data: Room) => {
      const nextRoom = normalizeRoomAfterUpdate(data);
      setRemoteCurrentRoom(nextRoom);
      setRemoteRooms((current) => {
        const found = current.some((room) => room.id === nextRoom.id);
        if (!found) {
          return [nextRoom, ...current];
        }
        return current.map((room) => (room.id === nextRoom.id ? nextRoom : room));
      });
    });

    nextSocket.on('room:results', (data: Room) => {
      const nextRoom = normalizeRoomAfterUpdate(data);
      setRemoteCurrentRoom(nextRoom);
      setRemoteRooms((current) => current.map((room) => (room.id === nextRoom.id ? nextRoom : room)));
    });

    nextSocket.on('room:leave', () => {
      setRemoteCurrentRoom(null);
    });

    nextSocket.on('chat:message', (data: ChatMessage) => {
      setRemoteMessages((current) => [...current, data]);
    });
    socketRef.current = nextSocket;

    return () => {
      nextSocket.disconnect();
    };
  }, [url]);

  const rooms = useMemo(() => (usingRemoteData ? remoteRooms : localRooms), [localRooms, remoteRooms, usingRemoteData]);

  const currentRoom = useMemo(() => {
    if (usingRemoteData) {
      return remoteCurrentRoom;
    }
    return rooms.find((room) => room.id === currentRoomId) ?? null;
  }, [currentRoomId, remoteCurrentRoom, rooms, usingRemoteData]);

  const messages = useMemo(() => {
    if (usingRemoteData) {
      return remoteMessages;
    }
    if (!currentRoom) {
      return [];
    }
    return localMessagesByRoom[currentRoom.id] ?? [];
  }, [currentRoom, localMessagesByRoom, remoteMessages, usingRemoteData]);

  const updateLocalRoom = useCallback((roomId: string, updater: (room: Room) => Room) => {
    setLocalRooms((current) =>
      current.map((room) => {
        if (room.id !== roomId) {
          return room;
        }
        return updater(cloneRoom(room));
      })
    );
  }, []);

  const emit = useCallback(
    <T,>(event: SocketEventName, data: T) => {
      socketRef.current?.emit(event, data);
    },
    []
  );

  const appendLocalMessage = useCallback((roomId: string, message: ChatMessage) => {
    setLocalMessagesByRoom((current) => ({
      ...current,
      [roomId]: [...(current[roomId] ?? []), message],
    }));
  }, []);

  const joinRoom = useCallback(
    (roomId: string, playerName: string) => {
      emit('room:join', { roomId, playerName });
      trackAchievementEvent({
        type: 'multiplayer:room_joined',
        timestamp: Date.now(),
        source: 'socket',
        payload: { roomId },
      });

      if (usingRemoteData) return;

      let joined = false;
      updateLocalRoom(roomId, (room) => {
        if (room.status !== 'waiting') {
          return room;
        }

        if (room.players.some((player) => player.id === CLIENT_ID)) {
          joined = true;
          return room;
        }

        room.players.push({
          id: CLIENT_ID,
          name: playerName,
          ready: true,
          connected: true,
          isHost: false,
          score: 0,
          progress: 0,
          latency: 23,
          role: 'player',
        });
        joined = true;
        return {
          ...room,
          chatHeat: room.chatHeat + 1,
        };
      });

      if (joined) {
        setCurrentRoomId(roomId);
        appendLocalMessage(roomId, createSystemMessage(roomId, `${playerName} joined the room.`));
      }
    },
    [appendLocalMessage, emit, updateLocalRoom, usingRemoteData]
  );

  const spectateRoom = useCallback(
    (roomId: string, spectatorName: string) => {
      emit('room:spectate', { roomId, spectatorName });

      if (usingRemoteData) return;

      updateLocalRoom(roomId, (room) => {
        if (!room.spectators.some((spectator) => spectator.id === CLIENT_ID)) {
          room.spectators.push({
            id: CLIENT_ID,
            name: spectatorName,
            connected: true,
            joinedAt: Date.now(),
            role: 'spectator',
          });
        }

        return {
          ...room,
          spectatorCount: room.spectators.length,
          chatHeat: room.chatHeat + 1,
        };
      });
      setCurrentRoomId(roomId);
      appendLocalMessage(roomId, createSystemMessage(roomId, `${spectatorName} is now spectating.`));
    },
    [appendLocalMessage, emit, updateLocalRoom, usingRemoteData]
  );

  const createRoom = useCallback(
    (config: GameConfig, playerName: string) => {
      emit('room:create', { config, playerName });
      trackAchievementEvent({
        type: 'multiplayer:room_created',
        timestamp: Date.now(),
        source: 'socket',
        payload: {},
      });

      if (usingRemoteData) return;

      const nextRoom = createLocalRoom(config, CLIENT_ID, playerName);
      setLocalRooms((current) => [nextRoom, ...current]);
      setLocalMessagesByRoom((current) => ({
        ...current,
        [nextRoom.id]: [createSystemMessage(nextRoom.id, `${playerName} opened ${nextRoom.inviteCode}.`)],
      }));
      setCurrentRoomId(nextRoom.id);
    },
    [emit, usingRemoteData]
  );

  const leaveRoom = useCallback(() => {
    const roomId = currentRoom?.id;
    emit('room:leave', {});
    trackAchievementEvent({
      type: 'multiplayer:room_left',
      timestamp: Date.now(),
      source: 'socket',
      payload: { roomId },
    });

    if (usingRemoteData) {
      setRemoteCurrentRoom(null);
      return;
    }

    setCurrentRoomId(null);
  }, [currentRoom?.id, emit, usingRemoteData]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim()) return;

      emit('chat:message', { content });
      trackAchievementEvent({
        type: 'multiplayer:message_sent',
        timestamp: Date.now(),
        source: 'socket',
        payload: {
          roomId: currentRoom?.id,
          length: content.trim().length,
        },
      });

      if (usingRemoteData || !currentRoom) return;

      appendLocalMessage(currentRoom.id, {
        id: `msg_${Date.now().toString(36)}`,
        roomId: currentRoom.id,
        playerId: CLIENT_ID,
        playerName:
          currentRoom.players.find((player) => player.id === CLIENT_ID)?.name ??
          currentRoom.spectators.find((spectator) => spectator.id === CLIENT_ID)?.name ??
          'You',
        content: content.trim(),
        timestamp: Date.now(),
        type: 'normal',
      });

      updateLocalRoom(currentRoom.id, (room) => ({
        ...room,
        chatHeat: room.chatHeat + 1,
      }));
    },
    [appendLocalMessage, currentRoom, emit, updateLocalRoom, usingRemoteData]
  );

  const joinByInviteCode = useCallback(
    (inviteCode: string, playerName: string) => {
      const normalizedCode = inviteCode.trim().toUpperCase();
      if (!normalizedCode) {
        return false;
      }

      const targetRoom = rooms.find((room) => room.inviteCode.toUpperCase() === normalizedCode);
      if (!targetRoom) {
        return false;
      }

      if (targetRoom.status === 'waiting') {
        joinRoom(targetRoom.id, playerName);
      } else {
        spectateRoom(targetRoom.id, playerName);
      }

      return true;
    },
    [joinRoom, rooms, spectateRoom]
  );

  const setFocusPlayer = useCallback(
    (playerId: string) => {
      emit('room:focus', { playerId });

      if (usingRemoteData || !currentRoom) return;

      updateLocalRoom(currentRoom.id, (room) => ({
        ...room,
        currentFocusPlayerId: playerId,
      }));
    },
    [currentRoom, emit, updateLocalRoom, usingRemoteData]
  );

  const startRoom = useCallback(() => {
    if (!currentRoom) return;

    emit('room:start', { roomId: currentRoom.id });

    if (usingRemoteData) return;

    updateLocalRoom(currentRoom.id, (room) => ({
      ...room,
      status: 'playing',
      startedAt: Date.now(),
      currentFocusPlayerId: room.currentFocusPlayerId ?? room.players[0]?.id,
      liveSnapshots:
        room.liveSnapshots.length > 0
          ? room.liveSnapshots
          : room.players.map((player, index) =>
              createLiveSnapshot(player, room.config, {
                stepsRemoved: 8 + index * 2,
                score: player.score,
                progress: player.progress,
                elapsedTime: 0,
                combo: index + 1,
              })
            ),
    }));
  }, [currentRoom, emit, updateLocalRoom, usingRemoteData]);

  const finishRoom = useCallback(() => {
    if (!currentRoom) return;

    if (usingRemoteData) {
      emit('game:end', { roomId: currentRoom.id });
      trackAchievementEvent({
        type: 'multiplayer:match_finished',
        timestamp: Date.now(),
        source: 'socket',
        payload: {
          roomId: currentRoom.id,
          result: 'win',
        },
      });
      return;
    }

    trackAchievementEvent({
      type: 'multiplayer:match_finished',
      timestamp: Date.now(),
      source: 'socket',
      payload: {
        roomId: currentRoom.id,
        result: 'win',
      },
    });

    updateLocalRoom(currentRoom.id, (room) => ({
      ...room,
      status: 'finished',
      results: room.results ?? buildResultsFromRoom(room),
      resultSummary:
        room.resultSummary ??
        {
          headline: `${room.players[0]?.name ?? 'Host'} kept the crowd focused through the final section.`,
          moments: [
            { id: 'pace', label: 'Top pace', value: 'Controlled' },
            { id: 'pressure', label: 'Pressure', value: 'High' },
            { id: 'crowd', label: 'Crowd heat', value: `${room.chatHeat}` },
          ],
        },
    }));
  }, [currentRoom, emit, updateLocalRoom, usingRemoteData]);

  const restartRoom = useCallback(() => {
    if (!currentRoom) return;

    if (usingRemoteData) {
      emit('room:start', { roomId: currentRoom.id, restart: true });
      return;
    }

    updateLocalRoom(currentRoom.id, (room) => ({
      ...room,
      status: 'waiting',
      startedAt: undefined,
      results: undefined,
      resultSummary: undefined,
      currentFocusPlayerId: room.players[0]?.id,
    }));
  }, [currentRoom, emit, updateLocalRoom, usingRemoteData]);

  return {
    isConnected,
    connectionState,
    lastError,
    rooms,
    currentRoom,
    messages,
    emit,
    joinRoom,
    spectateRoom,
    leaveRoom,
    createRoom,
    sendMessage,
    joinByInviteCode,
    setFocusPlayer,
    startRoom,
    finishRoom,
    restartRoom,
  };
};
