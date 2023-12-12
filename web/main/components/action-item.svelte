<script lang="ts">
  import Popup from '@components/popup';
  import { Switch } from '@ggchivalrous/db-ui';
  import { createEventDispatcher } from 'svelte';

  import type { ICameraInfoItem } from '../interface';

  import type { TActionItemData } from './interface';

  export let title = '';
  export let showSwitch = true;
  export let showEdit = true;
  export let data: ICameraInfoItem<string | number | boolean> = null;

  const dispatch = createEventDispatcher();
  let form: TActionItemData = {
    use: false,
    value: '',
    bImg: '',
    wImg: '',
    type: 'text',
    title: '',
  };

  $: form = { ...form, ...data };

  function onEdit() {
    dispatch('edit', form);
  }

  function onSave() {
    dispatch('save', form);
  }
</script>

<p class="action-item">
  <span class="config-title">{title}</span>
  {#if $$slots.popup}
    <Popup class="db-icon-question icon" style="padding-right: 4px; color: var(--text-color);">
      <slot name="popup" slot="message" />
    </Popup>
  {/if}

  {#if showSwitch}
    <Switch bind:value={form.use} on:change={onSave} />
  {/if}

  <span class="config-value">
    {#if data.type === 'text'}
      {form.value}
    {:else if data.type === 'img'}
      {#if form.wImg}
        <img src="file://{form.wImg}" alt="图片" />
      {/if}
      {#if form.bImg}
        <img src="file://{form.bImg}" alt="图片" />
      {/if}
    {/if}
  </span>

  {#if showEdit}
    <i class="db-icon-edit icon" on:click={onEdit} on:keypress></i>
  {/if}
</p>

<style scoped>
  .action-item {
    width: 100%;
    height: 35px;
    display: flex;
    align-items: center;
    padding-right: 15px;
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
  }

  .config-value img {
    display: inline-block;
    height: 16px;
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
