import type { OutputOption, TextPosition } from './interface'

export interface ContentLayoutOption extends Pick<
  OutputOption,
  'mini_top_bottom_margin' | 'shadow' | 'shadow_show' | 'text_position' | 'bottom_margin'
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
  // 底部额外留白（视频字幕区）
  const bottomMargin = bgHeight * ((opt.bottom_margin || 0) / 100)

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

  // 内容整体高度
  const contentH = Math.ceil(textH + mainHeight + mainImgOffset + bottomMargin)

  // 文本在下方：主图从最小间隔处开始
  // 文本在上方：主图取默认布局镜像后的位置，并让出底部留白，
  //             保证它与文本、与顶部的间隔都不变，多出来的高度全部落在照片下方
  // （位置必须是整数像素，留白换算出来是小数，这里取整）
  const mainTop = textTop && hasText
    ? Math.round(contentH - contentTop - bottomMargin - mainHeight)
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
 * @param height - 内容高度
 * @param textHeights - 各文本图片高度（从上到下的顺序）
 * @param textEdgeOffset - 文本与内容边缘之间的间隔
 * @param bottomMargin - 内容最下方额外留出的空白（文本在下方时文本要避开它）
 */
export function calcTextStartTop(
  textTop: boolean,
  height: number,
  textHeights: number[],
  textEdgeOffset: number,
  bottomMargin = 0,
): number {
  if (textTop) {
    return textEdgeOffset
  }

  const textH = textHeights.reduce((n, h) => n + h, 0)
  return height - bottomMargin - textEdgeOffset - textH
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
