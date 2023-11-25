import { BrowserWindow, app } from 'electron';
import fs from 'node:fs';
import routerConfig from '../../router-config';
import { Router } from '../modules/router';
import { config, DefaultConfig } from '../config';
import { Image } from '../modules/tools/image';

const r = new Router();

r.listen(routerConfig.getConfig, async () => config);

r.listen(routerConfig.setConfig, async (data) => {
  Object.assign(config.options, data);
  fs.writeFileSync(config.dir, JSON.stringify(config, null, 0));
});

r.listen(routerConfig.getDefConfig, async () => DefaultConfig);

r.listen(routerConfig.miniSize, async () => BrowserWindow.getFocusedWindow().minimize());

r.listen(routerConfig.closeApp, async () => app.quit());

r.listen(routerConfig.getExitInfo, async (imgPath: string) => {
  const img = new Image(imgPath);
  const info = img.getOriginExifInfo();
  return info || false;
});

export default r;
