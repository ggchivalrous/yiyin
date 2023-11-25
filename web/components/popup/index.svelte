<script context="module">
  let index = 1;
</script>

<script>
  // eslint-disable-next-line import/first
  import { popup } from '@skeletonlabs/skeleton';

  // eslint-disable-next-line import/no-mutable-exports
  export let event = 'hover';
  // eslint-disable-next-line import/no-mutable-exports
  export let placement = 'top';

  // eslint-disable-next-line import/no-mutable-exports
  let classes = '';
  export { classes as class };

  const popupHover = {
    event,
    target: `popupHover${index++}`,
    placement,
  };
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div use:popup={popupHover} class={classes} on:click>
  <slot></slot>
</div>

<div class="popup grass" data-popup={popupHover.target}>
	<slot name="message"></slot>
  <div class="arrow variant-filled-secondary" />
</div>

<style scoped>
.popup {
  position: absolute;
  top: 0;
  left: 0;
  display: none;
  background: var(--bg-color);
  padding: 6px 20px;
  border-radius: 4px;
  font-size: 14px;
}

.arrow {
  position: absolute;
  height: 0.5rem;
  width: 0.5rem;
  background-color: var(--bg-color);
  transform: rotate(45deg);
}
</style>