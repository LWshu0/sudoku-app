<script lang="ts">
  import { onMount } from 'svelte';
  import { sudokuParser } from '@sudoku/sudoku_parser';
  import game from '@sudoku/game';
  import { modal } from '@sudoku/stores/modal';
  import { gameWon } from '@sudoku/stores/game';
  // 新增：引入 grid store 和 cursor store 以便读取盘面和控制选中框
  import { grid, userGrid } from '@sudoku/stores/grid';
  import { cursor } from '@sudoku/stores/cursor';

  import Board from './components/Board/index.svelte';
  import Controls from './components/Controls/index.svelte';
  import Header from './components/Header/index.svelte';
  import Modal from './components/Modal/index.svelte';

  // 新增：引入我们写的解题器逻辑
  import { Solver } from './logic/Solver';
  import type { Hint } from './logic/types';

  // 实例化解题器
  const solver = new Solver();

  // 提示状态
  let currentHint: Hint | null = null;

  gameWon.subscribe((won) => {
    if (won) {
      game.pause();
      modal.show('gameover');
    }
  });

  onMount(() => {
    let hash = location.hash;

    if (hash.startsWith('#')) {
      hash = hash.slice(1);
    }

    let sencode;
    if (sudokuParser.validate(hash)) {
      sencode = hash;
    }

    modal.show('welcome', { onHide: game.resume, sencode });
  });

  function handleGetHint() {
    // 1. 数据转换：保持之前的二维转一维逻辑 (这是对的)
    const simpleGrid = [];

    // 直接遍历 $userGrid (它已经是纯数字了)
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        // 这里的 val 就是数字，0 代表空
        let val = $userGrid[r][c];
        simpleGrid.push(val);
      }
    }

    // 注意：你的 grid.js 里没有看到关于 notes (笔记) 的存储
    // 如果笔记存储在另一个 store (比如 notesStore)，你需要在这里引入并提取
    // 目前我们暂时传空笔记，Solver 依然能工作（只根据逻辑推导）
    const userNotes = [];

    // 2. 调用 Solver
    // console.log("发送给 Solver 的盘面:", simpleGrid);
    const hint = solver.getNextHint(simpleGrid, userNotes);

    if (hint) {
      currentHint = hint;

      // 3. 移动光标
      // Solver 返回的是一维 index (0-80)
      const col = hint.cellIndex % 9;
      const row = Math.floor(hint.cellIndex / 9);

      // 根据之前的经验，cursor.set 需要 (x, y)
      cursor.set(col, row);
    } else {
      alert('当前算法无法找到下一步，或题目已解完。');
      currentHint = null;
    }
  }
  function applyHint() {
    if (!currentHint) return;

    if (currentHint.type === 'FILL') {
      const index = currentHint.cellIndex;
      const value = currentHint.value;

      // 计算坐标
      const col = index % 9;
      const row = Math.floor(index / 9);

      // === 核心修改：调用 userGrid 提供的 API ===
      // grid.js 定义了 set: (pos, value) => { ... }
      // pos 是 {x, y}
      userGrid.set({ x: col, y: row }, value);

      // 移动光标并清除提示
      cursor.set(col, row);
      currentHint = null;
    } else if (currentHint.type === 'ELIMINATE') {
      // 你的 grid.js 里目前看起来不支持删除笔记的 API
      // 只能提示用户
      alert('排除策略：' + currentHint.description + '\n\n(请手动删除笔记)');
    }
  }
  function closeHint() {
    currentHint = null;
  }
</script>

<!-- Timer, Menu, etc. -->
<header>
  <Header />
</header>

<!-- Sudoku Field -->
<section>
  <Board />
</section>

<!-- === 新增：提示功能控制区 (插入在 Board 和 Footer 之间) === -->
<div class="hint-section">
  <!-- 提示按钮 -->
  <div class="hint-controls">
    <button class="btn-hint" on:click={handleGetHint}> 💡 获取下一步提示 </button>
  </div>

  <!-- 提示信息面板 -->
  {#if currentHint}
    <div class="hint-card">
      <div class="hint-header">
        <strong>策略: {currentHint.strategyName}</strong>
        <button class="btn-close" on:click={closeHint}>×</button>
      </div>
      <p class="hint-desc">{currentHint.description}</p>
      <div class="hint-actions">
        <button class="btn-apply" on:click={applyHint}>
          ✨ 填入数字 {currentHint.value}
        </button>
      </div>
    </div>
  {/if}
</div>
<!-- ======================================================== -->

<!-- Keyboard -->
<footer>
  <Controls />
</footer>

<Modal />

<style global>
  @import './styles/global.css';

  /* === 新增样式：简单美化提示区域 === */
  .hint-section {
    width: 100%;
    max-width: 500px; /* 与棋盘同宽 */
    margin: 10px auto;
    padding: 0 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .btn-hint {
    background-color: #f59e0b; /* Amber-500 */
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: background 0.2s;
  }

  .btn-hint:hover {
    background-color: #d97706;
  }

  .hint-card {
    background: #eff6ff; /* Blue-50 */
    border-left: 4px solid #3b82f6; /* Blue-500 */
    padding: 12px;
    margin-top: 10px;
    border-radius: 4px;
    width: 100%;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    animation: slideDown 0.3s ease-out;
  }

  .hint-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #1e40af;
    margin-bottom: 4px;
  }

  .hint-desc {
    font-size: 0.9rem;
    color: #333;
    margin-bottom: 8px;
    line-height: 1.4;
  }

  .btn-apply {
    background-color: #10b981; /* Green-500 */
    color: white;
    border: none;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .btn-close {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: #666;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
