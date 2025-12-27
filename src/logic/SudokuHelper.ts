import type { Grid, Candidates } from './types';

export class SudokuHelper {
  // 获取相关联的格子索引（行、列、宫）
  static getPeers(index: number): number[] {
    const row = Math.floor(index / 9);
    const col = index % 9;
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;

    const peers = new Set<number>();

    for (let k = 0; k < 9; k++) {
      peers.add(row * 9 + k); // 同行
      peers.add(k * 9 + col); // 同列
      peers.add(boxRow * 9 + boxCol + (k % 3) + Math.floor(k / 3) * 9); // 同宫
    }
    peers.delete(index); // 排除自己
    return Array.from(peers);
  }

  /**
   * 计算候选数
   * @param grid 数字盘面
   * @param userNotes 用户的笔记（二维数组，每个元素是该格子的笔记数组，如 [1, 5]）
   */
  static getCandidates(grid: Grid, userNotes?: number[][]): Candidates {
    const candidates: Candidates = [];

    for (let i = 0; i < 81; i++) {
      // 1. 如果已经填了数字，就没有候选数了
      if (grid[i] !== 0) {
        candidates.push([]);
        continue;
      }

      // 2. 计算逻辑上的“全量候选数” (根据数独规则排除同行同列同宫)
      const used = new Set<number>();
      const peers = this.getPeers(i);
      peers.forEach((peerIdx) => {
        if (grid[peerIdx] !== 0) used.add(grid[peerIdx]);
      });

      // 逻辑上允许的数字
      const logicalCandidates = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => !used.has(n));

      // 3. 结合用户的笔记 (关键步骤!)
      // 如果用户在这个格子里有笔记，我们取“逻辑候选数”和“用户笔记”的交集
      // 这样既尊重了用户的“排除”操作，又防止用户标记了明显错误的候选数
      if (userNotes && userNotes[i] && userNotes[i].length > 0) {
        const filtered = logicalCandidates.filter((n) => userNotes[i].includes(n));

        // 如果交集为空（说明用户笔记可能记错了，或者逻辑上无解），
        // 为了防止程序卡死，我们可以回退到使用逻辑候选数，或者就留空让后续策略报错
        if (filtered.length === 0) {
          candidates.push(logicalCandidates); // 容错：笔记全错时，忽略笔记
        } else {
          candidates.push(filtered);
        }
      } else {
        // 如果用户没做笔记，就用逻辑算出来的全部可能性
        candidates.push(logicalCandidates);
      }
    }
    return candidates;
  }

  // 辅助：获取某一行/列/宫的所有索引
  static getUnits(): number[][] {
    const units: number[][] = [];
    // Rows
    for (let r = 0; r < 9; r++) units.push(Array.from({ length: 9 }, (_, i) => r * 9 + i));
    // Cols
    for (let c = 0; c < 9; c++) units.push(Array.from({ length: 9 }, (_, i) => i * 9 + c));
    // Boxes
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        const box: number[] = [];
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            box.push((br * 3 + r) * 9 + (bc * 3 + c));
          }
        }
        units.push(box);
      }
    }
    return units;
  }
}
