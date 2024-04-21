import type { ITemp } from '@common/const/def-temps';
import type { Exif } from '@modules/exiftool/interface';
import type { IConfig, IFieldInfoItem } from '@src/interface';

export interface TextToolOption extends Pick<IConfig, 'options' | 'temps'> {
  exif: Exif
  bgHeight: number
  logoPath: string
  fields: IFieldInfoItem[]
}

export interface IFont {
  bold: boolean
  italic: boolean
  size: number
  font: string
  caseType: 'lowcase' | 'upcase' | 'default'
  color: string
}

export interface IFontParam extends Partial<IFont> {
  use?: boolean
}

export interface IImgFileInfo {
  data: string
  w?: number
  h?: number
}

export interface ISlotInfo {
  value: string | HTMLImageElement
  font: IFieldInfoItem['font']
}

export interface ITextOption extends Pick<ITemp, 'height' | 'font' | 'verticalAlign'> {
  bgHeight: number
}

export interface TextInfo {
  color: string
  font: string
  value: string | HTMLImageElement
  type: 'text' | 'img'
  w: number
  x: number
  y: number
  h: number
}

export type TFontParam = Omit<IFontParam, 'offset'>
