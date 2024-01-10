<script lang="ts">
  import Popup from '@components/popup';
  import { Dialog, Input, Message, Switch } from '@ggchivalrous/db-ui';
  import type { ICameraInfo, IFieldInfoItem } from '@web/main/interface';
  import { config } from '@web/store/config';
  import { createEventDispatcher } from 'svelte';

  import './index.scss';
  import ParamFontInfo from '../param-font-info/index.svelte';
  import StaticDialog from '../static-dialog/index.svelte';

  export let title = '';
  export let showImg = false;
  export let showType = false;
  export let visible = false;
  export let field: keyof ICameraInfo = 'Model';
  export let data: IFieldInfoItem<string | number | boolean> = null;

  const dispatch = createEventDispatcher();
  const model: IFieldInfoItem<string | number | boolean> = {
    use: false,
    value: '',
    bImg: '',
    wImg: '',
    type: 'text',
    param: {
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
      form.bImg = d.bImg || model.bImg;
      form.value = d.value || model.value;
      form.wImg = d.wImg || model.wImg;
      form.use = d.use || model.use;
      form.type = d.type || model.type;
      form.param = { ...model.param, ...d.param };
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

    config.update((v) => {
      v.templateFieldInfo[field] = { ...v.templateFieldInfo[field], ...form as any };
      return v;
    });
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

<Dialog class="custom-param-dialog" title="设置{title}" bind:visible appendToBody width="500px" top="8vh">
  {#if showType}
    <div class="form-item">
      <div class="form-item-label">生效类型</div>
      <Switch
        bind:value={form.type}
        inactiveValue="text"
        inactiveText="Text"
        activeText="Iamge"
        activeValue="img"
      />
    </div>
  {/if}

  <div class="form-item">
    <div class="form-item-label">文本</div>
    <Input class="text-input" type="text" bind:value={form.value} />
  </div>

  {#if showImg}
    <div class="img-wrap">
      <div class="form-item">
        <div class="form-item-label">
          白字图片
          <label for="wImg"><i class="db-icon-upload" /></label>
          <StaticDialog on:change={(e) => onStaticChange('white', e.detail)} />
        </div>
        <div class="form-item-value">
          {#if form.wImg}
            <Popup>
              <img class="form-item-img" src="file://{form.wImg}?flag={Date.now()}" alt="">
              <img slot="message" style="width: 200px; height: auto;" class="form-item-img" src="file://{form.wImg}?flag={Date.now()}" alt="">
            </Popup>
          {/if}
        </div>
        <input id="wImg" class="normal-input" style="display: none;" type="file" on:change={onFileChange('white')} />
      </div>
      <div class="form-item">
        <div class="form-item-label">
          黑字图片
          <label for="bImg"><i class="db-icon-upload" /></label>
          <StaticDialog on:change={(e) => onStaticChange('black', e.detail)} />
        </div>
        <div class="form-item-value">
          {#if form.bImg}
            <Popup>
              <img class="form-item-img" src="file://{form.bImg}?flag={Date.now()}" alt="">
              <img slot="message" style="width: 200px; height: auto;" class="form-item-img" src="file://{form.bImg}?flag={Date.now()}" alt="">
            </Popup>
          {/if}
        </div>
        <input id="bImg" class="normal-input" style="display: none;" type="file" on:change={onFileChange('black')} />
      </div>
    </div>
  {/if}

  <div class="form-item">
    <div class="form-item-label">字体参数</div>
    <ParamFontInfo bind:conf={form.param} />
  </div>

  <footer>
    <div class="button grass" on:click={() => (visible = false)} on:keypress role="button" tabindex="-1">取 消</div>
    <div class="button grass" on:click={() => onDialogSave()} on:keypress role="button" tabindex="-1">保 存</div>
  </footer>
</Dialog>
