<script lang='ts'>
  import { arrToObj } from '@common/utils';
  import { ActionItem } from '@components';
  import { Message, Switch } from '@ggchivalrous/db-ui';
  import { config } from '@web/store/config';
  import { smoothIncrement } from '@web/util/util';

  import type { ImgInfo, IConfig, IFileInfo, TInputEvent } from '../../interface';

  import './index.scss';

  export let labelWidth = '80px';
  export let fileInfoList: IFileInfo[] = [];

  let handleCount = 0;
  let outputDirName = '';
  let imgInfoRecord: Record<string, ImgInfo> = {};

  $: getPathName($config.output);
  $: onFileInfoList(fileInfoList);
  $: getHandleCount(imgInfoRecord);

  window.api['on:progress']((data: Pick<ImgInfo, 'id' | 'progress'>) => {
    if (imgInfoRecord[data.id]) {
      if (imgInfoRecord[data.id].closeInterval) {
        imgInfoRecord[data.id].closeInterval();
      }

      imgInfoRecord[data.id].closeInterval = smoothIncrement(
        imgInfoRecord[data.id].progress,
        data.progress,
        10,
        (n) => {
          imgInfoRecord[data.id].progress = n;
        },
      );
    }
  });

  window.api['on:faildTask']((data: { id: string, msg: string }) => {
    if (!imgInfoRecord[data.id]) {
      return;
    }

    imgInfoRecord[data.id].faild = true;
    imgInfoRecord[data.id].faildMsg = data.msg;
  });

  function getHandleCount(_imgInfoRecord: typeof imgInfoRecord) {
    handleCount = Object.values(_imgInfoRecord).filter((i) => i.progress === 100 || i.faild).length;
  }

  function onFileInfoList(list: IFileInfo[]) {
    imgInfoRecord = arrToObj(list, 'id', (i) => ({
      ...i,
      interval: null,
      progress: 0,
      exif: null,
      faild: false,
      faildMsg: '',
      ...imgInfoRecord[i.id],
    }));
  }

  async function changeOutputPath() {
    const data = await window.api['open:selectPath']();
    if (data.code === 0 && data.data.output) {
      $config.output = data.data.output;
    }
  }

  function openDir(dir: string) {
    window.api['open:dir'](dir);
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

  function onBGRateChange(e: CustomEvent<boolean>) {
    if (e.detail) {
      config.update((d) => {
        d.options.landscape = false;
        return d;
      });
    }
  }

  const numReg = /-{0,1}\d+\.{0,1}\d{0,3}/;
  function onNumInputChange(v: TInputEvent, key: keyof IConfig['options'], max: number, min: number) {
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

  function switchBgRate() {
    config.update((d) => {
      d.options.bg_rate = {
        w: d.options.bg_rate.h,
        h: d.options.bg_rate.w,
      };
      return d;
    });
  }

  async function getExitInfo(id: string, path: string) {
    if (imgInfoRecord[id].exif !== null) {
      return imgInfoRecord[id].exif;
    }

    const info = await window.api.getExitInfo(path);
    imgInfoRecord[id].exif = info.data || undefined;

    return info.data;
  }

  async function cpExif(id: string) {
    if (!imgInfoRecord[id] || !imgInfoRecord[id].exif) {
      return Message.error('图片信息不存在！！');
    }

    navigator.clipboard.writeText(JSON.stringify(imgInfoRecord[id].exif, null, 2));
    return Message.success('相机信息已复制到粘贴板');
  }

  async function clearImgInfo() {
    const res = await window.api.drainQueue();
    if (res.code !== 0) {
      Message.error(`清空失败！${res.message || ''}`);
      return;
    }

    Message.success('清空成功');
    fileInfoList = [];
  }
</script>

<div class="app-action-wrap">
  <div class="app-action-left-wrap">
    <ActionItem {labelWidth} title="输出目录">
      <svelte:fragment slot="popup">图片输出目录，点击可以打开目录</svelte:fragment>
      <span class="db-icon-setting output-setting" on:click|stopPropagation={changeOutputPath} on:keypress role="button" tabindex="-1"></span>
      <span class="open-file-line" on:click={() => openDir($config.output)} on:keypress role="button" tabindex="-1">{outputDirName}</span>
    </ActionItem>

    <ActionItem {labelWidth} title="圆角大小">
      <svelte:fragment slot="popup">
        指定圆角的大小，不指定则为直角
        <br>
        取值范围: 0 - 50
        <br>
        默认值: 2.1
      </svelte:fragment>
      <Switch bind:value={$config.options.radius_show} />
      <input
        class="input"
        type="text"
        value={$config.options.radius}
        style="width: 103px;"
        on:change={(v) => onNumInputChange(v, 'radius', 50, 0)}
      />
    </ActionItem>

    <ActionItem {labelWidth} title="阴影大小">
      <svelte:fragment slot="popup">
        指定阴影的大小，不指定则无阴影
        <br>
        设置的值为图片高度的百分比，例如: 1，则为0.01%
        <br>
        (默认使用图片高度的 0.06%)
      </svelte:fragment>
      <Switch bind:value={$config.options.shadow_show} />
      <input
        class="input"
        type="text"
        value={$config.options.shadow}
        style="width: 103px;"
        on:change={(v) => onNumInputChange(v, 'shadow', 50, 0)}
      />
    </ActionItem>

    <ActionItem {labelWidth} title="输出宽高比">
      <svelte:fragment slot="popup">
        指定输出的图片的宽高比(该比例只生效于背景，对原图不生效)
        <br>
        该选项生效后影响以下选项效果：
        <br>
        <b>原宽高输出：</b>失效
        <br>
        <b>横屏输出：</b>失效
      </svelte:fragment>
      <Switch bind:value={$config.options.bg_rate_show} on:change={onBGRateChange} />
      <input class="input" style="width: 40px; margin-right: 4px;" type="text" bind:value={$config.options.bg_rate.w}/>
      <i class="switch icon db-icon-sort" on:click={switchBgRate} role="button" tabindex="-1" on:keypress />
      <input class="input" style="width: 40px; margin-left: 5px;" type="text" bind:value={$config.options.bg_rate.h}/>
    </ActionItem>

    <ActionItem {labelWidth} title="纯色背景">
      <svelte:fragment slot="popup">使用纯色背景，默认使用图片模糊做背景</svelte:fragment>
      <Switch bind:value={$config.options.solid_bg} />
    </ActionItem>

    <ActionItem {labelWidth} title="横屏输出">
      <svelte:fragment slot="popup">
        软件自己判断图片宽高那一边更长
        <br>
        将背景横向处理
        <br>
        适合竖图生成横屏图片
      </svelte:fragment>
      <Switch bind:value={$config.options.landscape} disabled={$config.options.bg_rate_show} />
    </ActionItem>

    <ActionItem {labelWidth} title="快速输出">
      <svelte:fragment slot="popup">
        开启后选择图片/拖拽图片到软件将直接输出水印图片无需点击生成按钮
      </svelte:fragment>
      <Switch bind:value={$config.options.iot} />
    </ActionItem>
  </div>

  <div class="app-action-right-wrap">
    <div class="img-wrap grass-inset">
      <div class="img-list">
        {#each fileInfoList as i (i.id)}
          {@const record = imgInfoRecord[i.id]}
          {#key i.id}
          <div class="img-item grass">
            <div class="img-item-head">
              <span class="img-name">{i.name}</span>
              {#if record.faild}
                <i class="db-icon-error error"></i>
              {:else if record.progress < 100}
                <span
                  style="font-weight: bold;"
                  class={ record.progress === 100 ? 'success' : ''}
                >{record.progress}%</span>
              {:else}
                <i class="db-icon-success success"></i>
              {/if}
            </div>
            <div class="img-item-info">
              相机信息:
              {#await getExitInfo(i.id, i.path)}
                <i class="db-icon-loading"></i>
              {:then v}
                {#if v}
                  <i class="db-icon-success success"></i>
                  <i class="icon db-icon-document-copy" on:click={() => cpExif(i.id)} on:keypress role="button" tabindex="-1"></i>
                {:else}
                  <i class="db-icon-error error"></i>
                {/if}
              {/await}
            </div>

            <div class="img-item-faild-msg">
              {record.faildMsg}
            </div>
          </div>
          {/key}
        {/each}
      </div>
    </div>

    <div class="task-action">
      <ActionItem title="图片数量">{fileInfoList.length}</ActionItem>
      <ActionItem title="完成数量">{handleCount}</ActionItem>
      <div class="button" on:click={clearImgInfo} on:keypress role="button" tabindex="-1">清空</div>
    </div>
  </div>
</div>
