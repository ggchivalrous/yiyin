/* eslint-disable no-console */
import path from 'node:path';

import { setLoggerConfig, closeAllLogger } from '@modules/logger';
import paths from '@src/path';
import { app } from 'electron';

const isDev = import.meta.env.DEV;

import('@src/config').then(async ({ config }) => {
  if (isDev) {
    paths.logger = path.join(config.cacheDir, './logs');
    console.log('Env', import.meta.env);
    console.log('Path', paths);
  }

  setLoggerConfig({
    namespace: 'main',
    exportMode: isDev ? 'CONSOLE_FILE' : 'FILE',
    path: paths.logger,
    level: isDev ? 'DEBUG' : 'INFO',
  });

  app.addListener('quit', closeAllLogger);

  const { default: Application } = await import('./app');
  const _app = new Application();
  await _app.init();
  await _app.start();
});
