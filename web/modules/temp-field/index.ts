import type { IFieldInfoItem } from '@src/interface';
import { Exif } from '@web/modules/exif';
import { config, pathInfo } from '@web/store/config';
import { loadImage } from '@web/util/util';
import { get } from 'svelte/store';

import type { ITemp } from '@/common/const/def-temps';

interface IGetTempFieldsConfOpts {
  bgHeight: number
}

/**
 * 获取模版参数信息配置
 * @param exifInfo - 读取到的相机信息
 */
export async function getTempFieldsConf(exifInfo: Record<string, any>, opts: IGetTempFieldsConfOpts) {
  const tempFields = get(config).tempFields;
  const customTempFields = get(config).customTempFields;
  const tempFieldRecord: Record<string, IFieldInfoItem> = {};
  const fileds = [...customTempFields, ...tempFields];

  for (const filed of fileds) {
    tempFieldRecord[filed.key] = {
      ...filed,
      font: filed.font && {
        ...filed.font,
        size: filed.font.size ? Math.round(opts.bgHeight * (filed.font.size / 100)) : 0,
      },
    };
  }

  return fillTempFieldInfo(tempFieldRecord, exifInfo);
}

interface IGetTempsConfOpts {
  bgHeight: number
  color: string
}

export function getTempsConf(opts?: IGetTempsConfOpts): ITemp[] {
  const conf = get(config);
  const temps = conf.temps;

  return temps.map((temp) => ({
    ...temp,
    font: {
      ...temp.font,
      font: temp.font.font || conf.options.font,
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
async function fillTempFieldInfo(tempFieldConf: Record<string, IFieldInfoItem>, exifInfo?: Record<string, any>) {
  const exif = new Exif(exifInfo || {});
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
        const wImg = `file://${get(pathInfo).logo}/${exif.oriExif.Make.toLowerCase()}-w.svg`;
        const bImg = `file://${get(pathInfo).logo}/${exif.oriExif.Make.toLowerCase()}-b.svg`;

        if (await loadImage(wImg).catch(() => null)) {
          tempFieldInfo[field].wImg = wImg;
          tempFieldInfo[field].type = 'img';
        }

        if (await loadImage(bImg).catch(() => null)) {
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
