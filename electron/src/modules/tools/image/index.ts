import fs from 'fs';

import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import { Logger } from '@modules/logger';
import { getConfig } from '@src/config';
import { tryCatch, usePromise } from '@utils';
import ExifParser from 'exif-parser';
import fluentFfmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import type { RGBA } from 'sharp';

import type { OutputSetting, ImgInfo, TextInfo, ExifInfo } from './interface';

export * from './interface';

const log = new Logger('ImageM');
const NotInit = Symbol('未初始化');

export class Image {
  private imgPath: string;

  private opts: OutputSetting;

  private rotateImgInfo: ImgInfo;

  private exitBuf: Buffer;

  private isInit: boolean;

  constructor(imgPath: string, options?: OutputSetting) {
    this.imgPath = imgPath;
    this.opts = {
      ...getConfig(true),
      ...options,

      bg_rate: {
        w: (options?.bg_rate?.w ? +options.bg_rate.w : 0) || 0,
        h: (options?.bg_rate?.h ? +options.bg_rate.h : 0) || 0,
      },
    };
  }

  async init() {
    if (this.isInit) { return; }
    this.isInit = true;

    await this.rotateImg();
  }

  async createBgImg(toFilePath: string) {
    if (!this.isInit) { throw NotInit; }

    let resetHeight = this.rotateImgInfo.reset_info.h;
    let resetWidth = this.rotateImgInfo.reset_info.w;

    // 不按图片原始宽高输出，则对背景宽高做调整
    if (!this.opts.origin_wh_output) {
      const whRate = resetWidth / resetHeight;
      const heightRate = this.getMainImgHeightRate();

      // 主图高度比重置后的高度高，需要使用主图高度作为最终高度
      const validHeight = this.rotateImgInfo.info.h > resetHeight ? this.rotateImgInfo.info.h : resetHeight;
      resetHeight = Math.ceil(validHeight / heightRate);
      resetWidth = Math.ceil(resetHeight * whRate);

      // 如果重置后，宽度太窄，则等比扩大宽高
      if (this.rotateImgInfo.info.w / resetWidth > 0.9) {
        resetWidth = Math.ceil(resetWidth / 0.9);
        resetHeight = Math.ceil(resetWidth / whRate);
      }
    }

    let bgInfo;
    // 生成纯色背景
    if (this.opts.solid_bg) {
      bgInfo = await this.createSolidImg(resetWidth, resetHeight, toFilePath);
    } else {
      bgInfo = await this.createBlurImg(resetWidth, resetHeight, toFilePath);
    }

    return {
      path: toFilePath,
      width: bgInfo.info.width,
      height: bgInfo.info.height,
    };
  }

  async createMainImg(toFilePath: string) {
    if (!this.isInit) { throw NotInit; }

    const imgSharp = await this.getRotateSharp();

    // 输出不按照原始大小，则直接复制一份
    if (!this.opts.origin_wh_output) {
      fs.copyFileSync(this.imgPath, toFilePath);
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
      .withMetadata({ orientation: 1 })
      .resize({ width: outWidth, height: outHeight, fit: 'inside' })
      .toFormat('jpeg', { quality: 100 })
      .toBuffer({ resolveWithObject: true });
    fs.writeFileSync(toFilePath, mainImgInfo.data);

    return {
      path: toFilePath,
      width: mainImgInfo.info.width,
      height: mainImgInfo.info.height,
    };
  }

  static async imgComposite(bgPath: string | Buffer, mainPath: string, toFilePath: string, textInfo: TextInfo) {
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
      .toFile(toFilePath, (err) => {
        if (err) {
          log.error(err);
          rej(err);
        } else {
          res(true);
          log.info('水印已添加并保存为 ', toFilePath);
        }
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
    const mainImgInfoMetaData = await mainImgSharp.metadata();
    const rotate = (((mainImgInfoMetaData.orientation || 1) - 1) * 90) % 360;
    return mainImgSharp.rotate(rotate);
  }

  private async rotateImg() {
    const bufferInfo = await (await this.getRotateSharp()).toBuffer({ resolveWithObject: true });
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
    const path = ffmpegPath.path.includes('app.asar') ? ffmpegPath.path.replace('app.asar', 'app.asar.unpacked') : ffmpegPath.path;
    const ffmpeg = fluentFfmpeg();
    fluentFfmpeg.setFfmpegPath(path);

    const bgInfo = await sharp(this.rotateImgInfo.buf)
      .resize({ width, height, fit: 'fill' })
      .toFormat('jpeg', { quality: 50 })
      .toBuffer({ resolveWithObject: true });
    fs.writeFileSync(toFilePath, bgInfo.data);

    const diagonal = Math.round(Math.sqrt(this.rotateImgInfo.info.w ** 2 + this.rotateImgInfo.info.h ** 2) / 10);
    const blur = diagonal < 100 ? diagonal : diagonal - 65;

    // 生成模糊背景;
    await new Promise((r) => {
      ffmpeg
        .input(toFilePath)
        .outputOptions('-vf', `boxblur=${blur}:2`)
        .saveToFile(toFilePath || this.imgPath)
        .on('end', r)
        .on('error', (e) => log.error('Ffmpeg异常', e));
    });
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
}
