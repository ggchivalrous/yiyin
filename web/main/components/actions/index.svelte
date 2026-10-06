<script lang='ts'>
  import type { IConfig, IFileInfo, ImgInfo, TInputEvent } from '../../interface'
  import { arrToObj, roundDecimalPlaces } from '@common/utils'
  import { ActionItem } from '@components'
  import { ColorPicker, Message, Switch } from '@ggchivalrous/db-ui'
  import { config } from '@web/store/config'
  import { onDestroy, onMount } from 'svelte'

  import { smoothIncrement } from '@web/util/util'

  import './index.scss'

  export let fileInfoList: IFileInfo[] = []

  const PREVIEW_MIN_WIDTH = 120
  const PREVIEW_MAX_WIDTH = 720
  const PREVIEW_MIN_RATIO = 0.15
  const PREVIEW_MAX_RATIO = 0.75
  const PREVIEW_MIN_HEIGHT = 160
  const PREVIEW_MAX_HEIGHT = 560
  const PREVIEW_MIN_HEIGHT_RATIO = 0.35
  const PREVIEW_MAX_HEIGHT_RATIO = 0.92
  const SPLITTER_SIZE = 6
  const IMG_LIST_MIN_WIDTH = 180

  let selectedId = ''
  let previewUrl = ''
  let previewLoading = false
  let previewTimer: NodeJS.Timeout
  let imageListWrapEl: HTMLDivElement
  let previewWidth = 0
  let previewHeight = 0
  let isDragging = false
  let hoveredSplitter: 'width' | 'height' | null = null
  let resizeAxis: 'width' | 'height' = 'width'
  let resizeObserver: ResizeObserver

  function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
  }

  function getLayoutMetrics() {
    if (!imageListWrapEl) {
      return { availableWidth: 0, availableHeight: 0 }
    }

    const containerWidth = imageListWrapEl.clientWidth
    const containerHeight = imageListWrapEl.clientHeight
    const gapTotal = 15 * 2

    return {
      availableWidth: containerWidth - SPLITTER_SIZE - gapTotal - IMG_LIST_MIN_WIDTH,
      availableHeight: containerHeight - SPLITTER_SIZE,
    }
  }

  function clampPreviewWidth(width: number, availableWidth: number) {
    const minW = Math.max(PREVIEW_MIN_WIDTH, availableWidth * PREVIEW_MIN_RATIO)
    const maxW = Math.min(PREVIEW_MAX_WIDTH, availableWidth * PREVIEW_MAX_RATIO)
    return clamp(width, minW, maxW)
  }

  function clampPreviewHeight(height: number, availableHeight: number) {
    const minH = Math.max(PREVIEW_MIN_HEIGHT, availableHeight * PREVIEW_MIN_HEIGHT_RATIO)
    const maxH = Math.min(PREVIEW_MAX_HEIGHT, availableHeight * PREVIEW_MAX_HEIGHT_RATIO)
    return clamp(height, minH, maxH)
  }

  function applyPreviewSize() {
    if (!imageListWrapEl || !$config.options.preview_show || isDragging) {
      return
    }

    const { availableWidth, availableHeight } = getLayoutMetrics()
    if (availableWidth <= 0 || availableHeight <= 0) {
      return
    }

    const widthRatio = $config.options.preview_pane_width_ratio ?? 0.5
    const heightRatio = $config.options.preview_pane_height_ratio ?? 0.85
    previewWidth = clampPreviewWidth(availableWidth * widthRatio, availableWidth)
    previewHeight = clampPreviewHeight(availableHeight * heightRatio, availableHeight)
  }

  function persistPreviewRatio() {
    const { availableWidth, availableHeight } = getLayoutMetrics()

    if (resizeAxis === 'width' && availableWidth > 0) {
      $config.options.preview_pane_width_ratio = Math.round((previewWidth / availableWidth) * 1000) / 1000
    }
    else if (resizeAxis === 'height' && availableHeight > 0) {
      $config.options.preview_pane_height_ratio = Math.round((previewHeight / availableHeight) * 1000) / 1000
    }
  }

  /** 仅包含会影响预览图内容的配置，排除纯布局类字段 */
  function getPreviewUpdateKey(conf: IConfig, id: string) {
    const options = { ...conf.options }
    delete options.preview_pane_width_ratio
    delete options.preview_pane_height_ratio

    return JSON.stringify({
      id,
      show: conf.options.preview_show,
      options,
      output: conf.output,
      fontMap: conf.fontMap,
      tempFields: conf.tempFields,
      customTempFields: conf.customTempFields,
      temps: conf.temps,
    })
  }

  function startResize(e: PointerEvent, axis: 'width' | 'height') {
    if (!imageListWrapEl) {
      return
    }

    resizeAxis = axis
    isDragging = true
    hoveredSplitter = axis
    e.preventDefault()

    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
    document.body.classList.add('preview-resizing', axis === 'width' ? 'preview-resizing-x' : 'preview-resizing-y')

    const onMove = (ev: PointerEvent) => {
      const rect = imageListWrapEl.getBoundingClientRect()
      const { availableWidth, availableHeight } = getLayoutMetrics()

      if (axis === 'width') {
        previewWidth = clampPreviewWidth(ev.clientX - rect.left, availableWidth)
      }
      else {
        previewHeight = clampPreviewHeight(ev.clientY - rect.top, availableHeight)
      }
    }

    const onUp = (ev: PointerEvent) => {
      isDragging = false
      hoveredSplitter = null
      target.releasePointerCapture(ev.pointerId)
      document.body.classList.remove('preview-resizing', 'preview-resizing-x', 'preview-resizing-y')
      persistPreviewRatio()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  onMount(() => {
    resizeObserver = new ResizeObserver(() => {
      applyPreviewSize()
    })
  })

  onDestroy(() => {
    resizeObserver?.disconnect()
    document.body.classList.remove('preview-resizing', 'preview-resizing-x', 'preview-resizing-y')
  })

  $: if (imageListWrapEl && $config.options.preview_show) {
    resizeObserver?.disconnect()
    resizeObserver?.observe(imageListWrapEl)
    applyPreviewSize()
  }

  $: resizeHint = `${Math.round(previewWidth)} × ${Math.round(previewHeight)}`

  $: {
    if (fileInfoList.length) {
      if (!selectedId || !fileInfoList.some(i => i.id === selectedId)) {
        selectedId = fileInfoList[0].id
      }
    }
    else {
      selectedId = ''
      previewUrl = ''
    }
  }

  $: previewUpdateKey = getPreviewUpdateKey($config, selectedId)

  $: {
    const { show, id } = JSON.parse(previewUpdateKey) as { show: boolean, id: string }
    if (show && id) {
      clearTimeout(previewTimer)
      previewTimer = setTimeout(updatePreview, 300)
    }
    else {
      clearTimeout(previewTimer)
      previewUrl = ''
    }
  }

  async function updatePreview() {
    if (!$config.options.preview_show) return
    const file = fileInfoList.find(i => i.id === selectedId)
    if (!file) return

    previewLoading = true
    try {
      const res = await window.api.genPreview({ path: file.path, name: file.name })
      if (res && res.code === 0) {
        // 如果在请求过程中预览被关闭了，就不更新了
        if ($config.options.preview_show) {
          previewUrl = res.data
        }
      }
      else if (res) {
        console.error('预览生成失败:', res.message)
        previewUrl = ''
      }
    }
    catch (e) {
      console.error('预览生成失败:', e)
    }
    finally {
      previewLoading = false
    }
  }

  function selectImage(id: string) {
    selectedId = id
  }

  const labelWidth = '110px'

  let handleCount = 0
  let outputDirName = ''
  let imgInfoRecord: Record<string, ImgInfo> = {}

  $: getPathName($config.output)
  $: onFileInfoList(fileInfoList)
  $: getHandleCount(imgInfoRecord)

  window.api['on:progress']((data: Pick<ImgInfo, 'id' | 'progress'>) => {
    if (imgInfoRecord[data.id]) {
      if (imgInfoRecord[data.id].closeInterval) {
        imgInfoRecord[data.id].closeInterval()
      }

      imgInfoRecord[data.id].closeInterval = smoothIncrement(
        imgInfoRecord[data.id].progress,
        data.progress,
        10,
        (n) => {
          imgInfoRecord[data.id].progress = n
        },
      )
    }
  })

  window.api['on:faildTask']((data: { id: string, msg: string }) => {
    if (!imgInfoRecord[data.id]) {
      return
    }

    imgInfoRecord[data.id].faild = true
    imgInfoRecord[data.id].faildMsg = data.msg
  })

  function getHandleCount(_imgInfoRecord: typeof imgInfoRecord) {
    handleCount = Object.values(_imgInfoRecord).filter(i => i.progress === 100 || i.faild).length
  }

  function onFileInfoList(list: IFileInfo[]) {
    imgInfoRecord = arrToObj(list, 'id', i => ({
      ...i,
      interval: null,
      progress: 0,
      exif: null,
      faild: false,
      faildMsg: '',
      ...imgInfoRecord[i.id],
    }))
  }

  async function changeOutputPath() {
    const data = await window.api['open:selectPath']()
    if (data.code === 0 && data.data.output) {
      $config.output = data.data.output
    }
  }

  function openDir(dir: string) {
    window.api['open:dir'](dir)
  }

  function getPathName(path: string) {
    path = path.trim()

    if (!path) {
      outputDirName = '异常目录无法识别'
      return
    }

    const isMatch = path.match(/^([A-Z]:)\\/i)

    if (isMatch) {
      const arr = path.replace(isMatch[1], '').split('\\')
      outputDirName = arr[arr.length - 1] || isMatch[0]
      return
    }

    const arr = path.split('/')
    outputDirName = arr[arr.length - 1] || '/'
  }

  function onBGRateChange(e: CustomEvent<boolean>) {
    if (e.detail) {
      config.update((d) => {
        d.options.landscape = false
        return d
      })
    }
  }

  const numReg = /-?\d+\.?\d{0,3}/
  function onNumInputChange(v: TInputEvent, key: keyof IConfig['options'], max: number, min: number, decimal?: number) {
    let _v = v.currentTarget.value
    const match = _v.match(numReg)

    if (match && match.length) {
      _v = match[0]
    }

    let num = +_v
    if (Number.isNaN(num)) num = min
    else if (num < min) num = min
    else if (num > max) num = max

    num = typeof decimal === 'number' ? roundDecimalPlaces(num, decimal) : num;
    ($config.options[key] as number) = num
    v.currentTarget.value = `${num}`
  }

  function switchBgRate() {
    config.update((d) => {
      d.options.bg_rate = {
        w: d.options.bg_rate.h,
        h: d.options.bg_rate.w,
      }
      return d
    })
  }

  async function getExitInfo(id: string, path: string) {
    if (imgInfoRecord[id].exif !== null) {
      return imgInfoRecord[id].exif
    }

    const info = await window.api.getExitInfo(path)
    imgInfoRecord[id].exif = info.data || undefined

    return info.data
  }

  async function cpExif(id: string) {
    if (!imgInfoRecord[id] || !imgInfoRecord[id].exif) {
      return Message.error('图片信息不存在！！')
    }

    navigator.clipboard.writeText(JSON.stringify(imgInfoRecord[id].exif, null, 2))
    return Message.success('相机信息已复制到粘贴板')
  }

  async function clearImgInfo() {
    const res = await window.api.drainQueue()
    if (res.code !== 0) {
      Message.error(`清空失败！${res.message || ''}`)
      return
    }

    Message.success('清空成功')
    fileInfoList = []
  }
</script>

<div class='app-action-wrap'>
  <div class='app-action-left-wrap'>
    <ActionItem {labelWidth} title='输出目录'>
      <svelte:fragment slot='popup'>图片输出目录，点击可以打开目录</svelte:fragment>
      <span class='db-icon-setting output-setting' on:click|stopPropagation={changeOutputPath} on:keypress role='button' tabindex='-1'></span>
      <span class='open-file-line' on:click={() => openDir($config.output)} on:keypress role='button' tabindex='-1'>{outputDirName}</span>
    </ActionItem>

    <ActionItem {labelWidth} title='主图占比'>
      <svelte:fragment slot='popup'>
        指定主图对背景宽度的占比（可以调节左右边框的宽度）
        <br>
        默认主图占背景的90%
      </svelte:fragment>
      <input
        class='input'
        type='text'
        value={$config.options.main_img_w_rate}
        style='width: 103px;'
        on:change={v => onNumInputChange(v, 'main_img_w_rate', 100, 1, 0)}
      />
    </ActionItem>

    <ActionItem {labelWidth} title='文本间距'>
      <svelte:fragment slot='popup'>
        指定文本上下间距（临时性功能，后续会去掉）
        <br>
        默认0.4
      </svelte:fragment>
      <input
        class='input'
        type='text'
        value={$config.options.text_margin}
        style='width: 103px;'
        on:change={v => onNumInputChange(v, 'text_margin', 10000, 0, 2)}
      />
    </ActionItem>

    <ActionItem {labelWidth} title='最小上下边距'>
      <svelte:fragment slot='popup'>
        指定水印上下边距的最小值，默认情况使用阴影宽度作为上下边距
        <br>
        设置最小上下边距，将会从它和阴影之间取最大值
        <br>
        按照背景高度比例换算，值为 0-100
        <br>
        默认：0
      </svelte:fragment>
      <input
        class='input'
        type='text'
        value={$config.options.mini_top_bottom_margin}
        style='width: 103px;'
        on:change={v => onNumInputChange(v, 'mini_top_bottom_margin', 100, 0, 2)}
      />
    </ActionItem>

    <ActionItem {labelWidth} title='圆角大小'>
      <svelte:fragment slot='popup'>
        指定圆角的大小，不指定则为直角
        <br>
        取值范围: 0 - 50
        <br>
        默认值: 2.1
      </svelte:fragment>
      <Switch bind:value={$config.options.radius_show} />
      <input
        class='input'
        type='text'
        value={$config.options.radius}
        style='width: 103px;'
        on:change={v => onNumInputChange(v, 'radius', 50, 0, 1)}
      />
    </ActionItem>

    <ActionItem {labelWidth} title='阴影大小'>
      <svelte:fragment slot='popup'>
        指定阴影的大小，不指定则无阴影
        <br>
        设置的值为图片高度的百分比，例如: 1，则为0.01%
        <br>
        默认值：6
      </svelte:fragment>
      <Switch bind:value={$config.options.shadow_show} />
      <input
        class='input'
        type='text'
        value={$config.options.shadow}
        style='width: 103px;'
        on:change={v => onNumInputChange(v, 'shadow', 50, 0, 1)}
      />
    </ActionItem>

    <ActionItem {labelWidth} title='输出质量'>
      <svelte:fragment slot='popup'>
        指定输出质量，只允许整数
        <br>
        默认值：100
      </svelte:fragment>
      <input
        class='input'
        type='text'
        value={$config.options.quality}
        style='width: 103px;'
        on:change={v => onNumInputChange(v, 'quality', 100, 1, 0)}
      />
    </ActionItem>

    <ActionItem {labelWidth} title='输出宽高比'>
      <svelte:fragment slot='popup'>
        指定输出的图片的宽高比(该比例只生效于背景，对原图不生效)
        <br>
        该选项生效后影响以下选项效果：
        <br>
        <b>横屏输出：</b>失效
      </svelte:fragment>
      <Switch bind:value={$config.options.bg_rate_show} on:change={onBGRateChange} />
      <input class='input' style='width: 40px; margin-right: 4px;' type='text' bind:value={$config.options.bg_rate.w} />
      <i class='switch icon db-icon-sort' on:click={switchBgRate} role='button' tabindex='-1' on:keypress />
      <input class='input' style='width: 40px; margin-left: 5px;' type='text' bind:value={$config.options.bg_rate.h} />
    </ActionItem>

    <ActionItem {labelWidth} title='背景模糊'>
      <svelte:fragment slot='popup'>
        指定背景图片的模糊程度
        <br>
        取值范围: 0 - 100
        <br>
        默认值: 15
      </svelte:fragment>
      <input
        class='db-slider'
        type='range'
        min='0'
        max='100'
        step='1'
        bind:value={$config.options.bg_blur}
        style='margin-right: 8px;'
      />
      <input
        class='input'
        type='text'
        value={$config.options.bg_blur}
        style='width: 30px;'
        on:change={v => onNumInputChange(v, 'bg_blur', 100, 0, 0)}
      />
      <span style='font-size: 12px; margin-left: 2px;'>%</span>
    </ActionItem>

    <ActionItem {labelWidth} title='纯色背景'>
      <svelte:fragment slot='popup'>使用纯色背景，默认使用图片模糊做背景</svelte:fragment>
      <Switch bind:value={$config.options.solid_bg} />
      {#if $config.options.solid_bg}
        <ColorPicker bind:value={$config.options.solid_color} size='mini' />
      {/if}
    </ActionItem>

    <ActionItem {labelWidth} title='横屏输出'>
      <svelte:fragment slot='popup'>
        软件自己判断图片宽高那一边更长
        <br>
        将背景横向处理
        <br>
        适合竖图生成横屏图片
      </svelte:fragment>
      <Switch bind:value={$config.options.landscape} disabled={$config.options.bg_rate_show} />
    </ActionItem>

    <ActionItem {labelWidth} title='快速输出'>
      <svelte:fragment slot='popup'>
        开启后选择图片/拖拽图片到软件将直接输出水印图片无需点击生成按钮
      </svelte:fragment>
      <Switch bind:value={$config.options.iot} />
    </ActionItem>

    <ActionItem {labelWidth} title='实时预览'>
      <svelte:fragment slot='popup'>
        开启后点击列表图片可实时预览水印效果
      </svelte:fragment>
      <Switch bind:value={$config.options.preview_show} />
    </ActionItem>
  </div>

  <div class='app-action-right-wrap'>
    <div
      class='image-list-wrap'
      class:has-preview={$config.options.preview_show && selectedId}
      bind:this={imageListWrapEl}
    >
      {#if $config.options.preview_show && selectedId}
        <div class='preview-panel' style:width='{previewWidth}px' style:flex='0 0 {previewWidth}px'>
          <div
            class='preview-wrap'
            style:height='{previewHeight}px'
            style:flex='0 0 {previewHeight}px'
          >
            {#if previewLoading}
              <div class='preview-loading'>
                <i class='db-icon-loading icon-loading'></i>
                生成预览中...
              </div>
            {:else if previewUrl}
              <img class='preview-img' src={previewUrl} alt='预览图' />
            {:else}
              <div class='preview-placeholder'>预览图生成失败</div>
            {/if}
          </div>

          <div
            class='preview-splitter preview-splitter-horizontal'
            class:dragging={isDragging && resizeAxis === 'height'}
            class:hover={hoveredSplitter === 'height'}
            role='separator'
            aria-orientation='horizontal'
            aria-label='调整预览高度'
            on:pointerdown={e => startResize(e, 'height')}
            on:pointerenter={() => { if (!isDragging) hoveredSplitter = 'height' }}
            on:pointerleave={() => { if (!isDragging && hoveredSplitter === 'height') hoveredSplitter = null }}
          >
            {#if isDragging && resizeAxis === 'height'}
              <div class='splitter-tooltip'>{resizeHint}</div>
            {/if}
          </div>
        </div>

        <div
          class='preview-splitter preview-splitter-vertical'
          class:dragging={isDragging && resizeAxis === 'width'}
          class:hover={hoveredSplitter === 'width'}
          role='separator'
          aria-orientation='vertical'
          aria-label='调整预览宽度'
          on:pointerdown={e => startResize(e, 'width')}
          on:pointerenter={() => { if (!isDragging) hoveredSplitter = 'width' }}
          on:pointerleave={() => { if (!isDragging && hoveredSplitter === 'width') hoveredSplitter = null }}
        >
          {#if isDragging && resizeAxis === 'width'}
            <div class='splitter-tooltip'>{resizeHint}</div>
          {/if}
        </div>
      {/if}

      <div class='img-wrap grass-inset'>
        <div class='img-list'>
          {#each fileInfoList as i (i.id)}
            {@const record = imgInfoRecord[i.id]}
            {#key i.id}
              <div
                class='img-item {selectedId === i.id ? 'selected' : ''}'
                on:click={() => selectImage(i.id)}
                on:keypress
                role='button'
                tabindex='-1'
              >
                <div class='img-item-head'>
                  <span class='img-name'>{i.name}</span>
                  {#if record.faild}
                    <i class='db-icon-error error'></i>
                  {:else if record.progress < 100}
                    <span
                      style='font-weight: bold;'
                      class={record.progress === 100 ? 'success' : ''}
                    >{record.progress}%</span>
                  {:else}
                    <i class='db-icon-success success'></i>
                  {/if}
                </div>
                <div class='img-item-info'>
                  相机信息:
                  {#await getExitInfo(i.id, i.path)}
                    <i class='db-icon-loading'></i>
                  {:then v}
                    {#if v}
                      <i class='db-icon-success success'></i>
                      <i class='icon db-icon-document-copy' on:click={() => cpExif(i.id)} on:keypress role='button' tabindex='-1'></i>
                    {:else}
                      <i class='db-icon-error error'></i>
                    {/if}
                  {/await}
                </div>

                <div class='img-item-faild-msg'>
                  {record.faildMsg}
                </div>
              </div>
            {/key}
          {/each}
        </div>
      </div>
    </div>

    <div class='task-action'>
      <ActionItem title='图片数量'>{fileInfoList.length}</ActionItem>
      <ActionItem title='完成数量'>{handleCount}</ActionItem>
      <div class='button' on:click={clearImgInfo} on:keypress role='button' tabindex='-1'>清空</div>
    </div>
  </div>
</div>
