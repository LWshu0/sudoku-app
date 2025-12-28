// @ts-nocheck
import { get, writable } from 'svelte/store';
import { userGrid } from '@sudoku/stores/grid';
import { candidates } from '@sudoku/stores/candidates';
import { notes } from '@sudoku/stores/notes';
import { cursor } from '@sudoku/stores/cursor';
import { keyboardDisabled } from '@sudoku/stores/keyboard';

// 记录单步操作
type MaybePosition = { x: number | null | undefined; y: number | null | undefined } | null | undefined;

interface Position {
    x: number;
    y: number;
}

interface MutationContext {
    key: string;
    candidatesBefore?: Record<string, number[]>;
}

interface CellAction {
    type: 'input';
    pos: Position;
    prevValue: number;
    nextValue: number;
    prevCandidates: number[];
    nextCandidates: number[];
    noteMode: boolean;
}

interface BranchMeta {
    isBranchPoint: boolean;
    cellKey?: string;
    candidatesAtBranch?: number[];
    triedCandidates: number[];
}

interface HistoryEntry {
    action: CellAction;
    branch: BranchMeta;
}

const history: HistoryEntry[] = [];
let currentIndex = -1;

export const triedCandidatesStore = writable<Record<string, number[]>>({});

function normalizePosition(pos: MaybePosition): Position | null {
    if (!pos || pos.x == null || pos.y == null) {
        return null;
    }
    return { x: pos.x, y: pos.y };
}

function getCellKey(pos: Position): string {
    return `${pos.x},${pos.y}`;
}

function cloneCandidatesForKey(storeValue: any, key: string): number[] {
    if (!storeValue || !Object.prototype.hasOwnProperty.call(storeValue, key)) return [];
    const value = storeValue[key];
    return Array.isArray(value) ? [...value] : [];
}

function arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function applyCellState(pos: Position, value: number, cellCandidates: number[]): void {
    userGrid.set(pos as any, value as any);
    candidates.clear(pos as any);
    for (const n of cellCandidates) {
        candidates.add(pos as any, n as any);
    }
}

// 统一封装一次“对单个格子的修改”，根据来源和当前格子状态决定是否生成分支点
// source = 'user' 表示用户通过键盘输入；'hint' 表示各种自动提示逻辑
function recordMutation(
    pos: Position,
    noteMode: boolean,
    source: 'user' | 'hint',
    applyMutation: (context: MutationContext) => void
): void {
    const gridBefore = get(userGrid) as number[][];
    const candidatesBefore = get(candidates) as Record<string, number[]> | undefined;

    const key = getCellKey(pos);
    const prevValue = gridBefore[pos.y][pos.x];
    const prevCandidates = cloneCandidatesForKey(candidatesBefore, key);

    applyMutation({ key, candidatesBefore });

    const gridAfter = get(userGrid) as number[][];
    const candidatesAfter = get(candidates) as Record<string, number[]> | undefined;
    const nextValue = gridAfter[pos.y][pos.x];
    const nextCandidates = cloneCandidatesForKey(candidatesAfter, key);

    if (prevValue === nextValue && arraysEqual(prevCandidates, nextCandidates)) {
        return;
    }

    if (currentIndex < history.length - 1) {
        history.splice(currentIndex + 1);
    }

    // === 分支点判定（两个状态）===
    // 状态 A：该格不是“多候选”（prevCandidates.length <= 1）
    // 状态 B：该格是“多候选”（prevCandidates.length > 1）
    // 只有当「用户在状态 B 的格子里非笔记方式填入数字」时，才把这一步记为分支点。
    const wasMultiCandidateState = prevCandidates.length > 1;
    const isUserCommit = source === 'user' && !noteMode;
    const becameBranchPoint = isUserCommit && wasMultiCandidateState;

    const entry: HistoryEntry = {
        action: {
            type: 'input',
            pos: { x: pos.x, y: pos.y },
            prevValue,
            nextValue,
            prevCandidates,
            nextCandidates,
            noteMode,
        },
        branch: {
            isBranchPoint: becameBranchPoint,
            cellKey: becameBranchPoint ? key : undefined,
            // 分支点要记录的是“填数之前”的候选集，因此使用 prevCandidates
            candidatesAtBranch: becameBranchPoint ? [...prevCandidates] : undefined,
            triedCandidates: [],
        },
    };

    history.push(entry);
    currentIndex = history.length - 1;
}

function undoOne(): void {
    if (currentIndex < 0) return;
    const entry = history[currentIndex];
    const { pos, prevValue, prevCandidates } = entry.action;

    applyCellState(pos, prevValue, prevCandidates);
    currentIndex -= 1;
}

function redoOne(): void {
    if (currentIndex >= history.length - 1) return;
    const entry = history[currentIndex + 1];
    const { pos, nextValue, nextCandidates } = entry.action;

    applyCellState(pos, nextValue, nextCandidates);
    currentIndex += 1;
}

// === 外部 API ===

// 新局面：清空历史与尝试标记
export function initHistoryForNewGame(): void {
    history.length = 0;
    currentIndex = -1;
    triedCandidatesStore.set({});
}

// 统一处理键盘输入（包括笔记模式和正常模式），替代原 Keyboard 中的逻辑
export function handleNumberInput(num: number): void {
    if (get(keyboardDisabled)) return;

    const cursorPos = normalizePosition(get(cursor) as MaybePosition);
    if (!cursorPos) return;

    const isNoteMode = !!get(notes);

    recordMutation(cursorPos, isNoteMode, 'user', ({ key, candidatesBefore }) => {
        if (isNoteMode) {
            if (num === 0) {
                candidates.clear(cursorPos as any);
            } else {
                candidates.add(cursorPos as any, num as any);
            }
            userGrid.set(cursorPos as any, 0 as any);
        } else {
            if (candidatesBefore && Object.prototype.hasOwnProperty.call(candidatesBefore, key)) {
                candidates.clear(cursorPos as any);
            }
            userGrid.set(cursorPos as any, num as any);
        }
    });
}

export function applyValueWithHistory(pos: { x: number | null; y: number | null }, value: number): void {
    const normalized = normalizePosition(pos);
    if (!normalized) return;

    // 提示类填数，作为非用户分支（source = 'hint'），不产生新的分支点
    recordMutation(normalized, false, 'hint', ({ key, candidatesBefore }) => {
        if (candidatesBefore && Object.prototype.hasOwnProperty.call(candidatesBefore, key)) {
            candidates.clear(normalized as any);
        }
        userGrid.set(normalized as any, value as any);
    });
}

export function applyExternalMutation(
    pos: { x: number | null; y: number | null },
    mutate: (position: Position) => void
): void {
    const normalized = normalizePosition(pos);
    if (!normalized) return;

    // 外部一次性修改（如内置提示），同样记为 hint 来源
    recordMutation(normalized, false, 'hint', () => {
        mutate(normalized);
    });
}

export function undo(): void {
    undoOne();
}

export function redo(): void {
    redoOne();
}

// Restart：回溯至最近分支点；若不存在分支点，则回到根节点
export function restartFromLastBranch(): void {
    if (history.length === 0 || currentIndex < 0) {
        // 没有可撤销的用户输入，视为已经在根状态
        return;
    }

    // 从“当前之前”的位置向前寻找最近的分支点；
    // 如果当前条目本身就是分支点，则跳过它，以便多次点击 Restart 时逐级回溯到更早的分支
    const searchStart = history[currentIndex].branch.isBranchPoint ? currentIndex - 1 : currentIndex;

    let branchIndex = -1;
    for (let i = searchStart; i >= 0; i--) {
        if (history[i].branch.isBranchPoint) {
            branchIndex = i;
            break;
        }
    }

    // 若无分支点，回退到根（初始盘面）
    if (branchIndex === -1) {
        while (currentIndex >= 0) {
            undoOne();
        }
        triedCandidatesStore.set({});
        return;
    }

    const branchEntry = history[branchIndex];
    const cellKey = branchEntry.branch.cellKey!;
    const candidatesAtBranch = branchEntry.branch.candidatesAtBranch || [];

    // 在“分支点及其之后”的路径中，找出该格最后一次被真正填入的数字
    //（包括分支点本身的那次填数），用来标记为“已探索的候选”。
    let triedValue: number | null = null;
    for (let i = branchIndex; i <= currentIndex; i++) {
        const action = history[i].action;
        if (!action.noteMode && action.type === 'input') {
            const k = getCellKey(action.pos);
            if (k === cellKey && action.nextValue !== 0 && candidatesAtBranch.includes(action.nextValue)) {
                triedValue = action.nextValue;
            }
        }
    }

    // 更新该分支点下，已尝试过的候选列表，并同步到 UI 标记
    if (triedValue !== null) {
        if (!branchEntry.branch.triedCandidates.includes(triedValue)) {
            branchEntry.branch.triedCandidates.push(triedValue);
        }

        triedCandidatesStore.update((prev) => {
            const next = { ...prev };
            const existing = next[cellKey] ? [...next[cellKey]] : [];
            if (!existing.includes(triedValue!)) {
                existing.push(triedValue!);
            }
            next[cellKey] = existing;
            return next;
        });
    }

    // 实际回溯：连续执行 Undo，包含分支点这一步本身，
    // 回到“填数之前”的多候选笔记状态
    while (currentIndex >= branchIndex) {
        undoOne();
    }

    // 注意：历史条目仍然保留；接下来如有新输入，会自动截断当前索引之后的旧分支
}
