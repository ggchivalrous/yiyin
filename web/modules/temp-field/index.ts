import { ExifFormat } from '@common/modules/exif-format';
import type { IFieldInfoItem } from '@src/interface';
import { loadImage } from '@web/util/util';

import type { ITemp } from '@/common/const/def-temps';

interface GetFieldTempInfoOpt {
  bgHeight: number
  fields: IFieldInfoItem[]
  logoPath: string
}

/**
 * 获取模版参数信息配置
 * @param exifInfo - 读取到的相机信息
 */
export async function getFieldTempInfo(exifInfo: Record<string, any>, opt: GetFieldTempInfoOpt) {
  const tempFieldRecord: Record<string, IFieldInfoItem> = {};
  const fileds = opt.fields;

  for (const filed of fileds) {
    tempFieldRecord[filed.key] = {
      ...filed,
      font: filed.font && {
        ...filed.font,
        size: filed.font.size ? Math.round(opt.bgHeight * (filed.font.size / 100)) : 0,
      },
    };
  }

  return fillTempFieldInfo(tempFieldRecord, opt.logoPath, exifInfo);
}

interface IGetTempsConfOpts {
  bgHeight: number
  color: string
  defFont: string
}

export function getTextTempList(temps: ITemp[], opts?: IGetTempsConfOpts): ITemp[] {
  return temps.map((temp) => ({
    ...temp,
    font: {
      ...temp.font,
      font: temp.font.font || opts.defFont,
      color: temp.font.color || opts.color,
      size: opts.bgHeight * (temp.font.size / 100),
    },
  })).filter((i) => i.use);
}

/**
 * 模版 Field 对象信息填充
 * @param tempFieldConf
 * @param exifInfo - 规范化的相机信息对象
 * @returns
 */
async function fillTempFieldInfo(
  tempFieldConf: Record<string, IFieldInfoItem>,
  logoPath: string,
  exifInfo?: Record<string, any>,
) {
  const exif = new ExifFormat(exifInfo || {});
  const tempFieldInfo: Record<string, IFieldInfoItem> = {};

  for (const field in tempFieldConf) {
    const info = tempFieldConf[field];

    if (!tempFieldInfo[field]) {
      const _k = field as keyof typeof exif._;
      const _info: IFieldInfoItem = {
        ...info,
        value: exif._[_k]?.() || '',
      };
      tempFieldInfo[field] = JSON.parse(JSON.stringify(_info));

      if (field === 'Make') {
        const wImg = `file://${logoPath}/${exif.oriExif.Make.toLowerCase()}-w.svg`;
        const bImg = `file://${logoPath}/${exif.oriExif.Make.toLowerCase()}-b.svg`;

        if (await loadImage(wImg)) {
          tempFieldInfo[field].wImg = wImg;
          tempFieldInfo[field].type = 'img';
        }

        if (await loadImage(bImg)) {
          tempFieldInfo[field].bImg = bImg;
          tempFieldInfo[field].type = 'img';
        }
      }
    }

    // 强制使用则看该配置是否启动 || 非强制使用则看是否有原始相机信息
    if (info.use && (info.forceUse || !tempFieldInfo[field].value)) {
      tempFieldInfo[field].type = info.type || 'text';
      tempFieldInfo[field].value = `${info.value || ''}`;
      tempFieldInfo[field].bImg = `${info.bImg || ''}`;
      tempFieldInfo[field].wImg = `${info.wImg || ''}`;
      tempFieldInfo[field].font = info.font || tempFieldInfo[field].font;
    }
  }

  return tempFieldInfo;
}
