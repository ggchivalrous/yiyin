import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ExifParser from 'exif-parser';
import fluentFfmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import sharp from 'sharp';

export interface Option {
  /**
   * 是否横屏显示
   */
  landscape: boolean

  /**
   * 是否显示参数
   */
  ext_show: boolean

  /**
   * 是否显示机型
   */
  model_show: boolean

  /**
   * 是否显示品牌
   */
  brand_show: boolean

  /**
   * 背景比例
   */
  bg_rate: {
    w: number
    h: number
  }
}

export async function createBlurImg(filePath: string, toFilePath: string, option?: Option) {
  const path = ffmpegPath.path.includes('app.asar') ? ffmpegPath.path.replace('app.asar', 'app.asar.unpacked') : ffmpegPath.path;
  const ffmpeg = fluentFfmpeg();
  fluentFfmpeg.setFfmpegPath(path);

  const mainImgSharp = await sharp(filePath);
  const mainImgInfoMetaData = await mainImgSharp.metadata();
  const rotate = (((mainImgInfoMetaData.orientation || 1) - 1) * 90) % 360;
  const rotateFileSharp = await mainImgSharp.rotate(rotate);
  const rotateFileInfo = await rotateFileSharp.toBuffer({ resolveWithObject: true });

  let rotateWidth = rotateFileInfo.info.width;
  let rotateHeight = rotateFileInfo.info.height;
  // 重置宽高比
  if (option?.bg_rate.w && option?.bg_rate.h) {
    const rate = +option.bg_rate.w / +option.bg_rate.h;

    if (rotateWidth >= rotateHeight) {
      rotateHeight = Math.round(rotateWidth / rate);
    } else {
      rotateWidth = Math.round(rotateHeight * rate);
    }
  }

  const outWidth = option.landscape && rotateWidth < rotateHeight ? rotateHeight : rotateWidth;
  const outHeight = option.landscape && rotateWidth < rotateHeight ? rotateWidth : rotateHeight;

  const bgInfo = await sharp(filePath)
    .rotate(rotate)
    .resize({ width: outWidth, height: outHeight, fit: 'fill' })
    .toFormat('jpeg', { quality: 50 })
    .toBuffer({ resolveWithObject: true });
  fs.writeFileSync(toFilePath, bgInfo.data);

  const blur = Math.round(Math.sqrt(outWidth ** 2 + outHeight ** 2) / 10) - 65;

  // 生成模糊背景;
  await new Promise((r) => {
    ffmpeg
      .input(toFilePath)
      .outputOptions('-vf', `boxblur=${blur}:2`)
      .saveToFile(toFilePath || filePath)
      .on('end', r);
  });

  return {
    path: toFilePath,
    width: bgInfo.info.width,
    height: bgInfo.info.height,
  };
}

export async function createScaleImg(filePath: string, toFilePath: string, option?: Option) {
  const mainImgSharp = await sharp(filePath);
  const mainImgInfoMetaData = await mainImgSharp.metadata();
  const rotate = (((mainImgInfoMetaData.orientation || 1) - 1) * 90) % 360;

  const rotateFileSharp = await mainImgSharp.rotate(rotate);
  const rotateFileInfo = await rotateFileSharp.toBuffer({ resolveWithObject: true });
  let originWidth = rotateFileInfo.info.width;
  let originHeight = rotateFileInfo.info.height;

  // 重置宽高比
  if (option?.bg_rate.w && option?.bg_rate.h) {
    const rate = +option.bg_rate.w / +option.bg_rate.h;

    if (originWidth >= originHeight) {
      originHeight = Math.round(originWidth / rate);
    } else {
      originWidth = Math.round(originHeight * rate);
    }
  }

  let heightRate = 0.83;
  if (!option.ext_show) {
    heightRate += 0.02;
  }

  if (!option.brand_show) {
    heightRate += 0.02;
  }

  if (!option.ext_show && !option.brand_show) {
    heightRate += 0.05;
  }

  const blurImgHeight = option.landscape && originWidth < originHeight ? originWidth : originHeight;
  const contentHeight = Math.round(blurImgHeight * heightRate);
  const resize = { width: 0, height: 0 };

  resize.width = Math.round((originWidth / originHeight) * contentHeight);
  resize.height = contentHeight;

  const mainImgInfo = await rotateFileSharp
    .withMetadata({ orientation: 1 })
    .resize({ ...resize, fit: 'inside' })
    .toFormat('jpeg', { quality: 100 })
    .toBuffer({ resolveWithObject: true });
  fs.writeFileSync(toFilePath, mainImgInfo.data);

  return {
    path: toFilePath,
    width: mainImgInfo.info.width,
    height: mainImgInfo.info.height,
  };
}

interface TextInfo {
  title: {
    width: number
    height: number
    data: Buffer
    path: string
  }
  info: {
    width: number
    height: number
    path: string
    data: Buffer
  }
}

export async function sharpComposite(bgPath: string | Buffer, mainPath: string, toFilePath: string, textInfo: TextInfo) {
  const bgInfo = await sharp(bgPath)
    .toFormat('png')
    .toBuffer({ resolveWithObject: true });

  if (!bgInfo) return undefined;

  const originWidth = bgInfo.info.width;
  const originHeight = bgInfo.info.height;
  const mainImgInfo = await sharp(mainPath).metadata();
  if (!mainImgInfo) return undefined;

  const rem = originHeight / 3712;
  const contentOffsetX = Math.round((originWidth - mainImgInfo.width) / 2);
  const contentOffsetY = Math.round((originHeight - mainImgInfo.height) / (!textInfo.title?.data && !textInfo.info?.data ? 2 : 3));

  return new Promise((resolve, reject) => {
    const composite: any[] = [
      { input: mainPath, top: contentOffsetY, left: contentOffsetX },
      { input: bgInfo.data, gravity: sharp.gravity.center },
    ];

    if (textInfo.title?.data) {
      const top = originHeight - Math.round((textInfo.info?.height || 0) + 250 * rem);
      composite.push({
        input: textInfo.title.data,
        top,
        left: Math.round((originWidth - textInfo.title.width) / 2),
      });
    }

    if (textInfo.info?.data) {
      const top = originHeight - Math.round(200 * rem);
      const infoPosition = {
        input: textInfo.info.data,
        top,
        left: Math.round((originWidth - textInfo.info.width) / 2),
      };
      composite.push(infoPosition);
    }

    sharp({
      create: {
        channels: 3,
        width: originWidth,
        height: originHeight,
        background: {
          r: 255,
          g: 255,
          b: 255,
        },
      },
    })
      .withMetadata()
      .toFormat('jpeg', { quality: 100 })
      .composite(composite)
      .toFile(toFilePath, (err) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(true);
          console.log('水印已添加并保存为 ', toFilePath);
        }
      });
  });
}

export function getExifInfo(imgBuffer: Buffer) {
  try {
    const exifInfo = ExifParser.create(imgBuffer).parse();
    return {
      ExposureTime: exifInfo.tags.ExposureTime || 0,
      FNumber: exifInfo.tags.FNumber || 0,
      ISO: exifInfo.tags.ISO || 0,
      FocalLength: exifInfo.tags.FocalLength || 0,
      Model: exifInfo.tags.Model || '',
      ExposureProgram: exifInfo.tags.ExposureProgram || '',
      LensModel: exifInfo.tags.LensModel || '',
    };
  } catch (error) {
    console.log(error);
  }

  return {
    ExposureTime: 0,
    FNumber: 0,
    ISO: 0,
    FocalLength: 0,
    Model: '',
    ExposureProgram: '',
    LensModel: '',
  };
}
