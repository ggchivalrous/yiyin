<script lang='ts'>
  import { ActionItem } from '@components';
  import { Switch } from '@ggchivalrous/db-ui';
  import { config } from '@web/store/config';

  import type { IConfig, TInputEvent } from '../../interface';
  import './index.scss';

  export let labelWidth = '80px';
  export let activeCount = 0;

  let outputDirName = '';

  $: getPathName($config.output);

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
        d.options.origin_wh_output = false;
        return d;
      });
    }
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

  function switchBgRate() {
    config.update((d) => {
      d.options.bg_rate = {
        w: d.options.bg_rate.h,
        h: d.options.bg_rate.w,
      };
      return d;
    });
  }
</script>

<div class="app-action-wrap">
  <div class="app-action-left-wrap">
    <ActionItem {labelWidth} title="选中数量">{activeCount}</ActionItem>

    <ActionItem {labelWidth} title="输出目录">
      <svelte:fragment slot="popup">图片输出目录，点击可以打开目录</svelte:fragment>
      <span class="db-icon-setting output-setting" on:click|stopPropagation={changeOutputPath} on:keypress role="button" tabindex="-1"></span>
      <span class="open-file-line" on:click={() => openDir($config.output)} on:keypress role="button" tabindex="-1">{outputDirName}</span>
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
    <ActionItem {labelWidth} title="原宽高输出">
      <svelte:fragment slot="popup">
        开启将控制输出的宽高为输入的图片宽高
        <br>
        主图将等比缩放放置在背景中
        <br>
        例如：
        <br>
        原图宽高1080x1920
        <br>
        输出则为1080x1920
        <br>
        如果开启<b>【横屏输出】</b>则为 1920x1080
      </svelte:fragment>
      <Switch bind:value={$config.options.origin_wh_output} disabled={$config.options.bg_rate_show} />
    </ActionItem>

    <ActionItem {labelWidth} title="圆角大小">
      <svelte:fragment slot="popup">
        指定圆角的大小，不指定则为直角
        <br>
        设置的值为图片高度的百分比，例如: 1，则为0.01%
        <br>
        (默认使用图片高度的 0.021%)
      </svelte:fragment>
      <Switch bind:value={$config.options.radius_show} />
      <input
        class="input"
        type="text"
        value={$config.options.radius}
        style="width: 103px;"
        on:input={(v) => onNumInput(v, 'radius', 30, 0)}
        on:change={(v) => onNumInputChange(v, 'radius')}
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
        on:input={(v) => onNumInput(v, 'shadow', 50, 0)}
        on:change={(v) => onNumInputChange(v, 'shadow')}
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
  </div>
</div>
