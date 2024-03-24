import { IConfig } from '@src/interface';

export interface ImageToolOption {
  outputOption: OutputOption
  cachePath: string
  outputPath: string
}

export interface OutputOption {
  /** 立即输出 */
  iot: boolean

  /**
   * 是否横屏显示
   */
  landscape: boolean

  /**
   * 纯色背景
   */
  solid_bg: false

  /**
   * 背景比例
   */
  bg_rate: {
    w: number
    h: number
  }

  bg_rate_show: boolean

  /**
   * 是否按照原始宽高输出
   *
   * @default false
   */
  origin_wh_output: boolean

  /**
   * 圆角
   */
  radius: number

  radius_show: boolean

  /**
   * 阴影
   */
  shadow: number

  shadow_show: boolean

  /**
   * 选中的字体
   */
  font: string
}

export interface OutputFilePaths {
  /**
   * 基础路径
   */
  base: string

  /**
   * 背景图文件路径
   */
  bg: string

  /**
   * 主图文件路径
   */
  main: string

  /**
   * 最终合成图文件路径
   */
  composite: string

  /**
   * 遮罩层
   */
  mask: string
}

export interface SizeInfo {
  w: number
  h: number
  resetW: number
  resetH: number
}

export interface CalcContentHeightOption {
  bgHeight: number
  mainHeight: number
  textHeights: number[]
  options: IConfig['options']
}

export interface GenMainImgShadowOption {
  // bgImgPath: string
  // mainImgPath: string
  offsetTop: number
  options: IConfig['options']
}

export interface CompositeOption {
  textButtomOffset: number
  // bgImgPath: string
  mainImgList: {
    path: string
    top: number
    left: number
  }[]
  textList: {
    path: Buffer
    w: number
    h: number
  }[]
}

export interface Material {
  /**
   * 背景图片素材信息
   */
  bg: Img

  /**
   * 主图素材信息
   */
  main: Img[]

  /**
   * 文本素材信息
   */
  text: Img[]
}

export interface Img {
  path: string
  buf?: Buffer
  w: number
  h: number
  top: number
  left: number
}
