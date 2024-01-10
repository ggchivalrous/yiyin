<script>
  import Popup from '@components/popup';
  import './index.scss';

  export let title = '';
  export let labelWidth = '60px';
</script>

<p class="action-item">
  <span class="config-title" style:width={labelWidth} >{title}</span>
  {#if $$slots.popup}
    <Popup class="db-icon-question icon">
      <slot name="popup" slot="message"></slot>
    </Popup>
  {/if}
  <span class="config-value">
    <slot></slot>
  </span>
</p>
