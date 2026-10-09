import type { OutputOption, TextPosition } from './interface'

export interface ContentLayoutOption extends Pick<
  OutputOption,
  'mini_top_bottom_margin' | 'shadow' | 'shadow_show' | 'text_position' | 'bottom_margin' | 'bottom_margin_unit'
> {}

export interface ContentLayout {
  /**
   * 内容整体高度（文本 + 主图 + 间隔）
   */
  contentH: number

  /**
   * 主图顶部位置（相对内容顶部）
   */
  mainTop: number

  /**
   * 主图与内容上下边缘的最小间隔
   */
  contentTop: number

  /**
   * 主图上下间隔之和
   */
  mainImgOffset: number

  /**
   * 文本与内容边缘之间的间隔
   */
  textEdgeOffset: number

  /**
   * 内容最下方额外留出的空白
   */
  bottomMargin: number

  /**
   * 文本是否显示在照片上方
   */
  textTop: boolean
}

/**
 * 获取参数（文本）显示位置，非 `top` 时一律按默认的 `bottom` 处理
 */
export function getTextPosition(opt?: Pick<OutputOption, 'text_position'>): TextPosition {
  return opt?.text_position === 'top' ? 'top' : 'bottom'
}

/**
 * 计算底部留白的像素高度
 *
 * @param opt - 输出参数
 * @param value - 留白数值
 * @param referenceHeight - 百分比换算基准高度（一般用可用内容高度）
 */
export function calcBottomMarginPx(
  opt: Pick<OutputOption, 'bottom_margin_unit'>,
  value: number,
  referenceHeight: number,
): number {
  const v = value || 0
  return opt.bottom_margin_unit === 'px' ? Math.round(v) : referenceHeight * (v / 100)
}

/**
 * 固定分辨率输出：在「画布高度 - 底部留白」内求主图尺寸
 *
 * 内容整体靠上排列，底部留出 `bottomMargin` 的空白；
 * 主图按可用空间等比缩放（不裁切、可能放大或缩小），
 * 宽度不超过画布宽度的 `mainImgWRate`，高度不超过可用高度减去间隔与文字。
 *
 * @param opt - 输出参数
 * @param layoutRefHeight - 排版间隔的换算基准高度（固定分辨率时即画布高度）
 * @param photoW - 主图原始宽度
 * @param photoH - 主图原始高度
 * @param fit - 画布与文本信息
 * @param fit.canvasW - 画布宽度
 * @param fit.canvasH - 画布高度
 * @param fit.bottomMargin - 底部留白（像素）
 * @param fit.textHeights - 各文本图片高度
 * @param fit.mainImgWRate - 主图占画布宽度比例（0-100）
 */
export function fitMainSizeToFixedCanvas(
  opt: ContentLayoutOption,
  layoutRefHeight: number,
  photoW: number,
  photoH: number,
  fit: {
    canvasW: number
    canvasH: number
    bottomMargin: number
    textHeights: number[]
    mainImgWRate: number
  },
): { mainW: number, mainH: number, availableH: number } {
  const availableH = Math.max(1, fit.canvasH - fit.bottomMargin)
  const maxMainW = Math.max(1, fit.canvasW * ((fit.mainImgWRate || 90) / 100))
  const aspect = photoW / photoH
  // 求主图尺寸时把留白当 0（留白不参与内容高度）
  const probeOpt = { ...opt, bottom_margin: 0, bottom_margin_unit: 'px' as const }

  // 主图先撑满可用宽度，再按可用高度收敛（两者取小，保证等比且不裁切）
  let mainW = maxMainW
  let mainH = mainW / aspect

  for (let i = 0; i < 6; i++) {
    const probe = calcContentLayout(probeOpt, layoutRefHeight, mainH, fit.textHeights)
    // 除主图以外的占用（上下间隔 + 文字）
    const chrome = probe.contentH - mainH
    const maxH = availableH - chrome

    if (mainH <= maxH) break

    mainH = Math.max(1, Math.floor(maxH))
    mainW = mainH * aspect
  }

  // 极端情况下文字本身就超过可用高度，保证不出现负数/零
  if (mainH < 1) {
    mainH = 1
    mainW = aspect
  }

  return {
    mainW: Math.max(1, Math.round(mainW)),
    mainH: Math.max(1, Math.round(mainH)),
    availableH,
  }
}

/**
 * 计算水印整体布局
 *
 * 文本在照片下方时为默认布局；文本在照片上方时，布局取默认布局的垂直镜像，
 * 这样可以保证文本与照片的间隔、照片与内容边缘的间隔都不发生变化。
 *
 * @param opt - 输出参数
 * @param bgHeight - 背景高度（间隔按它的比例换算）
 * @param mainHeight - 主图高度
 * @param textHeights - 各文本图片高度（从上到下的顺序）
 */
export function calcContentLayout(
  opt: ContentLayoutOption,
  bgHeight: number,
  mainHeight: number,
  textHeights: number[] = [],
): ContentLayout {
  const textTop = getTextPosition(opt) === 'top'
  const mainImgTopOffset = bgHeight * (opt.mini_top_bottom_margin / 100)
  const textEdgeOffset = bgHeight * 0.027
  // 底部额外留白（视频字幕区）：百分比按背景高度换算，像素单位直接使用
  const bottomMargin = calcBottomMarginPx(opt, opt.bottom_margin, bgHeight)

  // 主图上下间隔最小间隔
  let contentTop = Math.ceil(mainImgTopOffset)
  let mainImgOffset = contentTop * 2

  // 阴影宽度
  if (opt.shadow_show) {
    const shadowHeight = Math.ceil(mainHeight * ((opt.shadow || 0) / 100))
    contentTop = Math.max(contentTop, Math.ceil(shadowHeight))
    mainImgOffset = contentTop * 2
  }

  const hasText = textHeights.length > 0

  // 有文字时文字与主图的间隔要小于主图对边缘的间隔，并且边缘间隔使用文字对边缘的间隔
  if (hasText) {
    mainImgOffset *= 3 / 4
    mainImgOffset += textEdgeOffset
  }

  // 文本高度
  const textH = textHeights.reduce((n, h) => n + h, 0)

  // 内容整体高度（不含底部留白：留白由调用方在画布尺寸确定后再追加到底部）
  const contentH = Math.ceil(textH + mainHeight + mainImgOffset)

  // 文本在下方：主图从最小间隔处开始
  // 文本在上方：主图取默认布局镜像后的位置，保证它与文本、与底部的间隔都不变
  const mainTop = textTop && hasText
    ? contentH - contentTop - mainHeight
    : contentTop

  return {
    contentH,
    mainTop,
    contentTop,
    mainImgOffset,
    textEdgeOffset,
    bottomMargin,
    textTop,
  }
}

/**
 * 计算文本块中第一张文本图片的顶部位置
 *
 * 文本在下方时文本块贴着内容底部，在上方时贴着内容顶部，与边缘的间隔固定为 `textEdgeOffset`
 *
 * @param textTop - 文本是否显示在照片上方
 * @param height - 内容高度（不含底部留白）
 * @param textHeights - 各文本图片高度（从上到下的顺序）
 * @param textEdgeOffset - 文本与内容边缘之间的间隔
 */
export function calcTextStartTop(
  textTop: boolean,
  height: number,
  textHeights: number[],
  textEdgeOffset: number,
): number {
  if (textTop) {
    return textEdgeOffset
  }

  const textH = textHeights.reduce((n, h) => n + h, 0)
  return height - textEdgeOffset - textH
}

/**
 * 按从上到下的顺序计算各文本图片的顶部位置
 */
export function calcTextTops(textHeights: number[], startTop: number): number[] {
  const tops: number[] = []
  let top = startTop

  for (const h of textHeights) {
    tops.push(top)
    top += h
  }

  return tops
}
