import type { ExifInfo, IImgFileInfo, OutputSetting } from '@modules/tools/image';

export type { ExifInfo, IImgFileInfo, OutputSetting } from '@modules/tools/image';
export type * from '@src/interface';

export interface ITaskInfo {
  name: string
  md5: string
  exifInfo: ExifInfo
  blur: IImgFileInfo,
  scale: IImgFileInfo,
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

export interface IBoxShadowMarkOption {
  img: HTMLImageElement
  contentImg: HTMLImageElement
  textImgInfo: IExifImgInfo
  shadow: {
    blur?: number
    offsetX?: number
    offsetY?: number
  }
  radius?: number
  option: OutputSetting
}
