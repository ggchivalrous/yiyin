import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ExifParser from 'exif-parser';
import fluentFfmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import sharp from 'sharp';

interface Option {
  /**
   * 是否横屏显示
   */
  landscape: boolean
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

  const rotateWidth = rotateFileInfo.info.width;
  const rotateHeight = rotateFileInfo.info.height;
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
  const originWidth = rotateFileInfo.info.width;
  const originHeight = rotateFileInfo.info.height;

  const blurImgHeight = option.landscape && originWidth < originHeight ? originWidth : originHeight;
  const contentHeight = Math.round(blurImgHeight * 0.8);
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
  const contentOffsetY = Math.round((originHeight - mainImgInfo.height) / 3);

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
}
