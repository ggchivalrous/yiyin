import type { ExifInfo, IImgFileInfo, OutputSetting } from '@modules/tools/image';
import type { IFieldInfoItem, TTemplateFieldInfo } from '@src/interface';

export type { ExifInfo, IImgFileInfo, OutputSetting } from '@modules/tools/image';
export type * from '@src/interface';

export interface ITaskInfo {
  name: string
  md5: string
  exifInfo: ExifInfo
  bgImgSize: {
    w: number
    h: number
  },
  mainImgInfo: IImgFileInfo,
  option: OutputSetting,
}

export interface IFontInfo {
  path: string
  name: string
}

export interface IExifImgInfo {
  title?: IImgFileInfo
  info?: IImgFileInfo
}

export interface ITextImgOption {
  text: string
  color: string
  fontSize: number
  font: string
  background?: string
}

export type TExifInfo = Record<keyof ExifInfo, Omit<IFieldInfoItem, 'use'>>

export interface IBoxShadowMarkOption {
  img: HTMLImageElement
  contentImg: HTMLImageElement
  textImgList: IImgFileInfo[]
  shadow: {
    blur?: number
    offsetX?: number
    offsetY?: number
  }
  radius?: number
  option: OutputSetting
}

export interface ITextOption {
  size: number
  font: string
  color: string
  bold: boolean
  height?: number
  width?: number
  /**
   * 斜体
   */
  italic: boolean
}

export interface ITemplateItem {
  text: string
  opts: ITextOption
}

export interface ISlotInfo {
  value: string | HTMLImageElement
  param: IFieldInfoItem['param']
}

export interface ICreateTextOption {
  templateList: ITemplateItem[]
  templateFieldConf: TTemplateFieldInfo
}
