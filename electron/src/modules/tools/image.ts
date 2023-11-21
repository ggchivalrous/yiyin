import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ExifParser from 'exif-parser';
import fluentFfmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import type { RGBA } from 'sharp';
import sharp from 'sharp';
import { tryCatch, usePromise } from '../../utils';

export interface OutputSetting {
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
   * 纯色背景
   */
  white_bg: false,

  /**
   * 背景比例
   */
  bg_rate: {
    w: number
    h: number
  }

  /**
   * 是否按照原始宽高输出
   *
   * @default false
   */
  origin_wh_output: boolean
}

interface ImgInfo {
  buf: Buffer
  info: {
    w: number
    h: number
  }
  reset_info: {
    w: number
    h: number
  }
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

export class Image {
  private imgPath: string;

  private opts: OutputSetting;

  private rotateImgInfo: ImgInfo;

  constructor(imgPath: string, options?: OutputSetting) {
    this.imgPath = imgPath;
    this.opts = {
      landscape: false,
      ext_show: true,
      model_show: true,
      brand_show: true,
      white_bg: false,
      origin_wh_output: true,
      ...options,

      bg_rate: {
        w: 0,
        h: 0,
        ...options.bg_rate,
      },
    };
  }

  async init() {
    await this.rotateImg();
  }

  async createBgImg(toFilePath: string) {
    let outHeight = this.rotateImgInfo.reset_info.h;
    let outWidth = this.rotateImgInfo.reset_info.w;

    // 不按图片原始宽高输出，则对背景宽高做调整
    if (!this.opts.origin_wh_output) {
      const whRate = outWidth / outHeight;
      const heightRate = this.getMainImgHeightRate();
      outHeight = Math.ceil(outHeight / heightRate);
      outWidth = Math.round(outHeight * whRate);
    }

    let bgInfo;
    // 生成纯色背景
    if (this.opts.white_bg) {
      bgInfo = await this.createSolidImg(outWidth, outHeight, toFilePath);
    } else {
      bgInfo = await this.createBlurImg(outWidth, outHeight, toFilePath);
    }

    return {
      path: toFilePath,
      width: bgInfo.info.width,
      height: bgInfo.info.height,
    };
  }

  async createMainImg(toFilePath: string) {
    const imgSharp = await this.getRotateSharp();
    let outHeight = this.rotateImgInfo.reset_info.h;
    let outWidth = this.rotateImgInfo.reset_info.w;

    // 输出不按照原始大小，则直接复制一份
    if (!this.opts.origin_wh_output) {
      fs.copyFileSync(this.imgPath, toFilePath);
      return {
        path: toFilePath,
        width: outWidth,
        height: outHeight,
      };
    }

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
          console.error(err);
          rej(err);
        } else {
          res(true);
          console.log('水印已添加并保存为 ', toFilePath);
        }
      });

    return result;
  }

  getExifInfo(imgBuffer?: Buffer) {
    return tryCatch(() => {
      if (!imgBuffer) {
        const buffer = Buffer.alloc(200 * 1024);
        const openImg = fs.openSync(this.imgPath, 'r');

        fs.readSync(fs.openSync(this.imgPath, 'r'), buffer, 0, buffer.length, 0);
        fs.closeSync(openImg);

        imgBuffer = buffer;
      }

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
    }, {
      ExposureTime: 0,
      FNumber: 0,
      ISO: 0,
      FocalLength: 0,
      Model: '',
      ExposureProgram: '',
      LensModel: '',
    }, console.log);
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
    if (this.opts.bg_rate.w && this.opts.bg_rate.h) {
      const rate = +this.opts.bg_rate.w / +this.opts.bg_rate.h;

      if (imgInfo.info.w >= imgInfo.info.h) {
        imgInfo.reset_info.h = Math.round(imgInfo.info.w / rate);
      } else {
        imgInfo.reset_info.w = Math.round(imgInfo.info.h * rate);
      }
    }

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

    const blur = Math.round(Math.sqrt(this.rotateImgInfo.info.w ** 2 + this.rotateImgInfo.info.h ** 2) / 10) - 65;

    // 生成模糊背景;
    await new Promise((r) => {
      ffmpeg
        .input(toFilePath)
        .outputOptions('-vf', `boxblur=${blur}:2`)
        .saveToFile(toFilePath || this.imgPath)
        .on('end', r);
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
