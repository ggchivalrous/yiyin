import type sharp from 'sharp';

export interface OutputSetting {
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

export interface ImgInfo {
  buf: Buffer
  info: {
    w: number
    h: number
  }
  reset_info: {
    w: number
    h: number
  }
  metadata: Partial<sharp.Metadata>
}

export interface IImgFileInfo {
  data?: string
  path: string
  width?: number
  height?: number
}
