export interface OutputSetting {
  /**
   * 是否横屏显示
   */
  landscape: boolean

  /**
   * 是否显示参数
   */
  ext_show: boolean

  /**
   * 是否显示机型
   */
  model_show: boolean

  /**
   * 是否显示品牌
   */
  brand_show: boolean

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
}

export interface TextInfo {
  title: {
    width: number
    height: number
    data: Buffer
    path: string
  }
  info: {
    width: number
    height: number
    path: string
    data: Buffer
  }
}

export interface ExifInfo {
  /**
   * 相机厂商
   */
  Make: string

  /**
   * 机型 Nikon Z 30
   */
  Model: string

  /**
   * 照片拍摄时间
   */
  DateTimeOriginal: number

  /**
   * 快门速度
   */
  ExposureTime: number

  /**
   * 光圈大小
   */
  FNumber: number

  /**
   * 焦段
   */
  FocalLength: number

  ISO: number

  /**
   * 档位
   */
  ExposureProgram: number

  /**
   * 镜头型号
   */
  LensModel: string

  /**
   * 镜头厂商
   */
  LensMake: string
}

export interface IImgFileInfo {
  path: string
  width: number
  height: number
}
