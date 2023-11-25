<script>
  import './index.scss';
  import { clipboard, getToastStore, initializeStores, Toast } from '@skeletonlabs/skeleton';
  import { tick } from 'svelte';
  import Switch from '../components/switch/index.svelte';
  import Popup from '../components/popup/index.svelte';
  import ActionItem from '../components/action-item/index.svelte';
  
  initializeStores();

  let fileUrlList = [];
  let processing = false;
  let fileSelectDom = null;
  let outputDirName = '';
  let option = {
    init: true,
    landscape: false, // 横屏输出
    ext_show: true, // 参数显示
    model_show: true, // 机型显示
    brand_show: true, // 型号显示
    solid_bg: false, // 纯色背景
    origin_wh_output: true, // 按照图片原始宽高输出
    radius: 2.1, // 圆角
    shadow: 6, // 阴影
    bg_rate: {
      w: '',
      h: '',
    },
    output: '',
  };
  let imgExif = '';
  let clipboardDom = null;

  const toastStore = getToastStore();
  getConfig();

  $: {
    const arr = option.output.split('/');
    outputDirName = arr[arr.length - 1] || '/';
  }

  $: setConfig(option);

  async function getConfig() {
    const defConf = await window.api.getConfig();
    if (defConf.code === 0) {
      option.output = defConf.data.output;
      option = Object.assign(option, defConf.data.options, { init: false });
    }
  }

  async function setConfig() {
    if (!option.init) {
      await window.api.setConfig(option);
    }
  }

  async function onFileChange(ev) {
    if (ev.target && ev.target.type === 'file') {
      const files = ev.target.files;
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
        output: option.output,
        option,
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
    const data = await window.api['open:selectPath'](option);
    if (data.code === 0) {
      option.output = data.data.output;
    }
  }

  function miniSizeWindow() {
    window.api.miniSize();
  }

  function closeApp() {
    window.api.closeApp();
  }

  function openDir(dir) {
    window.api['open:dir'](dir);
  }

  const numReg = /-{0,1}\d+\.{0,1}\d{0,3}/;
  function onNumInput(v, key, max, min) {
    let _v = v.target.value;

    const match = _v.match(numReg);
    if (match && match.length) {
      _v = match[0];
    }

    if (Number.isNaN(_v)) _v = min;
    else if (_v < min) _v = min;
    else if (_v > max) _v = max;

    option[key] = _v;
    v.target.value = _v;
  }

  function onNumInputChange(v, key) {
    const match = `${option[key]}`.match(numReg);

    if (match && match.length) {
      option[key] = +match[0];
    } else {
      option[key] = 0;
    }

    v.target.value = option[key];
  }

  async function getExitInfo() {
    if (fileUrlList.length) {
      const info = await window.api.getExitInfo(fileUrlList[0].path);

      if (info.code === 0) {
        imgExif = JSON.stringify(info.data, null, 2);
        await tick();
        clipboardDom.click();
        toastStore.trigger({
          message: '复制成功',
          classes: 'grass toast',
          timeout: 1500,
        });
      }
    }
  }

  async function resetOption() {
    const res = await window.api.resetConfig();
    if (res.code !== 0) {
      toastStore.trigger({ message: `重置失败！！${res.message}` });
      return;
    }

    option = { ...res.data.options, init: false, output: res.data.output };
    toastStore.trigger({ message: '重置成功' });
  }
</script>

<div class="header">
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <Popup class="show grass button reset" on:click={resetOption}>
    <svg t="1700902065043" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4044" width="20" height="20"><path d="M491.52 819.2a304.3328 304.3328 0 0 1-217.088-90.112l28.672-28.672a266.24 266.24 0 1 0-40.96-327.68l-35.2256-21.2992A307.2 307.2 0 1 1 491.52 819.2z" p-id="4045"></path><path d="M430.08 409.6H245.76a20.48 20.48 0 0 1-20.48-20.48V204.8h40.96v163.84h163.84z" p-id="4046"></path><path d="M512 512m-61.44 0a61.44 61.44 0 1 0 122.88 0 61.44 61.44 0 1 0-122.88 0Z" p-id="4047"></path></svg>
    <p slot="message">重置回默认选项</p>
  </Popup>

  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="show grass button" on:click={miniSizeWindow}>-</div>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="close grass button" on:click={closeApp}>x</div>
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

  <div class="content">
    <div class="action-wrap">
      <div class="left-wrap">
        <ActionItem title="横屏输出">
          <svelte:fragment slot="popup">软件自己判断宽高比，将图片进行背景横向输出，适合竖图生成横屏图片</svelte:fragment>
          <Switch bind:value={option.landscape} />
        </ActionItem>

        <ActionItem title="参数显示">
          <svelte:fragment slot="popup">是否显示快门、ISO、光圈信息</svelte:fragment>
          <Switch bind:value={option.ext_show} />
        </ActionItem>

        <ActionItem title="机型显示">
          <svelte:fragment slot="popup">是否显示机型</svelte:fragment>
          <Switch bind:value={option.brand_show} />
        </ActionItem>

        <ActionItem title="型号显示">
          <svelte:fragment slot="popup">是否显示机子型号</svelte:fragment>
          <Switch bind:value={option.model_show} />
        </ActionItem>

        <ActionItem title="纯色背景">
          <svelte:fragment slot="popup">使用纯色背景，默认使用图片模糊做背景</svelte:fragment>
          <Switch bind:value={option.solid_bg} />
        </ActionItem>

        <ActionItem title="原宽高输出">
          <svelte:fragment slot="popup">输出图片是否按照原始宽高，开启将缩放原图</svelte:fragment>
          <Switch bind:value={option.origin_wh_output} />
        </ActionItem>
      </div>

      <div class="right-wrap">
        <ActionItem title="选中数量">{fileUrlList.length}</ActionItem>

        <ActionItem title="输出目录">
          <svelte:fragment slot="popup">图片输出目录，点击可以打开目录</svelte:fragment>
          <span class="open-file-line" on:click={() => openDir(option.output)}>{outputDirName}</span>
        </ActionItem>

        <ActionItem title="背景比例">
          <svelte:fragment slot="popup">指定图片背景的宽高比例，默认按照原始比例</svelte:fragment>
          <input class="bg-rate-input" style="width: 40px;" type="text" bind:value={option.bg_rate.w}/>
            :
          <input class="bg-rate-input" style="width: 40px;" type="text" bind:value={option.bg_rate.h}/>
        </ActionItem>

        <ActionItem title="圆角大小">
          <svelte:fragment slot="popup">指定圆角的大小，不指定则为直角</svelte:fragment>
          <input
            class="bg-rate-input"
            type="text"
            value={option.radius}
            on:input={(v) => onNumInput(v, 'radius', 30, 0)}
            on:change={(v) => onNumInputChange(v, 'radius')}
          />
        </ActionItem>

        <ActionItem title="阴影大小">
          <svelte:fragment slot="popup">指定阴影的大小，不指定则无阴影</svelte:fragment>
          <input
            class="bg-rate-input"
            type="text"
            value={option.shadow}
            on:input={(v) => onNumInput(v, 'shadow', 50, 0)}
            on:change={(v) => onNumInputChange(v, 'shadow')}
          />
        </ActionItem>
      </div>
    </div>
  </div>

  <div class="button-wrap">
    {#if !processing}
      <div class="button grass"><label for="path" style="display: inline;">选择图片</label></div>
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div class="button grass" on:click={changeOutputPath}>输出目录</div>
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div class="button grass" on:click={generatePictureFrames}>生成印框</div>
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div class="button grass" on:click={getExitInfo}>相机信息</div>
      <div style="display: none;" use:clipboard={imgExif} bind:this={clipboardDom}></div>
    {:else}
      印框生成中...
    {/if}
  </div>

  <Toast />
</div>
