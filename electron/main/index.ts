import { BrowserWindow, app } from 'electron';
import { release } from 'node:os';
import { query, open, image } from '../src/router';
import { createWindow } from './create-window';

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
  win = await createWindow('main', {
    ...(process.env.URL ? {} : {
      minWidth: 550,
      minHeight: 300,
      maxWidth: 550,
      maxHeight: 300,
    }),
    width: 600,
    height: 350,
    title: '壹印',
    frame: false,
  });
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
