import type { ISolverStrategy } from './ISolverStrategy';
import type { Grid, Candidates, Hint } from '../types';
import { SudokuHelper } from '../SudokuHelper';

export class SmartHiddenSingleStrategy implements ISolverStrategy {
  // 策略名称
  name = 'Smart Hidden Single (区域独占法)';

  solve(grid: Grid, candidates: Candidates): Hint | null {
    // 1. 获取所有的 行、列、宫 组合
    const units = SudokuHelper.getUnits();

    // 2. 遍历每一个区域 (Unit)
    for (const unit of units) {
      // unit 是一个包含 9 个格子索引的数组

      // 我们要检查数字 1 到 9，看它们在当前区域的分布情况
      for (let num = 1; num <= 9; num++) {
        // 如果这个数字在这个区域里已经存在（填好了），就跳过
        if (this.isNumberAlreadyInUnit(grid, unit, num)) {
          continue;
        }

        // 3. 找出当前区域内，所有“允许填入 num”的空格子位置
        const possiblePositions: number[] = [];

        for (const cellIndex of unit) {
          // 必须是空格
          if (grid[cellIndex] === 0) {
            // 检查候选数列表里有没有 num
            // (candidates 数组已经是经过排除法计算过的了，包含了题目要求的“排除行列宫已有数”的逻辑)
            if (candidates[cellIndex].includes(num)) {
              possiblePositions.push(cellIndex);
            }
          }
        }

        // 4. 核心判断：如果这个数字 num 在当前区域里，只能去 1 个地方
        if (possiblePositions.length === 1) {
          const targetCell = possiblePositions[0];

          return {
            cellIndex: targetCell,
            value: num,
            strategyName: this.name,
            // 生成详细的描述信息
            description: `观察${this.getUnitDescription(unit, targetCell)}：数字 ${num} 在该区域内没有其他位置可填，只能填入格子 R${Math.floor(targetCell / 9) + 1}C${(targetCell % 9) + 1}。`,
            affectedCells: unit, // 高亮整个区域作为证据
            type: 'FILL',
          };
        }

        // 5. 错误检测（按你的要求）：
        // 如果 possiblePositions.length === 0，说明这个区域里没地方放 num 了
        // 这意味着之前的步骤填错了，导致无解。
        // 但作为“提示器”，我们通常只返回正向的“下一步”。
        // 如果你想看这里报错，可以在控制台打印：
        if (possiblePositions.length === 0) {
          console.warn(`[逻辑错误] 在某个区域中，数字 ${num} 无处可填！此前可能有填错。`);
        }
      }
    }

    return null;
  }

  // 辅助：检查区域里是否已有该数字
  private isNumberAlreadyInUnit(grid: Grid, unit: number[], num: number): boolean {
    return unit.some((index) => grid[index] === num);
  }

  // 辅助：生成友好的区域描述（行、列还是宫？）
  private getUnitDescription(unit: number[], cellIndex: number): string {
    const row = Math.floor(cellIndex / 9);
    const col = cellIndex % 9;

    // 简单判断一下unit属于哪种类型
    // 如果unit里的所有索引除以9都相同，则是行
    if (unit.every((i) => Math.floor(i / 9) === row)) return `第 ${row + 1} 行`;
    // 如果unit里的所有索引模9都相同，则是列
    if (unit.every((i) => i % 9 === col)) return `第 ${col + 1} 列`;
    // 否则是宫
    return `当前九宫格`;
  }
}
