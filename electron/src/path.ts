import { join } from 'node:path';
import os from 'os';

import { app } from 'electron';

const env = import.meta.env;
const isDev = env.DEV;

const paths = {
  preload: join(isDev ? env.VITE_DIST_ELECTRON : app.getAppPath(), 'preload/index.js'),
  web: join(isDev ? env.VITE_WEB : app.getAppPath(), 'web'),
  public: env.VITE_PUBLIC,
  logger: join(app.getPath('userData'), 'logs'),
  logo: '',
  exiftool: join(isDev ? env.VITE_DIST_ELECTRON : app.getAppPath(), 'exiftool', os.platform() === 'win32' ? 'exiftool.exe' : 'exiftool'),
};

paths.public = isDev ? env.VITE_PUBLIC : paths.web;
paths.logo = join(paths.public, 'logo');

export default paths;
