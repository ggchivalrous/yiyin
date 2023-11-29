<svelte:options accessors/>

<script>
  import { onMount } from 'svelte';
  import { show, transition } from '../actions';
  import './index.css';

  // eslint-disable-next-line svelte/valid-compile
  export let id = '';
  export let message = '';
  export let el = null;
  export let visible = false;
  export let duration = 3000;
  export let iconClass = '';
  export let customClass = '';
  export let showClose = false;
  export let closed = false;
  export let verticalOffset = 0;
  export let dangerouslyUseHTMLString = false;
  export let center = false;
  export let zIndex = 1;
  /** @type {'info'|'success'|'warning'|'error'} */
  export let type = 'info';
  /** @type {Function} */
  export let destroy = null;
  /** @type {Function} */
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
  class="db-message grass {type && !iconClass ? `db-message--${type}` : ''} {customClass}"
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
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html message}
      </p>
    {:else}
      <p class="db-message__content">
        {message}
      </p>
    {/if}
  </slot>
  {#if showClose}
    <i class="db-message__closeBtn db-icon-close" on:click={close} on:keypress />
  {/if}
</div>
