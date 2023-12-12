import { OutputSetting } from '@modules/tools/image';

export interface IConfig {
  /**
   * 配置文件存放路径
   */
  dir: string

  /**
   * 图片输出路径
   */
  output: string

  /**
   * 缓存存放目录
   */
  cacheDir: string

  /**
   * 图片资源存放目录
   */
  staticDir: string

  /**
   * 字体信息
   */
  font: {
    path: string

    dir: string

    map: Record<string, string>
  }

  /**
   * 参数信息
   */
  options: OutputSetting

  /**
   * 相机参数信息
   */
  cameraInfo: ICameraInfo
}

export interface ICameraInfoItem<T = string> {
  use: boolean

  /**
   * 文本
   */
  value: T

  /**
   * 暗色背景使用
   */
  wImg: string

  /**
   * 亮色背景使用
   */
  bImg: string
  type: 'text' | 'img'
}

export interface ICameraInfo {
  Force: ICameraInfoItem<boolean>
  Make: ICameraInfoItem
  Model: ICameraInfoItem
  ExposureTime: ICameraInfoItem
  FNumber: ICameraInfoItem
  ISO: ICameraInfoItem
  FocalLength: ICameraInfoItem
  ExposureProgram: ICameraInfoItem
  DateTimeOriginal: ICameraInfoItem<number>
  LensModel: ICameraInfoItem
  LensMake: ICameraInfoItem
  PersonalSign: ICameraInfoItem
}
