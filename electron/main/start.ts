import { BrowserWindow, BrowserWindowConstructorOptions, app } from 'electron';
import { release } from 'node:os';
import path from 'node:path';
import { query, open, image } from '../src/router';
import { createWindow } from './create-window';
// eslint-disable-next-line import/no-relative-packages
import { setLoggerConfig } from '../src/modules/logger';
import { config } from '../src/config';

setLoggerConfig({
  namespace: 'main',
  exportMode: process.env.URL ? 'CONSOLE_FILE' : 'FILE',
  path: process.env.URL ? path.resolve(app.getPath('userData'), '/logs') : path.resolve(config.cacheDir, './logs'),
  level: 'DEBUG',
});

// Windows 7 禁用GPU加速
if (release().startsWith('6.1')) app.disableHardwareAcceleration();

// 为Windows 10+通知设置应用程序名称
if (process.platform === 'win32') app.setAppUserModelId(app.getName());

// 强制确保单例运行
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win: BrowserWindow | null = null;

async function createDefWin() {
  const opts: BrowserWindowConstructorOptions = {
    width: 600,
    height: 400,
    title: '壹印',
    frame: false,
  };

  if (!process.env.URL) {
    opts.minWidth = opts.width;
    opts.minHeight = opts.height;
    opts.maxWidth = opts.width;
    opts.maxHeight = opts.height;
  }

  win = await createWindow('main', opts);
}

app.whenReady().then(async () => {
  await createDefWin();
  query.use(win);
  open.use(win);
  image.use(win);
  win.on('closed', () => app.quit());
  win.webContents.on('before-input-event', (event, input) => {
    if (process.env.URL) {
      return;
    }

    if ((input.key === 'r' && input.meta) || input.key.toLowerCase() === 'f5') {
      event.preventDefault();
    }
  });
});

app.on('window-all-closed', () => {
  win = null;
  if (process.platform !== 'darwin') app.quit();
});

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createDefWin();
  }
});
