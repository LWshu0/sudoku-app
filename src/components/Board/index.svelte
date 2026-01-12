<script>
  import { BOX_SIZE } from '@sudoku/constants';
  import { gamePaused } from '@sudoku/stores/game';
  import { grid, userGrid, invalidCells } from '@sudoku/stores/grid';
  import { settings } from '@sudoku/stores/settings';
  import { cursor } from '@sudoku/stores/cursor';
  import { candidates } from '@sudoku/stores/candidates';
  import Cell from './Cell.svelte';

  // 从历史中读取“已尝试候选”信息，用于在候选列表中做视觉标记
  import { triedCandidatesStore } from '../../logic/History';

  // Creator integration: optional props to make the Board editable and to accept an override grid
  export let editable = false;
  export let onCellEdit = null; // function({x, y, value})
  export let overrideUserGrid = null; // optional 9x9 array to display instead of $userGrid
  export let invalidCellsOverride = null; // optional array of 'x,y' strings to mark conflicts
  export let disabled = undefined; // allow parent to force cells enabled/disabled (creator should pass disabled=false)
  export let startingGrid = null;        // 新增：初始快照
   
  function isSelected(cursorStore, x, y) {
    return cursorStore.x === x && cursorStore.y === y;
  }

  function isSameArea(cursorStore, x, y) {
    if (cursorStore.x === null && cursorStore.y === null) return false;
    if (cursorStore.x === x || cursorStore.y === y) return true;

    const cursorBoxX = Math.floor(cursorStore.x / BOX_SIZE);
    const cursorBoxY = Math.floor(cursorStore.y / BOX_SIZE);
    const cellBoxX = Math.floor(x / BOX_SIZE);
    const cellBoxY = Math.floor(y / BOX_SIZE);
    return cursorBoxX === cellBoxX && cursorBoxY === cellBoxY;
  }

  function getValueAtCursor(gridStore, cursorStore) {
    if (!gridStore) return null;
    if (cursorStore.x === null && cursorStore.y === null) return null;

    return gridStore[cursorStore.y][cursorStore.x];
  }

  // displayUserGrid prefers overrideUserGrid if provided (used by creator)
  $: displayUserGrid = overrideUserGrid ? overrideUserGrid : $userGrid;

  // 判定是否为“原始数字”
  function checkIsGiven(x, y, currentVal) {
    if (!startingGrid) return false;
    const startVal = startingGrid[y][x];
    return startVal !== 0 && currentVal === startVal;
  }

  // 判定是否为“被修改过的原始数字”
  function checkIsModifiedGiven(x, y, currentVal) {
    if (!startingGrid) return false;
    const startVal = startingGrid[y][x];
    return startVal !== 0 && currentVal !== startVal;
  }
</script>

<div class="board-padding relative z-10">
  <div class="max-w-xl relative">
    <div class="w-full" style="padding-top: 100%"></div>
  </div>
  <div class="board-padding absolute inset-0 flex justify-center">
    <div
      class="bg-white shadow-2xl rounded-xl overflow-hidden w-full h-full max-w-xl grid"
      class:bg-gray-200={$gamePaused}
    >
      {#each displayUserGrid as row, y}
        {#each row as value, x}
          {@const cellKey = x + ',' + y}
          <Cell
            {value}
            cellY={y + 1}
            cellX={x + 1}
            candidates={overrideUserGrid ? null : $candidates[cellKey]}
            triedCandidates={overrideUserGrid ? null : $triedCandidatesStore[cellKey]}
            disabled={disabled !== undefined ? disabled : $gamePaused}
            selected={isSelected($cursor, x, y)}
            userNumber={startingGrid ? (startingGrid[y][x] === 0) : ($grid[y][x] === 0)}

            isGiven={checkIsGiven(x, y, value)}
            isModifiedGiven={checkIsModifiedGiven(x, y, value)}

            sameArea={$settings.highlightCells &&
              !isSelected($cursor, x, y) &&
              isSameArea($cursor, x, y)}
            sameNumber={$settings.highlightSame &&
              value &&
              !isSelected($cursor, x, y) &&
              getValueAtCursor(displayUserGrid, $cursor) === value}

            conflictingNumber={
              invalidCellsOverride 
                ? invalidCellsOverride.includes(cellKey) // Creator 模式只看这个
                : ($settings.highlightConflicting && $grid[y][x] === 0 && $invalidCells.includes(cellKey))
            }
            editable={editable}
            onEdit={onCellEdit}
          />        
        {/each}
      {/each}
    </div>
  </div>
</div>

<style>
  .board-padding {
    @apply px-4 pb-4;
  }
</style>
