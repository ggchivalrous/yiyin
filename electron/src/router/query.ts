import fs from 'node:fs';
import path from 'node:path';

import { config, getConfig, storeConfig } from '@config';
import { Router } from '@modules/router';
import { Image } from '@modules/tools/image';
import routerConfig from '@root/router-config';
import { md5 } from '@utils';
import { BrowserWindow, app } from 'electron';

import { webDir } from '@/electron/main/create-window';

const r = new Router();

r.listen(routerConfig.getConfig, async () => config);

r.listen(routerConfig.setConfig, async (data: any) => {
  storeConfig({
    options: Object.assign(config.options, data.options),
    templateFieldInfo: Object.assign(config.templateFieldInfo, data.templateFieldInfo),
  });
  return config;
});

r.listen(routerConfig.resetConfig, async () => {
  storeConfig(getConfig(true));
  return config;
});

r.listen(routerConfig.miniSize, async () => BrowserWindow.getFocusedWindow().minimize());

r.listen(routerConfig.closeApp, async () => app.quit());

r.listen(routerConfig.getExitInfo, async (imgPath: string) => {
  const img = new Image(imgPath, '');
  const info = img.getOriginExifInfo();
  return info || false;
});

r.listen(routerConfig.getFontList, async () => config.font.map);

r.listen(routerConfig.addFont, async (data: any) => {
  if (!data.path || !data.name) return 0;
  if (config.font.map[data.name]) return 1;
  if (!fs.existsSync(data.path)) return 2;

  // 将文件添加至目录
  const fileName = md5(data.path);
  const targetPath = path.resolve(config.font.dir, fileName);
  fs.copyFileSync(data.path, targetPath);

  // 添加记录
  config.font.map[data.name] = fileName;

  // 写入文件
  fs.writeFileSync(config.font.path, JSON.stringify(config.font.map));
  return 3;
});

r.listen(routerConfig.delFont, async (name: string) => {
  if (config.font.map[name]) {
    const filePath = path.resolve(config.font.path, config.font.map[name]);
    if (fs.existsSync(filePath)) {
      // 删除文件
      fs.rmSync(filePath);
    }

    // 移除记录
    delete config.font.map[name];
    // 写入文件
    fs.writeFileSync(config.font.path, JSON.stringify(config.font.map));
    return true;
  }

  return false;
});

r.listen(routerConfig.uploadExifImg, async (data: any) => {
  if (data && data.path) {
    const pathInfo = path.parse(data.path);
    const filePath = path.resolve(config.staticDir, `${data.name}.${pathInfo.ext}`);
    fs.copyFileSync(data.path, filePath);
    return filePath;
  }

  return false;
});

r.listen(routerConfig.staticInfo, async () => ({
  webDir,
}));

export default r;
