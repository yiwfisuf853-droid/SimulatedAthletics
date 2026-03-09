import type { Cell, GameConfig, GamePhase } from './game';

export type SocketEventName =
  | 'room:create'
  | 'room:join'
  | 'room:leave'
  | 'room:ready'
  | 'room:start'
  | 'room:sync'
  | 'room:update'
  | 'room:spectate'
  | 'room:focus'
  | 'room:results'
  | 'game:action'
  | 'game:end'
  | 'chat:message';

export type RoomStatus = 'waiting' | 'countdown' | 'playing' | 'finished';

export type RoomVisibility = 'public' | 'private';

export type RoomMemberRole = 'player' | 'spectator';

export type MultiplayerViewState = 'browse' | 'room_waiting' | 'room_live' | 'room_results';

export interface RoomPlayer {
  id: string;
  name: string;
  ready: boolean;
  connected: boolean;
  isHost: boolean;
  score: number;
  progress: number;
  latency: number;
  role?: 'player';
}

export interface Spectator {
  id: string;
  name: string;
  connected: boolean;
  joinedAt: number;
  role: 'spectator';
}

export interface RoomLiveSnapshot {
  playerId: string;
  playerName: string;
  grid: Cell[][];
  score: number;
  progress: number;
  elapsedTime: number;
  phase: Exclude<GamePhase, 'replay'>;
  combo: number;
}

export interface RoomResultMoment {
  id: string;
  label: string;
  value: string;
}

export interface RoomResultSummary {
  headline: string;
  moments: RoomResultMoment[];
}

export interface RoomResultEntry {
  playerId: string;
  playerName: string;
  placement: number;
  score: number;
  duration: number;
  progress: number;
  isHost: boolean;
  role: RoomMemberRole;
}

export interface Room {
  id: string;
  hostId: string;
  players: RoomPlayer[];
  spectators: Spectator[];
  spectatorCount: number;
  status: RoomStatus;
  config: GameConfig;
  seed: string;
  visibility: RoomVisibility;
  inviteCode: string;
  createdAt: number;
  startedAt?: number;
  currentFocusPlayerId?: string;
  liveSnapshots: RoomLiveSnapshot[];
  results?: RoomResultEntry[];
  resultSummary?: RoomResultSummary;
  chatHeat: number;
}

export interface SyncEvent {
  type: 'player_join' | 'player_leave' | 'player_action' | 'game_start' | 'game_end';
  payload: unknown;
  playerId: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  playerId: string;
  playerName: string;
  content: string;
  timestamp: number;
  type: 'normal' | 'system';
}
