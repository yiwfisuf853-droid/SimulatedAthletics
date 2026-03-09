import { GridGenerator } from './GridGenerator';
import { ScoreCalculator } from './ScoreCalculator';
import { toAchievementConfigSnapshot } from '@/types/achievement';
import type {
  AchievementEvent,
  AchievementEventName,
  AchievementEventPayloadMap,
} from '@/types/achievement';
import type {
  GameConfig,
  GameRecord,
  GameResultSummary,
  GameState,
  PlayerAction,
  PlayerActionType,
} from '@/types/game';

type GameStateListener = (state: GameState) => void;
type GameEngineEventName =
  | 'game:started'
  | 'game:first_input'
  | 'move:correct'
  | 'move:wrong'
  | 'combo:updated'
  | 'final_click:available'
  | 'final_click:claimed'
  | 'game:completed';
type GameEngineEventListener<K extends GameEngineEventName> = (
  event: K,
  data: AchievementEventPayloadMap[K]
) => void;

export class GameEngine {
  private static readonly FINAL_CLICK_DELAY_MS = 1000;

  private state: GameState;
  private readonly config: GameConfig;
  private readonly listeners: Set<GameStateListener> = new Set();
  private readonly eventListeners: Map<GameEngineEventName, Set<(event: GameEngineEventName, data: unknown) => void>> = new Map();
  private actions: PlayerAction[] = [];
  private startTime: number | null = null;
  private timerInterval: number | null = null;
  private actualSeed = '';
  private readonly sessionId: string;
  private hasEmittedFirstInput = false;

  constructor(config: GameConfig) {
    this.config = config;
    this.state = this.createInitialState();
    this.sessionId = `session_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private createInitialState(): GameState {
    return {
      phase: 'idle',
      grid: [],
      score: 0,
      combo: 0,
      maxCombo: 0,
      multiplier: 1,
      elapsedTime: 0,
      mistakeCount: 0,
      startTime: null,
      lastClickTime: null,
      currentMinNumber: null,
      currentMinCell: null,
      highlightRow: null,
      highlightCol: null,
      predictedFinalBonus: null,
      isAI: false,
      clickIntervals: [],
      inputStats: {
        clickActions: 0,
        keyboardActions: 0,
        autoActions: 0,
      },
      finalClickType: null,
    };
  }

  start(): void {
    this.actualSeed = this.config.seed || Date.now().toString();
    const grid = GridGenerator.generate(this.config.size, this.actualSeed, this.config.layers);

    this.state = {
      ...this.createInitialState(),
      phase: 'playing',
      grid,
    };

    this.updateMinNumber();
    this.actions = [];
    this.hasEmittedFirstInput = false;
    this.emit('game:started', {
      config: toAchievementConfigSnapshot(this.config),
    });
    this.notifyListeners();
  }

  handleClick(row: number, col: number, type: PlayerActionType): boolean {
    const now = Date.now();

    if (this.state.phase !== 'playing') {
      if (this.state.phase === 'finished') {
        this.finalClick(type);
        return this.getState().phase === 'final_clicked';
      }
      return false;
    }

    if (!this.hasEmittedFirstInput) {
      this.hasEmittedFirstInput = true;
      this.emit('game:first_input', {
        inputType: type,
        position: row >= 0 && col >= 0 ? { row, col } : null,
      });
    }

    if (row >= 0 && col >= 0) {
      this.ensureTimerStarted(now);
    }

    this.recordClickInterval(now);

    const minCell = this.state.currentMinCell;
    if (minCell && row === minCell.row && col === minCell.col) {
      this.handleCorrectClick(row, col, type, now);
      return true;
    }

    this.handleWrongClick(type, now);
    return false;
  }

  private handleCorrectClick(row: number, col: number, type: PlayerActionType, now: number): void {
    const cell = this.state.grid[row][col];
    const minNum = Math.min(...cell.numbers);

    cell.numbers = cell.numbers.filter((value) => value !== minNum);

    this.incrementInputCount(type);
    this.state.combo += 1;
    this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);
    this.state.multiplier = ScoreCalculator.getComboMultiplier(this.state.combo);
    this.state.mistakeCount = 0;

    const interval = this.state.lastClickTime ? now - this.state.lastClickTime : 0;
    const scoreGain = ScoreCalculator.calculate({
      baseScore: 1,
      comboMultiplier: this.state.multiplier,
      clickIntervalMs: interval,
      isLazy: this.config.lazy,
      gridSize: this.config.size,
      isFinalClick: false,
    });

    this.state.score = Math.round((this.state.score + scoreGain) * 1000) / 1000;
    this.state.lastClickTime = now;

    this.recordAction({
      type,
      row,
      col,
      timestamp: (now - (this.startTime || now)) / 1000,
      interval: interval / 1000,
      correct: true,
    });

    this.updateMinNumber();

    this.emit('move:correct', {
      row,
      col,
      combo: this.state.combo,
      scoreGain,
      inputType: type,
    });
    this.emit('combo:updated', {
      combo: this.state.combo,
      multiplier: this.state.multiplier,
    });

    if (this.checkVictory()) {
      this.handleVictory();
    }

    this.notifyListeners();
  }

  private handleWrongClick(type: PlayerActionType, now: number): void {
    this.incrementInputCount(type);
    this.state.mistakeCount += 1;
    const previousClickTime = this.state.lastClickTime;

    if (this.state.mistakeCount === 1) {
      this.state.multiplier *= 0.5;
    } else if (this.state.mistakeCount === 2) {
      this.state.multiplier *= 0.5;
    } else if (this.state.mistakeCount >= 3) {
      this.state.multiplier = 1;
      this.state.combo = 0;
    }

    const interval = previousClickTime ? now - previousClickTime : 0;
    this.state.lastClickTime = now;

    this.recordAction({
      type,
      row: -1,
      col: -1,
      timestamp: (now - (this.startTime || now)) / 1000,
      interval: interval / 1000,
      correct: false,
    });

    this.emit('move:wrong', {
      mistakeCount: this.state.mistakeCount,
      inputType: type,
    });
    this.notifyListeners();
  }

  private ensureTimerStarted(now: number): void {
    if (this.startTime) return;

    this.startTime = now;
    this.state.startTime = now;

    const updateTimer = () => {
      if (this.startTime && this.state.phase === 'playing') {
        this.state.elapsedTime = (Date.now() - this.startTime) / 1000;
        this.notifyListeners();
        this.timerInterval = window.requestAnimationFrame(updateTimer);
      }
    };

    this.timerInterval = window.requestAnimationFrame(updateTimer);
  }

  private getFinalClickInterval(): number {
    return GameEngine.FINAL_CLICK_DELAY_MS;
  }

  private canClaimFinalClick(now: number): boolean {
    if (!this.state.lastClickTime) return false;
    return now - this.state.lastClickTime >= GameEngine.FINAL_CLICK_DELAY_MS;
  }

  finalClick(type: PlayerActionType = 'auto'): void {
    if (this.state.phase !== 'finished') return;

    const now = Date.now();
    if (!this.canClaimFinalClick(now)) return;

    const interval = this.getFinalClickInterval();
    const baseTime = this.startTime ?? this.state.lastClickTime ?? now;
    const lastStepTime = this.state.lastClickTime ?? now;
    const finalTimestamp = (lastStepTime - baseTime + interval) / 1000;

    this.state.elapsedTime = finalTimestamp;

    const bonus = ScoreCalculator.predictFinalBonus({
      currentScore: this.state.score,
      comboMultiplier: this.state.multiplier,
      lastClickIntervalMs: interval,
      isLazy: this.config.lazy,
      gridSize: this.config.size,
    });

    this.incrementInputCount(type);
    this.state.score = Math.round((this.state.score + bonus) * 1000) / 1000;
    this.state.phase = 'final_clicked';
    this.state.predictedFinalBonus = null;
    this.state.finalClickType = type;

    this.recordAction({
      type,
      row: -2,
      col: -2,
      timestamp: finalTimestamp,
      interval: interval / 1000,
      correct: true,
      isFinalClick: true,
    });

    this.emit('final_click:claimed', {
      bonus,
      finalClickType: type,
    });

    const record = this.getRecord();
    if (record) {
      this.emit('game:completed', {
        record,
      });
    }

    this.notifyListeners();
  }

  private handleVictory(): void {
    if (this.timerInterval) {
      window.cancelAnimationFrame(this.timerInterval);
      this.timerInterval = null;
    }

    this.clearHighlight();
    this.state.phase = 'finished';
    this.state.predictedFinalBonus = ScoreCalculator.predictFinalBonus({
      currentScore: this.state.score,
      comboMultiplier: this.state.multiplier,
      lastClickIntervalMs: this.getFinalClickInterval(),
      isLazy: this.config.lazy,
      gridSize: this.config.size,
    });

    this.emit('final_click:available', {
      predictedBonus: this.state.predictedFinalBonus,
    });

    if (this.config.autoFinalClick) {
      setTimeout(() => this.finalClick('auto'), GameEngine.FINAL_CLICK_DELAY_MS);
    }
  }

  private updateMinNumber(): void {
    let minVal = Infinity;
    let minCell: { row: number; col: number } | null = null;

    for (const row of this.state.grid) {
      for (const cell of row) {
        if (cell.numbers.length > 1) {
          const cellMin = Math.min(...cell.numbers);
          if (cellMin < minVal) {
            minVal = cellMin;
            minCell = { row: cell.row, col: cell.col };
          }
        }
      }
    }

    this.state.currentMinNumber = minVal === Infinity ? null : minVal;
    this.state.currentMinCell = minCell;
  }

  private checkVictory(): boolean {
    return this.state.grid.every((row) => row.every((cell) => cell.numbers.length === 1));
  }

  private recordClickInterval(now: number): void {
    if (this.state.lastClickTime) {
      const interval = now - this.state.lastClickTime;
      this.state.clickIntervals.push(interval);
      if (this.state.clickIntervals.length > 5) {
        this.state.clickIntervals.shift();
      }

      if (this.state.clickIntervals.length === 5 && this.state.clickIntervals.every((entry) => entry < 50)) {
        this.state.isAI = true;
      }
    }
  }

  private recordAction(action: PlayerAction): void {
    this.actions.push(action);
  }

  private incrementInputCount(type: PlayerActionType) {
    if (type === 'click') {
      this.state.inputStats.clickActions += 1;
      return;
    }
    if (type === 'keyboard') {
      this.state.inputStats.keyboardActions += 1;
      return;
    }
    this.state.inputStats.autoActions += 1;
  }

  setHighlight(row: number | null, col: number | null): void {
    this.state.highlightRow = row;
    this.state.highlightCol = col;
    this.notifyListeners();
  }

  clearHighlight(): void {
    this.state.highlightRow = null;
    this.state.highlightCol = null;
    this.notifyListeners();
  }

  getState(): GameState {
    return {
      ...this.state,
      inputStats: { ...this.state.inputStats },
    };
  }

  getConfig(): GameConfig {
    return { ...this.config };
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getActions(): PlayerAction[] {
    return [...this.actions];
  }

  getSummary(): GameResultSummary {
    return {
      mistakeCount: this.state.mistakeCount,
      maxCombo: this.state.maxCombo,
      inputStats: { ...this.state.inputStats },
      finalClickType: this.state.finalClickType,
      storyContext: this.config.storyContext ?? null,
    };
  }

  getRecord(): GameRecord | null {
    if (this.state.phase !== 'final_clicked') return null;

    return {
      id: '',
      config: this.config,
      initialGrid: GridGenerator.generate(this.config.size, this.actualSeed, this.config.layers),
      actions: this.actions,
      finalScore: this.state.score,
      duration: this.state.elapsedTime,
      createdAt: Date.now(),
      isAI: this.state.isAI,
      ...this.getSummary(),
    };
  }

  subscribe(listener: GameStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  on<K extends GameEngineEventName>(event: K, listener: GameEngineEventListener<K>): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    const eventSet = this.eventListeners.get(event)!;
    const wrappedListener = listener as unknown as (event: GameEngineEventName, data: unknown) => void;
    eventSet.add(wrappedListener);

    return () => {
      eventSet.delete(wrappedListener);
    };
  }

  createAchievementEvent<K extends AchievementEventName>(
    type: K,
    payload: AchievementEventPayloadMap[K],
    source: AchievementEvent<K>['source'] = 'engine'
  ): AchievementEvent<K> {
    return {
      type,
      timestamp: Date.now(),
      source,
      sessionId: this.sessionId,
      phase: this.state.phase,
      config: toAchievementConfigSnapshot(this.config),
      payload,
    };
  }

  private emit<K extends GameEngineEventName>(event: K, data: AchievementEventPayloadMap[K]): void {
    this.eventListeners.get(event)?.forEach((listener) => listener(event, data));
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }

  reset(): void {
    if (this.timerInterval) {
      window.cancelAnimationFrame(this.timerInterval);
      this.timerInterval = null;
    }

    this.state = this.createInitialState();
    this.actions = [];
    this.startTime = null;
    this.actualSeed = '';
    this.hasEmittedFirstInput = false;
    this.notifyListeners();
  }
}
