import { Logger } from '@modules/logger';
import { Router } from '@modules/router';
import { IImgFileInfo, Image, OutputSetting } from '@modules/tools/image';
import { createWindow } from '@root/main/create-window';
import routerConfig from '@root/router-config';
import { pollSleep, tryAsyncCatch, usePromise } from '@utils';
import { BrowserWindow } from 'electron';

let maskGenWin: BrowserWindow = null;
const r = new Router();
const log = new Logger('ImageR');
const queue: {
  composite: Record<string, { image: Image }>
} = {
  composite: {},
};

async function createMaskWin() {
  const [promise, res] = usePromise();

  if (!maskGenWin || maskGenWin.isDestroyed()) {
    maskGenWin = await createWindow('/mask', {
      show: import.meta.env.DEV,
      frame: false,
      webPreferences: {
        webSecurity: false,
        nodeIntegration: true,
        offscreen: true,
      },
    });

    maskGenWin.addListener('ready-to-show', () => {
      res(maskGenWin);
    });
  }

  return promise;
}

interface StartTaskData {
  fileUrlList: {
    path: string
    name: string
  }[]
  option: OutputSetting
}

r.listen<any, boolean>(routerConfig.startTask, async (data: StartTaskData, ev, win) => {
  if (maskGenWin) {
    maskGenWin.close();
    maskGenWin = null;
  }

  await createMaskWin();

  for (const fileInfo of data.fileUrlList) {
    await pollSleep(() => Object.keys(queue.composite).length < 2);
    const { path: url, name } = fileInfo;
    const imgTool = new Image(url, name, data.option);

    log.info('【%s】开始处理图片\n名称：%s\n路径：%s\nMD5：%s', imgTool.md5, name, url, imgTool.md5);
    await imgTool.init();

    queue.composite[imgTool.md5] = {
      image: imgTool,
    };

    const bgImgSize = imgTool.clacBgImgSize();

    // 生成主图
    const mainImgInfo = await tryAsyncCatch(
      imgTool.createMainImg(),
      null,
      (e) => log.error('【%s】缩放图片生成失败【%s】', imgTool.md5, url, e),
    );

    // 获取图片Exif信息
    const exifInfo = await imgTool.getExifInfo();

    // 发送到前端
    maskGenWin.webContents.send(routerConfig.on.createMask, {
      name,
      md5: imgTool.md5,
      exifInfo,
      bgImgSize,
      mainImgInfo,
      option: data.option,
    });
    win.webContents.send(routerConfig.on.progress, {
      path: url,
      md5: imgTool.md5,
      progress: 30,
    });
    log.info('【%s】图片基本信息处理完毕，生成背景图片...', imgTool.md5);
  }

  return true;
});

r.listen<any, any>(routerConfig.composite, async (data, ev, win) => {
  if (!data.md5 || !data.bgImgInfo) return false;
  if (!queue.composite[data.md5]) {
    log.error('【%s】图片操作实例不存在！！！\n当前已知实例: %s', data.md5, JSON.stringify(queue.composite, null, 2));
    return false;
  }

  const imgTool = queue.composite[data.md5].image;

  try {
    log.info('【%s】图片蒙版生成完成，开始合成图片...', imgTool.md5);
    win.webContents.send(routerConfig.on.progress, {
      md5: imgTool.md5,
      progress: 80,
    });

    data.bgImgInfo.path = Buffer.from(data.bgImgInfo.data.split(',')[1], 'base64');
    const textList: IImgFileInfo[] = data.text?.length ? data.text.map((i: IImgFileInfo) => ({
      path: i.path,
      data: Buffer.from(i.path.split(',')[1], 'base64'),
      width: i.width,
      height: i.height,
    })) : [];

    const compositeState = await imgTool.imgComposite(data.bgImgInfo, textList, {
      contentTop: data.mainImgOffset.top,
      contentLeft: data.mainImgOffset.left,
    }).catch((e) => {
      log.error('【%s】图片合成失败', imgTool.md5, e);
    });

    if (compositeState) {
      log.info('【%s】水印已添加并保存为 ', imgTool.md5, imgTool.fileNames.output);
    }

    if ((import.meta.env.DEV && compositeState) || import.meta.env.PROD) {
      imgTool.clearCache();
    }

    win.webContents.send(routerConfig.on.composite, {
      md5: data.md5,
      res: 'success',
    });
  } catch (e) {
    log.error('【%s】图片合成处理过程异常', data.md5, e);
    win.webContents.send(routerConfig.on.composite, {
      md5: data.md5,
      res: 'fail',
    });

    if (import.meta.env.PROD) {
      imgTool.clearCache();
    }
  } finally {
    delete queue.composite[data.md5];
  }

  return true;
});

r.listen<any, any>(routerConfig.compositeFail, async (data, ev, win) => {
  if (!data) return false;

  if (queue.composite[data.md5]) {
    const imgTool = queue.composite[data.md5].image;
    imgTool.clearCache();
    delete queue.composite[data.md5];
  }

  log.error('【%s】图片蒙版生成失败\nError: %s', data.md5, data.msg);
  win.webContents.send(routerConfig.on.composite, {
    md5: data.md5,
    res: 'fail',
  });
  return true;
});

r.listen<any, any>(routerConfig.createBgImg, async (data) => {
  if (!data) return false;

  if (!queue.composite[data.md5]) {
    log.error('【%s】图片操作实例不存在！！！\n当前已知实例: %s', data.md5, JSON.stringify(queue.composite, null, 2));
    return false;
  }

  const imgTool = queue.composite[data.md5].image;
  const imgInfo = await imgTool.createBgImg(data.height)
    .catch((e) => {
      log.error('【%s】背景图片生成失败', imgTool.md5, e);
    });

  log.info('【%s】图片背景生成完成，生成图片背景蒙版', imgTool.md5);
  return imgInfo;
});

export default r;
