<script lang="ts">
  import { Switch, Popover } from '@ggchivalrous/db-ui';
  import type { IFieldInfoItem } from '@web/main/interface';
  import { createEventDispatcher } from 'svelte';

  export let title = '';
  export let showSwitch = true;
  export let showEdit = true;
  export let data: IFieldInfoItem<string | number | boolean> = null;
  export let imgFlag = Date.now();

  const dispatch = createEventDispatcher();
  let form: Partial<IFieldInfoItem<string | number | boolean>> = {};

  $: form = { ...data };

  function onEdit() {
    dispatch('edit', { ...form, title });
  }

  function onUseChange() {
    dispatch('use-change', form);
  }
</script>

<p class="action-item">
  <span class="config-title">{title}</span>
  {#if $$slots.popup}
    <Popover trigger="hover">
      <slot name="popup" />
      <i slot="reference" class="db-icon-question icon" style="padding-right: 4px; color: var(--text-color);"></i>
    </Popover>
  {/if}

  {#if showSwitch}
    <Switch bind:value={form.use} on:change={onUseChange} />
  {/if}

  <span class="config-value">
    {#if form.type === 'text'}
      {form.value || ''}
    {:else}
      {#if form.bImg}
        <Popover trigger="hover">
          <img slot="reference" src="file://{form.bImg}?flag={imgFlag}" alt="图片" />
          <img style="width: 200px; height: auto;" src="file://{form.bImg}?flag={imgFlag}" alt="图片" />
        </Popover>
      {/if}

      {#if form.wImg}
        <Popover trigger="hover">
          <img slot="reference" src="file://{form.wImg}?flag={imgFlag}" alt="图片" />
          <img style="width: 200px; height: auto;" src="file://{form.wImg}?flag={imgFlag}" alt="图片" />
        </Popover>
      {/if}
    {/if}
  </span>

  {#if showEdit}
    <i class="db-icon-edit icon" on:click={onEdit} on:keypress role="button" tabindex="-1"></i>
  {/if}
</p>

<style scoped>
  .action-item {
    width: 100%;
    height: 35px;
    display: flex;
    align-items: center;
  }

  .config-title {
    display: inline-block;
    width: 90px;
    font-weight: bold;
    text-align: right;
    margin-right: 8px;
  }

  .config-value {
    flex: 1;
    font-size: 13px;
    padding: 0 6px;
    box-sizing: border-box;
    display: flex;
    justify-content: space-around;
    align-items: center;
  }

  .config-value img {
    display: inline-block;
    height: 12px;
  }

  .config-value img:last-of-type {
    margin-left: 10px;
  }

  .icon {
    color: var(--text-color);
    padding: 0 4px;
  }

  .icon:hover {
    cursor: pointer;
    font-weight: bold;
    color: var(--active-color);
  }
</style>
