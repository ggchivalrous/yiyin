<svelte:options accessors/>

<script>
  import { onMount } from 'svelte';
  import { show, transition } from '../actions';
  import './index.css';

  // eslint-disable-next-line import/no-mutable-exports
  export let message = '';
  // eslint-disable-next-line import/no-mutable-exports
  export let el = null;
  // eslint-disable-next-line import/no-mutable-exports
  export let visible = false;
  // eslint-disable-next-line import/no-mutable-exports
  export let duration = 3000;
  // eslint-disable-next-line import/no-mutable-exports
  export let iconClass = '';
  // eslint-disable-next-line import/no-mutable-exports
  export let customClass = '';
  // eslint-disable-next-line import/no-mutable-exports
  export let showClose = false;
  // eslint-disable-next-line import/no-mutable-exports
  export let closed = false;
  // eslint-disable-next-line import/no-mutable-exports
  export let verticalOffset = 0;
  // eslint-disable-next-line import/no-mutable-exports
  export let dangerouslyUseHTMLString = false;
  // eslint-disable-next-line import/no-mutable-exports
  export let center = false;
  // eslint-disable-next-line import/no-mutable-exports
  export let id = '';
  // eslint-disable-next-line import/no-mutable-exports
  export let zIndex = 1;
  
  /** @type {'info'|'success'|'warning'|'error'} */
  // eslint-disable-next-line import/no-mutable-exports
  export let type = 'info';
  
  /** @type {Function} */
  // eslint-disable-next-line import/no-mutable-exports
  export let destroy = null;
  
  /** @type {Function} */
  // eslint-disable-next-line import/no-mutable-exports
  export let onClose = null;

  const typeMap = {
    success: 'success',
    info: 'info',
    warning: 'warning',
    error: 'error',
  };

  let typeClass;
  let timer;

  $: watchClosed(closed);

  onMount(() => {
    startTimer();
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
    };
  });

  function watchClosed(newVal) {
    if (newVal) {
      visible = false;
    }
  }

  function handleAfterLeave() {
    if (typeof destroy === 'function') {
      destroy();
    }
  }

  function close() {
    closed = true;
    if (typeof onClose === 'function') {
      onClose(this);
    }
  }

  function clearTimer() {
    clearTimeout(timer);
  }

  function startTimer() {
    if (duration > 0) {
      timer = window.setTimeout(() => {
        if (!closed) {
          close();
        }
      }, duration);
    }
  }

  function keydown(e) {
    if (e.keyCode === 27) {
      // esc关闭消息
      if (!closed) {
        close();
      }
    }
  }
</script>

<div
  use:transition={'db-message-fade'}
  use:show={visible}
  on:afterLeave={handleAfterLeave}
  class:db-message={true}
  class:grass={true}
  class:toast={true}
  class="{type && !iconClass ? `db-message--${type}` : ''} {customClass}"
  class:is-center={center}
  class:is-closable={showClose}
  style="top: {verticalOffset}px; z-index: {zIndex}"
  on:mouseenter={clearTimer}
  on:mouseleave={startTimer}
  role="alert"
  bind:this={el}
>
  {#if iconClass}
    <i class={iconClass} />
  {:else}
    <i class={typeClass} />
  {/if}
  <slot>
    {#if dangerouslyUseHTMLString}
      <p class="db-message__content">
        {@html message}
      </p>
    {:else}
      <p class="db-message__content">
        {message}
      </p>
    {/if}
  </slot>
  {#if showClose}
    <i class="db-message__closeBtn db-icon-close" on:click={close} />
  {/if}
</div>
