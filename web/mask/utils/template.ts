import { config } from '@web/store/config';
import { loadImage } from '@web/util/util';
import modelMap from '@web-utils/model-map';
import { get } from 'svelte/store';

import type { ExifInfo, TExifInfo, TTemplateFieldInfo } from '../interface';

const cameraParamFields = ['ExposureTime', 'FNumber', 'FocalLength', 'ISO'];

interface IGetTemplateFieldInfoConfOption {
  bgHeight: number
}

/**
 * 获取模版参数信息配置
 * @param exifInfo - 读取到的相机信息
 */
export async function getTemplateFieldsConf(exifInfo: ExifInfo, opts: IGetTemplateFieldInfoConfOption) {
  const configTemplateFields = getConfigTemplateFields(opts);
  return fillTemplateFieldInfo(configTemplateFields, await formatExifInfo(exifInfo));
}

/**
 * 获取配置中的模板字段配置信息
 */
export function getConfigTemplateFields(opts: IGetTemplateFieldInfoConfOption) {
  const fieldInfo = get(config).templateFieldInfo;
  const templateFieldInfo: TTemplateFieldInfo = {};

  for (const field in fieldInfo) {
    const info = fieldInfo[field];
    templateFieldInfo[field] = {
      ...info,
      param: info.param && {
        ...info.param,
        size: info.param.size ? Math.round(opts.bgHeight * (info.param.size / 100)) : 0,
      },
    };
  }

  return templateFieldInfo;
}

/**
 * 规范化相机参数，将相机信息转成模板 Field 对象
 * @param exifInfo 读取到的相机信息
 */
export async function formatExifInfo(exifInfo: ExifInfo) {
  const exif: TExifInfo = {
    Make: { type: 'text', value: '', bImg: '', wImg: '', param: null },
    Model: { type: 'text', value: '', bImg: '', wImg: '', param: null },
    DateTimeOriginal: { type: 'text', value: '', bImg: '', wImg: '', param: null },
    ExposureTime: { type: 'text', value: '', bImg: '', wImg: '', param: null },
    FNumber: { type: 'text', value: '', bImg: '', wImg: '', param: null },
    FocalLength: { type: 'text', value: '', bImg: '', wImg: '', param: null },
    ISO: { type: 'text', value: '', bImg: '', wImg: '', param: null },
    ExposureProgram: { type: 'text', value: '', bImg: '', wImg: '', param: null },
    LensModel: { type: 'text', value: '', bImg: '', wImg: '', param: null },
    LensMake: { type: 'text', value: '', bImg: '', wImg: '', param: null },
  };

  if (exifInfo.Make) {
    exif.Make.value = modelMap.INIT.make_filter(exifInfo.Make).trim();
    const _modelMap = Object.assign(modelMap.DEF, modelMap[exif.Make.value]);

    if (exifInfo.Model) {
      exif.Model.value = _modelMap.model_filter(exifInfo.Model.replace(exif.Make.value, ''))?.trim() || '';
    }

    if (exifInfo.Make) {
      const whiteLogoImgName = `/logo/${exif.Make.value.toLowerCase()}-w.svg`;
      const blackLogoImgName = `/logo/${exif.Make.value.toLowerCase()}-b.svg`;

      if (await loadImage(whiteLogoImgName).catch(() => null)) {
        exif.Make.wImg = whiteLogoImgName;
        exif.Make.type = 'img';
      }

      if (await loadImage(blackLogoImgName).catch(() => null)) {
        exif.Make.bImg = blackLogoImgName;
        exif.Make.type = 'img';
      }

      exif.Make.value = _modelMap.make_filter(exif.Make.value)?.trim() || '';
    }
  }

  if (exifInfo.FocalLength) {
    exif.FocalLength.value = `${Math.round(exifInfo.FocalLength)}mm`;
  }

  if (exifInfo.FNumber) {
    exif.FNumber.value = `f/${exifInfo.FNumber}`;
  }

  if (exifInfo.ExposureTime) {
    if (exifInfo.ExposureTime < 1) {
      exif.ExposureTime.value = `1/${Math.round(1 / exifInfo.ExposureTime)}s`;
    } else {
      exif.ExposureTime.value = `${exifInfo.ExposureTime}s`;
    }
  }

  if (exifInfo.ISO) {
    exif.ISO.value = `ISO${exifInfo.ISO}`;
  }

  return exif;
}

/**
 * 模版 Field 对象信息填充
 * @param templateFieldConf
 * @param exifInfo - 规范化的相机信息对象
 * @returns
 */
export function fillTemplateFieldInfo(templateFieldConf: TTemplateFieldInfo, exifInfo?: TTemplateFieldInfo) {
  exifInfo = exifInfo || {};

  for (const field in templateFieldConf) {
    const info = templateFieldConf[field];
    if (!exifInfo[field]) {
      exifInfo[field] = {
        use: info.use,
        type: 'text',
        value: '',
        bImg: '',
        wImg: '',
        param: {
          use: false,
          bold: false,
          italic: false,
          size: 0,
          font: '',
        },
      };
    }

    const _config = get(config);
    // TODO: 后续废弃，后续只需要是否使用某条模版即可
    // 不显示型号
    if (field === 'Model' && !_config.options.model_show) {
      exifInfo[field].value = '';
      continue;
    }

    // 不显示厂商
    if (field === 'Make' && !_config.options.brand_show) {
      exifInfo[field].value = '';
      continue;
    }

    // 不显示参数
    if (cameraParamFields.includes(field) && !_config.options.ext_show) {
      exifInfo[field].value = '';
      continue;
    }

    // 强制使用则看该配置是否启动 || 非强制使用则看是否有原始相机信息
    if ((templateFieldConf?.Force?.use && info.use) || (info.use && !exifInfo[field].value)) {
      exifInfo[field].type = info.type;
      exifInfo[field].value = `${info.value}`;
      exifInfo[field].bImg = `${info.bImg}`;
      exifInfo[field].wImg = `${info.wImg}`;
      exifInfo[field].param = info.param || exifInfo[field].param;
    }
  }

  return exifInfo;
}
