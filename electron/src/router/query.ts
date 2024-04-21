import fs from 'node:fs';
import path from 'node:path';

import { config, getConfig, storeConfig } from '@config';
import { Router } from '@modules/router';
import routerConfig from '@root/router-config';
import paths from '@src/path';
import { md5 } from '@utils';
import { BrowserWindow, app } from 'electron';

const r = new Router();

r.listen(routerConfig.getConfig, async () => config);

r.listen(routerConfig.setConfig, async (data: any) => {
  storeConfig({
    options: Object.assign(config.options, data.options),
    tempFields: data.tempFields,
    customTempFields: data.customTempFields,
    temps: data.temps,
  });
  return config;
});

r.listen(routerConfig.resetConfig, async () => {
  storeConfig(getConfig(true));
  return config;
});

r.listen(routerConfig.miniSize, async () => BrowserWindow.getFocusedWindow()?.minimize?.());

r.listen(routerConfig.closeApp, async () => app.quit());

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

r.listen(routerConfig.pathInfo, async () => ({
  ...paths,
}));

r.listen(routerConfig.logoList, async () => {
  if (fs.existsSync(paths.logo)) {
    const logoList = fs.readdirSync(paths.logo);
    return logoList
      .filter((i) => !i.startsWith('.'))
      .map((i) => path.join(paths.logo, i));
  }

  return [];
});

r.listen(routerConfig.pathJoin, async (data: string[]) => path.join(...data));

export default r;
