<script lang="ts">
  import { Message as toast } from '@ggchivalrous/db-ui';
  import { config } from '@web/store/config';
  import { tick } from 'svelte';
  import './index.scss';

  import { Actions, CustomParamSetting, Footer, Header } from './components';
  import type { IFileInfo, TInputEvent } from './interface';

  let fileUrlList: IFileInfo[] = [];
  let processing = false;
  let fileSelectDom: HTMLInputElement = null;
  const clipboardDom: HTMLDivElement = null;

  let imgExif = '';
  let showSetting = false;

  async function onFileChange(ev: TInputEvent) {
    if (ev.currentTarget && ev.currentTarget.type === 'file') {
      const files = ev.currentTarget.files;
      fileUrlList = [];

      for (let i = 0; i < files.length; i++) {
        fileUrlList.push({
          path: files[i].path,
          name: files[i].name,
        });
      }
    }
  }

  async function generatePictureFrames() {
    if (processing) return;

    if (fileUrlList.length) {
      processing = true;
      const res = await window.api.startTask({
        fileUrlList,
        output: $config.output,
        option: $config.options,
      });

      if (res.code !== 0) {
        console.log(res);
      }

      fileUrlList = [];
      fileSelectDom.value = '';
      processing = false;
    }
  }

  async function getExitInfo() {
    if (fileUrlList.length) {
      const info = await window.api.getExitInfo(fileUrlList[0].path);

      if (info.code === 0) {
        imgExif = JSON.stringify(info.data, null, 2);
        await tick();
        clipboardDom.click();
        toast.success('复制成功');
      }
    } else {
      toast.info('请选择一张图片');
    }
  }
</script>

<Header />

<div id="root">
  <input type="file" id="path" bind:this={fileSelectDom} on:change={onFileChange} multiple class="hide" />

  <div class="body">
    <div class="content">
      <Actions activeCount={fileUrlList.length} />
    </div>

    <div class="button-wrap">
      {#if !processing}
        <label for="path" class="button grass">选择图片</label>
        <div class="button grass" on:click={generatePictureFrames} on:keypress role="button" tabindex="-1">生成印框</div>
        <div class="button grass" on:click={getExitInfo} on:keypress role="button" tabindex="-1">相机信息</div>
        <!-- <div style="display: none;" use:clipboard={imgExif} bind:this={clipboardDom}></div> -->
        <div class="button grass" on:click={() => { showSetting = true; }} on:keypress role="button" tabindex="-1">参数设置</div>
      {:else}
        印框生成中...
      {/if}
    </div>
  </div>

  <Footer />

  <CustomParamSetting bind:visible={showSetting} />
</div>

<!-- <Modal /> -->
