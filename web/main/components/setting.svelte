<script lang="ts">
  import { Drawer } from '@ggchivalrous/db-ui';
  import type { ICameraInfo } from '@web/main/interface';
  import { config } from '@web/store/config';

  import { ActionItem } from '.';

  export let visible = false;
  export let beforeClose: any = null;

  let option: ICameraInfo;

  $: option = JSON.parse(JSON.stringify($config.cameraInfo));

  function onSave(field: keyof ICameraInfo) {
    return async (e: CustomEvent<any>) => {
      config.update((v) => {
        v.cameraInfo[field] = { ...v.cameraInfo[field], ...e.detail };
        return v;
      });
    };
  }
</script>

<Drawer
  customClass="grass"
  size="300px"
  title="参数设置"
  bind:visible
  direction="rtl"
  {beforeClose}
>
  <ActionItem title="模式" showSwitch showEdit={false} bind:value={option.Force.use} on:save={onSave('Force')}>
    <svelte:fragment slot="popup">
      是否强制使用自定义参数作为最终输出，默认参数识别失败将使用自定义参数作为最终输出，开启将强制使用自定义参数
    </svelte:fragment>
  </ActionItem>
  <ActionItem
    title="个性签名"
    showType
    showSwitch
    bind:value={option.PersonalSign.use}
    bind:content={option.PersonalSign.value}
    contentType={option.PersonalSign.type}
    on:save={onSave('PersonalSign')}
  />
  <ActionItem
    title="厂商"
    showType
    showSwitch
    bind:value={option.Make.use}
    bind:content={option.Make.value}
    contentType={option.Make.type}
    on:save={onSave('Make')}
  />
  <ActionItem
    title="机型"
    showType
    showSwitch
    bind:value={option.Model.use}
    bind:content={option.Model.value}
    contentType={option.Model.type}
    on:save={onSave('Model')}
  />
  <ActionItem
    title="快门"
    showSwitch
    bind:value={option.ExposureTime.use}
    bind:content={option.ExposureTime.value}
    contentType={option.ExposureTime.type}
    on:save={onSave('ExposureTime')}
  />
  <ActionItem
    title="光圈"
    showSwitch
    bind:value={option.FNumber.use}
    bind:content={option.FNumber.value}
    contentType={option.FNumber.type}
    on:save={onSave('FNumber')}
  />
  <ActionItem
    title="ISO"
    showSwitch
    bind:value={option.ISO.use}
    bind:content={option.ISO.value}
    contentType={option.ISO.type}
    on:save={onSave('ISO')}
  />
  <ActionItem
    title="焦距"
    showSwitch
    bind:value={option.FocalLength.use}
    bind:content={option.FocalLength.value}
    contentType={option.FocalLength.type}
    on:save={onSave('FocalLength')}
  />
  <ActionItem
    title="镜头厂商"
    showType
    showSwitch
    bind:value={option.LensMake.use}
    bind:content={option.LensMake.value}
    contentType={option.LensMake.type}
    on:save={onSave('LensMake')}
  />
  <ActionItem
    title="镜头型号"
    showType
    showSwitch
    bind:value={option.LensModel.use}
    bind:content={option.LensModel.value}
    contentType={option.LensModel.type}
    on:save={onSave('LensModel')}
  />
</Drawer>
