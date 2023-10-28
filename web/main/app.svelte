<script>
  import './index.scss';
  import Switch from '../components/switch/index.svelte';

  let fileUrlList = [];
  let processing = false;
  let fileSelectDom = null;
  let outputDirName = '';
  const option = {
    landscape: false,
    ext_show: true,
    model_show: true,
    brand_show: true,
  };
  const output = {
    path: '',
  };

  getConfig();

  $: {
    const arr = output.path.split('/');
    outputDirName = arr[arr.length - 1] || '/';
  }

  async function getConfig() {
    const defConf = await window.api.getConfig();
    if (defConf.code === 0) {
      output.path = defConf.data.output;
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
      await window.api.startTask({
        fileUrlList,
        output: output.path,
        option,
      });
      fileUrlList = [];
      fileSelectDom.value = '';
      processing = false;
    }
  }

  async function changeOutputPath() {
    const data = await window.api['open:selectPath']();
    if (data.code === 0) {
      output.path = data.data.output;
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
</script>

<div class="header">
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

  <div class="wrap">
    <div class="left-wrap">
      <p>
        <span class="config-title">选中数量:</span>
        <span class="config-value">{fileUrlList.length}</span>
      </p>

      <p>
        <span class="config-title">输出目录:</span>
        <span class="config-value open-file-line" on:click={() => openDir(output.path)}>{outputDirName}</span>
      </p>

      <p>
        <span class="config-title">横屏输出:</span>
        <span class="config-value">
          <Switch bind:value={option.landscape} size="mini" />
        </span>
      </p>

      <p>
        <span class="config-title">参数显示:</span>
        <span class="config-value">
          <Switch bind:value={option.ext_show} size="mini" />
        </span>
      </p>

      <p>
        <span class="config-title">机型显示:</span>
        <span class="config-value">
          <Switch bind:value={option.brand_show} size="mini" />
        </span>
      </p>

      <p>
        <span class="config-title">显示机型加型号:</span>
        <span class="config-value">
          <Switch bind:value={option.model_show} size="mini" />
        </span>
      </p>
    </div>
  </div>

  <div class="button-wrap">
    {#if !processing}
      <label for="path"><div class="button grass">选择图片</div></label>
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div class="button grass" on:click={changeOutputPath}>输出目录</div>
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div class="button grass" on:click={generatePictureFrames}>生成印框</div>
    {:else}
      印框生成中...
    {/if}
  </div>
</div>
