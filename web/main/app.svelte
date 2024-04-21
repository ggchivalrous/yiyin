<script lang="ts">
  import './index.scss';
  import { Message } from '@ggchivalrous/db-ui';
  import { ImageTool } from '@web/modules/image-tool';
  import type { ImageToolOption } from '@web/modules/image-tool/interface';
  import { TextTool } from '@web/modules/text-tool';
  import type { TextToolOption } from '@web/modules/text-tool/interface';
  import { config, pathInfo } from '@web/store/config';
  import { importFont } from '@web/util/util';
  import type { IFontInfo } from '@web/util/util';

  import { Actions, ParamSetting, Footer, Header, TempSetting } from './components';
  import type { IFileInfo, TInputEvent } from './interface';

  let fileInfoList: IFileInfo[] = [];
  const processing = false;
  let fileSelectDom: HTMLInputElement = null;
  let showParamSetting = false;
  let showTempSetting = false;
  let fontList: IFontInfo[] = [];

  $: onFileInfoListChange(fileInfoList);
  $: onFontMap($config.fontMap);
  $: importFont(fontList);

  onFileDrop();

  window.api['on:genTextImg'](async (data: TextToolOption & { id: string }) => {
    const textTool = new TextTool(data.exif, data);
    const textImgList = await textTool.genTextImg().catch((e) => {
      console.log(e);
    });

    window.api.genTextImg({
      id: data.id,
      textImgList,
    });
  });

  window.api['on:genMainImgShadow'](async (data: ImageToolOption & { id: string }) => {
    const tool = new ImageTool(data);
    const _data = await tool.genMainImgShadow();
    window.api.genMainImgShadow({
      id: data.id,
      data: _data,
    });
  });

  async function onFileChange(ev: TInputEvent) {
    if (ev.currentTarget && ev.currentTarget.type === 'file') {
      const files = ev.currentTarget.files;
      const _fileUrlList: IFileInfo[] = [];

      for (let i = 0; i < files.length; i++) {
        _fileUrlList.push({
          path: files[i].path,
          name: files[i].name,
        });
      }

      const res = await window.api.addTask(_fileUrlList);
      if (res.code !== 0) {
        Message.error(`图片添加失败${res.message}`);
        return;
      }

      fileInfoList.unshift(...res.data.reverse());
      fileSelectDom.value = '';
      fileInfoList = fileInfoList;
    }
  }

  async function startTask() {
    const res = await window.api.startTask();
    if (res.code !== 0) {
      Message.error(res.message || '水印生成开启失败');
    }
  }

  // 监听文件放入，然后执行水印生成等后续操作
  function onFileDrop() {
    window.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const _fileInfoList = [];
      const files = e.dataTransfer.files;

      for (let i = 0; i < files.length; i++) {
        const file = files.item(i);
        if (!file.type.startsWith('image/')) {
          Message.error(`${file.name} 文件非图片文件`);
          continue;
        }

        _fileInfoList.push({
          name: file.name,
          path: file.path,
        });
      }

      const res = await window.api.addTask(_fileInfoList);
      if (res.code !== 0) {
        Message.error(`图片添加失败${res.message}`);
        return;
      }

      fileInfoList.unshift(...res.data.reverse());
      fileInfoList = fileInfoList;

      if ($config.options?.iot) {
        startTask();
      }
    });

    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  }

  function onFileInfoListChange(_: IFileInfo[]) {
    if ($config.options?.iot) {
      startTask();
    }
  }

  async function onFontMap(fontMap: Record<string, string>) {
    if (fontMap) {
      const list = [];
      for (const key in fontMap) {
        const data = await window.api.pathJoin([$config.fontDir, fontMap[key]]);
        if (data.code === 0) {
          list.push({
            name: key,
            path: `file://${data.data.replaceAll('\\', '\\\\')}`,
          });
        }
      }

      fontList = list;
    }
  }
</script>

<Header />

<div id="root">
  <div class="guide">
    <i style="background-image: url('file://{$pathInfo.public}/img/guide.svg');"></i>
    白嫖指南(●°u°●)​ 」
  </div>

  <div class="desc">
    <i style="background-image: url('file://{$pathInfo.public}/img/guide.svg');"></i>
    萌新指北(｡･ω･｡)
  </div>

  <input type="file" id="path" accept="image/*" bind:this={fileSelectDom} on:change={onFileChange} multiple class="hide" />

  <div class="body">
    <div class="content">
      <Actions bind:fileInfoList={fileInfoList} />
    </div>

    <div class="button-wrap">
      <label for="path" class="button grass">添加图片</label>
      <div class="button grass" on:click={startTask} on:keypress role="button" tabindex="-1">
        {#if processing}
          处理中...
        {:else}
          生成印框
        {/if}
      </div>
      <div class="button grass" on:click={() => { showParamSetting = true; }} on:keypress role="button" tabindex="-1">参数设置</div>
      <div class="button grass" on:click={() => { showTempSetting = true; }} on:keypress role="button" tabindex="-1">模板设置</div>
    </div>
  </div>

  <Footer />
  <ParamSetting bind:visible={showParamSetting} />
  <TempSetting bind:visible={showTempSetting} />
</div>
