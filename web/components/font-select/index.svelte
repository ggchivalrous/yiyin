<script>
  // eslint-disable-next-line import/first
  import { ListBox, ListBoxItem, getModalStore, popup } from '@skeletonlabs/skeleton';
  // eslint-disable-next-line import/first
  import FontDialog from '../font-dialog/index.svelte';
  import './index.scss';
  import Message from '../message';
  // eslint-disable-next-line import/order
  import { createEventDispatcher } from 'svelte';

  // eslint-disable-next-line import/no-mutable-exports
  export let config = {};
  // eslint-disable-next-line import/no-mutable-exports
  export let value = 'PingFang SC';

  const modalStore = getModalStore();
  const dispatch = createEventDispatcher();
  let fontList = [{ name: 'PingFang SC', fileName: '' }];

  $: listenConfigChange(config);

  const popupCombobox = {
    event: 'click',
    target: 'popupCombobox',
    placement: 'bottom',
    closeQuery: '.font-name',
  };

  function addFont() {
    modalStore.trigger({
      type: 'component',
      component: { ref: FontDialog },
      response() {
        dispatch('update');
      },
    });
  }

  async function delFont(i) {
    const res = await window.api.delFont(i);
    if (res.code === 0) {
      if (res.data) {
        Message.success('删除成功');
      } else {
        Message.error('记录不存在');
      }
      dispatch('update');
      return;
    }

    Message.error(res.message);
  }

  function listenConfigChange() {
    if (config?.map) {
      const list = [];

      // eslint-disable-next-line guard-for-in
      for (const key in config.map) {
        list.push({
          name: key,
          fileName: config.map[key],
        });
      }

      fontList = [{ name: 'PingFang SC', fileName: '' }, ...list];

      if (!config.map[value]) {
        value = fontList[0].name;
      }
    }
  }
</script>

<div class="font-select-wrap">
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="show grass button font-select" use:popup={popupCombobox}>
    {value}
  </div>

  <div class="font-list w-48 shadow-xl py-2 grass" data-popup="popupCombobox">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="button add-font" on:click={addFont}>+</div>
    <ListBox rounded="rounded-none">
      {#each fontList as i}
        <ListBoxItem bind:group={value} name="medium" value={i.name}>
          <span class="font-name">{i.name}</span>
          {#if i.fileName}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <span class="font-del" on:click|preventDefault|capture={() => delFont(i)}>x</span>
          {/if}
        </ListBoxItem>
      {/each}
    </ListBox>
  </div>
</div>
