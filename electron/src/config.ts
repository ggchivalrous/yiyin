import fs from 'node:fs';
import path from 'node:path';

import type { IFieldInfoItem, IConfig } from '@src/interface';
import { app } from 'electron';

import { exifFields } from '@/common/const';
import { defTemps, type ITemp } from '@/common/const/def-temps';
import { arrToObj, normalize, tryCatch } from '@/common/utils';

export const DefaultConfig: IConfig = {
  dir: path.join(app.getPath('userData'), 'config.json'),
  output: path.join(app.getPath('pictures'), 'watermark'),
  cacheDir: path.join(app.getPath('temp'), 'yiyin'),
  staticDir: path.join(app.getPath('userData'), 'static'),

  font: {
    path: path.join(app.getPath('userData'), 'font.json'),
    dir: path.join(app.getPath('userData'), 'font'),
    map: {},
  },

  options: {
    landscape: false,
    solid_bg: false,
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
  },

  tempFields: [getDefOptionItem('')],

  customTempFields: [getDefOptionItem('')],

  temps: [getDefTemps()],

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
    param: {
      use: false,
      bold: false,
      italic: false,
      size: 0,
      font: '',
      offset: {
        top: null,
        bottom: null,
        left: null,
        right: null,
      },
    },
  };
}

function getDefTemps(d?: ITemp): ITemp {
  return {
    key: '',
    name: '',
    temp: '',
    ...d,
    opts: {
      size: 0,
      font: '',
      bold: false,
      italic: false,
      ...d?.opts,
    },
  };
}

function getConfModel(): IConfig {
  return JSON.parse(JSON.stringify(DefaultConfig));
}

function getDefConf(): IConfig {
  const conf = getConfModel();
  conf.tempFields = exifFields.map((i) => getDefOptionItem(i.value, i.key, i.name));
  conf.temps = defTemps.map((i) => getDefTemps(i));
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
    Object.assign(_config, {
      output: fileConfig.output || _config.output,
      cacheDir: fileConfig.cacheDir || _config.cacheDir,
      options: Object.assign(_config.options, fileConfig.options),
      versionUpdateInfo: Object.assign(_config.versionUpdateInfo, fileConfig.versionUpdateInfo),
      tempFields: fileConfig.tempFields,
      customTempFields: fileConfig.customTempFields,
      temps: fileConfig.temps,
    } as Partial<IConfig>);

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
        _config.temps.push(getDefTemps(temp));
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
