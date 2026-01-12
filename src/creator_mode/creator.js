import { writable, get } from 'svelte/store';
import { createCommandManager } from './lib/commandManager.js';
import { Solver } from '../logic/Solver.js';
import { SUDOKU_SIZE } from '@sudoku/constants.js';
import * as repository from './lib/repository.js';
import * as parser from './lib/parser.js';
// Simple Creator store with localStorage repository and basic undo/redo

// 创建一个空的数独网格
function emptyGrid() {
    const g = new Array(SUDOKU_SIZE);
    for (let y = 0; y < SUDOKU_SIZE; y++) {
        g[y] = new Array(SUDOKU_SIZE).fill(0);
    }
    return g;
}

// 深拷贝数独网格
function cloneGrid(grid) {
    return grid.map((row) => row.slice());
}

// 生成唯一ID
function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// Creator store
function createCreatorStore() {
    const initial = {
        mode: 'off', // 'off' | 'creator'
        grid: emptyGrid(),
        startingGrid: emptyGrid(), // 新增：用于记录初始快照
        id: null,
        name: null,
        meta: {},
        isModified: false,
    };

    const { subscribe, update, set } = writable(initial);

    // repository functions (delegated)
    function list() {
        return repository.list();
    }

    function saveToRepo(entry) {
        return repository.save(entry);
    }

    function removeFromRepo(id) {
        return repository.remove(id);
    }

    // command manager (Command pattern)
    const commandManager = createCommandManager(500);

    // 内部辅助函数：统一处理加载新棋盘的逻辑
    function _loadBoard(state, newGrid) {
        const cloned = cloneGrid(newGrid);
        state.grid = cloned;
        state.startingGrid = cloneGrid(cloned); // 同步初始快照
        state.isModified = false;
        commandManager.clear(); // 清空撤销重做栈
    }

    return {
        subscribe,
        enter(initialGrid) {
            update((s) => {
                s.mode = 'creator';
                _loadBoard(s, initialGrid || emptyGrid());
                s.id = null;
                s.name = null;
                s.meta = {};
                return s;
            });
        },
        exit({ saveDraft = false } = {}) {
            update((s) => {
                if (saveDraft && s.isModified) {
                    const entry = {
                        id: s.id || uid(),
                        name: s.name || 'Untitled',
                        grid: cloneGrid(s.grid),
                        createdAt: s.meta.createdAt || Date.now(),
                        updatedAt: Date.now(),
                    };
                    const savedId = saveToRepo(entry);
                    s.id = savedId;
                    s.meta.createdAt = entry.createdAt;
                    s.meta.updatedAt = entry.updatedAt;
                    s.isModified = false;
                }
                s.mode = 'off';
                return s;
            });
        },
        setCell(x, y, value) {
            const s = get({ subscribe }); // 获取当前快照
            let prevVal = s.grid[y][x];

            if (prevVal === value) return;

            // register command with commandManager (keeps function-based undo/redo)
            commandManager.execute(
                () => {
                    // redo/do function
                    update((s) => {
                        s.grid[y][x] = value;
                        s.isModified = true;
                        return s;
                    });
                },
                () => {
                    // undo function
                    update((s) => {
                        s.grid[y][x] = prevVal;
                        s.isModified = true;
                        return s;
                    });
                }
            );

        },
        clearCell(x, y) {
            this.setCell(x, y, 0);
        },
        undo() {
            commandManager.undo();
        },
        redo() {
            commandManager.redo();
        },
        save(name) {
            let savedId;
            update((s) => {
                const entry = {
                    id: s.id || uid(),
                    name: name || s.name || 'Untitled',
                    grid: cloneGrid(s.grid),
                    createdAt: s.meta.createdAt || Date.now(),
                    updatedAt: Date.now(),
                };
                const id = saveToRepo(entry);
                s.id = id;
                s.name = entry.name;
                s.meta.createdAt = entry.createdAt;
                s.meta.updatedAt = entry.updatedAt;
                s.isModified = false;
                savedId = s.id;
                return s;
            });
            return savedId;
        },
        load(id) {
            const entry = repository.load(id);
            if (!entry) return false;
            update((s) => {
                s.id = entry.id;
                _loadBoard(s, entry.grid);
                s.name = entry.name;
                s.meta = { createdAt: entry.createdAt, updatedAt: entry.updatedAt };
                s.mode = 'creator';
                return s;
            });
            return true;
        },
        delete(id) {
            removeFromRepo(id);
        },
        list,
        exportSencode() {
            // Use parser.encode for consistent sencode/url encoding
            let dump;
            update((s) => {
                dump = parser.encode(s.grid);
                return s;
            });
            return dump;
        },
        importSencode(s) {
            try {
                // Try parser.parse first (supports sencode/url)
                const grid = parser.parse(s);
                update((state) => {
                    _loadBoard(state, grid);
                    // state.isModified = true;
                    return state;
                });
                return true;
            } catch (e) {
                // 返回错误信息
                console.error('creator import failed', e);
                return false;
            }
        },
        validate() {
            const s = get({ subscribe });
            const gridFlat = s.grid.flat().map(v => v || 0);

            // 直接利用 Solver 的 getNextHint 探测错误
            // 因为 Solver 内部第一步就是运行 findConflict
            const solver = new Solver();
            const hint = solver.getNextHint(gridFlat);

            if (hint && hint.strategyName === '错误警告') {
                return {
                    valid: false,
                    issues: [{ type: 'conflict', message: hint.description }]
                };
            }

            return { valid: true, issues: [] };
        },
        reset() {
            update(s => {
                s.grid = cloneGrid(s.startingGrid);
                s.isModified = false;
                commandManager.clear();
                return s;
            });
        },
        // internal / utilities
        _resetStorage() {
            repository.clearAll();
        },
    };
}

export const creator = createCreatorStore();
