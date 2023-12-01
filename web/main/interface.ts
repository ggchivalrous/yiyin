import type { IConfig as Config } from '@src/interface';

export interface IFileInfo {
  path: string
  name: string
}

export interface IConfig {
  init: boolean
  options: Config['options']
  output: string
}

export type TInputEvent = Event & {
  currentTarget: EventTarget & HTMLInputElement;
}
