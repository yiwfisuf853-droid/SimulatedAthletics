import { GridGenerator } from '../game/GridGenerator';
import { ScoreCalculator } from '../game/ScoreCalculator';
import type { Cell, PlayerAction, GameConfig } from '@/types/game';

export interface ReplayState {
  grid: Cell[][];
  score: number;
  combo: number;
  multiplier: number;
  mistakeCount: number;
  currentTime: number;
  step: number;
  totalSteps: number;
  isPlaying: boolean;
  currentMinCell: { row: number; col: number } | null;
}

/**
 * 复盘播放器。
 */
export class ReplayPlayer {
  private config: GameConfig;
  private initialGrid: Cell[][];
  private actions: PlayerAction[];
  private state: ReplayState;
  private listeners: Set<(state: ReplayState) => void> = new Set();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private speed: number = 1;
  private lastUpdateTime: number = 0;
  private timeElapsedSinceLastAction: number = 0;

  constructor(record: {
    config: GameConfig;
    initialGrid: Cell[][];
    actions: PlayerAction[];
  }) {
    this.config = record.config;
    this.initialGrid = GridGenerator.clone(record.initialGrid);
    this.actions = record.actions;

    this.state = {
      grid: GridGenerator.clone(this.initialGrid),
      score: 0,
      combo: 0,
      multiplier: 1,
      mistakeCount: 0,
      currentTime: 0,
      step: 0,
      totalSteps: record.actions.length,
      isPlaying: false,
      currentMinCell: null,
    };
  }

  /**
   * 开始播放。
   */
  play(): void {
    if (this.state.isPlaying) return;

    this.state.isPlaying = true;
    this.lastUpdateTime = Date.now();
    this.schedule();
    this.notifyListeners();
  }

  /**
   * 暂停播放。
   */
  pause(): void {
    this.state.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.lastUpdateTime = 0;
    this.notifyListeners();
  }

  /**
   * 切换播放状态。
   */
  toggle(): void {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * 跳转到指定步骤。
   */
  seekTo(step: number): void {
    if (step < 0 || step > this.state.totalSteps) return;

    this.pause();
    this.replayTo(step);
  }

  /**
   * 前进一步。
   */
  stepForward(): void {
    if (this.state.step >= this.state.totalSteps) return;
    this.pause();
    this.executeStep(this.state.step);
    this.state.step++;
    this.notifyListeners();
  }

  /**
   * 后退一步。
   */
  stepBackward(): void {
    if (this.state.step <= 0) return;
    this.pause();
    this.replayTo(this.state.step - 1);
  }

  /**
   * 设置播放速度。
   */
  setSpeed(speed: number): void {
    this.speed = speed;
  }

  /**
   * 重置到开头。
   */
  reset(): void {
    this.pause();
    this.state = {
      grid: GridGenerator.clone(this.initialGrid),
      score: 0,
      combo: 0,
      multiplier: 1,
      mistakeCount: 0,
      currentTime: 0,
      step: 0,
      totalSteps: this.actions.length,
      isPlaying: false,
      currentMinCell: null,
    };
    this.timeElapsedSinceLastAction = 0;
    this.notifyListeners();
  }

  /**
   * 获取当前复盘状态。
   */
  getState(): ReplayState {
    return { ...this.state };
  }

  /**
   * 订阅状态变化。
   */
  subscribe(listener: (state: ReplayState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 调度下一段播放。
   */
  private schedule(): void {
    if (!this.state.isPlaying || this.state.step >= this.state.totalSteps) {
      if (this.state.step >= this.state.totalSteps) {
        this.pause();
      }
      return;
    }

    const currentAction = this.actions[this.state.step];
    const prevAction = this.state.step > 0 ? this.actions[this.state.step - 1] : null;
    const targetTimestamp = currentAction.timestamp;
    const currentTimestamp = prevAction ? prevAction.timestamp : 0;

    // 播放过程中实时推进当前时间。
    const updateTimer = () => {
      if (!this.state.isPlaying) return;

      const now = Date.now();
      const deltaTime = (now - this.lastUpdateTime) / 1000 * this.speed;
      this.lastUpdateTime = now;
      this.timeElapsedSinceLastAction += deltaTime;

      // 计算当前应显示的复盘时间。
      const currentTime = currentTimestamp + this.timeElapsedSinceLastAction;

      if (currentTime >= targetTimestamp) {
        // 到达目标时间后执行该步动作。
        this.timeElapsedSinceLastAction = currentTime - targetTimestamp;
        this.executeStep(this.state.step);
        this.state.step++;
        this.notifyListeners();
        this.schedule();
      } else {
        // 未到达动作节点时，仅更新时间显示。
        this.state.currentTime = currentTime;
        this.notifyListeners();
        requestAnimationFrame(updateTimer);
      }
    };

    requestAnimationFrame(updateTimer);
  }

  /**
   * 执行单步动作。
   */
  private executeStep(step: number): void {
    const action = this.actions[step];
    this.state.currentTime = action.timestamp;

    if (action.row >= 0) {
      // 正确点击。
      const cell = this.state.grid[action.row][action.col];
      const minNum = Math.min(...cell.numbers);
      cell.numbers = cell.numbers.filter(n => n !== minNum);

      this.state.combo++;
      this.state.multiplier = ScoreCalculator.getComboMultiplier(this.state.combo);
      this.state.mistakeCount = 0;

      const scoreGain = ScoreCalculator.calculate({
        baseScore: 1,
        comboMultiplier: this.state.multiplier,
        clickIntervalMs: action.interval * 1000,
        isLazy: this.config.lazy,
        gridSize: this.config.size,
        isFinalClick: false,
      });

      this.state.score = Math.round((this.state.score + scoreGain) * 1000) / 1000;
    } else if (action.row === -1) {
      // 错误点击，沿用正式对局的渐进惩罚。
      this.state.mistakeCount++;

      if (this.state.mistakeCount === 1) {
        this.state.multiplier *= 0.5;
      } else if (this.state.mistakeCount === 2) {
        this.state.multiplier *= 0.5;
      } else if (this.state.mistakeCount >= 3) {
        this.state.multiplier = 1;
        this.state.combo = 0;
      }
    } else if (action.row === -2) {
      // 最后一击。
      const bonus = ScoreCalculator.calculate({
        baseScore: 1,
        comboMultiplier: this.state.multiplier * 3,
        clickIntervalMs: action.interval * 1000,
        isLazy: this.config.lazy,
        gridSize: this.config.size,
        isFinalClick: true,
      });

      this.state.score = Math.round((this.state.score + bonus) * 1000) / 1000;
    }

    // 每次动作后都重新计算当前最小格子。
    this.updateCurrentMinCell();
  }

  /**
   * 更新当前全局最小数字所在格子。
   */
  private updateCurrentMinCell(): void {
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
    this.state.currentMinCell = minCell;
  }

  /**
   * 从头回放到指定步骤。
   */
  private replayTo(targetStep: number): void {
    // 先恢复初始状态。
    this.state.grid = GridGenerator.clone(this.initialGrid);
    this.state.score = 0;
    this.state.combo = 0;
    this.state.multiplier = 1;
    this.state.mistakeCount = 0;
    this.state.currentTime = 0;
    this.state.step = 0;
    this.state.currentMinCell = null;
    this.timeElapsedSinceLastAction = 0;

    // 再逐步执行到目标步骤。
    for (let i = 0; i < targetStep; i++) {
      this.executeStep(i);
      this.state.step++;
    }

    if (targetStep > 0) {
      this.state.currentTime = this.actions[targetStep - 1].timestamp;
    }

    this.notifyListeners();
  }

  /**
   * 通知所有订阅者。
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }
}
