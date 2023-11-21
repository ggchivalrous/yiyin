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

function getConfig() {
  const config:IConfig = {
    dir: path.join(app.getPath('userData'), 'config.json'),
    output: path.join(app.getPath('pictures'), 'watermark'),
    cacheDir: path.join(app.getPath('temp'), 'yiyin'),

    options: {
      landscape: false,
      ext_show: true,
      model_show: true,
      brand_show: true,
      white_bg: false,
      origin_wh_output: true,
      bg_rate: {
        w: 0,
        h: 0,
      },
    },
  };

  if (process.env.URL) {
    config.cacheDir = path.join(config.output, '.catch');

    if (!fs.existsSync(config.cacheDir)) {
      fs.mkdirSync(config.cacheDir, { recursive: true });
    }
  }

  if (fs.existsSync(config.dir)) {
    const content = fs.readFileSync(config.dir);
    Object.assign(config, tryCatch(() => JSON.parse(content.toString()), {}));
  }

  return config;
}

export const config = getConfig();
