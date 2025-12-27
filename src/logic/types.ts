// 定义盘面：81个数字的数组，0代表空格
export type Grid = number[];

// 候选数：每个格子的可能值数组，例如 [1, 2, 4]
export type Candidates = number[][];

// 提示信息的结构（核心输出）
export interface Hint {
    cellIndex: number;          // 目标格子的索引 (0-80)
    value: number;              // 填入的数字
    strategyName: string;       // 策略名称，如 "Naked Single"
    description: string;        // 给用户的自然语言解释
    affectedCells: number[];    // 需要高亮的关联格子（作为证据）
    type: 'FILL' | 'ELIMINATE'; // 是填数还是删减候选数（初级主要是填数）
}