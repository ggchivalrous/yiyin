import type { ExifInfo } from '@modules/tools/image';
import type { IFieldInfoItem } from '@src/interface';
import { Exif } from '@web/modules/exif';
import { config, pathInfo } from '@web/store/config';
import { get } from 'svelte/store';

interface IGetTempFieldsConfOpts {
  bgHeight: number
}

/**
 * 获取模版参数信息配置
 * @param exifInfo - 读取到的相机信息
 */
export async function getTempFieldsConf(exifInfo: ExifInfo, opts: IGetTempFieldsConfOpts) {
  const tempFields = get(config).tempFields;
  const tempFieldRecord: Record<string, IFieldInfoItem> = {};

  for (const filed of tempFields) {
    tempFieldRecord[filed.key] = {
      ...filed,
      param: filed.param && {
        ...filed.param,
        size: filed.param.size ? Math.round(opts.bgHeight * (filed.param.size / 100)) : 0,
      },
    };
  }

  return fillTempFieldInfo(tempFieldRecord, exifInfo);
}

/**
 * 模版 Field 对象信息填充
 * @param tempFieldConf
 * @param exifInfo - 规范化的相机信息对象
 * @returns
 */
function fillTempFieldInfo(tempFieldConf: Record<string, IFieldInfoItem>, exifInfo?: Record<string, any>) {
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
        tempFieldInfo[field].wImg = `file://${get(pathInfo).logo}/${_info.value.toLowerCase()}-w.svg`;
        tempFieldInfo[field].bImg = `file://${get(pathInfo).logo}/${_info.value.toLowerCase()}-b.svg`;
      }
    }

    // 强制使用则看该配置是否启动 || 非强制使用则看是否有原始相机信息
    if (info.use && (info.forceUse || !exifInfo[field].value)) {
      exifInfo[field].type = info.type;
      exifInfo[field].value = `${info.value}`;
      exifInfo[field].bImg = `${info.bImg}`;
      exifInfo[field].wImg = `${info.wImg}`;
      exifInfo[field].param = info.param || exifInfo[field].param;
    }
  }

  return tempFieldInfo;
}
