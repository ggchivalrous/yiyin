import path from 'node:path';
import { app } from 'electron';
// eslint-disable-next-line import/no-relative-packages
import { setLoggerConfig, closeAllLogger, Logger } from '../src/modules/logger';

import('../src/config').then(async ({ config }) => {
  setLoggerConfig({
    namespace: 'main',
    exportMode: process.env.URL ? 'CONSOLE_FILE' : 'FILE',
    path: process.env.URL ? path.join(config.cacheDir, './logs') : path.resolve(app.getPath('userData'), 'logs'),
    level: 'DEBUG',
  });

  const log = new Logger();
  log.info('当前配置信息: ', JSON.stringify(config, null, 2));
  app.addListener('quit', closeAllLogger)

  await import('./start');
});
