export interface ITemp {
  key: string
  name: string
  temp: string
  opts: {
    size: number
    color?: string
    font: string
    bold: boolean
    italic: boolean
  }
}

export const defTemps: ITemp[] = [
  {
    key: 'make-model',
    name: 'Logo型号模版',
    temp: '{Make} {Model}',
    opts: {
      size: 2.5,
      font: 'PingFang SC',
      bold: true,
      italic: false,
    },
  },
  {
    key: 'exif-params',
    name: '参数模版 - 等效焦距',
    temp: '{FocalLengthIn35mmFormat} {FNumber} {ExposureTime} {ISO} {PersonalSign}',
    opts: {
      size: 2,
      font: 'PingFang SC',
      bold: true,
      italic: false,
    },
  },
  {
    key: 'exif-params-1',
    name: '参数模版 - 原始焦距',
    temp: '{FocalLength} {FNumber} {ExposureTime} {ISO} {PersonalSign}',
    opts: {
      size: 2,
      font: 'PingFang SC',
      bold: true,
      italic: false,
    },
  },
];
