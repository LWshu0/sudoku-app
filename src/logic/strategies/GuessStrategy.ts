import type { ISolverStrategy } from './ISolverStrategy';
import type { Grid, Candidates, Hint } from '../types';

export class GuessStrategy implements ISolverStrategy {
  name = 'Guesser (试错/探索)';

  solve(grid: Grid, candidates: Candidates): Hint | null {
    // 找到候选数最少的格子（比如只有 2 个候选数的）
    let minCandidates = 10;
    let bestCell = -1;

    for (let i = 0; i < 81; i++) {
      if (grid[i] === 0 && candidates[i].length > 1) {
        if (candidates[i].length < minCandidates) {
          minCandidates = candidates[i].length;
          bestCell = i;
        }
      }
    }

    if (bestCell !== -1) {
      // 随便取第一个候选数建议用户尝试
      // 在更高级的实现中，这里会结合“回溯”功能记录状态
      const guessValue = candidates[bestCell][0];
      return {
        cellIndex: bestCell,
        value: guessValue,
        strategyName: this.name,
        description: `逻辑推演暂时无法找到确定的解。建议尝试在格子上填入 ${guessValue}（基于该格候选数最少原则）。这是一种“探索”策略。`,
        affectedCells: [bestCell],
        type: 'FILL', // 猜测本质上也是填数
      };
    }

    return null;
  }
}
