import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { tryCatch } from './utils';
import { OutputSetting } from './modules/tools/image';

interface IConfig {
  /**
   * 配置文件存放路径
   */
  dir: string

  /**
   * 图片输出路径
   */
  output: string

  /**
   * 缓存存放目录
   */
  cacheDir: string

  options: OutputSetting
}

export const DefaultConfig: IConfig = {
  dir: path.join(app.getPath('userData'), 'config.json'),
  output: path.join(app.getPath('pictures'), 'watermark'),
  cacheDir: path.join(app.getPath('temp'), 'yiyin'),

  options: {
    landscape: false,
    ext_show: true,
    model_show: true,
    brand_show: true,
    solid_bg: false,
    origin_wh_output: true,
    radius: 2.1,
    shadow: 6,
    bg_rate: {
      w: 0,
      h: 0,
    },
  },
};

function getConfig() {
  const config:IConfig = JSON.parse(JSON.stringify(DefaultConfig));

  if (fs.existsSync(config.dir)) {
    const content = fs.readFileSync(config.dir);
    Object.assign(config, tryCatch(() => JSON.parse(content.toString()), {}));
  }

  if (process.env.URL) {
    config.cacheDir = path.join(config.output, '.catch');

    if (!fs.existsSync(config.cacheDir)) {
      fs.mkdirSync(config.cacheDir, { recursive: true });
    }
  }

  return config;
}

export const config = getConfig();
