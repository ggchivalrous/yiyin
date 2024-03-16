/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';
import { format } from 'util';

import { setLoggerConfig, closeAllLogger } from '@modules/logger';
import paths from '@src/path';
import { formatDate } from '@utils';
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

process.on('uncaughtException', (e) => {
  onError('uncaughtException', e);
});

process.on('unhandledRejection', (e) => {
  onError('unhandledRejection', e as Error);
});

process.on('uncaughtExceptionMonitor', (e) => {
  onError('uncaughtExceptionMonitor', e);
});

function onError(type: string, e: Error) {
  const logPath = path.join(app.getPath('userData'), 'logs');
  if (!fs.existsSync(logPath)) {
    fs.mkdirSync(logPath);
  }

  const crashPath = path.join(logPath, 'crash.log');
  fs.appendFileSync(crashPath, format('%s %s 错误: %s\n', formatDate(), type, e));
}
