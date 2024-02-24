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
   * 模版字段列表
   */
  tempFields: IFieldInfoItem<any>[]

  /**
   * 模板
   */
  temps: string[]

  versionUpdateInfo: {
    checkDate: number
    version: string
    downloadLink: string
  }
}

export interface IFontParam {
  use: boolean
  bold: boolean
  italic: boolean
  size: number
  font: string

  /**
   * 偏移
   */
  offset: {
    top?: number
    bottom?: number
    left?: number
    right?: number
  }
}

export interface IFieldInfoItem<T = string> {
  use?: boolean

  forceUse?: boolean

  /**
   * 是否显示
   */
  show?: boolean

  key: string

  name: string

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

export interface IReleaseData {
  id: number
  tag_name: string
  name: string
  created_at: string

  assets: {
    url: string
    id: number
    name: string
    download_count: string
    browser_download_url: string
  }[]

  /**
   * Relase 更新内容
   */
  body: string
}

export interface INewVersionRes {
  update: boolean
  version: string
  downloadLink?: string
}
