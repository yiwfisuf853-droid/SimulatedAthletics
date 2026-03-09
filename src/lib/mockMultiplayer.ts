import { GridGenerator } from '@/core/game/GridGenerator';
import type { GameConfig } from '@/types/game';
import type {
  ChatMessage,
  Room,
  RoomLiveSnapshot,
  RoomPlayer,
  RoomResultEntry,
  RoomResultSummary,
  Spectator,
} from '@/types/socket';

const now = Date.now();

const createInviteCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const createMessageId = () => `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const cloneSnapshot = (snapshot: RoomLiveSnapshot): RoomLiveSnapshot => ({
  ...snapshot,
  grid: GridGenerator.clone(snapshot.grid),
});

export const cloneRoom = (room: Room): Room => ({
  ...room,
  players: room.players.map((player) => ({ ...player })),
  spectators: room.spectators.map((spectator) => ({ ...spectator })),
  liveSnapshots: room.liveSnapshots.map(cloneSnapshot),
  results: room.results?.map((entry) => ({ ...entry })),
  resultSummary: room.resultSummary
    ? {
        ...room.resultSummary,
        moments: room.resultSummary.moments.map((moment) => ({ ...moment })),
      }
    : undefined,
});

const removeSolvedSteps = (config: GameConfig, steps: number) => {
  const grid = GridGenerator.generate(config.size, config.seed, config.layers);
  const gridCopy = GridGenerator.clone(grid);

  let remaining = steps;
  while (remaining > 0) {
    let minValue = Number.POSITIVE_INFINITY;
    let minCell: { row: number; col: number } | null = null;

    for (const row of gridCopy) {
      for (const cell of row) {
        if (cell.numbers.length <= 1) continue;
        const cellMin = Math.min(...cell.numbers);
        if (cellMin < minValue) {
          minValue = cellMin;
          minCell = { row: cell.row, col: cell.col };
        }
      }
    }

    if (!minCell) break;

    const targetCell = gridCopy[minCell.row][minCell.col];
    targetCell.numbers = targetCell.numbers.filter((value) => value !== minValue);
    remaining -= 1;
  }

  return gridCopy;
};

const createPlayer = (
  id: string,
  name: string,
  patch: Partial<RoomPlayer> = {}
): RoomPlayer => ({
  id,
  name,
  ready: false,
  connected: true,
  isHost: false,
  score: 0,
  progress: 0,
  latency: 26,
  role: 'player',
  ...patch,
});

const createSpectator = (id: string, name: string, joinedAt: number): Spectator => ({
  id,
  name,
  connected: true,
  joinedAt,
  role: 'spectator',
});

export const createLiveSnapshot = (
  player: RoomPlayer,
  config: GameConfig,
  patch: Partial<Omit<RoomLiveSnapshot, 'playerId' | 'playerName' | 'grid'>> & {
    stepsRemoved: number;
  }
): RoomLiveSnapshot => ({
  playerId: player.id,
  playerName: player.name,
  grid: removeSolvedSteps(config, patch.stepsRemoved),
  score: patch.score ?? player.score,
  progress: patch.progress ?? player.progress,
  elapsedTime: patch.elapsedTime ?? 0,
  phase: patch.phase ?? 'playing',
  combo: patch.combo ?? 0,
});

const createResults = (players: RoomPlayer[]): RoomResultEntry[] =>
  [...players]
    .sort((left, right) => right.score - left.score || right.progress - left.progress || left.latency - right.latency)
    .map((player, index) => ({
      playerId: player.id,
      playerName: player.name,
      placement: index + 1,
      score: player.score,
      duration: Number((34 + index * 1.8).toFixed(2)),
      progress: player.progress,
      isHost: player.isHost,
      role: 'player',
    }));

const createResultSummary = (headline: string, fastest: string, finishRate: string): RoomResultSummary => ({
  headline,
  moments: [
    { id: 'fastest', label: 'Fastest close', value: fastest },
    { id: 'finish-rate', label: 'Board clear', value: finishRate },
    { id: 'chat', label: 'Crowd heat', value: 'High' },
  ],
});

export const createSystemMessage = (roomId: string, content: string): ChatMessage => ({
  id: createMessageId(),
  roomId,
  playerId: 'system',
  playerName: 'System',
  content,
  timestamp: Date.now(),
  type: 'system',
});

const WAITING_CONFIG: GameConfig = {
  size: 4,
  layers: 3,
  lazy: false,
  seed: 'open-lane',
  autoFinalClick: false,
  hideAxisLabels: false,
  hideFinalLayer: false,
  theme: 'classic',
};

const LIVE_CONFIG: GameConfig = {
  size: 6,
  layers: 2,
  lazy: true,
  seed: 'stadium-rush',
  autoFinalClick: true,
  hideAxisLabels: false,
  hideFinalLayer: false,
  theme: 'classic',
};

const RESULTS_CONFIG: GameConfig = {
  size: 5,
  layers: 3,
  lazy: false,
  seed: 'photo-finish',
  autoFinalClick: true,
  hideAxisLabels: false,
  hideFinalLayer: false,
  theme: 'classic',
};

export const createLocalRoom = (config: GameConfig, hostId: string, hostName: string): Room => {
  const roomId = `local_${Date.now().toString(36)}`;
  const host = createPlayer(hostId, hostName, {
    isHost: true,
    ready: true,
    score: 0,
    progress: 0,
  });

  return {
    id: roomId,
    hostId,
    players: [host],
    spectators: [],
    spectatorCount: 0,
    status: 'waiting',
    config: { ...config },
    seed: config.seed,
    visibility: 'public',
    inviteCode: createInviteCode(),
    createdAt: Date.now(),
    currentFocusPlayerId: hostId,
    liveSnapshots: [],
    chatHeat: 0,
  };
};

export const createMockRooms = (): Room[] => {
  const waitingPlayers = [
    createPlayer('host_iris', 'Iris', { isHost: true, ready: true, score: 128.6, progress: 0.18, latency: 18 }),
    createPlayer('player_niko', 'Niko', { ready: false, score: 111.3, progress: 0.11, latency: 31 }),
  ];

  const livePlayers = [
    createPlayer('host_mika', 'Mika', { isHost: true, ready: true, score: 268.9, progress: 0.74, latency: 19 }),
    createPlayer('player_jo', 'Jo', { ready: true, score: 241.2, progress: 0.66, latency: 27 }),
    createPlayer('player_rei', 'Rei', { ready: true, score: 219.8, progress: 0.61, latency: 35 }),
  ];

  const resultPlayers = [
    createPlayer('host_sera', 'Sera', { isHost: true, ready: true, score: 332.7, progress: 1, latency: 16 }),
    createPlayer('player_tao', 'Tao', { ready: true, score: 308.5, progress: 1, latency: 24 }),
    createPlayer('player_lin', 'Lin', { ready: true, score: 274.9, progress: 0.96, latency: 29 }),
  ];

  return [
    {
      id: 'room_open_lane',
      hostId: waitingPlayers[0].id,
      players: waitingPlayers,
      spectators: [createSpectator('spec_anna', 'Anna', now - 1000 * 60 * 4)],
      spectatorCount: 1,
      status: 'waiting',
      config: WAITING_CONFIG,
      seed: WAITING_CONFIG.seed,
      visibility: 'public',
      inviteCode: 'OPEN44',
      createdAt: now - 1000 * 60 * 7,
      currentFocusPlayerId: waitingPlayers[0].id,
      liveSnapshots: [],
      chatHeat: 4,
    },
    {
      id: 'room_stadium_rush',
      hostId: livePlayers[0].id,
      players: livePlayers,
      spectators: [
        createSpectator('spec_lena', 'Lena', now - 1000 * 60 * 8),
        createSpectator('spec_omar', 'Omar', now - 1000 * 60 * 2),
      ],
      spectatorCount: 2,
      status: 'playing',
      config: LIVE_CONFIG,
      seed: LIVE_CONFIG.seed,
      visibility: 'public',
      inviteCode: 'RUSH66',
      createdAt: now - 1000 * 60 * 11,
      startedAt: now - 1000 * 42,
      currentFocusPlayerId: livePlayers[0].id,
      liveSnapshots: [
        createLiveSnapshot(livePlayers[0], LIVE_CONFIG, {
          stepsRemoved: 26,
          score: livePlayers[0].score,
          progress: livePlayers[0].progress,
          elapsedTime: 42.6,
          combo: 7,
        }),
        createLiveSnapshot(livePlayers[1], LIVE_CONFIG, {
          stepsRemoved: 23,
          score: livePlayers[1].score,
          progress: livePlayers[1].progress,
          elapsedTime: 42.6,
          combo: 6,
        }),
        createLiveSnapshot(livePlayers[2], LIVE_CONFIG, {
          stepsRemoved: 21,
          score: livePlayers[2].score,
          progress: livePlayers[2].progress,
          elapsedTime: 42.6,
          combo: 4,
        }),
      ],
      chatHeat: 11,
    },
    {
      id: 'room_photo_finish',
      hostId: resultPlayers[0].id,
      players: resultPlayers,
      spectators: [
        createSpectator('spec_yara', 'Yara', now - 1000 * 60 * 12),
        createSpectator('spec_ken', 'Ken', now - 1000 * 60 * 9),
        createSpectator('spec_mina', 'Mina', now - 1000 * 60 * 3),
      ],
      spectatorCount: 3,
      status: 'finished',
      config: RESULTS_CONFIG,
      seed: RESULTS_CONFIG.seed,
      visibility: 'public',
      inviteCode: 'FIN55H',
      createdAt: now - 1000 * 60 * 18,
      startedAt: now - 1000 * 60 * 3,
      currentFocusPlayerId: resultPlayers[0].id,
      liveSnapshots: [
        createLiveSnapshot(resultPlayers[0], RESULTS_CONFIG, {
          stepsRemoved: 24,
          score: resultPlayers[0].score,
          progress: 1,
          elapsedTime: 38.2,
          phase: 'final_clicked',
          combo: 9,
        }),
      ],
      results: createResults(resultPlayers),
      resultSummary: createResultSummary('Sera held the lead from the middle split onward.', '38.20s', '96% completed'),
      chatHeat: 8,
    },
  ];
};

export const createMockMessages = (rooms: Room[]): Record<string, ChatMessage[]> =>
  Object.fromEntries(
    rooms.map((room) => [
      room.id,
      [
        createSystemMessage(room.id, `Room ${room.inviteCode} opened for public spectating.`),
        {
          id: createMessageId(),
          roomId: room.id,
          playerId: room.players[0]?.id ?? 'host',
          playerName: room.players[0]?.name ?? 'Host',
          content:
            room.status === 'waiting'
              ? 'Warm-up lane is open. We start once one more player settles in.'
              : room.status === 'playing'
                ? 'Focus the center route. The next branch is where the board flips.'
                : 'GGs. That ending combo was much cleaner than the opening split.',
          timestamp: Date.now() - 1000 * 45,
          type: 'normal',
        },
      ],
    ])
  );
