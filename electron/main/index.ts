import path from 'node:path';

import { setLoggerConfig, closeAllLogger } from '@modules/logger';
import { app } from 'electron';

import('@src/config').then(async ({ config }) => {
  // eslint-disable-next-line no-console
  if (import.meta.env.DEV) console.log(import.meta.env);

  setLoggerConfig({
    namespace: 'main',
    exportMode: import.meta.env.DEV ? 'CONSOLE_FILE' : 'FILE',
    path: import.meta.env.DEV ? path.join(config.cacheDir, './logs') : path.resolve(app.getPath('userData'), 'logs'),
    level: import.meta.env.DEV ? 'DEBUG' : 'INFO',
  });

  app.addListener('quit', closeAllLogger);

  await import('./start');
});
