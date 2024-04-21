<script lang="ts">
  import { Switch, ColorPicker, Radio, RadioGroup } from '@ggchivalrous/db-ui';
  import type { IFontParam } from '@src/interface';
  import { ActionItem, FontSelect } from '@web/components';
  import { config } from '@web/store/config';
  import './index.scss';

  export let showUseSwitch = true;

  export let conf: IFontParam = {
    use: false,
    bold: false,
    italic: false,
    size: 0,
    font: '',
    caseType: 'default',
  };
</script>

<div class="param-font-info">
  {#if showUseSwitch}
    <ActionItem title="生效">
      <svelte:fragment slot="popup">是否启用自定义字体参数</svelte:fragment>
      <Switch bind:value={conf.use} />
    </ActionItem>
  {/if}
  <div class="param-font-item">
    <ActionItem title="粗体">
      <svelte:fragment slot="popup">只对文本生效，文本加粗</svelte:fragment>
      <Switch bind:value={conf.bold} />
    </ActionItem>
    <ActionItem title="斜体">
      <svelte:fragment slot="popup">只对文本生效，文本斜体</svelte:fragment>
      <Switch bind:value={conf.italic} />
    </ActionItem>
  </div>
  <div class="param-font-item">
    <ActionItem title="字体大小">
      <svelte:fragment slot="popup">
        <b>文本：</b>指定文本字体大小
        <br>
        <b>图片：</b>指定图片高度
        <br>
        指定的大小为图片背景的高度的百分比
        <br>
        机型默认为3，即 0.03%
        <br>
        参数默认为2.2，即 0.022%
      </svelte:fragment>
      <input class="input" type="number" bind:value={conf.size} />
    </ActionItem>
    <ActionItem title="字体">
      <svelte:fragment slot="popup">只对文本生效，指定该文本字体</svelte:fragment>
      <FontSelect fontMap={$config.fontMap} bind:value={conf.font} clearable />
    </ActionItem>
  </div>
  <div class="param-font-item">
    <ActionItem title="字体颜色">
      <svelte:fragment slot="popup">指定字体的颜色，可以指定透明度</svelte:fragment>
      <ColorPicker bind:value={conf.color} showAlpha size="mini"/>
    </ActionItem>
    <ActionItem title="格式化">
      <svelte:fragment slot="popup"></svelte:fragment>
      <Radio bind:value={conf.caseType} label="default">默认</Radio>
      <Radio bind:value={conf.caseType} label="upcase">大写</Radio>
      <Radio bind:value={conf.caseType} label="lowcase">小写</Radio>
    </ActionItem>
  </div>
</div>
