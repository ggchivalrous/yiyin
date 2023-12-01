import path from 'node:path';

import { setLoggerConfig, closeAllLogger } from '@modules/logger';
import { app } from 'electron';

import('@src/config').then(async ({ config }) => {
  setLoggerConfig({
    namespace: 'main',
    exportMode: process.env.URL ? 'CONSOLE_FILE' : 'FILE',
    path: process.env.URL ? path.join(config.cacheDir, './logs') : path.resolve(app.getPath('userData'), 'logs'),
    level: process.env.URL ? 'DEBUG' : 'INFO',
  });

  app.addListener('quit', closeAllLogger);

  await import('./start');
});
