<script lang="ts">
  import ActionItem from '@components/action-item';
  import FontSelect from '@components/font-select';
  import Popup from '@components/popup';
  import './index.scss';
  import { Switch, Message as toast } from '@ggchivalrous/db-ui';
  import { Modal, clipboard, initializeStores } from '@skeletonlabs/skeleton';
  import { config, getConfig, resetConfig } from '@web/store/config';
  import { tick } from 'svelte';

  import { CustomParamSetting } from './components';
  import type { IConfig, IFileInfo, TInputEvent } from './interface';

  initializeStores();

  let fileUrlList: IFileInfo[] = [];
  let processing = false;
  let fileSelectDom: HTMLInputElement = null;
  let clipboardDom: HTMLDivElement = null;
  let outputDirName = '';
  let imgExif = '';
  let showSetting = false;

  $: getPathName($config.output);

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

  async function changeOutputPath() {
    const data = await window.api['open:selectPath']();
    if (data.code === 0 && data.data.output) {
      $config.output = data.data.output;
    }
  }

  function miniSizeWindow() {
    window.api.miniSize();
  }

  function closeApp() {
    window.api.closeApp();
  }

  function openDir(dir: string) {
    window.api['open:dir'](dir);
  }

  const numReg = /-{0,1}\d+\.{0,1}\d{0,3}/;
  function onNumInput(v: TInputEvent, key: keyof IConfig['options'], max: number, min: number) {
    let _v = v.currentTarget.value;

    const match = _v.match(numReg);
    if (match && match.length) {
      _v = match[0];
    }

    let num = +_v;
    if (Number.isNaN(num)) num = min;
    else if (num < min) num = min;
    else if (num > max) num = max;

    ($config.options[key] as number) = num;
    v.currentTarget.value = `${num}`;
  }

  function onNumInputChange(v: TInputEvent, key: keyof IConfig['options']) {
    const match = `${$config.options[key]}`.match(numReg);

    if (match && match.length) {
      ($config.options[key] as number) = +match[0];
    } else {
      ($config.options[key] as number) = 0;
    }

    v.currentTarget.value = $config.options[key] as string;
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

  function getPathName(path: string) {
    path = path.trim();

    if (!path) {
      outputDirName = '异常目录无法识别';
      return;
    }

    const isMatch = path.match(/^([A-Za-z]:)\\/);

    if (isMatch) {
      const arr = path.replace(isMatch[1], '').split('\\');
      outputDirName = arr[arr.length - 1] || isMatch[0];
      return;
    }

    const arr = path.split('/');
    outputDirName = arr[arr.length - 1] || '/';
  }
</script>

<div class="header">
  <FontSelect fontMap={$config.fontMap} bind:value={$config.options.font} on:update={getConfig} />

  <Popup class="show grass button reset" on:click={resetConfig}>
    <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M491.52 819.2a304.3328 304.3328 0 0 1-217.088-90.112l28.672-28.672a266.24 266.24 0 1 0-40.96-327.68l-35.2256-21.2992A307.2 307.2 0 1 1 491.52 819.2z"></path><path d="M430.08 409.6H245.76a20.48 20.48 0 0 1-20.48-20.48V204.8h40.96v163.84h163.84z"></path><path d="M512 512m-61.44 0a61.44 61.44 0 1 0 122.88 0 61.44 61.44 0 1 0-122.88 0Z"></path></svg>
    <p slot="message">重置回默认选项</p>
  </Popup>

  <div class="show grass button" on:click={miniSizeWindow} on:keypress>-</div>
  <div class="close grass button" on:click={closeApp} on:keypress>x</div>
</div>

<div id="root">
  <input
    type="file"
    id="path"
    bind:this={fileSelectDom}
    on:change={onFileChange}
    multiple
    class="hide"
  />

  <div class="body">
    <div class="content">
      <div class="action-wrap">
        <div class="left-wrap">
          <ActionItem title="横屏输出">
            <svelte:fragment slot="popup">软件自己判断宽高比，将图片进行背景横向输出，适合竖图生成横屏图片</svelte:fragment>
            <Switch bind:value={$config.options.landscape} />
          </ActionItem>

          <ActionItem title="参数显示">
            <svelte:fragment slot="popup">是否显示快门、ISO、光圈信息</svelte:fragment>
            <Switch bind:value={$config.options.ext_show} />
          </ActionItem>

          <ActionItem title="机型显示">
            <svelte:fragment slot="popup">是否显示机型</svelte:fragment>
            <Switch bind:value={$config.options.brand_show} />
          </ActionItem>

          <ActionItem title="型号显示">
            <svelte:fragment slot="popup">是否显示机子型号</svelte:fragment>
            <Switch bind:value={$config.options.model_show} />
          </ActionItem>

          <ActionItem title="纯色背景">
            <svelte:fragment slot="popup">使用纯色背景，默认使用图片模糊做背景</svelte:fragment>
            <Switch bind:value={$config.options.solid_bg} />
          </ActionItem>

          <ActionItem title="原宽高输出">
            <svelte:fragment slot="popup">输出图片是否按照原始宽高，开启将缩放原图</svelte:fragment>
            <Switch bind:value={$config.options.origin_wh_output} />
          </ActionItem>
        </div>

        <div class="right-wrap">
          <ActionItem title="选中数量">{fileUrlList.length}</ActionItem>

          <ActionItem title="输出目录">
            <svelte:fragment slot="popup">图片输出目录，点击可以打开目录</svelte:fragment>
            <span class="db-icon-setting output-setting" on:click|stopPropagation={changeOutputPath} on:keypress></span>
            <span class="open-file-line" on:click={() => openDir($config.output)} on:keypress>{outputDirName}</span>
          </ActionItem>

          <ActionItem title="背景比例">
            <svelte:fragment slot="popup">指定图片背景的宽高比例，默认按照原始比例</svelte:fragment>
            <Switch bind:value={$config.options.bg_rate_show} />
            <input class="bg-rate-input" style="width: 40px;" type="text" bind:value={$config.options.bg_rate.w}/>
            :
            <input class="bg-rate-input" style="width: 40px;" type="text" bind:value={$config.options.bg_rate.h}/>
          </ActionItem>

          <ActionItem title="圆角大小">
            <svelte:fragment slot="popup">指定圆角的大小，不指定则为直角(默认使用高度的 0.021%)</svelte:fragment>
            <Switch bind:value={$config.options.radius_show} />
            <input
              class="bg-rate-input"
              type="text"
              value={$config.options.radius}
              on:input={(v) => onNumInput(v, 'radius', 30, 0)}
              on:change={(v) => onNumInputChange(v, 'radius')}
            />
          </ActionItem>

          <ActionItem title="阴影大小">
            <svelte:fragment slot="popup">指定阴影的大小，不指定则无阴影(默认使用高度的 0.06%)</svelte:fragment>
            <Switch bind:value={$config.options.shadow_show} />
            <input
              class="bg-rate-input"
              type="text"
              value={$config.options.shadow}
              on:input={(v) => onNumInput(v, 'shadow', 50, 0)}
              on:change={(v) => onNumInputChange(v, 'shadow')}
            />
          </ActionItem>
        </div>
      </div>
    </div>

    <div class="button-wrap">
      {#if !processing}
        <label for="path" class="button grass">选择图片</label>
        <div class="button grass" on:click={generatePictureFrames} on:keypress>生成印框</div>
        <div class="button grass" on:click={getExitInfo} on:keypress>相机信息</div>
        <div style="display: none;" use:clipboard={imgExif} bind:this={clipboardDom}></div>
        <div class="button grass" on:click={() => { showSetting = true; }} on:keypress>自定义参数</div>
      {:else}
        印框生成中...
      {/if}
    </div>
  </div>

  <div class="foot">
    <p class="foot-item">
      <a href="https://space.bilibili.com/94829489" target="_blank">B站 - 不长肉的小伙吒</a>
    </p>
    <p class="foot-item">
      <a href="https://github.com/ggchivalrous/yiyin" target="_blank">© 2023 Github - GGChivalrous.</a>
    </p>
  </div>

  <CustomParamSetting bind:visible={showSetting} />
</div>

<Modal />
