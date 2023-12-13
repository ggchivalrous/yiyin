<script lang="ts">
  import { Dialog, Input, Message, Switch } from '@ggchivalrous/db-ui';
  import type { ICameraInfo, ICameraInfoItem } from '@web/main/interface';
  import { config } from '@web/store/config';
  import './index.scss';

  export let title = '';
  export let showImg = false;
  export let showType = false;
  export let visible = false;
  export let field: keyof ICameraInfo = 'Model';
  export let data: ICameraInfoItem<string | number | boolean> = null;

  let form: ICameraInfoItem<string | number | boolean> = {
    use: false,
    value: '',
    bImg: '',
    wImg: '',
    type: 'text',
  };

  $: if (data) form = { ...form, ...data };

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
      v.cameraInfo[field] = { ...v.cameraInfo[field], ...data as any };
      return v;
    });
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
</script>

<Dialog class="custom-param-dialog" title="设置{title}" bind:visible appendToBody width="450px" top="8vh">
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
    <Input type="text" bind:value={form.value} />
  </div>

  {#if showImg}
    <div class="img-wrap">
      <div class="form-item">
        <div class="form-item-label">
          白字图片
          <label for="wImg"><i class="db-icon-upload" /></label>
        </div>
        <div class="form-item-value">
          {#if form.wImg}
            <img class="form-item-img" src="file://{form.wImg}" alt="">
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
          {#if form.bImg}
            <img class="form-item-img" src="file://{form.bImg}" alt="">
          {/if}
        </div>
        <input id="bImg" class="normal-input" style="display: none;" type="file" on:change={onFileChange('black')} />
      </div>
    </div>
  {/if}

  <footer>
    <div class="button grass" on:click={() => (visible = false)} on:keypress>
      取 消
    </div>
    <div class="button grass" on:click={() => onDialogSave()} on:keypress>保 存</div>
  </footer>
</Dialog>
