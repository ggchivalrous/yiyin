import fs from 'node:fs';
import path from 'node:path';

import { config } from '@config';
import { Router } from '@modules/router';
import routerConfig from '@root/router-config';
import { dialog, shell } from 'electron';

const r = new Router();

r.listen(routerConfig.open.dir, async (data) => shell.openPath(data));

r.listen(routerConfig.open.selectPath, async (data, event, win) => {
  const res = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
  });

  if (!res.canceled && res.filePaths.length > 0) {
    config.output = res.filePaths[0];

    if (process.env.URL) {
      config.cacheDir = path.join(config.output, '.catch');

      if (!fs.existsSync(config.cacheDir)) {
        fs.mkdirSync(config.cacheDir, { recursive: true });
      }
    }

    fs.writeFileSync(config.dir, JSON.stringify(config, null, 0));
    return config;
  }

  return false;
});

export default r;
