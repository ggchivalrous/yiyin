<script lang="ts">
  import { Dialog, Drawer, Message, Switch, Input } from '@ggchivalrous/db-ui';
  import type { ICameraInfo, ICameraInfoItem } from '@web/main/interface';
  import { config } from '@web/store/config';
    import { tick } from 'svelte';

  import ActionItem from './action-item.svelte';
  import type { TActionItemData } from './interface';

  export let visible = false;
  export let beforeClose: any = null;

  let option: ICameraInfo;
  const form: ICameraInfoItem = {
    use: false,
    value: '',
    bImg: '',
    wImg: '',
    type: 'text',
  };
  const dialog: {
    form: ICameraInfoItem<string | number | boolean>
    title: string
    showImg: boolean
    showType: boolean
    show: boolean
    field: keyof ICameraInfo
  } = {
    title: '',
    showImg: false,
    showType: false,
    show: false,
    field: 'Model',
    form: {
      use: false,
      value: '',
      bImg: '',
      wImg: '',
      type: 'text',
    },
  };
  const fieldMap: Record<keyof ICameraInfo, {
    showImg?: boolean
    showType?: boolean,
  }> = {
    Force: {
      showImg: false,
      showType: false,
    },
    Make: {
      showImg: true,
      showType: true,
    },
    Model: {
      showImg: true,
      showType: true,
    },
    ExposureTime: {
      showImg: false,
      showType: false,
    },
    FNumber: {
      showImg: false,
      showType: false,
    },
    ISO: {
      showImg: false,
      showType: false,
    },
    FocalLength: {
      showImg: false,
      showType: false,
    },
    ExposureProgram: {
      showImg: false,
      showType: false,
    },
    DateTimeOriginal: {
      showImg: false,
      showType: false,
    },
    LensModel: {
      showImg: true,
      showType: true,
    },
    LensMake: {
      showImg: true,
      showType: true,
    },
    PersonalSign: {
      showImg: true,
      showType: true,
    },
  };

  $: onCameraInfoChange($config.cameraInfo);

  async function onCameraInfoChange(cameraInfo: typeof $config.cameraInfo) {
    await tick();
    option = JSON.parse(JSON.stringify(cameraInfo));
  }

  function onSave(field: keyof ICameraInfo) {
    return async (e: CustomEvent<any>) => {
      const data: ICameraInfoItem = e.detail;
      await onDialogSave(field, data);
    };
  }

  async function onDialogSave(field?: keyof ICameraInfo, data?: ICameraInfoItem<any>) {
    data = data || dialog.form;
    field = field || dialog.field;

    if (data.type === 'img') {
      if (!data.bImg || data.bImg.indexOf($config.staticDir) !== 0) {
        const res = await window.api.uploadExifImg({ name: `${field}_bImg`, path: data.bImg });
        if (res.code !== 0) {
          Message.error(`图片保存失败！${res.message}`);
          return;
        }

        data.bImg = res.data;
      }

      if (!data.wImg || data.wImg.indexOf($config.staticDir) !== 0) {
        const res = await window.api.uploadExifImg({ name: `${field}_wImg`, path: data.wImg });
        if (res.code !== 0) {
          Message.error(`图片保存失败！${res.message}`);
          return;
        }

        data.wImg = res.data;
      }
    }

    config.update((v) => {
      v.cameraInfo[field] = { ...v.cameraInfo[field], ...data as any };
      return v;
    });
  }

  function onFileChange(t: string) {
    return async (e: Event & { currentTarget: EventTarget & HTMLInputElement }) => {
      if (e.currentTarget?.files?.length) {
        if (t === 'white') {
          dialog.form.wImg = e.currentTarget.files[0].path;
        } else {
          dialog.form.bImg = e.currentTarget.files[0].path;
        }
      }
    };
  }

  function onEdit(field: keyof ICameraInfo) {
    return async (e: CustomEvent<TActionItemData>) => {
      dialog.field = field;
      dialog.form = { ...form, ...e.detail };
      if (fieldMap[field]) {
        dialog.showImg = fieldMap[field].showImg;
        dialog.showType = fieldMap[field].showType;
      }
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
>
  <ActionItem title="模式" showSwitch showEdit={false} data={option.Force} on:save={onSave('Force')}>
    <svelte:fragment slot="popup">
      是否强制使用自定义参数作为最终输出，默认参数识别失败将使用自定义参数作为最终输出，开启将强制使用自定义参数
    </svelte:fragment>
  </ActionItem>
  <ActionItem title="个性签名" showSwitch data={option.PersonalSign} on:save={onSave('PersonalSign')} on:edit={onEdit('PersonalSign')} />
  <ActionItem title="厂商" showSwitch data={option.Make} on:save={onSave('Make')} on:edit={onEdit('Make')} />
  <ActionItem title="机型" showSwitch data={option.Model} on:save={onSave('Model')} on:edit={onEdit('Model')} />
  <ActionItem title="快门" showSwitch data={option.ExposureTime} on:save={onSave('ExposureTime')} on:edit={onEdit('ExposureTime')} />
  <ActionItem title="光圈" showSwitch data={option.FNumber} on:save={onSave('FNumber')} on:edit={onEdit('FNumber')} />
  <ActionItem title="ISO" showSwitch data={option.ISO} on:save={onSave('ISO')} on:edit={onEdit('ISO')} />
  <ActionItem title="焦距" showSwitch data={option.FocalLength} on:save={onSave('FocalLength')} on:edit={onEdit('FocalLength')} />
  <ActionItem title="镜头厂商" showSwitch data={option.LensMake} on:save={onSave('LensMake')} on:edit={onEdit('LensMake')} />
  <ActionItem title="镜头型号" showSwitch data={option.LensModel} on:save={onSave('LensModel')} on:edit={onEdit('LensModel')} />
</Drawer>

<Dialog title="设置{dialog.title}" bind:visible={dialog.show} appendToBody width="450px" top="8vh">
  {#if dialog.showType}
    <div class="form-item">
      <div class="label">使用类型</div>
      <Switch
        bind:value={dialog.form.type}
        inactiveValue="text"
        inactiveText="Text"
        activeText="Iamge"
        activeValue="img"
      />
    </div>
  {/if}

  <div class="form-item">
    <div class="label">文本</div>
    <Input type="text" bind:value={dialog.form.value} />
  </div>

  {#if dialog.showImg}
    <div class="form-item">
      <div class="form-item-label">
        白字图片
        <label for="wImg"><i class="db-icon-upload" /></label>
      </div>
      <div class="form-item-value">
        {#if dialog.form.wImg}
          <img class="form-item-img" src="file://{dialog.form.wImg}" alt="">
        {/if}
      </div>
      <input id="wImg" class="normal-input" style="display: none;" type="file" on:change={onFileChange('white')} />
    </div>
    <div class="form-item">
      <div class="form-item-label">
        黑字图片
        <label for="bImg"><i class="db-icon-upload" /></label>
      </div>
      <div class="form-item-value">
        {#if dialog.form.bImg}
          <img class="form-item-img" src="file://{dialog.form.bImg}" alt="">
        {/if}
      </div>
      <input id="bImg" class="normal-input" style="display: none;" type="file" on:change={onFileChange('black')} />
    </div>
  {/if}

  <footer>
    <div class="button grass" on:click={() => (dialog.show = false)} on:keypress>
      取 消
    </div>
    <div class="button grass" on:click={() => onDialogSave()} on:keypress>保 存</div>
  </footer>
</Dialog>

<style scoped>
  footer {
    margin-top: 20px;
    text-align: right;
  }

  .form-item {
    padding: 8px 0;
  }

  .form-item-label {
    height: 35px;
    font-weight: bold;
    opacity: .8;
    display: flex;
    align-items: center;
  }

  .form-item-label label {
    display: inline-block;
    height: 20px;
    width: 20px;
    margin-left: 10px;
  }

  .form-item .db-icon-upload {
    font-size: 20px;
    cursor: pointer;
    font-weight: bold;
  }

  .form-item-img {
    height: 30px;
  }
</style>
