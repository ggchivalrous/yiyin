<script lang="ts">
  import { ActionItem, FontSetting } from '@components';
  import { Dialog, Input, Message, Switch, Popover } from '@ggchivalrous/db-ui';
  import type { IFieldInfoItem } from '@web/main/interface';
  import { config } from '@web/store/config';
  import { createEventDispatcher } from 'svelte';

  import StaticDialog from '../static-dialog/index.svelte';
  import './index.scss';

  export let title = '';
  export let visible = false;
  export let field = 'Model';
  export let data: IFieldInfoItem<string | number | boolean> = null;
  export let type: 'preset' | 'custom' = 'preset';

  const dispatch = createEventDispatcher();
  const model: IFieldInfoItem<string | number | boolean> = {
    key: '',
    name: '',
    use: false,
    value: '',
    bImg: '',
    wImg: '',
    type: 'text',
    font: {
      use: false,
      bold: false,
      italic: false,
      size: 0,
      font: '',
    },
  };
  const form: IFieldInfoItem<string | number | boolean> = { ...model };

  $: listenData(data);

  function listenData(d: IFieldInfoItem<string | number | boolean>) {
    if (data) {
      form.use = d.use || model.use;
      form.forceUse = d.forceUse || model.forceUse;
      form.show = d.show || model.show;
      form.key = d.key || model.key;
      form.name = d.name || model.name;
      form.value = d.value || model.value;
      form.wImg = d.wImg || model.wImg;
      form.bImg = d.bImg || model.bImg;
      form.type = d.type || model.type;
      form.font = { ...model.font, ...d.font };
    }
  }

  async function onDialogSave() {
    if (form.type === 'img') {
      if (!form.bImg || form.bImg.indexOf($config.staticDir) !== 0) {
        const res = await window.api.uploadExifImg({ name: `${field}_bImg`, path: form.bImg });
        if (res.code !== 0) {
          Message.error(`图片保存失败！${res.message}`);
          return;
        }

        form.bImg = res.data;
      }

      if (!form.wImg || form.wImg.indexOf($config.staticDir) !== 0) {
        const res = await window.api.uploadExifImg({ name: `${field}_wImg`, path: form.wImg });
        if (res.code !== 0) {
          Message.error(`图片保存失败！${res.message}`);
          return;
        }

        form.wImg = res.data;
      }
    }

    visible = false;
    dispatch('update', form);
  }

  function onFileChange(t: string) {
    return async (e: Event & { currentTarget: EventTarget & HTMLInputElement }) => {
      if (e.currentTarget?.files?.length) {
        if (t === 'white') {
          form.wImg = e.currentTarget.files[0].path;
        } else {
          form.bImg = e.currentTarget.files[0].path;
        }
      }
    };
  }

  function onStaticChange(t: string, path: string) {
    if (!path) {
      return;
    }

    if (t === 'white') {
      form.wImg = path;
    } else {
      form.bImg = path;
    }
  }
</script>

<Dialog class="custom-param-dialog" title="{form.key ? '设置' : '添加参数'}{title}" bind:visible appendToBody width="520px" top="8vh">
  <ActionItem title="是否显示" labelWidth="auto">
    <svelte:fragment slot="popup">控制是否显示该参数的内容<br>控制{title}参数是否显示</svelte:fragment>
    <Switch bind:value={form.show} />
  </ActionItem>

  {#if type === 'custom'}
    <ActionItem title="名称">
      <Input class="text-input" bind:value={form.name} />
    </ActionItem>
  {/if}

  <div class="form-item">
    <div class="form-item-label title">字体参数</div>
    <div class="form-item-content">
      <FontSetting bind:conf={form.font} />
    </div>
  </div>

  <div class="form-item">
    <div class="form-item-label title">自定义参数</div>
    <div class="form-item-content">
      <div class="base-switch-wrap">
        <ActionItem title="是否生效">
          <svelte:fragment slot="popup">开启则将启用自定义参数内容<br>在未识别到该相机参数信息时自动使用自定义内容</svelte:fragment>
          <Switch bind:value={form.use} />
        </ActionItem>
        <ActionItem title="强制替换">
          <svelte:fragment slot="popup">开启则将强制使用自定义的参数信息<br>强制替换识别出来的相机参数</svelte:fragment>
          <Switch bind:value={form.forceUse} />
        </ActionItem>
      </div>

      <ActionItem title="类型">
        <svelte:fragment slot="popup">使用何种类型作为内容显示<br>支持: 文本、图片</svelte:fragment>
        <Switch bind:value={form.type} inactiveValue="text" activeValue="img" inactiveText="文本" activeText="图片"/>
      </ActionItem>

      {#if form.type === 'text'}
        <ActionItem title="文本内容">
          <Input class="text-input" type="text" bind:value={form.value} />
        </ActionItem>
      {:else}
        <div class="img-wrap">
          <div class="img-item">
            <ActionItem title="模糊背景">
              <svelte:fragment slot="popup">模糊背景下使用的图片<br>一般使用白色字体的图片</svelte:fragment>
              <svelte:fragment slot="expand">
                <label for="wImg" style="margin: 0 8px;"><i class="db-icon-upload" /></label>
                <StaticDialog on:change={(e) => onStaticChange('white', e.detail)} />
              </svelte:fragment>
              <input id="wImg" class="normal-input" style="display: none;" type="file" on:change={onFileChange('white')} />
            </ActionItem>

            {#if form.wImg}
              <Popover trigger="hover">
                <img slot="reference" class="form-item-img" src="file://{form.wImg}?flag={Date.now()}" alt="">
                <img style="width: 200px; height: auto;" class="form-item-img" src="file://{form.wImg}?flag={Date.now()}" alt="">
              </Popover>
            {/if}
          </div>

          <div class="img-item">
            <ActionItem title="纯色背景">
              <svelte:fragment slot="popup">纯色背景下使用的图片<br>一般使用黑色字体的图片</svelte:fragment>
              <svelte:fragment slot="expand">
                <label for="bImg" style="margin: 0 8px;"><i class="db-icon-upload" /></label>
                <StaticDialog on:change={(e) => onStaticChange('black', e.detail)} />
              </svelte:fragment>
              <input id="bImg" class="normal-input" style="display: none;" type="file" on:change={onFileChange('black')} />
            </ActionItem>

            {#if form.bImg}
              <Popover trigger="hover">
                <img slot="reference" class="form-item-img" src="file://{form.bImg}?flag={Date.now()}" alt="">
                <img style="width: 200px; height: auto;" class="form-item-img" src="file://{form.bImg}?flag={Date.now()}" alt="">
              </Popover>
            {/if}
          </div>
        </div>
      {/if}
    </div>

  </div>

  <footer>
    <div class="button grass" on:click={() => (visible = false)} on:keypress role="button" tabindex="-1">取 消</div>
    <div class="button grass" on:click={() => onDialogSave()} on:keypress role="button" tabindex="-1">保 存</div>
  </footer>
</Dialog>
