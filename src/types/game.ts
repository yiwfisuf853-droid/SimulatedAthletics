import type { StoryMatchStyle } from './config';

export interface Cell {
  row: number;
  col: number;
  numbers: number[];
}

export interface StoryContext {
  levelId: string;
  title: string;
  chapter: string;
  matchStyle: StoryMatchStyle;
}

export interface GameConfig {
  size: number;
  layers: number;
  lazy: boolean;
  seed: string;
  autoFinalClick: boolean;
  hideAxisLabels: boolean;
  hideFinalLayer: boolean;
  theme: string;
  storyContext?: StoryContext | null;
}

export type GamePhase = 'idle' | 'playing' | 'finished' | 'final_clicked' | 'replay';

export type PlayerActionType = 'click' | 'keyboard' | 'auto';

export interface InputStats {
  clickActions: number;
  keyboardActions: number;
  autoActions: number;
}

export interface GameState {
  phase: GamePhase;
  grid: Cell[][];
  score: number;
  combo: number;
  maxCombo: number;
  multiplier: number;
  elapsedTime: number;
  mistakeCount: number;
  startTime: number | null;
  lastClickTime: number | null;
  currentMinNumber: number | null;
  currentMinCell: { row: number; col: number } | null;
  highlightRow: number | null;
  highlightCol: number | null;
  predictedFinalBonus: number | null;
  isAI: boolean;
  clickIntervals: number[];
  inputStats: InputStats;
  finalClickType: PlayerActionType | null;
}

export interface PlayerAction {
  type: PlayerActionType;
  row: number;
  col: number;
  timestamp: number;
  interval: number;
  correct: boolean;
  isFinalClick?: boolean;
}

export interface GameResultSummary {
  mistakeCount: number;
  maxCombo: number;
  inputStats: InputStats;
  finalClickType: PlayerActionType | null;
  storyContext?: StoryContext | null;
}

export interface GameRecord extends GameResultSummary {
  id: string;
  config: GameConfig;
  initialGrid: Cell[][];
  actions: PlayerAction[];
  finalScore: number;
  duration: number;
  createdAt: number;
  isAI: boolean;
  playerId?: string;
  playerName?: string;
}
