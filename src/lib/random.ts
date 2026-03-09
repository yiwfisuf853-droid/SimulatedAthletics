/**
 * 梅森旋转算法伪随机数生成器
 * 支持字符串种子，确保相同种子生成相同序列
 */
export class SeededRandom {
  private mt: Uint32Array;
  private mti: number;

  constructor(seed: string | number) {
    this.mt = new Uint32Array(624);
    this.mti = 625;
    
    // 字符串种子转为数字
    let s: number;
    if (typeof seed === 'string') {
      s = [...seed].reduce((h, c) => (h << 5) - h + c.charCodeAt(0), 0);
    } else {
      s = seed;
    }
    
    this.mt[0] = s >>> 0;
    for (this.mti = 1; this.mti < 624; this.mti++) {
      this.mt[this.mti] = (
        1812433253 * (this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >>> 30)) + this.mti
      ) >>> 0;
    }
  }

  /**
   * 提取随机数
   */
  private extractNumber(): number {
    if (this.mti >= 624) {
      this.twist();
    }
    
    let y = this.mt[this.mti++];
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;
    
    return y >>> 0;
  }

  /**
   * MT19937 twist操作
   */
  private twist(): void {
    for (let i = 0; i < 624; i++) {
      const y = (this.mt[i] & 0x80000000) + (this.mt[(i + 1) % 624] & 0x7fffffff);
      this.mt[i] = this.mt[(i + 397) % 624] ^ (y >>> 1);
      if (y % 2 !== 0) {
        this.mt[i] ^= 0x9908b0df;
      }
    }
    this.mti = 0;
  }

  /**
   * 获取 [0, 1) 范围随机数
   */
  random(): number {
    return this.extractNumber() / 4294967296;
  }

  /**
   * 获取 [min, max) 范围随机整数
   */
  randInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min)) + min;
  }

  /**
   * Fisher-Yates 洗牌
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.randInt(0, i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
