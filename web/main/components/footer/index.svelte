<script lang='ts'>
  import { version } from '@web/store/version';
  import './index.scss';
</script>

<div class="app-footer">
  <p class="app-footer-item">
    <a class:version-update={$version.curVersion < $version.newVersion} href={`https://github.com/ggchivalrous/yiyin/releases/tag/v${$version.curVersion}`} target="_blank">
      v{$version.curVersion}
    </a>
    {#if $version.curVersion < $version.newVersion}
      ->
      <a href={$version.downloadLink} target="_blank">
        v{$version.newVersion}
      </a>
    {/if}
  </p>
  <p class="app-footer-item">
    <a href="https://space.bilibili.com/94829489" target="_blank">B站 - 不长肉的小伙吒</a>
  </p>
  <p class="app-footer-item">
    <a href="https://github.com/ggchivalrous/yiyin" target="_blank">© 2023 Github - GGChivalrous.</a>
  </p>
</div>
