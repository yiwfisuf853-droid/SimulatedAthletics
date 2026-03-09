'use client';
import React, { useEffect, useMemo, useState } from 'react';
import MultiplayerBoard from '@/components/multiplayer/MultiplayerBoard';
import {
  cn,
  controlButtonClass,
  controlGroupClass,
  controlInputClass,
  panelCardClass,
  panelEyebrowClass,
  panelTitleClass,
} from '@/components/ui/classes';
import { useI18n } from '@/hooks/useI18n';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSocket } from '@/hooks/useSocket';
import { useConfigStore } from '@/stores/configStore';
import type { ChatMessage, MultiplayerViewState, Room, RoomLiveSnapshot, RoomPlayer, RoomResultEntry } from '@/types/socket';

const formatElapsed = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

const formatStatus = (room: Room, locale: string) => {
  if (locale === 'zh-CN') {
    if (room.status === 'playing') return '进行中';
    if (room.status === 'finished') return '已结算';
    if (room.status === 'countdown') return '倒计时';
    return '等待中';
  }

  if (room.status === 'playing') return 'Live';
  if (room.status === 'finished') return 'Results';
  if (room.status === 'countdown') return 'Countdown';
  return 'Waiting';
};

const buildConfigSummary = (room: Room) =>
  `${room.config.size}x${room.config.size} · ${room.config.layers + 1} layers · seed ${room.seed}`;

const findFocusedSnapshot = (room: Room | null): RoomLiveSnapshot | null => {
  if (!room || room.liveSnapshots.length === 0) return null;
  return (
    room.liveSnapshots.find((snapshot) => snapshot.playerId === room.currentFocusPlayerId) ??
    room.liveSnapshots[0] ??
    null
  );
};

const sortPlayersForStanding = (players: RoomPlayer[]) =>
  [...players].sort((left, right) => right.score - left.score || right.progress - left.progress || left.latency - right.latency);

const textForLocale = (locale: string) =>
  locale === 'zh-CN'
    ? {
        hubTitle: '多人大厅',
        hubHint: '公开房间优先展示，进行中的房间可直接观战。没有本地 socket 服务时，这里会回退到演示房间数据。',
        roomTitle: '房间中',
        offline: '离线演示',
        connecting: '连接中',
        connected: '已连接',
        offlineHint: '当前未连接到联机服务，仍可体验完整大厅和房间 UI。',
        nickname: '昵称',
        nicknamePlaceholder: '输入你的房间昵称',
        inviteCode: '邀请码',
        invitePlaceholder: '输入邀请码',
        joinByCode: '按码进入',
        createRoom: '创建公开房间',
        publicRoom: '公开房间',
        roomList: '公开房间列表',
        noRooms: '当前没有公开房间，创建一个新的房间来开启第一场。',
        host: '房主',
        players: '玩家',
        spectators: '观战',
        heat: '热度',
        join: '加入',
        spectate: '观战',
        viewResults: '查看结算',
        leaveRoom: '离开房间',
        copyInvite: '复制邀请码',
        startRound: '开始下一局',
        finishRound: '结束演示局',
        stayRoom: '留在房间',
        backToLobby: '回到大厅',
        roomConfig: '房间配置',
        playerSeats: '玩家席',
        spectatorSeats: '观战席',
        chat: '聊天',
        emptyChat: '还没有聊天消息，发一句把房间气氛带起来。',
        messagePlaceholder: '发送一条消息',
        send: '发送',
        focusBoard: '焦点棋盘',
        focusHint: '点击右侧玩家卡切换当前观战焦点。',
        liveStandings: '实时榜单',
        progress: '进度',
        latency: '延迟',
        results: '结算',
        summary: '过程摘要',
        keyMoments: '关键片段',
        inviteCopied: '邀请码已复制。',
        inviteRequired: '请先输入邀请码。',
        inviteInvalid: '没有找到对应房间。',
        nicknameRequired: '请先设置昵称。',
        you: '你',
        spectatorMode: '中途进入默认观战，下一局再上场。',
        liveRoomHint: '进行中的房间保持聊天和观战开放。',
        resultsHint: '结算后可以留在房间继续下一局，或返回大厅切换其他房间。',
        demoActionHint: '未连接服务时，开始/结束按钮会驱动本地演示状态切换。',
      }
    : {
        hubTitle: 'Multiplayer Hub',
        hubHint:
          'Public rooms stay visible first, and live rooms can be spectated immediately. When no socket server is available, the panel falls back to demo rooms.',
        roomTitle: 'Room',
        offline: 'Offline Demo',
        connecting: 'Connecting',
        connected: 'Connected',
        offlineHint: 'Live service is unavailable right now, but the full lobby and room UI remains usable in demo mode.',
        nickname: 'Nickname',
        nicknamePlaceholder: 'Choose a room nickname',
        inviteCode: 'Invite Code',
        invitePlaceholder: 'Enter a code',
        joinByCode: 'Join by Code',
        createRoom: 'Create Public Room',
        publicRoom: 'Public Room',
        roomList: 'Public Rooms',
        noRooms: 'No public rooms are live yet. Create one to open the first lane.',
        host: 'Host',
        players: 'Players',
        spectators: 'Spectators',
        heat: 'Heat',
        join: 'Join',
        spectate: 'Spectate',
        viewResults: 'View Results',
        leaveRoom: 'Leave Room',
        copyInvite: 'Copy Invite',
        startRound: 'Start Next Round',
        finishRound: 'Finish Demo Round',
        stayRoom: 'Stay in Room',
        backToLobby: 'Back to Lobby',
        roomConfig: 'Room Config',
        playerSeats: 'Player Seats',
        spectatorSeats: 'Spectator Seats',
        chat: 'Chat',
        emptyChat: 'No messages yet. Send one to give the room some life.',
        messagePlaceholder: 'Send a room message',
        send: 'Send',
        focusBoard: 'Focus Board',
        focusHint: 'Use the player cards on the right to change the current spectating focus.',
        liveStandings: 'Live Standings',
        progress: 'Progress',
        latency: 'Latency',
        results: 'Results',
        summary: 'Round Summary',
        keyMoments: 'Key Moments',
        inviteCopied: 'Invite code copied.',
        inviteRequired: 'Enter an invite code first.',
        inviteInvalid: 'No room matched that invite code.',
        nicknameRequired: 'Choose a nickname first.',
        you: 'You',
        spectatorMode: 'Late joins start in spectator mode and step in next round.',
        liveRoomHint: 'Live rooms keep chat and spectating open while the board is in motion.',
        resultsHint: 'After results, stay in the room for the next round or head back to the lobby.',
        demoActionHint: 'When the live service is offline, start/finish buttons drive local demo state changes.',
      };

const StatusPill: React.FC<{ label: string; state: 'offline' | 'connecting' | 'connected' }> = ({ label, state }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-[0.08em]',
      state === 'connected' && 'bg-[#dff4e6] text-[#1a6a3a] dark:bg-[#274733] dark:text-[#8cf0ae]',
      state === 'connecting' && 'bg-[#fff2d7] text-[#966112] dark:bg-[#4a391b] dark:text-[#ffd37e]',
      state === 'offline' && 'bg-[#e7edf5] text-[#5b7085] dark:bg-[#35393f] dark:text-[#c0cad3]'
    )}
  >
    {label}
  </span>
);

const MultiplayerPanel: React.FC = () => {
  const { locale } = useI18n();
  const copy = textForLocale(locale);
  const [nickname, setNickname] = useLocalStorage('simulated-athletics-multiplayer-name', locale === 'zh-CN' ? '观众一号' : 'Player One');
  const [inviteCode, setInviteCode] = useState('');
  const [messageDraft, setMessageDraft] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [roomSeedDraft, setRoomSeedDraft] = useState(() => `room-${Date.now().toString(36)}`);
  const {
    defaultSize,
    defaultLayers,
    lazy,
    autoFinalClick,
    hideAxisLabels,
    hideFinalLayer,
    theme,
    seed,
    expandMode,
    expandSize,
  } = useConfigStore();
  const {
    connectionState,
    lastError,
    rooms,
    currentRoom,
    messages,
    createRoom,
    joinRoom,
    spectateRoom,
    joinByInviteCode,
    leaveRoom,
    sendMessage,
    setFocusPlayer,
    startRoom,
    finishRoom,
    restartRoom,
  } = useSocket();

  const currentView = useMemo<MultiplayerViewState>(() => {
    if (!currentRoom) return 'browse';
    if (currentRoom.status === 'playing') return 'room_live';
    if (currentRoom.status === 'finished') return 'room_results';
    return 'room_waiting';
  }, [currentRoom]);

  const focusedSnapshot = useMemo(() => findFocusedSnapshot(currentRoom), [currentRoom]);
  const standings = useMemo(() => (currentRoom ? sortPlayersForStanding(currentRoom.players) : []), [currentRoom]);
  const results = useMemo<RoomResultEntry[]>(() => currentRoom?.results ?? [], [currentRoom]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 2400);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    const timer = window.setTimeout(() => setMessageDraft(''), 0);
    return () => window.clearTimeout(timer);
  }, [currentRoom?.id]);

  const connectionLabel =
    connectionState === 'connected' ? copy.connected : connectionState === 'connecting' ? copy.connecting : copy.offline;

  const roomDraftConfig = {
    size: expandMode ? expandSize : defaultSize,
    layers: expandMode ? 1 : defaultLayers,
    lazy,
    seed: seed || roomSeedDraft,
    autoFinalClick,
    hideAxisLabels,
    hideFinalLayer,
    theme,
  };

  const ensureNickname = () => {
    if (nickname.trim()) return true;
    setFeedback(copy.nicknameRequired);
    return false;
  };

  const handleJoinByCode = () => {
    if (!ensureNickname()) return;
    if (!inviteCode.trim()) {
      setFeedback(copy.inviteRequired);
      return;
    }

    const joined = joinByInviteCode(inviteCode, nickname.trim());
    setFeedback(joined ? null : copy.inviteInvalid);
    if (joined) {
      setInviteCode('');
    }
  };

  const handleCreateRoom = () => {
    if (!ensureNickname()) return;
    createRoom(roomDraftConfig, nickname.trim());
    setRoomSeedDraft(`room-${Date.now().toString(36)}`);
  };

  const handleCopyInvite = async () => {
    if (!currentRoom) return;

    try {
      await navigator.clipboard.writeText(currentRoom.inviteCode);
      setFeedback(copy.inviteCopied);
    } catch {
      setFeedback(currentRoom.inviteCode);
    }
  };

  const handleSendMessage = () => {
    if (!messageDraft.trim()) return;
    sendMessage(messageDraft);
    setMessageDraft('');
  };

  const renderRoomCardAction = (room: Room) => {
    if (room.status === 'waiting') {
      return (
        <button
          className={controlButtonClass({ variant: 'primary', compact: true })}
          onClick={() => ensureNickname() && joinRoom(room.id, nickname.trim())}
          type="button"
        >
          {copy.join}
        </button>
      );
    }

    if (room.status === 'playing') {
      return (
        <button
          className={controlButtonClass({ variant: 'accent', compact: true })}
          onClick={() => ensureNickname() && spectateRoom(room.id, nickname.trim())}
          type="button"
        >
          {copy.spectate}
        </button>
      );
    }

    return (
      <button
        className={controlButtonClass({ compact: true })}
        onClick={() => ensureNickname() && spectateRoom(room.id, nickname.trim())}
        type="button"
      >
        {copy.viewResults}
      </button>
    );
  };

  const renderChat = (className = '') => (
    <div className={cn(panelCardClass({ tone: 'muted' }), 'flex min-h-0 flex-col', className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className={panelEyebrowClass}>{copy.chat}</div>
          <div className={cn(panelTitleClass, 'mt-1')}>{currentRoom ? currentRoom.id : copy.roomList}</div>
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {messages.length === 0 && <div className="rounded-2xl bg-white/70 px-3 py-3 text-sm text-[#6b7f94] dark:bg-[#2e3238] dark:text-[#b9c4cd]">{copy.emptyChat}</div>}
        {messages.map((message: ChatMessage) => (
          <div
            key={message.id}
            className={cn(
              'rounded-2xl px-3 py-2 text-sm',
              message.type === 'system'
                ? 'bg-[#eef4fb] text-[#5f7488] dark:bg-[#2f353d] dark:text-[#c2cbd4]'
                : 'bg-white text-[#20384f] dark:bg-[#3a3f45] dark:text-[#ecf3fa]'
            )}
          >
            <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] opacity-75">
              <span>{message.playerName}</span>
              <span>{new Date(message.timestamp).toLocaleTimeString(locale === 'zh-CN' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div>{message.content}</div>
          </div>
        ))}
      </div>
      {currentRoom && (
        <div className="mt-3 flex gap-2">
          <input
            className={cn(controlInputClass, 'flex-1 text-left')}
            value={messageDraft}
            onChange={(event) => setMessageDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={copy.messagePlaceholder}
          />
          <button className={controlButtonClass({ variant: 'primary' })} onClick={handleSendMessage} type="button">
            {copy.send}
          </button>
        </div>
      )}
    </div>
  );

  const renderBrowseView = () => (
    <div className="space-y-4">
      <div className={cn(panelCardClass({ tone: 'accent' }), 'space-y-4')}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className={panelEyebrowClass}>{copy.hubTitle}</div>
            <div className={cn(panelTitleClass, 'mt-1 text-base')}>{copy.hubHint}</div>
          </div>
          <StatusPill label={connectionLabel} state={connectionState === 'connected' ? 'connected' : connectionState === 'connecting' ? 'connecting' : 'offline'} />
        </div>
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className={controlGroupClass}>
            <span className={panelEyebrowClass}>{copy.nickname}</span>
            <input
              className={cn(controlInputClass, 'w-full flex-1 text-left')}
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder={copy.nicknamePlaceholder}
            />
          </div>
          <div className={controlGroupClass}>
            <span className={panelEyebrowClass}>{copy.inviteCode}</span>
            <input
              className={cn(controlInputClass, 'w-full flex-1 text-left uppercase')}
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
              placeholder={copy.invitePlaceholder}
            />
            <button className={controlButtonClass({ compact: true })} onClick={handleJoinByCode} type="button">
              {copy.joinByCode}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className={controlButtonClass({ variant: 'primary' })} onClick={handleCreateRoom} type="button">
            {copy.createRoom}
          </button>
          {connectionState !== 'connected' && (
            <span className="text-sm text-[#6a7d91] dark:text-[#b8c2cb]">
              {lastError ? `${copy.offlineHint} (${lastError})` : copy.offlineHint}
            </span>
          )}
        </div>
        {feedback && <div className="rounded-2xl bg-[#eef4fb] px-3 py-2 text-sm text-[#45647f] dark:bg-[#313740] dark:text-[#d7e2ec]">{feedback}</div>}
      </div>

      <div className={cn(panelCardClass({ tone: 'muted' }), 'space-y-3')}>
        <div className={panelTitleClass}>{copy.roomList}</div>
        <div className="grid gap-3 xl:grid-cols-2">
          {rooms.map((room) => (
            <div key={room.id} className="rounded-[22px] border border-[#dbe4ef] bg-white/90 p-4 shadow-[0_10px_20px_rgba(0,20,40,0.05)] dark:border-[#4b5058] dark:bg-[#383c42]/90">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={panelEyebrowClass}>{copy.publicRoom}</div>
                  <div className={cn(panelTitleClass, 'mt-1 text-base')}>{room.inviteCode}</div>
                </div>
                <span className="rounded-full bg-[#edf4fb] px-3 py-1 text-xs font-semibold text-[#3d5d79] dark:bg-[#2f363d] dark:text-[#d2dce5]">
                  {formatStatus(room, locale)}
                </span>
              </div>
              <div className="mt-3 text-sm text-[#5d7389] dark:text-[#b8c2cb]">{buildConfigSummary(room)}</div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-[#20384f] dark:text-[#edf4fb] sm:grid-cols-4">
                <div className="rounded-2xl bg-[#f6faff] px-3 py-2 dark:bg-[#2d3136]">
                  <div className="text-[10px] uppercase tracking-[0.12em] opacity-70">{copy.host}</div>
                  <div className="mt-1 font-semibold">{room.players.find((player) => player.isHost)?.name ?? '--'}</div>
                </div>
                <div className="rounded-2xl bg-[#f6faff] px-3 py-2 dark:bg-[#2d3136]">
                  <div className="text-[10px] uppercase tracking-[0.12em] opacity-70">{copy.players}</div>
                  <div className="mt-1 font-semibold">{room.players.length}</div>
                </div>
                <div className="rounded-2xl bg-[#f6faff] px-3 py-2 dark:bg-[#2d3136]">
                  <div className="text-[10px] uppercase tracking-[0.12em] opacity-70">{copy.spectators}</div>
                  <div className="mt-1 font-semibold">{room.spectatorCount}</div>
                </div>
                <div className="rounded-2xl bg-[#f6faff] px-3 py-2 dark:bg-[#2d3136]">
                  <div className="text-[10px] uppercase tracking-[0.12em] opacity-70">{copy.heat}</div>
                  <div className="mt-1 font-semibold">{room.chatHeat}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <div className="text-xs text-[#6a7e92] dark:text-[#b8c2cb]">{copy.spectatorMode}</div>
                {renderRoomCardAction(room)}
              </div>
            </div>
          ))}
          {rooms.length === 0 && (
            <div className="rounded-[22px] border border-dashed border-[#d6e1ee] bg-[#f8fbff] px-4 py-10 text-center text-sm text-[#698096] dark:border-[#4b525b] dark:bg-[#2f343a] dark:text-[#bcc7d0]">
              {copy.noRooms}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderRoster = () => {
    if (!currentRoom) return null;

    return (
      <div className="space-y-3">
        <div className={cn(panelCardClass({ tone: 'muted' }), 'space-y-3')}>
          <div className="flex items-center justify-between gap-2">
            <div className={panelTitleClass}>{copy.playerSeats}</div>
            <div className="text-xs text-[#6f8297] dark:text-[#b7c0c8]">{copy.liveRoomHint}</div>
          </div>
          <div className="space-y-2">
            {standings.map((player) => {
              const isFocus = currentRoom.currentFocusPlayerId === player.id;
              const isSelf = player.id === 'local';

              return (
                <button
                  key={player.id}
                  className={cn(
                    'w-full rounded-[20px] border px-3 py-3 text-left transition-colors',
                    isFocus
                      ? 'border-[#1f5b9e] bg-[#edf6ff] dark:border-[#84c4ff] dark:bg-[#27425b]'
                      : 'border-[#dde6ef] bg-white hover:bg-[#f7fbff] dark:border-[#4a5058] dark:bg-[#373b40] dark:hover:bg-[#40454c]'
                  )}
                  onClick={() => setFocusPlayer(player.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#1d364f] dark:text-[#eef5fb]">{player.name}</span>
                        {player.isHost && (
                          <span className="rounded-full bg-[#1e2b3a] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white dark:bg-[#6a9aff] dark:text-[#10233d]">
                            {copy.host}
                          </span>
                        )}
                        {isSelf && (
                          <span className="rounded-full bg-[#fff1d8] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9b6410] dark:bg-[#5f431b] dark:text-[#ffd585]">
                            {copy.you}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-[#5d7389] dark:text-[#b8c2cb]">
                        <span>{copy.progress} {Math.round(player.progress * 100)}%</span>
                        <span>•</span>
                        <span>{copy.latency} {player.latency}ms</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-[#173550] dark:text-[#eef5fb]">{player.score.toFixed(1)}</div>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dce9f4] dark:bg-[#2a3440]">
                    <div className="h-full rounded-full bg-[#1f5b9e] dark:bg-[#8dc9ff]" style={{ width: `${Math.round(player.progress * 100)}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className={cn(panelCardClass({ tone: 'muted' }), 'space-y-3')}>
          <div className={panelTitleClass}>{copy.spectatorSeats}</div>
          <div className="space-y-2">
            {currentRoom.spectators.length === 0 && (
              <div className="rounded-2xl bg-white/80 px-3 py-3 text-sm text-[#607588] dark:bg-[#30353b] dark:text-[#b8c2cb]">
                {copy.spectatorMode}
              </div>
            )}
            {currentRoom.spectators.map((spectator) => (
              <div key={spectator.id} className="rounded-2xl bg-white/85 px-3 py-3 text-sm text-[#20384f] dark:bg-[#393e44] dark:text-[#eef5fb]">
                <div className="font-medium">{spectator.name}</div>
                <div className="mt-1 text-xs text-[#6b8093] dark:text-[#b7c0c8]">
                  {new Date(spectator.joinedAt).toLocaleTimeString(locale === 'zh-CN' ? 'zh-CN' : 'en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderRoomHeader = () => {
    if (!currentRoom) return null;

    return (
      <div className={cn(panelCardClass({ tone: 'accent' }), 'space-y-4')}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className={panelEyebrowClass}>{copy.roomTitle}</div>
            <div className={cn(panelTitleClass, 'mt-1 text-base')}>{currentRoom.inviteCode}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label={formatStatus(currentRoom, locale)} state={currentView === 'room_live' ? 'connected' : currentView === 'room_results' ? 'offline' : 'connecting'} />
            <button className={controlButtonClass({ compact: true })} onClick={handleCopyInvite} type="button">
              {copy.copyInvite}
            </button>
            <button className={controlButtonClass({ compact: true, variant: 'danger' })} onClick={leaveRoom} type="button">
              {copy.leaveRoom}
            </button>
          </div>
        </div>
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
          <div className="text-sm text-[#576d84] dark:text-[#bdc7d0]">
            <div>{buildConfigSummary(currentRoom)}</div>
            <div className="mt-2">{currentView === 'room_results' ? copy.resultsHint : currentView === 'room_live' ? copy.liveRoomHint : copy.demoActionHint}</div>
            {feedback && <div className="mt-3 rounded-2xl bg-white/80 px-3 py-2 text-sm text-[#45647f] dark:bg-[#2f353d] dark:text-[#d7e2ec]">{feedback}</div>}
          </div>
          <div className="flex flex-wrap gap-2">
            {currentView === 'room_waiting' && (
              <button className={controlButtonClass({ variant: 'primary' })} onClick={startRoom} type="button">
                {copy.startRound}
              </button>
            )}
            {currentView === 'room_live' && (
              <button className={controlButtonClass({ variant: 'accent' })} onClick={finishRoom} type="button">
                {copy.finishRound}
              </button>
            )}
            {currentView === 'room_results' && (
              <>
                <button className={controlButtonClass({ variant: 'primary' })} onClick={restartRoom} type="button">
                  {copy.stayRoom}
                </button>
                <button className={controlButtonClass()} onClick={leaveRoom} type="button">
                  {copy.backToLobby}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderWaitingView = () => {
    if (!currentRoom) return null;

    return (
      <div className="space-y-4">
        {renderRoomHeader()}
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <div className={cn(panelCardClass({ tone: 'muted' }), 'space-y-3')}>
              <div className={panelTitleClass}>{copy.roomConfig}</div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/85 px-3 py-3 dark:bg-[#383d43]">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-[#688096] dark:text-[#b8c2cb]">Seed</div>
                  <div className="mt-1 font-semibold text-[#1d364f] dark:text-[#eef5fb]">{currentRoom.seed}</div>
                </div>
                <div className="rounded-2xl bg-white/85 px-3 py-3 dark:bg-[#383d43]">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-[#688096] dark:text-[#b8c2cb]">{copy.players}</div>
                  <div className="mt-1 font-semibold text-[#1d364f] dark:text-[#eef5fb]">{currentRoom.players.length}</div>
                </div>
                <div className="rounded-2xl bg-white/85 px-3 py-3 dark:bg-[#383d43]">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-[#688096] dark:text-[#b8c2cb]">{copy.spectators}</div>
                  <div className="mt-1 font-semibold text-[#1d364f] dark:text-[#eef5fb]">{currentRoom.spectatorCount}</div>
                </div>
              </div>
            </div>
            {renderRoster()}
          </div>
          {renderChat('min-h-[360px]')}
        </div>
      </div>
    );
  };

  const renderLiveView = () => {
    if (!currentRoom) return null;

    return (
      <div className="space-y-4">
        {renderRoomHeader()}
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <MultiplayerBoard
              snapshot={focusedSnapshot}
              title={copy.focusBoard}
              subtitle={focusedSnapshot ? `${focusedSnapshot.playerName} · ${copy.focusHint}` : copy.focusHint}
            />
          </div>
          <div className="space-y-4">
            {renderRoster()}
            {renderChat('max-h-[360px]')}
          </div>
        </div>
      </div>
    );
  };

  const renderResultsView = () => {
    if (!currentRoom) return null;

    return (
      <div className="space-y-4">
        {renderRoomHeader()}
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <div className={cn(panelCardClass({ tone: 'accent' }), 'space-y-4')}>
              <div>
                <div className={panelEyebrowClass}>{copy.results}</div>
                <div className={cn(panelTitleClass, 'mt-1 text-base')}>{currentRoom.resultSummary?.headline ?? copy.resultsHint}</div>
              </div>
              <div className="space-y-3">
                {results.map((entry) => (
                  <div key={entry.playerId} className="flex items-center justify-between rounded-[20px] bg-white/85 px-4 py-3 dark:bg-[#373c42]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e2b3a] text-sm font-semibold text-white dark:bg-[#6a9aff] dark:text-[#10233d]">
                        {entry.placement}
                      </div>
                      <div>
                        <div className="font-semibold text-[#18324a] dark:text-[#eef5fb]">{entry.playerName}</div>
                        <div className="mt-1 text-xs text-[#607588] dark:text-[#b8c2cb]">
                          {copy.progress} {Math.round(entry.progress * 100)}% • {formatElapsed(entry.duration)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-lg font-semibold text-[#173550] dark:text-[#eef5fb]">{entry.score.toFixed(1)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={cn(panelCardClass({ tone: 'muted' }), 'space-y-3')}>
              <div className={panelTitleClass}>{copy.keyMoments}</div>
              <div className="grid gap-3 sm:grid-cols-3">
                {(currentRoom.resultSummary?.moments ?? []).map((moment) => (
                  <div key={moment.id} className="rounded-2xl bg-white/85 px-4 py-3 dark:bg-[#373c42]">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-[#688096] dark:text-[#b8c2cb]">{moment.label}</div>
                    <div className="mt-1 font-semibold text-[#18324a] dark:text-[#eef5fb]">{moment.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {renderChat('max-h-[480px]')}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {currentView === 'browse' && renderBrowseView()}
      {currentView === 'room_waiting' && renderWaitingView()}
      {currentView === 'room_live' && renderLiveView()}
      {currentView === 'room_results' && renderResultsView()}
    </div>
  );
};

export default MultiplayerPanel;
