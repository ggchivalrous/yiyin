import Event from 'events';
import fs from 'fs';
import { join } from 'path';

import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import { ExifTool } from '@modules/exiftool';
import { Exif } from '@modules/exiftool/interface';
import { Logger } from '@modules/logger';
import routerConfig from '@root/router-config';
import { mainApp } from '@src/common/app';
import { genMainImgShadowQueue, genTextImgQueue } from '@src/common/queue';
import { config } from '@src/config';
import { IConfig } from '@src/interface';
import paths from '@src/path';
import { getFileName, md5, tryCatch, usePromise } from '@utils';
import fluentFfmpeg from 'fluent-ffmpeg';
import type { RGBA } from 'sharp';
import sharp from 'sharp';

import type { ImageToolOption, Material, OutputFilePaths, SizeInfo } from './interface';

const log = new Logger('ImageTool');
const NotInit = Symbol('未初始化');

interface EventMap {
  progress(id: string, progress: number): void
}

export class ImageTool extends Event {
  private isInit: boolean;

  readonly id: string;

  readonly path: string;

  readonly name: string;

  private outputOpt: IConfig['options'];

  private outputFileNames: OutputFilePaths;

  private meta: sharp.Metadata;

  private sizeInfo: SizeInfo;

  private blur = 200;

  private exif: Exif;

  private _progress = 0;

  private material: Material = {
    bg: undefined,
    main: [],
    text: [],
  };

  private contentH: number;

  set progress(n: number) {
    this._progress = n;
    this.emit('progress', this.id, this._progress);
  }

  constructor(path: string, name: string, opt: ImageToolOption) {
    super();

    this.path = path;
    this.name = name;
    this.outputOpt = opt.outputOption;
    this.id = md5(`${md5(path)}${Math.random()}${Date.now()}`);

    const baseFilePath = join(opt.cachePath, this.id);
    this.outputFileNames = {
      base: baseFilePath,
      bg: `${baseFilePath}_bg.jpg`,
      main: `${baseFilePath}_main.jpg`,
      mask: `${baseFilePath}_mask.png`,
      composite: join(opt.outputPath, getFileName(opt.outputPath, name)),
    };
  }

  async init() {
    if (this.isInit) return;
    this.isInit = true;

    // 准备基础信息
    const imgSharp = sharp(this.path).rotate();

    this.meta = await imgSharp.metadata();
    const { info: imgInfo } = await imgSharp.toBuffer({ resolveWithObject: true });
    this.sizeInfo = {
      w: imgInfo.width,
      h: imgInfo.height,
      resetW: imgInfo.width,
      resetH: imgInfo.height,
    };

    const { outputOpt } = this;

    // 重置宽高比
    if (outputOpt.bg_rate_show && outputOpt.bg_rate.w && outputOpt.bg_rate.h) {
      const rate = +outputOpt.bg_rate.w / +outputOpt.bg_rate.h;

      if (this.sizeInfo.w >= this.sizeInfo.h) {
        this.sizeInfo.resetH = Math.round(this.sizeInfo.w / rate);
      } else {
        this.sizeInfo.resetW = Math.round(this.sizeInfo.h * rate);
      }
    }

    // 横屏输出
    const width = outputOpt.landscape && this.sizeInfo.resetW < this.sizeInfo.resetH
      ? this.sizeInfo.resetH
      : this.sizeInfo.resetW;
    const height = outputOpt.landscape && this.sizeInfo.resetW < this.sizeInfo.resetH
      ? this.sizeInfo.resetW
      : this.sizeInfo.resetH;

    this.sizeInfo.resetW = width;
    this.sizeInfo.resetH = height;

    // 获取相机信息
    const exiftool = new ExifTool(this.path);
    this.exif = exiftool.parse();
  }

  async genWatermark() {
    this.progress = 1;
    log.info('【%s】初始化基础数据', this.id);
    await this.init();
    this.progress = 10;

    log.info('【%s】初步计算背景图片大小', this.id);
    this.clacBgImgSize();
    this.progress = 20;

    log.info('【%s】生成文本图片', this.id);
    await this.genTextImg();
    this.progress = 30;

    log.info('【%s】生成主图', this.id);
    await this.genMainImg();
    this.progress = 50;

    log.info('【%s】计算内容高度', this.id);
    this.calcContentHeight();
    this.progress = 60;

    log.info('【%s】生成背景图', this.id);
    await this.genBgImg();
    this.progress = 70;

    log.info('【%s】生成主图阴影遮罩', this.id);
    await this.genMainImgShadow();
    this.progress = 90;

    log.info('【%s】图片合成...', this.id);
    await this.composite();
    this.progress = 100;

    this.delCacheFile();
  }

  async genBgImg() {
    const toFilePath: string = this.outputFileNames.bg;
    this.clacBgImgSize(this.contentH);
    const { w, h } = this.material.bg;

    if (this.outputOpt.solid_bg) {
      await this.genSolidImg(w, h, toFilePath);
    } else {
      await this.genBlurImg(w, h, toFilePath);
    }

    this.material.main[0].left = Math.round((this.material.bg.w - this.material.main[0].w) / 2);
    this.material.main[0].top += Math.round((this.material.bg.h - this.contentH) / 2);
  }

  async genMainImg() {
    const toFilePath: string = this.outputFileNames.main;
    if (!this.isInit) throw NotInit;
    await sharp(this.path)
      .rotate()
      .withMetadata({ density: this.meta.density })
      .toFormat('jpeg', { quality: 100 })
      .toFile(toFilePath);

    this.material.main.push({
      path: toFilePath,
      w: this.sizeInfo.w,
      h: this.sizeInfo.h,
      top: 0,
      left: 0,
    });
  }

  async genTextImg() {
    const [p, r, j] = usePromise();
    let timer: NodeJS.Timeout;

    const handler: Parameters<typeof genTextImgQueue.on>[number] = async ({ id, textImgList = [] }) => {
      if (id === this.id) {
        this.material.text = textImgList.map((i) => ({
          path: '',
          buf: Buffer.from(i.data.split(',')[1], 'base64'),
          w: i.w,
          h: i.h,
          top: 0,
          left: 0,
        }));

        if (import.meta.env.DEV) {
          tryCatch(() => {
            for (const { buf } of this.material.text) {
              fs.writeFileSync(join(`${this.outputFileNames.base}_${Date.now() + Math.random()}.png`), buf);
            }
          }, null, (e) => log.error('文字图片写入异常', e));
        }

        clearTimeout(timer);
        genTextImgQueue.off(handler);
        r(true);
      }
    };

    timer = setTimeout(() => {
      log.error('【%s】水印文字图片生成超时', this.id);
      genTextImgQueue.off(handler);
      j(new Error('水印文字图片生成超时'));
    }, 20e3);

    genTextImgQueue.on(handler);

    mainApp.win.webContents.send(routerConfig.on.genTextImg, {
      id: this.id,
      exif: this.exif || {},
      bgHeight: this.material.bg.h,
      options: config.options,
      fields: [...config.tempFields, ...config.customTempFields],
      temps: config.temps,
      logoPath: paths.logo,
    });

    return p;
  }

  async composite() {
    const composite: sharp.OverlayOptions[] = [];

    // 主图
    for (const img of this.material.main) {
      composite.push({ input: img.path, top: img.top, left: img.left });
    }

    // 背景
    composite.push({ input: this.outputFileNames.mask, gravity: sharp.gravity.center });

    // 文字
    if (this.material.text?.length) {
      const textCompositeList: sharp.OverlayOptions[] = [];
      for (let i = this.material.text.length - 1; i >= 0; i--) {
        const text = this.material.text[i];
        const _composite: sharp.OverlayOptions = {
          input: text.buf,
          left: Math.round((this.material.bg.w - text.w) / 2),
        };

        if (!textCompositeList.length) {
          _composite.top = Math.round(this.material.bg.h - text.h);
        } else {
          _composite.top = Math.round(textCompositeList[textCompositeList.length - 1].top - text.h);
        }

        textCompositeList.push(_composite);
      }

      composite.push(...textCompositeList);
    }

    await sharp({
      create: {
        channels: 3,
        width: this.material.bg.w,
        height: this.material.bg.h,
        background: {
          r: 255,
          g: 255,
          b: 255,
        },
      },
    })
      .withMetadata({ density: this.meta.density })
      .composite(composite)
      .toFormat('jpeg', { quality: 100 })
      .toFile(this.outputFileNames.composite);

    log.info('【%s】图片合成完毕，输出到文件: ', this.id, this.outputFileNames.composite);
    return true;
  }

  private getFFmpeg() {
    const _path = ffmpegPath.path.includes('app.asar') ? ffmpegPath.path.replace('app.asar', 'app.asar.unpacked') : ffmpegPath.path;
    fluentFfmpeg.setFfmpegPath(_path);
    return fluentFfmpeg();
  }

  private async genBlurImg(width: number, height: number, toFilePath: string) {
    const ffmpeg = this.getFFmpeg();

    // 统一转成固定大小，方便控制模糊数值
    await sharp(this.path)
      .rotate()
      .resize({ width: 3025, height: 3025, fit: 'fill' })
      .toFormat('jpeg', { quality: 50 })
      .toFile(toFilePath);

    const [promise, r] = usePromise();

    /**
     * luma_radius (lr)：控制在亮度（Luma）通道上的模糊半径。它决定了在视频的亮度通道上应用模糊的程度。较大的值将导致更大的模糊效果。默认值为 2。
     * chroma_radius (cr)：控制在色度（Chroma）通道上的模糊半径。它决定了在视频的色度通道上应用模糊的程度。较大的值将导致更大的模糊效果。默认值为 2。
     * luma_power (lp)：控制在亮度通道上应用模糊的程度。较大的值将导致更多的模糊效果。默认值为 1。chroma_radius (cr)：控制在色度（Chroma）通道上的模糊半径。它决定了在视频的色度通道上应用模糊的程度。较大的值将导致更大的模糊效果。默认值为 2。
     * chroma_power (cp)：控制在色度通道上应用模糊的程度。较大的值将导致更多的模糊效果。默认值为 1。
     */
    // 模糊
    ffmpeg.input(toFilePath)
      .outputOptions('-vf', `boxblur=${this.blur}:2`)
      .saveToFile(toFilePath)
      .on('end', () => r(true))
      .on('error', (e) => {
        log.error('FFmpeg模糊异常', e);
        r(false);
      });

    if (!await promise) return;

    const buf = await sharp(toFilePath)
      .resize({ width, height, fit: 'fill' })
      .toBuffer();
    fs.writeFileSync(toFilePath, buf);
  }

  private async genSolidImg(width: number, height: number, toFilePath: string, color?: string | RGBA) {
    return sharp({
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
      .toFormat('jpeg')
      .toFile(toFilePath);
  }

  private delCacheFile() {
    for (const k in this.outputFileNames) {
      if (k === 'composite') continue;

      const _path = (this.outputFileNames as any)[k];
      if (fs.existsSync(_path)) {
        tryCatch(() => fs.rmSync(_path));
      }
    }
  }

  async genMainImgShadow() {
    const [p, r, j] = usePromise();
    let timer: NodeJS.Timeout;

    const handler: Parameters<typeof genMainImgShadowQueue.on>[number] = async ({ id, data }) => {
      if (id === this.id) {
        fs.writeFileSync(this.outputFileNames.mask, Buffer.from(data.split(',')[1], 'base64'));
        clearTimeout(timer);
        r(true);
        genMainImgShadowQueue.off(handler);
      }
    };

    timer = setTimeout(() => {
      log.error('【%s】图片阴影生成超时', this.id);
      genMainImgShadowQueue.off(handler);
      j(new Error('图片阴影生成超时'));
    }, 20e3);

    genMainImgShadowQueue.on(handler);
    mainApp.win.webContents.send(routerConfig.on.genMainImgShadow, {
      id: this.id,
      material: this.material,
      options: config.options,
    });

    return p;
  }

  /**
   * @param height - 指定内容高度，默认为创建时的输入的图片高度
   */
  clacBgImgSize(height: number = this.sizeInfo.h) {
    if (!this.isInit) throw NotInit;

    let resetHeight = this.sizeInfo.resetH;
    let resetWidth = this.sizeInfo.resetW;

    const whRate = resetWidth / resetHeight;

    // 按照重置后的宽高比算出适合内容高度的宽度
    if (height) {
      resetHeight = height;
      resetWidth = Math.ceil(resetHeight * whRate);
    }
    else {
      // 主图高度比重置后的高度高，需要使用主图高度作为最终高度
      const validHeight = this.sizeInfo.h > resetHeight ? this.sizeInfo.h : resetHeight;
      resetHeight = validHeight;
      resetWidth = Math.ceil(resetHeight * whRate);
    }

    // 如果重置后，宽度太窄，则等比扩大宽高
    const mainImgWidthRate = (this.outputOpt.main_img_w_rate || 90) / 100;
    if (this.sizeInfo.w / resetWidth > mainImgWidthRate) {
      resetWidth = Math.ceil(this.sizeInfo.w / mainImgWidthRate);
      resetHeight = Math.ceil(resetWidth / whRate);
    }

    this.material.bg = {
      path: this.outputFileNames.bg,
      h: resetHeight,
      w: resetWidth,
      top: 0,
      left: 0,
    };
  }

  calcContentHeight() {
    const opt = this.outputOpt;
    const bgHeight = this.material.bg.h;
    const mainImgTopOffset = bgHeight * 0.036;
    const textButtomOffset = bgHeight * 0.027;

    // 主图上下间隔最小间隔
    let contentTop = Math.ceil(mainImgTopOffset);
    let mainImgOffset = contentTop * 2;

    // 阴影宽度
    if (opt.shadow_show) {
      const shadowHeight = Math.ceil(this.material.main[0].h * ((opt.shadow || 0) / 100));
      contentTop = Math.ceil(shadowHeight);
      mainImgOffset = contentTop * 2;
    }

    // 有文字时文字与主图的间隔要小于主图对顶部的间隔，并且底部间隔使用文字对底部的间隔
    if (this.material.text.length) {
      mainImgOffset *= 3 / 4;
      mainImgOffset += textButtomOffset;
    }

    // 文本高度
    const textH = this.material.text.reduce((n, i) => {
      n += i.h;
      return n;
    }, 0);

    // 生成背景图片
    const contentH = Math.ceil(textH + this.material.main[0].h + mainImgOffset);

    this.material.main[0].top = contentTop;
    this.contentH = contentH;

    if (this.material.text?.length) {
      this.material.text[this.material.text.length - 1].h += textButtomOffset;
    }
  }

  emit<U extends keyof EventMap>(
    event: U,
    ...args: Parameters<EventMap[U]>
  ): boolean {
    return super.emit(event, ...args);
  }

  off<U extends keyof EventMap>(
    eventName: U,
    listener: EventMap[U],
  ): this {
    super.off(eventName, listener);
    return this;
  }

  on<U extends keyof EventMap>(
    event: U,
    listener: EventMap[U],
  ): this {
    super.on(event, listener);
    return this;
  }

  once<U extends keyof EventMap>(
    event: U,
    listener: EventMap[U],
  ): this {
    super.once(event, listener);
    return this;
  }
}
