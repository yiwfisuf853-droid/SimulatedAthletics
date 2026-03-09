/**
 * 得分计算器。
 */
export class ScoreCalculator {
  /**
   * 计算单次操作得分。
   */
  static calculate(params: {
    baseScore: number;
    comboMultiplier: number;
    clickIntervalMs: number;
    isLazy: boolean;
    gridSize: number;
    isFinalClick: boolean;
  }): number {
    const { baseScore, comboMultiplier, clickIntervalMs, isLazy, gridSize, isFinalClick } = params;

    const bonus = this.calculateBonus(clickIntervalMs, isFinalClick);
    const lazyPenalty = isLazy ? Math.pow(2, gridSize - 2) : 1;
    const rawScore = (baseScore * comboMultiplier * bonus) / lazyPenalty;

    return Math.round(rawScore * 1000) / 1000;
  }

  /**
   * 根据点击间隔计算速度加成。
   * @param intervalMs 点击间隔（毫秒）
   * @param isFinal 是否为最后一击
   */
  static calculateBonus(intervalMs: number, isFinal: boolean): number {
    const cps = intervalMs > 0 ? 1000 / intervalMs : 0;

    if (isFinal) {
      // 最后一击奖励更克制，避免后置结算权重过高。
      if (cps >= 20) return 0.3;
      if (cps >= 2) return 0.1 + (cps - 2) * 0.2 / 18;
      return 0.05;
    }

    // 常规点击更强调速度表现。
    if (cps >= 20) return 3.0;
    if (cps >= 2) return 1 + (cps - 2) * 2 / 18;
    return 1.0;
  }

  /**
   * 计算连击倍率。
   */
  static getComboMultiplier(combo: number): number {
    return 1 + combo * 0.1;
  }

  /**
   * 根据数字所在层级返回显示级别。
   */
  static getNumberLevel(num: number, gridSize: number): number {
    return Math.min(3, Math.floor((num - 1) / (gridSize * gridSize)));
  }

  /**
   * 预测最后一击奖励。
   */
  static predictFinalBonus(params: {
    currentScore: number;
    comboMultiplier: number;
    lastClickIntervalMs: number;
    isLazy: boolean;
    gridSize: number;
  }): number {
    const { currentScore, comboMultiplier, lastClickIntervalMs, isLazy, gridSize } = params;

    const bonus = this.calculateBonus(lastClickIntervalMs, true);
    const lazyPenalty = isLazy ? Math.pow(2, gridSize - 2) : 1;
    const baseBonus = comboMultiplier * 3 * bonus;

    return Math.round((baseBonus * currentScore / lazyPenalty) * 1000) / 1000;
  }
}
