<script>
  import Popup from '@components/popup';

  export let title = '';
</script>

<p class="action-item">
  <span class="config-title">{title}</span>
  {#if $$slots.popup}
    <Popup class="db-icon-question icon">
      <slot name="popup" slot="message"></slot>
    </Popup>
  {/if}
  <span class="config-value">
    <slot></slot>
  </span>
</p>

<style scoped>
.action-item {
  padding: 2px 0;
}

.config-title {
  display: inline-block;
  width: 90px;
  font-weight: bold;
  text-align: right;
}

.config-value {
  padding-left: 2px;
  font-size: 13px;
}
</style>
