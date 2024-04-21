import type { OutputOption } from '@modules/image-tool/interface';

import type { ITemp } from '@/common/const/def-temps';

export interface IConfig {
  version: string

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
  options: OutputOption

  /**
   * 模版字段列表
   */
  tempFields: IFieldInfoItem<any>[]

  customTempFields: IFieldInfoItem<any>[]

  /**
   * 模板
   */
  temps: ITemp[]

  versionUpdateInfo: {
    checkDate: number
    version: string
    downloadLink: string
  }
}

export interface IFont {
  bold: boolean
  italic: boolean
  size: number
  font: string
  caseType: 'lowcase' | 'upcase' | 'default'
  color: string
}

export interface IPosition {
  top: number
  bottom: number
  left: number
  right: number
}

export interface IFontParam extends Partial<IFont> {
  use?: boolean
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
  font: IFontParam
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
