import { join } from 'node:path';

import paths from '@src/path';
import { BrowserWindow, shell } from 'electron';

export const createWindow = async (path: string, opts: Electron.BrowserWindowConstructorOptions) => {
  const win = new BrowserWindow({
    ...opts,
    webPreferences: {
      preload: paths.preload,
      ...opts?.webPreferences,
      nodeIntegration: true,
    },
  });

  if (import.meta.env.DEV) {
    win.loadURL(join(import.meta.env.VITE_URL, path, 'index.html'));
    win.on('ready-to-show', () => {
      if (opts.show !== false) {
        win.webContents.openDevTools();
      }
    });
  } else {
    win.loadFile(join(paths.web, path, 'index.html'));
  }

  // 使用浏览器而不是应用程序打开所有链接
  win.webContents.setWindowOpenHandler(({ url: _url }) => {
    if (_url.startsWith('https:') || _url.startsWith('http:')) shell.openExternal(_url);
    return { action: 'deny' };
  });

  return win;
};
