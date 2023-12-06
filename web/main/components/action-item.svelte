<script lang="ts">
  import Popup from '@components/popup';
  import { Dialog, Input, Switch } from '@ggchivalrous/db-ui';
  import { createEventDispatcher } from 'svelte';

  export let title = '';
  export let value = false;
  export let showSwitch = true;
  export let content: any = '';
  export let contentType: 'text' | 'img' = 'text';
  export let showType = false;
  export let showEdit = true;

  const dispatch = createEventDispatcher();
  const form = {
    value: false,
    content: '',
    contentType: 'text',
    show: false,
  };

  $: form.value = value;
  $: form.content = content;
  $: form.contentType = contentType;

  function showDialog() {
    form.value = value;
    form.content = content;
    form.contentType = contentType;
    form.show = true;
  }

  function onFileChange(e: CustomEvent) {
    if (e.detail) {
      form.content = e.detail;
    }
  }

  function onSave() {
    dispatch('save', {
      type: form.contentType,
      use: form.value,
      value: form.content,
    });
    form.show = false;
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
    <Switch bind:value={form.value} on:change={onSave} />
  {/if}

  <span class="config-value">
    {#if content}
      {#if contentType === 'text'}
        {content}
      {:else if contentType === 'img'}
        <img src={content} alt={content} />
      {/if}
    {/if}
  </span>

  {#if showEdit}
    <i class="db-icon-edit icon" on:click={showDialog} on:keypress></i>
  {/if}
</p>

<Dialog title="设置{title}" bind:visible={form.show} appendToBody width="450px">
  {#if showType}
    <div class="form-item">
      <Switch
        bind:value={form.contentType}
        inactiveValue="text"
        inactiveText="Text"
        activeText="Iamge"
        activeValue="img"
        on:change={() => (form.content = '')}
      />
    </div>
  {/if}

  <div class="form-item">
    {#if form.contentType === 'text'}
      <Input type="text" bind:value={form.content} />
    {:else}
      <Input type="file" on:input={onFileChange} />
    {/if}
  </div>

  <footer>
    <div class="button grass" on:click={() => (form.show = false)} on:keypress>
      取 消
    </div>
    <div class="button grass" on:click={onSave} on:keypress>保 存</div>
  </footer>
</Dialog>

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

  .icon {
    color: var(--text-color);
    padding: 0 4px;
  }

  .icon:hover {
    cursor: pointer;
    font-weight: bold;
    color: var(--active-color);
  }

  footer {
    margin-top: 20px;
    text-align: right;
  }

  .form-item {
    padding: 8px 0;
  }
</style>
