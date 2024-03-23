import type { Exif } from '@modules/exiftool/interface';
import type { IConfig as Config } from '@src/interface';

export * from '@src/interface';

export interface IFileInfo {
  path: string
  name: string
}

export interface IConfig extends Pick<
  Config,
  'options' | 'tempFields' | 'customTempFields' | 'staticDir' | 'temps'
> {
  output: string
  fontMap: Record<string, string>
  fontDir: string
}

export type TInputEvent = Event & {
  currentTarget: EventTarget & HTMLInputElement;
}

export interface ActiveImgInfo extends IFileInfo {
  exif: Exif
  progress: number
}
