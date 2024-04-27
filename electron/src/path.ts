import { join } from 'node:path';
import os from 'os';

import { tryCatch } from '@utils';
import { app } from 'electron';

const env = import.meta.env;
const isDev = env.DEV;

export const appPath = app.getAppPath();
export const userDataPath = tryCatch(() => app.getPath('userData'), appPath);
export const desktopPath = tryCatch(() => app.getPath('desktop'), userDataPath);
export function getPath(name: Parameters<typeof app.getPath>[0]) {
  return tryCatch(() => app.getPath(name), desktopPath, () => {});
}

const paths = {
  preload: join(isDev ? env.VITE_DIST_ELECTRON : app.getAppPath(), 'preload/index.js'),
  web: join(isDev ? env.VITE_WEB : app.getAppPath(), 'web'),
  public: env.VITE_PUBLIC,
  logger: join(userDataPath, 'logs'),
  logo: '',
  exiftool: join(isDev ? env.VITE_DIST_ELECTRON : app.getAppPath(), 'exiftool', os.platform() === 'win32' ? 'exiftool.exe' : 'exiftool'),
};

paths.public = isDev ? env.VITE_PUBLIC : paths.web;
paths.logo = join(paths.public, 'logo');

export default paths;
