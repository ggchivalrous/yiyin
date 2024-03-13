import type { IImgFileInfo, OutputSetting } from '@modules/tools/image';
import type { IFieldInfoItem, IFontParam } from '@src/interface';

import { ITemp } from '@/common/const';

export type { IImgFileInfo, OutputSetting } from '@modules/tools/image';
export type * from '@src/interface';

export interface ITaskInfo {
  name: string
  md5: string
  exifInfo: Record<string, any>
  bgImgSize: {
    w: number
    h: number
  },
  mainImgInfo: IImgFileInfo,
  option: OutputSetting,
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

export type TFontParam = Omit<IFontParam, 'offset'>

export type TExifInfo = Record<string, Omit<IFieldInfoItem, 'use'>>

export interface IBoxShadowMarkOption {
  img: HTMLImageElement
  contentImg: HTMLImageElement
  textImgList: IImgFileInfo[]
  contentHeight: number
  contentTop: number
  shadow: {
    blur?: number
    offsetX?: number
    offsetY?: number
  }
  radius?: number
  option: OutputSetting
}

export interface ITextOption {
  height: ITemp['height']
  font: ITemp['font']
}

export interface ISlotInfo {
  value: string | HTMLImageElement
  font: IFieldInfoItem['font']
}
