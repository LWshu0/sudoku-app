import type { Grid, Candidates, Hint } from '../types';

export interface ISolverStrategy {
  name: string;
  // 核心方法：给定盘面和候选数，尝试找到一个提示。如果找不到，返回 null。
  solve(grid: Grid, candidates: Candidates): Hint | null;
}
