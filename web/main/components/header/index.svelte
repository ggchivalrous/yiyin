<script lang="ts">
  import { help } from '@common/const';
  import { FontSelect } from '@components';
  import { Popover, Message, Collapse, CollapseItem } from '@ggchivalrous/db-ui';
  import { config, getConfig, resetConfig, pathInfo } from '@web/store/config';
  import './index.scss';

  const qqQun = '718615618';

  function miniSizeWindow() {
    window.api.miniSize();
  }

  function closeApp() {
    window.api.closeApp();
  }

  function copyQQQun() {
    navigator.clipboard.writeText(qqQun);
    Message.success('群号已复制到粘贴板');
  }
</script>

<div class="app-header">
  <div class="app-header-left">
    <Popover trigger="click" class="star-popover">
      <div slot="reference" class="no-drag app-header-star grass button app-header-button" role="button" tabindex="-1">
        <i class="db-icon-star-off"></i>
      </div>
      <div class="app-header-star-content">
        <div class="star-item group-chat button" on:click={copyQQQun} on:keypress role="button" tabindex="-1">
          QQ交流群:{qqQun}
        </div>
        <div class="star-item button">
          <a href="https://message.bilibili.com/#/whisper/mid94829489" target="_blank">反馈 - 建议(B站私信)</a>
        </div>
        <div class="star-item button">
          <a href="https://github.com/ggchivalrous/yiyin/issues" target="_blank">反馈 - 建议(Github Issues)</a>
        </div>
        <div class="star-item">
          <div class="star-item-head">
            ๑乛◡乛๑你不会想白嫖吧
          </div>
          <div class="star-item-content">
            <div class="zan-item">
              <img class="zanshang grass" src="file://{$pathInfo.public}/zs-wx.jpg" alt="赞赏码">
              微信
            </div>
            <div class="zan-item">
              <img class="zanshang grass" src="file://{$pathInfo.public}/zs-zfb.jpg" alt="赞赏码">
              支付宝
            </div>
          </div>
        </div>
      </div>
    </Popover>

    <Popover trigger="click" class="help-popover">
      <div slot="reference" class="no-drag app-header-show button app-header-button" on:keypress role="button" tabindex="-1">?</div>
      <div class="help-wrap">
        <p>一些常见问题解答</p>
        <div class="help-list">
          <Collapse accordion>
            {#each help as i}
              <CollapseItem title={i.title} name={i.title}>
                {@html i.desc}
              </CollapseItem>
            {/each}
          </Collapse>
        </div>
      </div>
    </Popover>
  </div>

  <div class="app-header-right">
    <FontSelect fontMap={$config.fontMap} bind:value={$config.options.font} on:update={getConfig} />

    <Popover trigger="hover">
      <div slot="reference" class="no-drag button app-header-button app-header-reset" on:click={resetConfig} on:keypress role="button" tabindex="-1">
        <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M491.52 819.2a304.3328 304.3328 0 0 1-217.088-90.112l28.672-28.672a266.24 266.24 0 1 0-40.96-327.68l-35.2256-21.2992A307.2 307.2 0 1 1 491.52 819.2z"></path><path d="M430.08 409.6H245.76a20.48 20.48 0 0 1-20.48-20.48V204.8h40.96v163.84h163.84z"></path><path d="M512 512m-61.44 0a61.44 61.44 0 1 0 122.88 0 61.44 61.44 0 1 0-122.88 0Z"></path></svg>
      </div>
      <p>重置回默认选项</p>
    </Popover>

    <div class="no-drag button app-header-button" on:click={miniSizeWindow} on:keypress role="button" tabindex="-1">-</div>
    <div class="no-drag button app-header-button" on:click={closeApp} on:keypress role="button" tabindex="-1">x</div>
  </div>
</div>
