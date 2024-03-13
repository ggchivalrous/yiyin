<script lang="ts">
  import './index.scss';
  import { Drawer, Collapse, CollapseItem } from '@ggchivalrous/db-ui';
  import type { IConfig, IFieldInfoItem } from '@web/main/interface';
  import { config } from '@web/store/config';
  import { md5 } from '@web/util/md5';

  import CustomParamDialog from '../param-dialog/index.svelte';

  import ActionItem from './action-item.svelte';

  export let visible = false;
  export let beforeClose: any = null;

  let flag = Date.now();
  let keyInc = 1;
  const form: IFieldInfoItem = {
    key: '',
    name: '',
    use: false,
    value: '',
    bImg: '',
    wImg: '',
    type: 'text',
    font: undefined,
  };

  interface IDialogData {
    form: IFieldInfoItem<string | number | boolean>
    title: string
    show: boolean
    field: string
    type: 'preset' | 'custom'
  }

  let dialog: IDialogData = getFieldModel();

  function getFieldModel(): IDialogData {
    return {
      title: '',
      show: false,
      field: 'Model',
      type: 'preset',
      form: {
        key: '',
        name: '',
        use: true,
        value: '',
        bImg: '',
        wImg: '',
        type: 'text',
        font: undefined,
      },
    };
  }

  function onShowChange(type: IDialogData['type']) {
    return (e: CustomEvent<IFieldInfoItem>) => {
      const data = e.detail;
      config.update((v) => {
        const item = getActiveFieldInfoList(v, type).find((i) => i.key === data.key);
        if (item) {
          item.show = data.show;
        }
        return v;
      });
    };
  }

  function onEdit(field: string, type: IDialogData['type']) {
    return async (e: CustomEvent<IFieldInfoItem & { title: string }>) => {
      dialog.field = field;
      dialog.form = { ...form, ...e.detail };
      dialog.title = e.detail.title;
      dialog.show = true;
      dialog.type = type;
    };
  }

  function onDel(type: IDialogData['type']) {
    return async (e: CustomEvent<IFieldInfoItem & { title: string }>) => {
      config.update((v) => {
        const fieldsList = getActiveFieldInfoList(v, type);
        const index = fieldsList.findIndex((i) => i.key === e.detail.key);
        if (index !== -1) {
          fieldsList.splice(index, 1);
        }
        return v;
      });
    };
  }

  function addField() {
    dialog = getFieldModel();
    dialog.show = true;
    dialog.type = 'custom';
  }

  function onFieldSave(ev: CustomEvent<IFieldInfoItem>) {
    const d = ev.detail;
    flag = Date.now();

    config.update((v) => {
      const fieldsList = getActiveFieldInfoList(v, dialog.type);
      // 新增
      if (!dialog.form.key) {
        fieldsList.push({ ...d, key: md5(`${Date.now()}-${keyInc++}-${d.name}`) });
      } else {
        const item = fieldsList.find((i) => i.key === d.key);
        if (item) {
          Object.assign(item, d);
        }
      }

      return v;
    });
  }

  function getActiveFieldInfoList(conf: IConfig, type: IDialogData['type']) {
    let fieldsList: IFieldInfoItem[] = [];

    switch (type) {
      case 'preset': fieldsList = conf.tempFields; break;
      case 'custom': fieldsList = conf.customTempFields; break;
      default: return fieldsList;
    }

    return fieldsList;
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
    <Collapse>
      <CollapseItem title="相机参数" name="tempFields">
        {#each $config.tempFields as i (i.key)}
          <ActionItem imgFlag={flag} title={i.name} data={i} on:show-change={onShowChange('preset')} on:edit={onEdit(i.key, 'preset')} />
        {/each}
      </CollapseItem>
      <CollapseItem name="customFields">
        <p slot="title">
          自定义参数
          <i class="button icon db-icon-plus" on:click={addField} on:keypress role="button" tabindex="-1"></i>
        </p>
        {#each $config.customTempFields as i (i.key)}
          <ActionItem
            showDelete
            imgFlag={flag}
            title={i.name}
            data={i}
            labelPosition='top'
            labelWidth='auto'
            on:show-change={onShowChange('custom')}
            on:edit={onEdit(i.key, 'custom')}
            on:delete={onDel('custom')}
          />
        {/each}
      </CollapseItem>
    </Collapse>
  </div>
</Drawer>

<CustomParamDialog
  bind:visible={dialog.show}
  title={dialog.title}
  field={dialog.field}
  data={dialog.form}
  type={dialog.type}
  on:update={onFieldSave}
/>
