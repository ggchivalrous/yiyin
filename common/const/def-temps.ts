import type { IPosition } from '@src/interface';

export interface ITemp {
  key: string
  name: string
  temp: string
  use: boolean
  type: 'system' | 'custom'
  height?: number
  font: {
    size: number
    color?: string
    font: string
    bold: boolean
    italic: boolean
  }
  position?: IPosition
}

export const defTemps: ITemp[] = [
  {
    key: 'make-model',
    name: 'Logo型号模版',
    temp: '{Make} {Model}',
    use: true,
    type: 'system',
    font: {
      size: 2.5,
      font: '',
      bold: true,
      italic: false,
    },
  },
  {
    key: 'exif-params',
    name: '参数模版 - 等效焦距',
    temp: '{FocalLengthIn35mmFormat}mm f/{FNumber} {ExposureTime}s ISO{ISO} {PersonalSign}',
    use: true,
    type: 'system',
    font: {
      size: 2,
      font: '',
      bold: true,
      italic: false,
    },
  },
  {
    key: 'exif-params-1',
    name: '参数模版 - 原始焦距',
    temp: '{FocalLength}mm f/{FNumber} {ExposureTime}s ISO{ISO} {PersonalSign}',
    use: false,
    type: 'system',
    font: {
      size: 2,
      font: '',
      bold: true,
      italic: false,
    },
  },
];

export function getDefTemp(d?: ITemp): ITemp {
  return {
    key: '',
    name: '',
    temp: '',
    use: false,
    type: 'custom',
    ...d,
    font: {
      size: 2,
      font: '',
      bold: false,
      italic: false,
      ...d?.font,
    },
    position: {
      left: null,
      right: null,
      top: null,
      bottom: null,
      ...d?.position,
    },
  };
}
