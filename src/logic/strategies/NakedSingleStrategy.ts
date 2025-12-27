import type { ISolverStrategy } from './ISolverStrategy';
import type { Grid, Candidates, Hint } from '../types';

export class NakedSingleStrategy implements ISolverStrategy {
    name = "Naked Single (唯一数)";

    solve(grid: Grid, candidates: Candidates): Hint | null {
        for (let i = 0; i < 81; i++) {
            // 如果该格子是空的，且只有一个候选数
            if (grid[i] === 0 && candidates[i].length === 1) {
                const value = candidates[i][0];
                return {
                    cellIndex: i,
                    value: value,
                    strategyName: this.name,
                    description: `格子 R${Math.floor(i / 9) + 1}C${i % 9 + 1} 只有一个候选数 ${value}，因为同行、列或宫已包含其他数字。`,
                    affectedCells: [i], // 这里可以进一步优化，把使其成为唯一数的peers也加入高亮
                    type: 'FILL'
                };
            }
        }
        return null;
    }
}