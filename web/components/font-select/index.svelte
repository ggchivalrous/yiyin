<script lang="ts">
  import { Message, Option, Select } from '@ggchivalrous/db-ui';
  import { createEventDispatcher } from 'svelte';
  import './index.scss';

  export let fontMap: Record<string, string> = {};
  export let value = '';

  const defFont = { name: 'PingFang SC', fileName: '' };
  const dispatch = createEventDispatcher();
  let fontList = [defFont];

  $: listenFontMapChange(fontMap);

  function addFont() {
    dispatch('update');
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
    if (Object.keys(_fontMap).length) {
      const list = [];

      for (const key in _fontMap) {
        list.push({
          name: key,
          fileName: _fontMap[key],
        });
      }

      fontList = [defFont, ...list];
      if ((!_fontMap[value] && value !== defFont.name) || !value) {
        value = defFont.name;
      }
    }
  }
</script>

<Select size="mini" bind:value class="no-drag grass font-select">
  <div class="button add-font" on:click={addFont} on:keypress role="button" tabindex="-1">+</div>
  {#each fontList as i}
    {#key i.name}
      <Option value={i.name}>
        <span class="font-name">{i.name}</span>
        {#if i.fileName}
          <span class="font-del" on:click|preventDefault|capture={() => delFont(i.name)} on:keypress role="button" tabindex="-1">x</span>
        {/if}
      </Option>
    {/key}
  {/each}
</Select>
