<script lang="ts">
  import './item.scss';
  import { Switch } from '@ggchivalrous/db-ui';
    import { config } from '@web/store/config';
  import { createEventDispatcher } from 'svelte';

  import type { ITemp } from '@/common/const/def-temps';

  export let data: ITemp = null;
  export let showEdit = true;
  export let showDelete = false;
  export let topOrder = true;
  export let bottomOrder = true;

  const dispatch = createEventDispatcher();

  $: form = { ...data };

  function onEdit() {
    dispatch('edit', { ...form });
  }

  function onDel() {
    dispatch('delete', { ...form });
  }

  function onShowChange() {
    dispatch('show-change', form);
  }

  function onChangeOrder(order: 'bottom' | 'top') {
    return () => {
      config.update((v) => {
        const index = v.temps.findIndex((i) => i.key === form.key);
        if (index !== -1) {
          const curTemp = v.temps[index];
          let newIndex = index;

          if (order === 'top') newIndex -= 1;
          else newIndex += 1;

          v.temps[index] = v.temps[newIndex];
          v.temps[newIndex] = curTemp;
        }
        return v;
      });
    };
  }
</script>

<div class="temp-setting-item">
  <Switch bind:value={form.use} on:change={onShowChange} />
  <span class="config-value">{form.name}</span>

  {#if topOrder}
    <i class="db-icon-caret-top icon" on:click={onChangeOrder('top')} on:keypress role="button" tabindex="-1"></i>
  {/if}

  {#if bottomOrder}
    <i class="db-icon-caret-bottom icon" on:click={onChangeOrder('bottom')} on:keypress role="button" tabindex="-1"></i>
  {/if}

  {#if showEdit}
    <i class="db-icon-edit icon" on:click={onEdit} on:keypress role="button" tabindex="-1"></i>
  {/if}

  {#if showDelete}
    <i class="db-icon-delete icon" on:click={onDel} on:keypress role="button" tabindex="-1"></i>
  {/if}
</div>
