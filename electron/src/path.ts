import { join } from 'node:path';

import { app } from 'electron';

const env = import.meta.env;
const isDev = env.DEV;

const paths = {
  preload: join(isDev ? env.VITE_DIST_ELECTRON : app.getAppPath(), 'preload/index.js'),
  web: join(isDev ? env.VITE_WEB : app.getAppPath(), 'web'),
  public: env.VITE_PUBLIC,
  logger: join(app.getPath('userData'), 'logs'),
  logo: '',
};

paths.public = isDev ? env.VITE_PUBLIC : paths.web;
paths.logo = join(paths.public, 'logo');

export default paths;
