import type { IFont, IPosition } from '@src/interface';

export interface ITemp {
  key: string
  name: string
  temp: string
  use: boolean
  type: 'system' | 'custom'
  height?: number
  font: IFont
  position?: IPosition
  verticalAlign: 'center' | 'baseline'
}

export const defTemps: ITemp[] = [
  {
    key: 'make-model',
    name: 'Logo型号模版',
    temp: '{Make} {Model}',
    use: true,
    type: 'system',
    verticalAlign: 'baseline',
    font: {
      size: 3,
      font: '',
      bold: true,
      italic: false,
      color: '',
      caseType: 'default',
    },
  },
  {
    key: 'exif-params',
    name: '参数模版 - 等效焦距',
    temp: '{FocalLengthIn35mmFormat}mm f/{FNumber} {ExposureTime}s ISO{ISO}',
    use: true,
    type: 'system',
    verticalAlign: 'baseline',
    font: {
      size: 2.2,
      font: '',
      bold: true,
      italic: false,
      color: '',
      caseType: 'default',
    },
  },
  {
    key: 'exif-params-1',
    name: '参数模版 - 原始焦距',
    temp: '{FocalLength}mm f/{FNumber} {ExposureTime}s ISO{ISO}',
    use: false,
    type: 'system',
    verticalAlign: 'baseline',
    font: {
      size: 2.2,
      font: '',
      bold: true,
      italic: false,
      color: '',
      caseType: 'default',
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
    verticalAlign: 'baseline',
    ...d,
    font: {
      size: 2.2,
      font: '',
      bold: false,
      italic: false,
      color: '',
      caseType: 'default',
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
