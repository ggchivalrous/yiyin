import { release } from 'node:os';

import { Logger } from '@modules/logger';
import { createWindow } from '@root/main/create-window';
import routerConfig from '@root/router-config';
import { image, open, query } from '@router';
import { config, storeConfig } from '@src/config';
import { hasNewVersion } from '@utils';
import { BrowserWindow, BrowserWindowConstructorOptions, app } from 'electron';

const log = new Logger('App');

export default class Application {
  win: BrowserWindow;

  private isInit: boolean;

  async init() {
    // Windows 7 禁用GPU加速
    if (release().startsWith('6.1')) app.disableHardwareAcceleration();

    // 为Windows 10+通知设置应用程序名称
    if (process.platform === 'win32') app.setAppUserModelId(app.getName());

    // 强制确保单例运行
    if (!app.requestSingleInstanceLock()) {
      app.quit();
      process.exit(0);
    }

    app.on('window-all-closed', () => {
      this.win = null;
      if (process.platform !== 'darwin') app.quit();
    });

    app.on('second-instance', () => {
      if (this.win) {
        // 如果用户试图打开另一个窗口，则关注主窗口
        if (this.win.isMinimized()) this.win.restore();
        this.win.focus();
      }
    });

    app.on('activate', () => {
      const allWindows = BrowserWindow.getAllWindows();
      if (allWindows.length) {
        allWindows[0].focus();
      } else {
        this.createDefWin();
      }
    });

    await app.whenReady();
    this.isInit = true;
  }

  async start() {
    if (!this.isInit) {
      throw new Error('请初始化 Application');
    }

    await this.createDefWin();
    query.use(this.win);
    open.use(this.win);
    image.use(this.win);
    this.win.on('closed', () => app.quit());

    if (import.meta.env.DEV) {
      this.win.webContents.on('before-input-event', (event, input) => {
        if ((input.key === 'r' && input.meta) || input.key.toLowerCase() === 'f5') {
          event.preventDefault();
        }
      });
    }

    this.win.on('ready-to-show', () => {
      this.checkAssetsUpdate();
    });
  }

  async checkAssetsUpdate() {
    const dayTs = new Date().setHours(0, 0, 0, 0);
    if (dayTs === config?.versionUpdateInfo?.checkDate) {
      this.win.webContents.send(routerConfig.on.assetsUpdate, config.versionUpdateInfo);
      return;
    }

    const versionInfo = await hasNewVersion().catch((e) => {
      log.error('版本信息获取失败', e);
    });

    log.info('版本信息获取成功', versionInfo);
    if (!versionInfo) {
      return;
    }

    if (!versionInfo.update) {
      storeConfig({
        versionUpdateInfo: {
          checkDate: dayTs,
          version: config.versionUpdateInfo.version.replace('v', ''),
          downloadLink: config.versionUpdateInfo.downloadLink,
        },
      });
      return;
    }

    // 写入配置文件，并限制访问的频次
    storeConfig({
      versionUpdateInfo: {
        checkDate: dayTs,
        version: versionInfo.version,
        downloadLink: versionInfo.downloadLink,
      },
    });
    this.win.webContents.send(routerConfig.on.assetsUpdate, versionInfo);
  }

  private async createDefWin() {
    const opts: BrowserWindowConstructorOptions = {
      width: 680,
      height: 490,
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

    this.win = await createWindow('main', opts);
  }
}
