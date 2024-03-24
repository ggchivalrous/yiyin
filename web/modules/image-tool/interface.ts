export interface ImageToolOption {
  material: Material
  options: OutputOption
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
