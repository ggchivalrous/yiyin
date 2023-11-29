<script>
  import FontDialog from '@components/font-dialog';
  import Message from '@db-ui/message';
  import { ListBox, ListBoxItem, getModalStore, popup } from '@skeletonlabs/skeleton';
  import { createEventDispatcher } from 'svelte';
  import './index.scss';

  export let config = {};
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
  <div class="show grass button font-select" use:popup={popupCombobox}>
    {value}
  </div>

  <div class="font-list w-48 shadow-xl py-2 grass" data-popup="popupCombobox">
    <div class="button add-font" on:click={addFont} on:keypress>+</div>
    <ListBox rounded="rounded-none">
      {#each fontList as i}
        <ListBoxItem bind:group={value} name="medium" value={i.name}>
          <span class="font-name">{i.name}</span>
          {#if i.fileName}
            <span class="font-del" on:click|preventDefault|capture={() => delFont(i)} on:keypress>x</span>
          {/if}
        </ListBoxItem>
      {/each}
    </ListBox>
  </div>
</div>
