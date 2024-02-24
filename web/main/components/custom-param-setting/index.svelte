<script lang="ts">
  import { Drawer } from '@ggchivalrous/db-ui';
  import type { IFieldInfoItem } from '@web/main/interface';
  import { config } from '@web/store/config';

  import CustomParamDialog from '../custom-param-dialog/index.svelte';

  import ActionItem from './action-item.svelte';

  export let visible = false;
  export let beforeClose: any = null;

  let flag = Date.now();
  const form: IFieldInfoItem = {
    key: '',
    name: '',
    use: false,
    value: '',
    bImg: '',
    wImg: '',
    type: 'text',
    param: undefined,
  };
  const dialog: {
    form: IFieldInfoItem<string | number | boolean>
    title: string
    showImg: boolean
    showType: boolean
    show: boolean
    field: string
  } = {
    title: '',
    showImg: false,
    showType: false,
    show: false,
    field: 'Model',
    form: {
      key: '',
      name: '',
      use: false,
      value: '',
      bImg: '',
      wImg: '',
      type: 'text',
      param: undefined,
    },
  };

  function onUseChange() {
    return async (e: CustomEvent<any>) => {
      const data: IFieldInfoItem = e.detail;
      config.update((v) => {
        const item = v.tempFields.find((i) => i.key === data.key);
        if (item) {
          item.use = data.use;
        }
        return v;
      });
    };
  }

  function onEdit(field: string) {
    return async (e: CustomEvent<IFieldInfoItem & { title: string }>) => {
      dialog.field = field;
      dialog.form = { ...form, ...e.detail };
      dialog.title = e.detail.title;
      dialog.show = true;
    };
  }
</script>

<Drawer
  size="500px"
  title="参数设置"
  bind:visible
  direction="rtl"
  {beforeClose}
  modal={false}
>
  <div class="custom-params-wrap">
    {#each $config.tempFields as i (i.key)}
      <ActionItem imgFlag={flag} title={i.name} showSwitch data={i} on:use-change={onUseChange()} on:edit={onEdit(i.key)} />
    {/each}
  </div>
</Drawer>

<CustomParamDialog
  bind:visible={dialog.show}
  title={dialog.title}
  field={dialog.field}
  data={dialog.form}
  on:update={() => flag = Date.now()}
/>

<style>
  .custom-params-wrap {
    padding: 20px 15px;
    padding-top: 0;
    overflow-y: auto;
  }
</style>
