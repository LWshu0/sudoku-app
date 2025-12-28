<script>
  import { CANDIDATE_COORDS } from '@sudoku/constants';

  export let candidates = [];
  // 已尝试过的候选，不影响是否显示，仅用于样式（置灰/划线）
  export let tried = [];
</script>

<div class="candidate-grid">
  {#each CANDIDATE_COORDS as [row, col], index}
    <div
      class="candidate row-start-{row} col-start-{col}"
      class:invisible={!candidates.includes(index + 1)}
      class:visible={candidates.includes(index + 1)}
      class:tried={tried && tried.includes(index + 1)}
    >
      {index + 1}
    </div>
  {/each}
</div>

<style>
  .candidate-grid {
    @apply grid h-full w-full p-1;
  }

  .candidate {
    @apply h-full w-full row-end-auto col-end-auto leading-full;
  }

  .tried {
    @apply text-gray-400 line-through;
  }
</style>
