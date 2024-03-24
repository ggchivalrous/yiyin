export interface Exif {
  /**
   * Logo
   */
  Make: string

  /**
   * 型号
   */
  Model: string

  /**
   * 镜头Logo
   */
  LensMake: string

  /**
   * 镜头型号
   */
  LensModel: string

  /**
   * 快门
   */
  ExposureTime: string

  /**
   * 光圈
   */
  FNumber: string

  /**
   * ISO
   */
  ISO: string

  /**
   * 焦距
   */
  FocalLength: string

  /**
   * 等效焦距
   */
  FocalLengthIn35mmFormat: string

  /**
   * 档位
   */
  ExposureProgram: string

  /**
   * 拍摄日期
   */
  DateTimeOriginal: string

  /**
   * 曝光补偿
   */
  ExposureCompensation: string

  /**
   * 测光模式
   */
  MeteringMode: string

  /**
   * 白平衡
   */
  WhiteBalance: string
}
