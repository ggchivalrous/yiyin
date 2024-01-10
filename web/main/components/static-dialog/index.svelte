<script lang="ts">
  import { Popover } from '@ggchivalrous/db-ui';
  import { staticList } from '@web/store/static';
  import './index.scss';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  function handleItemClick(path: string) {
    dispatch('change', path);
  }
</script>

<Popover trigger="hover">
  <i class="db-icon-files" slot="reference" />
  <div class="static-wrap">
    {#each $staticList as i}
      <div class="static-item" on:click={() => handleItemClick(i)} on:keypress role="button" tabindex="-1">
        <img src="file://{i}" alt="">
      </div>
    {/each}
  </div>
</Popover>
