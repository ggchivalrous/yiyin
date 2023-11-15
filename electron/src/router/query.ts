import { BrowserWindow, app, dialog } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { createWindow } from '../../main/create-window';
import routerConfig from '../../router-config';
import { Router } from '../modules/router';
import { createBlurImg, createScaleImg, getExifInfo, sharpComposite } from '../modules/tools/blur';
import md5 from '../utils/md5';

const r = new Router();
const config = {
  dir: path.join(app.getPath('userData'), 'config.json'),
  output: path.join(app.getPath('pictures'), 'watermark'),
};

readConfig();

const cacheDir = process.env.URL ? path.join(config.output, '.catch') : app.getPath('temp');

let maskGenWin: BrowserWindow = null;

if (process.env.URL && !fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

async function createMaskWin() {
  if (!maskGenWin || maskGenWin.isDestroyed()) {
    maskGenWin = await createWindow('/mask', {
      show: !!process.env.URL,
      frame: false,
      webPreferences: {
        webSecurity: false,
        nodeIntegration: true,
        offscreen: true,
      },
    });
  }
}

function readConfig() {
  if (fs.existsSync(config.dir)) {
    const content = fs.readFileSync(config.dir);
    try {
      Object.assign(config, JSON.parse(content.toString()));
      return;
    } catch {
      // ignore
    }
  }

  Object.assign(config, {
    output: path.join(app.getPath('pictures'), 'watermark'),
  });
}

r.listen<any, boolean>(routerConfig.startTask, async (data) => {
  await createMaskWin();

  for (const fileInfo of data.fileUrlList) {
    const { path: url, name } = fileInfo;
    const _md5 = md5(url);
    const imgPath = path.resolve(cacheDir, _md5);
    const buffer = Buffer.alloc(200 * 1024);
    const openImg = fs.openSync(url, 'r');
    fs.readSync(fs.openSync(url, 'r'), buffer, 0, 200 * 1024, 0);
    fs.closeSync(openImg);

    // 生成高斯模糊图片
    const blurInfo = await createBlurImg(url, path.resolve(`${imgPath}_blur.jpg`), data.option).catch((e) => {
      console.log('模糊图片生成失败', e);
    });
    // 缩小原图
    const scaleInfo = await createScaleImg(url, path.resolve(`${imgPath}_scale.jpg`), data.option).catch((e) => {
      console.log('缩放图片生成失败', e);
    });
    // 获取图片Exif信息
    const exifInfo = getExifInfo(buffer);

    // 发送到前端
    maskGenWin.webContents.send(routerConfig.on.createMask, {
      name,
      md5: _md5,
      exifInfo,
      blur: blurInfo,
      scale: scaleInfo,
      option: data.option,
    });
  }

  return true;
});

r.listen<any, any>(routerConfig.composite, async (data) => {
  if (!data.md5 || !data.mask) return false;

  try {
    const scalePath = path.resolve(cacheDir, `${data.md5}_scale.jpg`);
    const blurPath = path.resolve(cacheDir, `${data.md5}_blur.jpg`);
    const buffer = Buffer.from(data.mask.split(',')[1], 'base64');

    if (data.text.title) {
      data.text.title.data = Buffer.from(data.text.title.data.split(',')[1], 'base64');
    }

    if (data.text.info) {
      data.text.info.data = Buffer.from(data.text.info.data.split(',')[1], 'base64');
    }

    await sharpComposite(buffer, scalePath, path.resolve(config.output, data.name), data.text).catch((e) => {
      console.log('图片合成失败', e);
    });
    // fs.writeFileSync(path.resolve(cacheDir, `${data.md5}_mask.jpg`), buffer)
    fs.rmSync(scalePath);
    fs.rmSync(blurPath);
  } catch (e) {
    console.log(e);
  }
  return true;
});

r.listen(routerConfig.open.selectPath, async (data, event, win) => {
  const res = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
  });

  if (!res.canceled && res.filePaths.length > 0) {
    config.output = res.filePaths[0];
    fs.writeFileSync(config.dir, JSON.stringify(config, null, 0));
    return config;
  }

  return false;
});

r.listen(routerConfig.getConfig, async () => config);

r.listen(routerConfig.miniSize, async () => {
  BrowserWindow.getFocusedWindow().minimize();
});

r.listen(routerConfig.closeApp, async () => {
  app.quit();
});

export default r;
