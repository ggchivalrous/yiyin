import { BrowserWindow, app, shell } from 'electron';
import { join } from 'node:path';

// Here, you can also use other preload
export const preload = join(process.env.DIST_ELECTRON || app.getAppPath(), 'preload/index.js');
export const webDir = join(process.env.VITE_WEB || app.getAppPath(), 'web');

export const createWindow = async (path: string, opts: Electron.BrowserWindowConstructorOptions) => {
  const win = new BrowserWindow({
    ...opts,
    webPreferences: {
      preload,
      ...opts?.webPreferences,
      nodeIntegration: true,
    },
  });

  if (process.env.URL) {
    win.loadURL(join(process.env.URL, path, 'index.html'));
    if (opts.show !== false) {
      win.webContents.openDevTools();
    }
  } else {
    win.loadFile(join(webDir, path, 'index.html'));
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  // 使用浏览器而不是应用程序打开所有链接
  win.webContents.setWindowOpenHandler(({ url: _url }) => {
    if (_url.startsWith('https:') || _url.startsWith('http:')) shell.openExternal(_url);
    return { action: 'deny' };
  });

  return win;
};
