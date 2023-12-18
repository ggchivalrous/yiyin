import { join } from 'node:path';

import { BrowserWindow, app, shell } from 'electron';

export const preload = join(import.meta.env.VITE_DIST_ELECTRON || app.getAppPath(), 'preload/index.js');
export const webDir = join(import.meta.env.VITE_WEB || app.getAppPath(), 'web');

export const createWindow = async (path: string, opts: Electron.BrowserWindowConstructorOptions) => {
  const win = new BrowserWindow({
    ...opts,
    webPreferences: {
      preload,
      ...opts?.webPreferences,
      nodeIntegration: true,
    },
  });

  if (import.meta.env.DEV) {
    win.loadURL(join(import.meta.env.VITE_URL, path, 'index.html'));
    if (opts.show !== false) {
      win.webContents.openDevTools();
    }
  } else {
    win.loadFile(join(webDir, path, 'index.html'));
  }

  // 使用浏览器而不是应用程序打开所有链接
  win.webContents.setWindowOpenHandler(({ url: _url }) => {
    if (_url.startsWith('https:') || _url.startsWith('http:')) shell.openExternal(_url);
    return { action: 'deny' };
  });

  return win;
};
