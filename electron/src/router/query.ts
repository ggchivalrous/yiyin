import { BrowserWindow, app } from 'electron';
import fs from 'node:fs';
import routerConfig from '../../router-config';
import { Router } from '../modules/router';
import { config } from '../config';

const r = new Router();

r.listen(routerConfig.getConfig, async () => config);

r.listen(routerConfig.setConfig, async (data) => {
  Object.assign(config.options, data);
  fs.writeFileSync(config.dir, JSON.stringify(config, null, 0));
});

r.listen(routerConfig.miniSize, async () => BrowserWindow.getFocusedWindow().minimize());

r.listen(routerConfig.closeApp, async () => app.quit());

export default r;
