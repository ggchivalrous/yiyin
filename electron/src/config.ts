import fs from 'node:fs';
import path from 'node:path';

import type { IFieldInfoItem, IConfig } from '@src/interface';

import { userDataPath, getPath } from './path';

import { exifFields, defTemps, getDefTemp } from '@/common/const';
import { arrToObj, normalize, tryCatch } from '@/common/utils';

const needResetVer = ['1.5.0'];

export const DefaultConfig: IConfig = {
  version: import.meta.env.VITE_VERSION,
  dir: path.join(userDataPath, 'config.json'),
  output: path.join(getPath('pictures'), 'watermark'),
  cacheDir: path.join(getPath('temp'), 'yiyin'),
  staticDir: path.join(userDataPath, 'static'),

  font: {
    path: path.join(userDataPath, 'font.json'),
    dir: path.join(userDataPath, 'font'),
    map: {},
  },

  options: {
    iot: false,
    landscape: false,
    solid_bg: false,
    solid_color: '#fff',
    origin_wh_output: false,
    radius: 2.1,
    radius_show: true,
    shadow: 6,
    shadow_show: true,
    bg_rate_show: false,
    bg_rate: {
      w: 0,
      h: 0,
    },
    font: 'PingFang SC',
    main_img_w_rate: 90,
    text_margin: 0.4,
    quality: 100,
    mini_top_bottom_margin: 0,
  },

  tempFields: [getDefOptionItem('')],

  customTempFields: [getDefOptionItem('')],

  temps: [getDefTemp()],

  versionUpdateInfo: {
    version: import.meta.env.VITE_VERSION,
    downloadLink: '',
    checkDate: 0,
  },
};

export const config = getConfig();

function getDefOptionItem<T>(defV?: T, key = '', name = ''): IFieldInfoItem<T> {
  return {
    key,
    name,
    show: true,
    forceUse: false,
    use: false,
    value: defV,
    type: 'text',
    bImg: '',
    wImg: '',
    font: {
      use: false,
      bold: false,
      italic: false,
      size: 0,
      font: '',
      caseType: 'default',
      color: '',
    },
  };
}

function getConfModel(): IConfig {
  return JSON.parse(JSON.stringify(DefaultConfig));
}

function getDefConf(): IConfig {
  const conf = getConfModel();
  conf.tempFields = exifFields.map((i) => getDefOptionItem(i.value, i.key, i.name));
  conf.temps = defTemps.map((i) => getDefTemp(i));
  conf.customTempFields = [];
  return conf;
}

function normalizeConf(conf: IConfig) {
  const confModel = getConfModel();
  const _conf = normalize(conf, confModel);
  return _conf;
}

export function getConfig(def = false) {
  const _config: IConfig = getDefConf();

  if (!def && fs.existsSync(_config.dir)) {
    const content = fs.readFileSync(_config.dir);
    const fileConfig = tryCatch<Partial<IConfig>>(() => JSON.parse(content.toString()), {});

    if (
      !fileConfig?.version
      // 升版本时重置配置信息
      || (needResetVer.includes(_config.version) && fileConfig.version < _config.version)
    ) {
      console.log('重置配置信息');
    } else {
      Object.assign(_config, {
        output: fileConfig.output || _config.output,
        options: Object.assign(_config.options, fileConfig.options),
        versionUpdateInfo: Object.assign(_config.versionUpdateInfo, fileConfig.versionUpdateInfo),
        tempFields: fileConfig.tempFields || _config.tempFields,
        customTempFields: fileConfig.customTempFields || _config.customTempFields,
        temps: fileConfig.temps || _config.temps,
      } as Partial<IConfig>);
    }

    // 默认的内容需要单独处理
    const tempFieldObj = arrToObj(_config.tempFields, 'key');
    for (const exifField of exifFields) {
      if (!tempFieldObj[exifField.key]) {
        _config.tempFields.push(getDefOptionItem(exifField.value, exifField.key, exifField.name));
      }
    }

    const tempObj = arrToObj(_config.temps, 'key');
    for (const temp of defTemps) {
      if (!tempObj[temp.key]) {
        _config.temps.push(getDefTemp(temp));
      }
    }

    Object.assign(_config, normalizeConf(_config));
  }

  if (import.meta.env.DEV) {
    _config.cacheDir = path.join(_config.output, '.catch');
  }

  if (!fs.existsSync(_config.output)) {
    tryCatch(() => fs.mkdirSync(_config.output, { recursive: true }), null, () => {
      _config.output = DefaultConfig.output;
      _config.cacheDir = path.join(_config.output, '.catch');
      fs.mkdirSync(_config.output, { recursive: true });
    });
  }

  if (!fs.existsSync(_config.cacheDir)) {
    fs.mkdirSync(_config.cacheDir, { recursive: true });
  }

  if (!fs.existsSync(_config.staticDir)) {
    fs.mkdirSync(_config.staticDir, { recursive: true });
  }

  if (!fs.existsSync(_config.font.dir)) {
    fs.mkdirSync(_config.font.dir, { recursive: true });
  }

  if (fs.existsSync(_config.font.path)) {
    const content = fs.readFileSync(_config.font.path);
    const fontMap = tryCatch(() => JSON.parse(content.toString()), {});
    _config.font.map = fontMap;
  }

  return _config;
}

export function storeConfig(conf: Partial<IConfig>) {
  Object.assign(config, normalizeConf(Object.assign(config, conf)));
  fs.writeFileSync(config.dir, JSON.stringify(config, null, 2));
}
