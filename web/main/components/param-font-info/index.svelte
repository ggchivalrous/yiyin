<script lang="ts">
  import { Switch } from '@ggchivalrous/db-ui';
  import type { IFontParam } from '@src/interface';
  import ActionItem from '@web/components/action-item';
  import FontSelect from '@web/components/font-select';
  import { config } from '@web/store/config';
  import './index.scss';

  export let conf: IFontParam = {
    use: false,
    bold: false,
    italic: false,
    size: 0,
    font: '',
  };
</script>

<div class="param-font-info">
  <ActionItem title="生效">
    <svelte:fragment slot="popup">是否启用自定义字体参数</svelte:fragment>
    <Switch bind:value={conf.use} />
  </ActionItem>
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
      </svelte:fragment>
      <input class="mini-input" type="number" bind:value={conf.size} />
    </ActionItem>
    <ActionItem title="字体">
      <svelte:fragment slot="popup">只对文本生效，指定该文本字体</svelte:fragment>
      <FontSelect fontMap={$config.fontMap} bind:value={conf.font} />
    </ActionItem>
  </div>
</div>
