<script lang="ts">
  import FontSelect from '@components/font-select';
  import Popup from '@components/popup';
  import { initializeStores } from '@skeletonlabs/skeleton';
  import { config, getConfig, resetConfig } from '@web/store/config';
  import './index.scss';

  initializeStores();

  function miniSizeWindow() {
    window.api.miniSize();
  }

  function closeApp() {
    window.api.closeApp();
  }

</script>

<div class="app-header">
  <FontSelect fontMap={$config.fontMap} bind:value={$config.options.font} on:update={getConfig} />

  <Popup class="no-drag app-header-show grass button app-header-reset app-header-button" on:click={resetConfig}>
    <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M491.52 819.2a304.3328 304.3328 0 0 1-217.088-90.112l28.672-28.672a266.24 266.24 0 1 0-40.96-327.68l-35.2256-21.2992A307.2 307.2 0 1 1 491.52 819.2z"></path><path d="M430.08 409.6H245.76a20.48 20.48 0 0 1-20.48-20.48V204.8h40.96v163.84h163.84z"></path><path d="M512 512m-61.44 0a61.44 61.44 0 1 0 122.88 0 61.44 61.44 0 1 0-122.88 0Z"></path></svg>
    <p slot="message">重置回默认选项</p>
  </Popup>

  <div class="no-drag app-header-show grass button app-header-button" on:click={miniSizeWindow} on:keypress role="button" tabindex="-1">-</div>
  <div class="no-drag app-header-close grass button app-header-button" on:click={closeApp} on:keypress role="button" tabindex="-1">x</div>
</div>
