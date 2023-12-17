import type { IConfig as Config } from '@src/interface';

export * from '@src/interface';

export interface IFileInfo {
  path: string
  name: string
}

export interface IConfig {
  options: Config['options']
  output: string
  fontMap: Record<string, string>
  fontDir: string
  templateFieldInfo: Config['templateFieldInfo']
  staticDir: Config['staticDir']
}

export type TInputEvent = Event & {
  currentTarget: EventTarget & HTMLInputElement;
}
