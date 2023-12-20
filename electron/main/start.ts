import { release } from 'node:os';

import { createWindow } from '@root/main/create-window';
import { image, open, query } from '@router';
import { BrowserWindow, BrowserWindowConstructorOptions, app } from 'electron';

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
    width: 1000,
    height: 600,
    title: '壹印',
    frame: false,
    webPreferences: {
      webSecurity: false,
    },
  };

  if (import.meta.env.PROD) {
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

  if (import.meta.env.DEV) {
    win.webContents.on('before-input-event', (event, input) => {
      if ((input.key === 'r' && input.meta) || input.key.toLowerCase() === 'f5') {
        event.preventDefault();
      }
    });
  }
});

app.on('window-all-closed', () => {
  win = null;
  if (process.platform !== 'darwin') app.quit();
});

app.on('second-instance', () => {
  if (win) {
    // 如果用户试图打开另一个窗口，则关注主窗口
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
