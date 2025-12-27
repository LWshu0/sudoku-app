import type { Grid, Hint } from './types';
import { SudokuHelper } from './SudokuHelper';
import type { ISolverStrategy } from './strategies/ISolverStrategy';
import { NakedSingleStrategy } from './strategies/NakedSingleStrategy';
import { HiddenSingleStrategy } from './strategies/HiddenSingleStrategy';
import { IntersectionStrategy } from './strategies/IntersectionStrategy';
import { GuessStrategy } from './strategies/GuessStrategy';
import { SmartHiddenSingleStrategy } from './strategies/SmartHiddenSingleStrategy';

export class Solver {
    private strategies: ISolverStrategy[];

    constructor() {
        this.strategies = [
            new NakedSingleStrategy(),
            new HiddenSingleStrategy(),
            new SmartHiddenSingleStrategy(),
            new IntersectionStrategy(),
            new GuessStrategy()
        ];
    }

    /**
     * @param grid 数字盘面
     * @param userNotes 用户笔记 (新增参数)
     */
    public getNextHint(grid: Grid, userNotes?: number[][]): Hint | null {
        // 0. 错误检查 (保持之前加的 findConflict)
        console.log("Solver 接收到的盘面:", grid);

        const errorMsg = this.findConflict(grid);
        if (errorMsg) {
            console.warn("Solver 发现冲突:", errorMsg); // <--- 这一行很重要，看控制台有没有输出
            return {
                cellIndex: -1,
                value: 0,
                strategyName: "错误警告",
                description: errorMsg,
                affectedCells: [],
                type: 'ELIMINATE'
            };
        }

        // 1. 预处理：传入 userNotes
        const candidates = SudokuHelper.getCandidates(grid, userNotes);

        // 2. 遍历策略
        for (const strategy of this.strategies) {
            const hint = strategy.solve(grid, candidates);
            if (hint) return hint;
        }

        return null;
    }
    // --- 新增：检查当前盘面是否有冲突 ---
    private findConflict(grid: Grid): string | null {
        const units = SudokuHelper.getUnits();
        for (const unit of units) {
            const seen = new Map<number, number>();
            for (const idx of unit) {
                const val = grid[idx];

                // === 关键修改：严格限制 val 必须是 1-9 之间的数字 ===
                // 这样即使传入了 undefined, null 或 0，都会被忽略，不会误报冲突
                if (typeof val === 'number' && val >= 1 && val <= 9) {
                    if (seen.has(val)) {
                        return `当前盘面存在错误！在 ${this.getUnitName(unit)} 中，数字 ${val} 出现了两次。请先修正错误。`;
                    }
                    seen.set(val, idx);
                }
            }
        }
        return null;
    }

    private getUnitName(unit: number[]): string {
        // 简单判断是行、列还是宫，用于生成友好的错误提示
        // 这里简化处理，直接返回“某行/列/宫”
        return "同一行、列或宫";
    }
}