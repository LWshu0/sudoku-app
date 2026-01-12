<script>
  import { onMount, onDestroy } from 'svelte';
  import Board from '../../Board/index.svelte';
  import { creator } from '../../../creator_mode/creator.js';
  import { cursor } from '@sudoku/stores/cursor';
  import {SUDOKU_SIZE, BOX_SIZE} from '@sudoku/constants.js';

  // export let data = {};
  export let hideModal;

  let archives = []; // 存档列表
  let name = ''; // 当前谜题名称
  let validation = { valid: true, issues: [] }; // 验证结果

  // 获取存档列表
  function loadArchives() {
    archives = creator.list();
  }

  // 运行验证并更新状态
  function runValidate() {
    try {
      const res = creator.validate();
      validation = res || { valid: true, issues: [] };
    } catch (e) {
      console.error('creator validate failed', e);
      validation = { valid: true, issues: [] };
    }
  }

  // 初始加载存档列表
  onMount(() => {
    loadArchives();
  });

  // 订阅 creator 变化以实时验证
  let _unsubCreator;
  onMount(() => {
    _unsubCreator = creator.subscribe(() => {
      runValidate();
    });
  });

  // 清理订阅
  onDestroy(() => {
    if (_unsubCreator) _unsubCreator();
  });

  // 给最外层 modal 容器添加特定类以覆盖样式
  let modalContainerEl;
  onMount(() => {
    // find closest modal container element and add a class
    modalContainerEl = document.querySelector('.modal-container:last-of-type');
    if (modalContainerEl) {
      modalContainerEl.classList.add('creator-modal-container');
    }
  });

  // 清理类名
  onDestroy(() => {
    if (modalContainerEl) {
      modalContainerEl.classList.remove('creator-modal-container');
    }
  });

  // 保存存档的功能
  function handleSave() {
    const id = creator.save(name || undefined);
    loadArchives();
    if (id && !name) name = 'Untitled';
    alert('Saved');
  }

  // 撤销功能
  function handleUndo() {
    creator.undo();
  }

  // 重做功能
  function handleRedo() {
    creator.redo();
  }

  // 导入存档的功能
  function handleImport() {
    const s = prompt('Paste puzzle code (sencode):');
    if (s) {
      const ok = creator.importSencode(s);
      if (ok) alert('Imported');
      else alert('Import failed');
      runValidate();
    }
  }

  // 导出存档的功能
  function handleExport() {
    const s = creator.exportSencode();
    prompt('Copy this puzzle code:', s);
  }

  // 创建新盘的功能
  function handleNew() {
    if (confirm('Are you sure you want to create a new one? All current content will disappear!')) {
      creator.enter();
    }
  }

  // 加载存档的功能
  function handleLoad(id) {
    if (!confirm('Load this puzzle? Current content will be replaced.')) return;
    creator.load(id);
    runValidate();
  }

  // 删除存档的功能
  function handleDelete(id) {
    if (confirm('Delete this puzzle?')) {
      creator.delete(id);
      loadArchives();
    }
  }

  // 处理数字键盘输入
  function handleKeypad(num) {
    const c = $cursor;
    if (c.x === null || c.y === null) {
      alert('Select a cell first');
      return;
    }
    creator.setCell(c.x, c.y, num);
    runValidate();
  }

  // 处理棋盘单元格编辑
  function handleCellEdit(e) {
    // e = { x, y, value }
    creator.setCell(e.x, e.y, e.value);
    runValidate();
  }

  // 清空全盘的功能
  function handleReset() {
      if (confirm('Are you sure you want to reset? This operation is irreversible!')) {
          creator.reset();
          runValidate();
      }
  }

  function computeInvalids(grid2d) {
    const _invalid = [];

    const addInvalid = (x, y) => {
      const xy = x + ',' + y;
      if (!_invalid.includes(xy)) _invalid.push(xy);
    };

    for (let y = 0; y < SUDOKU_SIZE; y++) {
      for (let x = 0; x < SUDOKU_SIZE; x++) {
        const value = grid2d[y][x];
        if (value) {
          for (let i = 0; i < SUDOKU_SIZE; i++) {
            // row
            if (i !== x && grid2d[y][i] === value) addInvalid(x, y);
            // column
            if (i !== y && grid2d[i][x] === value) addInvalid(x, y);
          }

          // box
          const startY = Math.floor(y / BOX_SIZE) * BOX_SIZE;
          const endY = startY + BOX_SIZE;
          const startX = Math.floor(x / BOX_SIZE) * BOX_SIZE;
          const endX = startX + BOX_SIZE;
          for (let row = startY; row < endY; row++) {
            for (let col = startX; col < endX; col++) {
              if ((row !== y || col !== x) && grid2d[row][col] === value) {
                addInvalid(x, y);
              }
            }
          }
        }
      }
    }

    return _invalid;
  }
</script>

<div class="creator-wrapper">
  <div class="flex justify-between items-center mb-6 shrink-0">
    <h1 class="text-2xl font-bold text-gray-800">Create Your Own Sudoku</h1>
    <button class="p-2 hover:bg-gray-100 rounded-full transition-colors" on:click={hideModal}>
      <svg class="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  <div class="creator-container">
    
    <div class="board-section">
      {#if !validation.valid}
        <div class="error-toast">
          <span class="font-bold">⚠️ 注意:</span> {validation.issues[0]?.message || '布局冲突'}
        </div>
      {/if}

      <div class="board-container-fixed">
        {#if $creator && $creator.grid}
          <Board 
            overrideUserGrid={$creator.grid}
            startingGrid={$creator.startingGrid} 
            invalidCellsOverride={computeInvalids($creator.grid)} 
            editable={true} 
            disabled={false}
            onCellEdit={handleCellEdit} 
          />
        {:else}
          <div class="text-gray-400">Loading Board...</div>
        {/if}
      </div>
    </div>
    
    <div class="tools-section">
      <div class="tool-group">
        <label class="block text-sm font-medium text-gray-600 mb-1">Puzzle Name</label>
        <div class="flex gap-2">
          <input class="custom-input" placeholder="Untitled..." bind:value={name} />
          <button class="btn-primary" on:click={handleSave}>Save</button>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2">
        <button class="btn-outline" on:click={handleNew}>New</button>
        <button class="btn-outline" on:click={handleUndo}>Undo</button>
        <button class="btn-outline" on:click={handleRedo}>Redo</button>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <button class="btn-secondary" on:click={handleImport}>Import</button>
        <button class="btn-secondary" on:click={handleExport}>Export</button>
      </div>

      <div class="separator"></div>

      <div class="keypad-area">
        <h2 class="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Input Keypad</h2>
        
        <div class="grid grid-cols-3 gap-2 mb-3">
          {#each Array(9) as _, i}
            <button class="key-button" on:click={() => handleKeypad(i + 1)}>{i + 1}</button>
          {/each}
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button class="action-btn clear-cell" on:click={() => handleKeypad(0)}>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
            </svg>
            Clear Cell
          </button>
          
          <button class="action-btn clear-all" on:click={handleReset}>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Reset Board
          </button>
        </div>
      </div>

      <div class="separator"></div>

      <div class="archives-area">
        <h2 class="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Saved Puzzles</h2>
        <div class="archives-list">
          {#each archives as a}
            <div class="archive-item">
              <div class="truncate leading-tight">
                <div class="font-bold text-gray-700 truncate text-sm">{a.name}</div>
                <div class="text-[10px] text-gray-400">{new Date(a.updatedAt).toLocaleDateString()}</div>
              </div>
              <div class="flex gap-1">
                <button class="icon-btn hover:text-blue-600" on:click={() => handleLoad(a.id)}>
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                </button>
                <button class="icon-btn hover:text-red-600" on:click={() => handleDelete(a.id)}>
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          {:else}
            <div class="text-center py-4 text-gray-400 text-xs italic">No puzzles saved yet</div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* 解决尺寸塌陷的关键样式 */
  .creator-wrapper {
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    height: 100%;
    max-height: 90vh;
    overflow: hidden;
    background: white;
  }

  .creator-container {
    display: grid;
    grid-template-columns: 1fr; /* 手机端一列 */
    gap: 1.5rem;
    flex: 1;
    min-height: 0; /* 允许内容在 grid 中正确缩放 */
  }

  @media (min-width: 1024px) {
    .creator-container {
      grid-template-columns: 1fr 300px; /* 大屏两列 */
    }
  }

  /* 棋盘显示区域 */
  .board-section {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f8fafc;
    border-radius: 1rem;
    border: 2px dashed #e2e8f0;
    padding: 2rem;
    min-height: 350px;
  }

  /* 强制锁定棋盘比例和大小 */
  .board-container-fixed {
    width: 100%;
    max-width: 480px; /* 限制最大尺寸 */
    aspect-ratio: 1 / 1;
    display: block; /* 避免 flex 干扰组件内部计算 */
  }

  /* 工具栏滚动条优化 */
  .tools-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow-y: auto;
    padding-right: 0.5rem;
  }

  /* UI 元素微调 */
  .custom-input {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 0.875rem;
  }

  .error-toast {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    right: 0.75rem;
    padding: 0.5rem 1rem;
    background: #fff1f2;
    color: #e11d48;
    border: 1px solid #fda4af;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    z-index: 20;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .separator {
    height: 1px;
    background: #f1f5f9;
    margin: 0.5rem 0;
  }

  .archives-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    overflow-y: auto;
    max-height: 180px;
  }

  .archive-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 0.75rem;
    background: white;
    border: 1px solid #f1f5f9;
    border-radius: 0.5rem;
    transition: background 0.2s;
  }
  .archive-item:hover { background: #f8fafc; }

  /* 按钮系统 */
  .btn-primary { background: #2563eb; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 600; font-size: 0.875rem; }
  .btn-outline { border: 1px solid #e2e8f0; padding: 0.5rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; }
  .btn-secondary { background: #334155; color: white; padding: 0.5rem; border-radius: 0.5rem; font-size: 0.825rem; }

  .key-button {
    aspect-ratio: 1/1;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    font-weight: 700;
    font-size: 1.125rem;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }
  .key-button:hover { border-color: #3b82f6; color: #2563eb; }

  .icon-btn { color: #94a3b8; padding: 0.25rem; }

  /* 覆盖父级 Modal */
  :global(.creator-modal-container) {
    max-width: 950px !important;
    width: 95vw !important;
    height: auto !important;
    min-height: 550px;
  }
</style>