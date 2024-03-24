<script lang="ts">
  import { DropdownItem, Dropdown, DropdownMenu } from '@ggchivalrous/db-ui';
  import type { IFieldInfoItem } from '@src/interface';
  import { config } from '@web/store/config';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  let fields: IFieldInfoItem[] = [];

  $: listenFieldTemp($config.tempFields, $config.customTempFields);

  function listenFieldTemp(tempFields: IFieldInfoItem[], customTempFields: IFieldInfoItem[]) {
    fields = [...tempFields, ...customTempFields];
  }

  function onCommand(e: CustomEvent<string>) {
    const text = `{${e.detail}}`;
    navigator.clipboard.writeText(text);
    dispatch('change', text);
  }
</script>

<Dropdown on:command={onCommand}>
  <i class="db-icon-s-shop icon" on:click on:keypress role="button" tabindex="-1"></i>

  <DropdownMenu style="height: 250px; width: 150px;">
    {#each fields as field (field.key)}
      <DropdownItem command={field.name}>{field.name}</DropdownItem>
    {/each}
  </DropdownMenu>
</Dropdown>
