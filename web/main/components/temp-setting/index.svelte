<script lang="ts">
  import './index.scss';
  import { cpObj } from '@common/utils';
  import { Drawer } from '@ggchivalrous/db-ui';
  import { config } from '@web/store/config';

  import Dialog from './dialog.svelte';
  import Item from './item.svelte';

  import { getDefTemp, type ITemp } from '@/common/const/def-temps';

  export let visible = false;
  export let beforeClose: any = null;

  const dialog: {
    visible: boolean
    data: ITemp
  } = {
    visible: false,
    data: null,
  };

  function onShowChange(e: CustomEvent<ITemp>) {
    const data = e.detail;
    config.update((v) => {
      const item = v.temps.find((i) => i.key === data.key);
      if (item) {
        item.use = data.use;
      }
      return v;
    });
  }

  function onEdit(e: CustomEvent<ITemp>) {
    dialog.visible = true;
    dialog.data = cpObj(e.detail);
  }

  function onDel(e: CustomEvent<ITemp>) {
    config.update((v) => {
      const index = v.temps.findIndex((i) => i.key === e.detail.key);
      if (index !== -1) {
        v.temps.splice(index, 1);
      }
      return v;
    });
  }

  function addTemp() {
    dialog.data = getDefTemp();
    dialog.visible = true;
  }
</script>

<Drawer
  size="500px"
  title="文本模板设置"
  bind:visible
  direction="rtl"
  {beforeClose}
  modal={false}
>
  <div class="temp-setting-wrap">
    <div class="temp-setting-head">
      <i class="button icon db-icon-plus" on:click={addTemp} on:keypress role="button" tabindex="-1"></i>
    </div>
    <div class="temp-item-wrap">
      {#each $config.temps as i, j (i.key)}
        <Item
          data={i}
          showDelete={i.type !== 'system'}
          topOrder={j > 0}
          bottomOrder={j < $config.temps.length - 1}
          on:show-change={onShowChange}
          on:edit={onEdit}
          on:delete={onDel}
        />
      {/each}
    </div>
  </div>
</Drawer>

<Dialog bind:visible={dialog.visible} data={dialog.data} />
