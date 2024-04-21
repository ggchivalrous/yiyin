<script>
  import { Popover } from '@ggchivalrous/db-ui';
  import './index.scss';

  export let title = '';
  export let labelWidth = '60px';
</script>

<p class="action-item">
  <span class="config-title" style:width={labelWidth} >
    <slot name="title">{title}</slot>
  </span>
  {#if $$slots.popup}
    <Popover trigger="hover">
      <slot name="popup"></slot>
      <i slot="reference" class="db-icon-question icon" />
    </Popover>
  {/if}
  <slot name="expand"></slot>
  <span class="config-value">
    <slot></slot>
  </span>
</p>
