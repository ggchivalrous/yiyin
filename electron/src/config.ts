import fs from 'node:fs';
import path from 'node:path';

import type { IFieldInfoItem, IConfig } from '@src/interface';
import { app } from 'electron';

import { tryCatch } from './utils';

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
    ext_show: true,
    model_show: true,
    brand_show: true,
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

  templateFieldInfo: {
    Force: getDefOptionItem(''),
    Make: getDefOptionItem(''),
    Model: getDefOptionItem(''),
    ExposureTime: getDefOptionItem(''),
    FNumber: getDefOptionItem(''),
    ISO: getDefOptionItem(''),
    FocalLength: getDefOptionItem(''),
    ExposureProgram: getDefOptionItem(''),
    DateTimeOriginal: getDefOptionItem(0),
    LensModel: getDefOptionItem(''),
    LensMake: getDefOptionItem(''),
    PersonalSign: getDefOptionItem(''),
  },
};

function getDefOptionItem<T>(defV: T): IFieldInfoItem<T> {
  return {
    use: false,
    value: defV,
    type: 'text',
    bImg: '',
    wImg: '',
    param: undefined,
  };
}

function getDefConf(): IConfig {
  return JSON.parse(JSON.stringify(DefaultConfig));
}

export function getConfig(def = false) {
  const config: IConfig = getDefConf();

  if (!def && fs.existsSync(config.dir)) {
    const content = fs.readFileSync(config.dir);
    const fileConfig = tryCatch(() => JSON.parse(content.toString()), {});
    Object.assign(config, {
      output: fileConfig.output || config.output,
      cacheDir: fileConfig.cacheDir || config.cacheDir,
      options: Object.assign(config.options, fileConfig.options),
      templateFieldInfo: Object.assign(config.templateFieldInfo, fileConfig.templateFieldInfo),
    } as Partial<IConfig>);
  }

  if (import.meta.env.DEV) {
    config.cacheDir = path.join(config.output, '.catch');
  }

  if (!fs.existsSync(config.output)) {
    fs.mkdirSync(config.output, { recursive: true });
  }

  if (!fs.existsSync(config.cacheDir)) {
    fs.mkdirSync(config.cacheDir, { recursive: true });
  }

  if (!fs.existsSync(config.output)) {
    fs.mkdirSync(config.output, { recursive: true });
  }

  if (!fs.existsSync(config.staticDir)) {
    fs.mkdirSync(config.staticDir, { recursive: true });
  }

  if (!fs.existsSync(config.font.dir)) {
    fs.mkdirSync(config.font.dir, { recursive: true });
  }

  if (fs.existsSync(config.font.path)) {
    const content = fs.readFileSync(config.font.path);
    const fontMap = tryCatch(() => JSON.parse(content.toString()), {});
    config.font.map = fontMap;
  }

  return config;
}

export function storeConfig(conf: Partial<IConfig>) {
  Object.assign(config, conf);
  fs.writeFileSync(config.dir, JSON.stringify(config, null, 2));
}

export const config = getConfig();
