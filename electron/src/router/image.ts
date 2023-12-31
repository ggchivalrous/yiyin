import { BrowserWindow } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
// eslint-disable-next-line import/no-relative-packages
import { Logger } from '../modules/logger';
import { createWindow } from '../../main/create-window';
import routerConfig from '../../router-config';
import { config } from '../config';
import { Router } from '../modules/router';
import { Image, OutputSetting } from '../modules/tools/image';
import md5 from '../utils/md5';
import { getFileName } from '../utils';

const r = new Router();
let maskGenWin: BrowserWindow = null;
const log = new Logger('ImageR');

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

interface StartTaskData {
  fileUrlList: {
    path: string
    name: string
  }[]
  option: OutputSetting
}

r.listen<any, boolean>(routerConfig.startTask, async (data: StartTaskData) => {
  await createMaskWin();

  for (const fileInfo of data.fileUrlList) {
    const { path: url, name } = fileInfo;
    const _md5 = `${md5(url)}${Math.random()}${Date.now()}`;
    const imgPath = path.resolve(config.cacheDir, _md5);

    const imgTool = new Image(url, data.option);
    await imgTool.init();

    // 生成背景图片
    const blurInfo = await imgTool.createBgImg(path.resolve(`${imgPath}_bg.jpg`)).catch((e) => log.error('模糊图片生成失败', e));

    // 生成主图
    const scaleInfo = await imgTool.createMainImg(path.resolve(`${imgPath}_main.jpg`)).catch((e) => log.error('缩放图片生成失败', e));

    // 获取图片Exif信息
    const exifInfo = await imgTool.getExifInfo();

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
    const mainImgPath = path.resolve(config.cacheDir, `${data.md5}_main.jpg`);
    const bgImgPath = path.resolve(config.cacheDir, `${data.md5}_bg.jpg`);
    const buffer = Buffer.from(data.mask.split(',')[1], 'base64');

    if (data.text.title) {
      data.text.title.data = Buffer.from(data.text.title.data.split(',')[1], 'base64');
    }

    if (data.text.info) {
      data.text.info.data = Buffer.from(data.text.info.data.split(',')[1], 'base64');
    }

    await Image.imgComposite(buffer, mainImgPath, path.resolve(config.output, getFileName(config.output, data.name)), data.text).catch((e) => {
      log.error('图片合成失败', e);
    });

    // fs.writeFileSync(path.resolve(cacheDir, `${data.md5}_mask.jpg`), buffer)
    fs.rmSync(mainImgPath);
    fs.rmSync(bgImgPath);
  } catch (e) {
    log.error(e);
  }
  return true;
});

export default r;
