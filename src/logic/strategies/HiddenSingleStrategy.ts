import type { ISolverStrategy } from './ISolverStrategy';
import type { Grid, Candidates, Hint } from '../types';
import { SudokuHelper } from '../SudokuHelper';

export class HiddenSingleStrategy implements ISolverStrategy {
  name = 'Hidden Single (摒除法)';

  solve(grid: Grid, candidates: Candidates): Hint | null {
    const units = SudokuHelper.getUnits(); // 获取所有行、列、宫的索引组合

    // 遍历每一个单元（行、列、宫）
    for (const unit of units) {
      // 统计该单元内，每个数字(1-9)出现的次数和位置
      // countMap: key=number(1-9), value=array of cell indices
      const countMap = new Map<number, number[]>();

      for (const index of unit) {
        // 如果格子已有数字，跳过
        if (grid[index] !== 0) continue;

        // 记录该格子所有候选数的出现情况
        for (const candidate of candidates[index]) {
          if (!countMap.has(candidate)) countMap.set(candidate, []);
          countMap.get(candidate)!.push(index);
        }
      }

      // 检查是否有数字只出现了一次
      for (const [num, indices] of countMap.entries()) {
        if (indices.length === 1) {
          const targetCell = indices[0];
          return {
            cellIndex: targetCell,
            value: num,
            strategyName: this.name,
            description: `在当前区域内，数字 ${num} 只能填入 R${Math.floor(targetCell / 9) + 1}C${(targetCell % 9) + 1}，因为区域内其他位置不能填入此数。`,
            affectedCells: unit, // 高亮整个区域作为提示线索
            type: 'FILL',
          };
        }
      }
    }

    return null;
  }
}
