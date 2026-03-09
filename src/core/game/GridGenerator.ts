import { SeededRandom } from '@/lib/random';
import type { Cell } from '@/types/game';

/**
 * 棋盘生成器。
 */
export class GridGenerator {
  /**
   * 生成游戏棋盘。
   * @param size 棋盘边长
   * @param seed 随机种子
   * @param layers 有效层数，实际会生成 `layers + 1` 层
   */
  static generate(size: number, seed: string, layers: number): Cell[][] {
    const rng = new SeededRandom(seed + size.toString());
    const total = size * size;
    const actualLayers = layers + 1;

    // 为每一层准备对应的数字区间。
    const intervals: number[][] = [];
    for (let layer = 0; layer < actualLayers; layer++) {
      intervals[layer] = [];
      for (let num = 1; num <= total; num++) {
        intervals[layer].push(layer * total + num);
      }
    }

    // 分层打乱，保证局面可复现。
    intervals.forEach((arr, index) => {
      intervals[index] = rng.shuffle(arr);
    });

    // 将各层数字按格子分配，并在格内升序排列。
    const grid: Cell[][] = [];
    for (let row = 0; row < size; row++) {
      grid[row] = [];
      for (let col = 0; col < size; col++) {
        const numbers: number[] = [];
        for (let layer = 0; layer < actualLayers; layer++) {
          const num = intervals[layer].pop();
          if (num !== undefined) {
            numbers.push(num);
          }
        }
        grid[row][col] = {
          row,
          col,
          numbers: numbers.sort((a, b) => a - b),
        };
      }
    }

    return grid;
  }

  /**
   * 深拷贝棋盘。
   */
  static clone(grid: Cell[][]): Cell[][] {
    return grid.map(row =>
      row.map(cell => ({
        ...cell,
        numbers: [...cell.numbers],
      }))
    );
  }
}
