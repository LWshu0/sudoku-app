import type { ISolverStrategy } from './ISolverStrategy';
import type { Grid, Candidates, Hint } from '../types';
import { SudokuHelper } from '../SudokuHelper';

export class IntersectionStrategy implements ISolverStrategy {
    name = "Pointing Pairs (区块摒除)";

    solve(grid: Grid, candidates: Candidates): Hint | null {
        // 遍历所有 9 个宫
        for (let boxRow = 0; boxRow < 3; boxRow++) {
            for (let boxCol = 0; boxCol < 3; boxCol++) {

                // 检查数字 1-9
                for (let num = 1; num <= 9; num++) {
                    const positions: number[] = [];

                    // 找出该数字在当前宫内的所有可能位置
                    for (let r = 0; r < 3; r++) {
                        for (let c = 0; c < 3; c++) {
                            const idx = (boxRow * 3 + r) * 9 + (boxCol * 3 + c);
                            if (grid[idx] === 0 && candidates[idx].includes(num)) {
                                positions.push(idx);
                            }
                        }
                    }

                    // 如果该数字在宫内只出现在 2 或 3 个位置，且这些位置都在同一行或同一列
                    if (positions.length >= 2 && positions.length <= 3) {
                        const isSameRow = positions.every(p => Math.floor(p / 9) === Math.floor(positions[0] / 9));
                        const isSameCol = positions.every(p => p % 9 === positions[0] % 9);

                        if (isSameRow) {
                            const row = Math.floor(positions[0] / 9);
                            // 检查该行在宫外的其他格子是否有这个数字
                            const eliminations = this.findEliminationsInRow(row, num, positions, candidates, grid);
                            if (eliminations.length > 0) {
                                return {
                                    cellIndex: eliminations[0], // 这里的 cellIndex 仅作定位用
                                    value: num,
                                    strategyName: this.name,
                                    description: `在第 ${boxRow * 3 + boxCol + 1} 宫中，数字 ${num} 只能出现在第 ${row + 1} 行。因此，该行其他位置不能填入 ${num}。这将解锁新的填数机会。`,
                                    affectedCells: [...positions, ...eliminations],
                                    type: 'ELIMINATE' // 注意：这是排除类型
                                };
                            }
                        }

                        if (isSameCol) {
                            const col = positions[0] % 9;
                            const eliminations = this.findEliminationsInCol(col, num, positions, candidates, grid);
                            if (eliminations.length > 0) {
                                return {
                                    cellIndex: eliminations[0],
                                    value: num,
                                    strategyName: this.name,
                                    description: `在第 ${boxRow * 3 + boxCol + 1} 宫中，数字 ${num} 只能出现在第 ${col + 1} 列。因此，该列其他位置不能填入 ${num}。`,
                                    affectedCells: [...positions, ...eliminations],
                                    type: 'ELIMINATE'
                                };
                            }
                        }
                    }
                }
            }
        }
        return null;
    }

    private findEliminationsInRow(row: number, num: number, keepIdxs: number[], candidates: Candidates, grid: Grid): number[] {
        const result: number[] = [];
        for (let c = 0; c < 9; c++) {
            const idx = row * 9 + c;
            // 如果是空格，且有该候选数，且不在保留列表中（即在宫外）
            if (grid[idx] === 0 && candidates[idx].includes(num) && !keepIdxs.includes(idx)) {
                result.push(idx);
            }
        }
        return result;
    }

    private findEliminationsInCol(col: number, num: number, keepIdxs: number[], candidates: Candidates, grid: Grid): number[] {
        const result: number[] = [];
        for (let r = 0; r < 9; r++) {
            const idx = r * 9 + col;
            if (grid[idx] === 0 && candidates[idx].includes(num) && !keepIdxs.includes(idx)) {
                result.push(idx);
            }
        }
        return result;
    }
}   