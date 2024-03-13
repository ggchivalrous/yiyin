<script lang="ts">
  import './action-item.scss';
  import { Switch, Popover } from '@ggchivalrous/db-ui';
  import type { IFieldInfoItem } from '@web/main/interface';
  import { createEventDispatcher } from 'svelte';

  export let title = '';
  export let showSwitch = true;
  export let showEdit = true;
  export let showDelete = false;
  export let data: IFieldInfoItem<string | number | boolean> = null;
  export let imgFlag = Date.now();
  export let labelPosition: 'left' | 'right' | 'top' = 'right';
  export let labelWidth = '70px';

  const dispatch = createEventDispatcher();
  let form: Partial<IFieldInfoItem<string | number | boolean>> = {};

  $: form = { ...data };

  function onEdit() {
    dispatch('edit', { ...form, title });
  }

  function onShowChange() {
    dispatch('show-change', form);
  }

  function onDel() {
    dispatch('delete', { ...form, title });
  }
</script>

<div class="custom-param-setting-action-item {labelPosition === 'top' ? '' : 'flex'}">
  <div class="config-head">
    <span class="config-title {labelPosition}" style:width={labelWidth}>{title}</span>
    {#if $$slots.popup}
      <Popover trigger="hover">
        <slot name="popup" />
        <i slot="reference" class="db-icon-question icon" style="padding-right: 4px; color: var(--text-color);"></i>
      </Popover>
    {/if}
  </div>

  <div class="config-content">
    {#if showSwitch}
      <Switch bind:value={form.show} on:change={onShowChange} />
    {/if}

    <span class="config-value">
      {#if form.type === 'text'}
        {form.value || ''}
      {:else}
        {#if form.bImg}
          <Popover trigger="hover">
            <img style="max-width: 120px; height: auto; max-height: 25px;" slot="reference" src="file://{form.bImg}?flag={imgFlag}" alt="图片" />
            <img style="width: 200px; height: auto;" src="file://{form.bImg}?flag={imgFlag}" alt="图片" />
          </Popover>
        {/if}

        {#if form.wImg}
          <Popover trigger="hover">
            <img style="max-width: 120px; height: auto; max-height: 25px;" slot="reference" src="file://{form.wImg}?flag={imgFlag}" alt="图片" />
            <img style="width: 200px; height: auto;" src="file://{form.wImg}?flag={imgFlag}" alt="图片" />
          </Popover>
        {/if}
      {/if}
    </span>

    {#if showEdit}
      <i class="db-icon-edit icon" on:click={onEdit} on:keypress role="button" tabindex="-1"></i>
    {/if}

    {#if showDelete}
      <i class="db-icon-delete icon" on:click={onDel} on:keypress role="button" tabindex="-1"></i>
    {/if}
  </div>
</div>
