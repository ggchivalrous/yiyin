<script>
  // eslint-disable-next-line import/first
  import YiWen from '../yiwen/index.svelte';

  // eslint-disable-next-line import/no-mutable-exports
  export let title = '';
</script>

<p class="action-item">
  <span class="config-title">{title}</span>
  {#if $$slots.popup}
    <YiWen><slot name="popup" /></YiWen>
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

.icon {
  width: 30px;
  height: 30px;
}
</style>
