<script lang="ts">
  import { arrToObj } from '@common/utils';
  import { FontDialog } from '@components';
  import { Message, Option, Select } from '@ggchivalrous/db-ui';
  import frederickathegreat from '@web/assets/font/FrederickatheGreat.ttf';
  import neoneon from '@web/assets/font/Neoneon.otf';
  import qiantuxiaotu from '@web/assets/font/千图小兔体.ttf';
  import chunfengkai from '@web/assets/font/春风楷.ttf';
  import { importFont } from '@web/util/util';
  import { createEventDispatcher } from 'svelte';
  import './index.scss';

  export let fontMap: Record<string, string> = {};
  export let value = '';
  export let clearable = false;

  const dispatch = createEventDispatcher();
  const defActiveFont = { name: 'PingFang SC', fileName: '', type: 'default' };
  const defFont = [
    defActiveFont,
    { name: '春风楷', fileName: chunfengkai, type: 'default' },
    { name: '千图小兔', fileName: qiantuxiaotu, type: 'default' },
    { name: 'FrederickatheGreat', fileName: frederickathegreat, type: 'default' },
    { name: 'Neoneon', fileName: neoneon, type: 'default' },
  ];
  const defFontRecord = arrToObj(defFont, 'name');
  let fontList: {
    name: string
    fileName: string
    type?: string
  }[] = [...defFont];
  let visible = false;

  $: listenFontMapChange(fontMap);

  importFont(defFont.map((i) => ({
    name: i.name,
    path: i.fileName,
  })));

  function addFont() {
    visible = true;
  }

  async function delFont(i: string) {
    const res = await window.api.delFont(i);
    if (res.code === 0) {
      if (res.data) {
        Message.success('删除成功');
      } else {
        Message.error('记录不存在');
      }
      dispatch('update');
      return;
    }

    Message.error(res.message);
  }

  function listenFontMapChange(_fontMap: typeof fontMap) {
    if (!Object.keys(_fontMap).length) {
      fontList = [...defFont];
      return;
    }

    const list = [];

    for (const key in _fontMap) {
      list.push({
        name: key,
        fileName: _fontMap[key],
      });
    }

    fontList = [...defFont, ...list];

    // 选择的字体已经被删除了，则改为默认字体
    if ((!_fontMap[value] && !defFontRecord[value]) || !value) {
      value = defActiveFont.name;
    }
  }
</script>

<Select size="mini" bind:value {clearable} class="no-drag grass font-select" style="font-family: {value}">
  <div class="button add-font" on:click={addFont} on:keypress role="button" tabindex="-1">+</div>
  {#each fontList as i}
    <Option value={i.name}>
      <span class="font-name" style:font-family={i.name}>{i.name}</span>
      {#if i.type !== 'default'}
        <span class="font-del" on:click|preventDefault|capture|stopPropagation={() => delFont(i.name)} on:keypress role="button" tabindex="-1">x</span>
      {/if}
    </Option>
  {/each}
</Select>

<FontDialog bind:visible on:update />
