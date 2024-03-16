<script lang="ts">
  import { Message } from '@ggchivalrous/db-ui';
  import { config } from '@web/store/config';
  import './index.scss';

  import { Actions, ParamSetting, Footer, Header, TempSetting } from './components';
  import type { IFileInfo, TInputEvent } from './interface';

  let fileUrlList: IFileInfo[] = [];
  let processing = false;
  let fileSelectDom: HTMLInputElement = null;
  let showParamSetting = false;
  let showTempSetting = false;

  $: onFileUrlListChange(fileUrlList);

  onFileDrop();

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
        navigator.clipboard.writeText(JSON.stringify(info.data, null, 2));
        Message.success('图片的相机信息已复制到粘贴板');
      } else {
        Message.error('图片相机信息获取失败');
      }
    } else {
      Message.info('请选择一张图片');
    }
  }

  // 监听文件放入，然后执行水印生成等后续操作
  function onFileDrop() {
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const files = e.dataTransfer.files;
      for (let i = 0; i < files.length; i++) {
        const file = files.item(i);
        fileUrlList.push({
          name: file.name,
          path: file.path,
        });
      }
      fileUrlList = fileUrlList;

      if ($config.options?.iot) {
        generatePictureFrames();
      }
    });

    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  }

  function onFileUrlListChange(fileList: IFileInfo[]) {
    if ($config.options?.iot) {
      generatePictureFrames();
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
        <div class="button grass" on:click={() => { showParamSetting = true; }} on:keypress role="button" tabindex="-1">参数设置</div>
        <div class="button grass" on:click={() => { showTempSetting = true; }} on:keypress role="button" tabindex="-1">模板设置</div>
      {:else}
        印框生成中...
      {/if}
    </div>
  </div>

  <Footer />
  <ParamSetting bind:visible={showParamSetting} />
  <TempSetting bind:visible={showTempSetting} />
</div>
