import { dialog, shell } from 'electron';
import fs from 'node:fs';
import routerConfig from '../../router-config';
import { Router } from '../modules/router';
import { config } from '../config';

const r = new Router();

r.listen(routerConfig.open.dir, async (data) => shell.openPath(data));

r.listen(routerConfig.open.selectPath, async (data, event, win) => {
  const res = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
  });

  if (!res.canceled && res.filePaths.length > 0) {
    Object.assign(config, data || {});
    config.output = res.filePaths[0];
    fs.writeFileSync(config.dir, JSON.stringify(config, null, 0));
    return config;
  }

  return false;
});

export default r;
