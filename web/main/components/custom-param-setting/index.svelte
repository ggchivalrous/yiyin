<script lang="ts">
  import { Drawer } from '@ggchivalrous/db-ui';
  import type { ICameraInfo, ICameraInfoItem } from '@web/main/interface';
  import { config } from '@web/store/config';
  import { tick } from 'svelte';

  import CustomParamDialog from '../custom-param-dialog/index.svelte';

  import ActionItem from './action-item.svelte';

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

  function onUseChange(field: keyof ICameraInfo) {
    return async (e: CustomEvent<any>) => {
      const data: ICameraInfoItem = e.detail;
      config.update((v) => {
        v.cameraInfo[field].use = data.use;
        return v;
      });
    };
  }

  function onEdit(field: keyof ICameraInfo) {
    return async (e: CustomEvent<ICameraInfoItem & { title: string }>) => {
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
  <ActionItem title="模式" showSwitch showEdit={false} data={option.Force} on:use-change={onUseChange('Force')}>
    <svelte:fragment slot="popup">
      是否强制使用自定义参数作为最终输出，默认参数识别失败将使用自定义参数作为最终输出，开启将强制使用自定义参数
    </svelte:fragment>
  </ActionItem>
  <ActionItem title="个性签名" showSwitch data={option.PersonalSign} on:use-change={onUseChange('PersonalSign')} on:edit={onEdit('PersonalSign')} />
  <ActionItem title="厂商" showSwitch data={option.Make} on:use-change={onUseChange('Make')} on:edit={onEdit('Make')} />
  <ActionItem title="机型" showSwitch data={option.Model} on:use-change={onUseChange('Model')} on:edit={onEdit('Model')} />
  <ActionItem title="镜头厂商" showSwitch data={option.LensMake} on:use-change={onUseChange('LensMake')} on:edit={onEdit('LensMake')} />
  <ActionItem title="镜头型号" showSwitch data={option.LensModel} on:use-change={onUseChange('LensModel')} on:edit={onEdit('LensModel')} />
  <ActionItem title="光圈" showSwitch data={option.FNumber} on:use-change={onUseChange('FNumber')} on:edit={onEdit('FNumber')} />
  <ActionItem title="焦距" showSwitch data={option.FocalLength} on:use-change={onUseChange('FocalLength')} on:edit={onEdit('FocalLength')} />
  <ActionItem title="快门" showSwitch data={option.ExposureTime} on:use-change={onUseChange('ExposureTime')} on:edit={onEdit('ExposureTime')} />
  <ActionItem title="ISO" showSwitch data={option.ISO} on:use-change={onUseChange('ISO')} on:edit={onEdit('ISO')} />
</Drawer>

<CustomParamDialog
  bind:visible={dialog.show}
  showImg={dialog.showImg}
  showType={dialog.showType}
  title={dialog.title}
  field={dialog.field}
  data={dialog.form}
/>
