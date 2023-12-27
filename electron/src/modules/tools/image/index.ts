import fs from 'node:fs';
import path from 'node:path';

import { config } from '@config';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import { Logger } from '@modules/logger';
import { getConfig } from '@src/config';
import { tryCatch, usePromise, md5, getFileName } from '@utils';
import ExifParser from 'exif-parser';
import fluentFfmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import type { RGBA } from 'sharp';

import type { OutputSetting, ImgInfo, ExifInfo, IImgFileInfo } from './interface';

export * from './interface';

const log = new Logger('ImageM');
const NotInit = Symbol('未初始化');

export class Image {
  private imgPath: string;

  private opts: OutputSetting;

  private rotateImgInfo: ImgInfo;

  private exitBuf: Buffer;

  private isInit: boolean;

  private mainImgInfo: {
    w: number
    h: number
  };

  name: string;

  fileNames: Record<string, string> = {};

  md5: string;

  constructor(imgPath: string, name: string, options?: OutputSetting) {
    this.imgPath = imgPath;
    this.name = name;
    this.opts = {
      ...getConfig(true),
      ...options,

      bg_rate: {
        w: (options?.bg_rate?.w ? +options.bg_rate.w : 0) || 0,
        h: (options?.bg_rate?.h ? +options.bg_rate.h : 0) || 0,
      },
    };

    this.md5 = md5(`${md5(imgPath)}${Math.random()}${Date.now()}`);
    const imgPathBase = path.resolve(config.cacheDir, this.md5);
    this.fileNames.bg = path.resolve(`${imgPathBase}_bg.jpg`);
    this.fileNames.main = path.resolve(`${imgPathBase}_main.jpg`);
    this.fileNames.output = path.resolve(config.output, getFileName(config.output, name));
  }

  async init() {
    if (this.isInit) { return; }
    this.isInit = true;

    await this.rotateImg();
  }

  clacBgImgSize(height?: number) {
    if (!this.isInit) { throw NotInit; }
    let resetHeight = this.rotateImgInfo.reset_info.h;
    let resetWidth = this.rotateImgInfo.reset_info.w;

    const whRate = resetWidth / resetHeight;

    if (height) {
      resetHeight = height;
      resetWidth = Math.ceil(resetHeight * whRate);
    } else {
      // 主图高度比重置后的高度高，需要使用主图高度作为最终高度
      const validHeight = this.rotateImgInfo.info.h > resetHeight ? this.rotateImgInfo.info.h : resetHeight;
      resetHeight = validHeight;
      resetWidth = Math.ceil(resetHeight * whRate);
    }

    // 如果重置后，宽度太窄，则等比扩大宽高
    if (this.rotateImgInfo.info.w / resetWidth > 0.9) {
      resetWidth = Math.ceil(this.rotateImgInfo.info.w / 0.9);
      resetHeight = Math.ceil(resetWidth / whRate);
    }

    return {
      w: resetWidth,
      h: resetHeight,
    };
  }

  async createBgImg(height: number, toFilePath?: string): Promise<IImgFileInfo> {
    const { w, h } = this.clacBgImgSize(height);
    toFilePath = toFilePath || this.fileNames.bg;

    let bgInfo;
    // 生成纯色背景
    if (this.opts.solid_bg) {
      bgInfo = await this.createSolidImg(w, h, toFilePath);
    } else {
      bgInfo = await this.createBlurImg(w, h, toFilePath);
    }

    return {
      path: toFilePath,
      width: bgInfo.info.width,
      height: bgInfo.info.height,
    };
  }

  async createMainImg(toFilePath?: string): Promise<IImgFileInfo> {
    if (!this.isInit) { throw NotInit; }
    toFilePath = toFilePath || this.fileNames.main;
    const imgSharp = await this.getRotateSharp();

    // 输出不按照原始大小，则直接复制一份
    if (!this.opts.origin_wh_output) {
      const mainImgInfo = await imgSharp
        .withMetadata()
        .toFormat('jpeg', { quality: 100 })
        .toBuffer({ resolveWithObject: true });
      fs.writeFileSync(toFilePath, mainImgInfo.data);

      this.mainImgInfo = {
        w: mainImgInfo.info.width,
        h: mainImgInfo.info.height,
      };
      return {
        path: toFilePath,
        width: this.rotateImgInfo.info.w,
        height: this.rotateImgInfo.info.h,
      };
    }

    let outHeight = this.rotateImgInfo.reset_info.h;
    let outWidth = this.rotateImgInfo.reset_info.w;
    const heightRate = this.getMainImgHeightRate();
    const blurImgHeight = this.opts.landscape && outWidth < outHeight ? outWidth : outHeight;
    const contentHeight = Math.round(blurImgHeight * heightRate);
    outWidth = Math.round((outWidth / outHeight) * contentHeight);
    outHeight = contentHeight;

    const mainImgInfo = await imgSharp
      .withMetadata()
      .resize({ width: outWidth, height: outHeight, fit: 'inside' })
      .toFormat('jpeg', { quality: 100 })
      .toBuffer({ resolveWithObject: true });
    fs.writeFileSync(toFilePath, mainImgInfo.data);

    this.mainImgInfo = {
      w: mainImgInfo.info.width,
      h: mainImgInfo.info.height,
    };
    return {
      path: toFilePath,
      width: mainImgInfo.info.width,
      height: mainImgInfo.info.height,
    };
  }

  async imgComposite(bgImgInfo: IImgFileInfo, textInfo: IImgFileInfo[], opts: any) {
    if (!bgImgInfo) return undefined;

    const originWidth = bgImgInfo.width;
    const originHeight = bgImgInfo.height;
    const mainImgInfo = await sharp(this.fileNames.main).metadata();
    if (!mainImgInfo) return undefined;

    const composite: sharp.OverlayOptions[] = [
      { input: this.fileNames.main, top: opts.contentTop, left: opts.contentLeft },
      { input: bgImgInfo.path, gravity: sharp.gravity.center },
    ];

    const bottomMargin = 230;
    if (textInfo[1]?.data) {
      const top = Math.round(originHeight - textInfo[1].height - bottomMargin);
      const infoPosition = {
        input: textInfo[1].data,
        top,
        left: Math.round((originWidth - textInfo[1].width) / 2),
      };
      composite.push(infoPosition);
    }

    if (textInfo[0]?.data) {
      const top = Math.round(originHeight - textInfo[0].height - bottomMargin - (textInfo[1]?.height || 0) - 50);
      composite.push({
        input: textInfo[0].data,
        top,
        left: Math.round((originWidth - textInfo[0].width) / 2),
      });
    }

    const [result, res, rej] = usePromise();

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
      .toFile(this.fileNames.output, (err) => {
        if (err) rej(err);
        else res(true);
      });

    return result;
  }

  getExifInfo(imgBuffer?: Buffer): ExifInfo {
    const exifInfo = this.getOriginExifInfo(imgBuffer) || {};

    return {
      Make: (exifInfo.Make || '').toUpperCase(),
      Model: (exifInfo.Model || '').toUpperCase(),
      ExposureTime: exifInfo.ExposureTime || 0,
      FNumber: exifInfo.FNumber || 0,
      ISO: exifInfo.ISO || 0,
      FocalLength: exifInfo.FocalLength || 0,
      ExposureProgram: exifInfo.ExposureProgram || 0,
      DateTimeOriginal: exifInfo.DateTimeOriginal || 0,
      LensModel: (exifInfo.LensModel || '').toUpperCase(),
      LensMake: (exifInfo.LensMake || '').toUpperCase(),
    };
  }

  getOriginExifInfo(imgBuffer?: Buffer) {
    return tryCatch(() => {
      imgBuffer = imgBuffer || this.exitBuf;
      if (!imgBuffer && !this.exitBuf) {
        const buffer = Buffer.alloc(200 * 1024);
        const openImg = fs.openSync(this.imgPath, 'r');

        fs.readSync(fs.openSync(this.imgPath, 'r'), buffer, 0, buffer.length, 0);
        fs.closeSync(openImg);

        imgBuffer = buffer;
        this.exitBuf = buffer;
      }

      const info = ExifParser.create(imgBuffer).parse();
      return info?.tags;
    }, null, (e) => log.error('图片 %s 相机参数获取失败', this.imgPath, e.message));
  }

  private async getRotateSharp() {
    const mainImgSharp = await sharp(this.imgPath);
    return mainImgSharp.rotate();
  }

  private async rotateImg() {
    const imgSharp = await this.getRotateSharp();
    const bufferInfo = await imgSharp.toBuffer({ resolveWithObject: true });
    const imgInfo: ImgInfo = {
      buf: bufferInfo.data,
      info: {
        w: bufferInfo.info.width,
        h: bufferInfo.info.height,
      },
      reset_info: {
        w: bufferInfo.info.width,
        h: bufferInfo.info.height,
      },
      metadata: await imgSharp.metadata(),
    };

    // 重置宽高比
    if (this.opts.bg_rate_show && this.opts.bg_rate.w && this.opts.bg_rate.h) {
      const rate = +this.opts.bg_rate.w / +this.opts.bg_rate.h;

      if (imgInfo.info.w >= imgInfo.info.h) {
        imgInfo.reset_info.h = Math.round(imgInfo.info.w / rate);
      } else {
        imgInfo.reset_info.w = Math.round(imgInfo.info.h * rate);
      }
    }

    // 横屏输出
    const width = this.opts.landscape && imgInfo.reset_info.w < imgInfo.reset_info.h ? imgInfo.reset_info.h : imgInfo.reset_info.w;
    const height = this.opts.landscape && imgInfo.reset_info.w < imgInfo.reset_info.h ? imgInfo.reset_info.w : imgInfo.reset_info.h;

    imgInfo.reset_info.h = height;
    imgInfo.reset_info.w = width;
    this.rotateImgInfo = imgInfo;
  }

  private getMainImgHeightRate() {
    let rate = 0.83;
    if (!this.opts.ext_show) {
      rate += 0.02;
    }

    if (!this.opts.brand_show) {
      rate += 0.02;
    }

    if (!this.opts.ext_show && !this.opts.brand_show) {
      rate += 0.05;
    }

    return rate;
  }

  private async createBlurImg(width: number, height: number, toFilePath: string) {
    const _path = ffmpegPath.path.includes('app.asar') ? ffmpegPath.path.replace('app.asar', 'app.asar.unpacked') : ffmpegPath.path;
    const ffmpeg = fluentFfmpeg();
    fluentFfmpeg.setFfmpegPath(_path);

    let bgInfo = await sharp(this.rotateImgInfo.buf)
      .resize({ width: 3025, height: 3025, fit: 'fill' })
      .toFormat('jpeg', { quality: 100 })
      .toBuffer({ resolveWithObject: true });
    fs.writeFileSync(toFilePath, bgInfo.data);

    const blur = 200;
    const [promise, res] = usePromise();
    // 生成模糊背景;
    ffmpeg
      .input(toFilePath)
      .outputOptions('-vf', `boxblur=${blur}:2`)
      .saveToFile(toFilePath)
      .on('end', () => res(true))
      .on('error', (e) => {
        log.error('Ffmpeg异常', e);
        res(false);
      });

    if (!await promise) {
      return null;
    }

    bgInfo = await sharp(toFilePath)
      .resize({ width, height, fit: 'fill' })
      .toFormat('jpeg', { quality: 100 })
      .toBuffer({ resolveWithObject: true });
    fs.writeFileSync(toFilePath, bgInfo.data);

    return bgInfo;
  }

  private async createSolidImg(width: number, height: number, toFilePath: string, color?: string | RGBA) {
    const bgInfo = await sharp({
      create: {
        channels: 3,
        width,
        height,
        background: typeof color === 'string' ? color : {
          r: 255,
          g: 255,
          b: 255,
          ...color,
        },
      },
    })
      .toFormat('jpeg', { quality: 50 })
      .toBuffer({ resolveWithObject: true });

    fs.writeFileSync(toFilePath, bgInfo.data);
    return bgInfo;
  }

  clearCache() {
    if (fs.existsSync(this.fileNames.bg)) {
      fs.rmSync(this.fileNames.bg);
    }

    if (fs.existsSync(this.fileNames.main)) {
      fs.rmSync(this.fileNames.main);
    }
  }
}
