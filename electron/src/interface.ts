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
   * 模板字段信息
   */
  templateFieldInfo: TTemplateFieldInfo
}

export type TTemplateFieldInfo = Record<string, IFieldInfoItem<any>>

export interface IFontParam {
  use: boolean
  bold: boolean
  italic: boolean
  size: number
  font: string
}

export interface IFieldInfoItem<T = string> {
  use?: boolean

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

  /**
   * 类型
   */
  type: 'text' | 'img'

  /**
   * 显示参数
   */
  param: IFontParam
}

export interface ICameraInfo {
  Force: IFieldInfoItem<boolean>
  Make: IFieldInfoItem
  Model: IFieldInfoItem
  ExposureTime: IFieldInfoItem
  FNumber: IFieldInfoItem
  ISO: IFieldInfoItem
  FocalLength: IFieldInfoItem
  ExposureProgram: IFieldInfoItem
  DateTimeOriginal: IFieldInfoItem<number>
  LensModel: IFieldInfoItem
  LensMake: IFieldInfoItem
  PersonalSign: IFieldInfoItem
}
