import type { Exif } from '@modules/exiftool/interface'
import type { IConfig } from '@src/interface'
import type { RGBA } from 'sharp'

import type { ImageToolOption, Material, OutputFilePaths, SizeInfo } from './interface'
import type { ContentLayout } from './layout'
import { Buffer } from 'node:buffer'
import Event from 'node:events'
import fs from 'node:fs'
import { join } from 'node:path'
import ffmpegPath from '@ffmpeg-installer/ffmpeg'
import { ExifTool } from '@modules/exiftool'
import { Logger } from '@modules/logger'
import routerConfig from '@root/router-config'
import { mainApp } from '@src/common/app'
import { genMainImgShadowQueue, genTextImgQueue } from '@src/common/queue'
import { config } from '@src/config'
import paths from '@src/path'
import { getFileName, md5, tryCatch, usePromise } from '@utils'
import fluentFfmpeg from 'fluent-ffmpeg'

import sharp from 'sharp'

import { calcContentLayout, calcTextStartTop, calcTextTops } from './layout'

const log = new Logger('ImageTool')
const NotInit = Symbol('未初始化')

interface EventMap {
  progress: (id: string, progress: number) => void
}

export class ImageTool extends Event {
  private isInit: boolean

  private isCancelled = false

  readonly id: string

  readonly path: string

  readonly name: string

  private outputOpt: IConfig['options']

  private outputFileNames: OutputFilePaths

  private meta: sharp.Metadata

  private sizeInfo: SizeInfo

  private blur = 200

  private exif: Exif

  private _progress = 0

  private material: Material = {
    bg: undefined,
    main: [],
    text: [],
  }

  private contentH: number

  /**
   * 内容布局信息（文本位置、间隔等）
   */
  private layout: ContentLayout

  // eslint-disable-next-line accessor-pairs
  set progress(n: number) {
    this._progress = n
    this.emit('progress', this.id, this._progress)
  }

  constructor(path: string, name: string, opt: ImageToolOption) {
    super()

    this.path = path
    this.name = name
    this.outputOpt = opt.outputOption
    this.id = md5(`${md5(path)}${Math.random()}${Date.now()}`)

    const baseFilePath = join(opt.cachePath, this.id)
    this.outputFileNames = {
      base: baseFilePath,
      bg: `${baseFilePath}_bg.jpg`,
      bgSrc: `${baseFilePath}_bg_src.jpg`,
      bgBlur: `${baseFilePath}_bg_blur.jpg`,
      main: `${baseFilePath}_main.jpg`,
      mask: `${baseFilePath}_mask.png`,
      composite: join(opt.outputPath, getFileName(opt.outputPath, name)),
    }
  }

  cancel() {
    this.isCancelled = true
    log.info('【%s】任务已取消', this.id)
  }

  async init() {
    if (this.isInit) return
    this.isInit = true

    // 准备基础信息
    const imgSharp = sharp(this.path).rotate()

    this.meta = await imgSharp.metadata()
    const { info: imgInfo } = await imgSharp.toBuffer({ resolveWithObject: true })
    this.sizeInfo = {
      w: imgInfo.width,
      h: imgInfo.height,
      resetW: imgInfo.width,
      resetH: imgInfo.height,
    }

    const { outputOpt } = this

    // 重置宽高比
    if (outputOpt.bg_rate_show && outputOpt.bg_rate.w && outputOpt.bg_rate.h) {
      const rate = +outputOpt.bg_rate.w / +outputOpt.bg_rate.h

      if (this.sizeInfo.w >= this.sizeInfo.h) {
        this.sizeInfo.resetH = Math.round(this.sizeInfo.w / rate)
      }
      else {
        this.sizeInfo.resetW = Math.round(this.sizeInfo.h * rate)
      }
    }

    // 横屏输出
    const width = outputOpt.landscape && this.sizeInfo.resetW < this.sizeInfo.resetH
      ? this.sizeInfo.resetH
      : this.sizeInfo.resetW
    const height = outputOpt.landscape && this.sizeInfo.resetW < this.sizeInfo.resetH
      ? this.sizeInfo.resetW
      : this.sizeInfo.resetH

    this.sizeInfo.resetW = width
    this.sizeInfo.resetH = height

    // 获取相机信息
    const exiftool = new ExifTool(this.path)
    this.exif = exiftool.parse()
  }

  async genWatermark() {
    this.progress = 1
    log.info('【%s】初始化基础数据', this.id)
    await this.init()
    this.progress = 10

    log.info('【%s】初步计算背景图片大小', this.id)
    this.clacBgImgSize()
    this.progress = 20

    log.info('【%s】生成文本图片', this.id)
    await this.genTextImg()
    this.progress = 30

    log.info('【%s】生成主图', this.id)
    await this.genMainImg()
    this.progress = 50

    log.info('【%s】计算内容高度', this.id)
    this.calcContentHeight()
    this.progress = 60

    log.info('【%s】生成背景图', this.id)
    await this.genBgImg()
    this.progress = 70

    log.info('【%s】生成主图阴影遮罩', this.id)
    await this.genMainImgShadow()
    this.progress = 90

    log.info('【%s】图片合成...', this.id)
    await this.composite()
    this.progress = 100

    this.delCacheFile()
  }

  async genPreview() {
    log.info('【%s】生成预览图...', this.id)
    if (this.isCancelled) return null
    await this.init()
    if (this.isCancelled) return null
    this.clacBgImgSize()
    if (this.isCancelled) return null
    await this.genTextImg()
    if (this.isCancelled) return null
    await this.genMainImg()
    if (this.isCancelled) return null
    this.calcContentHeight()
    if (this.isCancelled) return null
    await this.genBgImg()
    if (this.isCancelled) return null
    await this.genMainImgShadow()
    if (this.isCancelled) return null
    const res = await this.composite(true)
    this.delCacheFile()
    return res
  }

  async genBgImg() {
    const toFilePath: string = this.outputFileNames.bg
    this.clacBgImgSize(this.contentH)
    const { w, h } = this.material.bg

    if (this.outputOpt.solid_bg) {
      await this.genSolidImg(w, h, toFilePath)
    }
    else {
      await this.genBlurImg(w, h, toFilePath)
    }

    this.material.main[0].left = Math.round((this.material.bg.w - this.material.main[0].w) / 2)
    this.material.main[0].top += Math.round((this.material.bg.h - this.contentH) / 2)
  }

  async genMainImg() {
    const toFilePath: string = this.outputFileNames.main
    if (!this.isInit) throw NotInit
    await sharp(this.path)
      .rotate()
      .withMetadata({ density: this.meta.density })
      .toFormat('jpeg', { quality: 100 })
      .toFile(toFilePath)

    this.material.main.push({
      path: toFilePath,
      w: this.sizeInfo.w,
      h: this.sizeInfo.h,
      top: 0,
      left: 0,
    })
  }

  async genTextImg() {
    if (this.isCancelled) return
    const [p, r, j] = usePromise()
    let timer: NodeJS.Timeout

    const handler: Parameters<typeof genTextImgQueue.on>[number] = async ({ id, textImgList = [] }) => {
      if (id === this.id) {
        if (this.isCancelled) {
          clearTimeout(timer)
          genTextImgQueue.off(handler)
          r(false)
          return
        }
        this.material.text = textImgList.map(i => ({
          path: '',
          buf: Buffer.from(i.data.split(',')[1], 'base64'),
          w: i.w,
          h: i.h,
          top: 0,
          left: 0,
        }))

        if (import.meta.env.DEV) {
          tryCatch(() => {
            for (const { buf } of this.material.text) {
              fs.writeFileSync(join(`${this.outputFileNames.base}_${Date.now() + Math.random()}.png`), buf)
            }
          }, null, e => log.error('文字图片写入异常', e))
        }

        clearTimeout(timer)
        genTextImgQueue.off(handler)
        r(true)
      }
    }

    timer = setTimeout(() => {
      log.error('【%s】水印文字图片生成超时', this.id)
      genTextImgQueue.off(handler)
      j(new Error('水印文字图片生成超时'))
    }, 20e3)

    genTextImgQueue.on(handler)

    mainApp.win.webContents.send(routerConfig.on.genTextImg, {
      id: this.id,
      exif: this.exif || {},
      bgHeight: this.material.bg.h,
      options: config.options,
      fields: [...config.tempFields, ...config.customTempFields],
      temps: config.temps,
      logoPath: paths.logo,
    })

    return p
  }

  async composite(isPreview = false) {
    const composite: sharp.OverlayOptions[] = []

    // 主图
    for (const img of this.material.main) {
      composite.push({ input: img.path, top: Math.round(img.top), left: Math.round(img.left) })
    }

    // 背景
    composite.push({ input: this.outputFileNames.mask, gravity: sharp.gravity.center })

    // 文字
    if (this.material.text?.length) {
      const textHeights = this.material.text.map(i => i.h)
      // 文本在照片上方时贴着顶部排列，在下方时贴着底部排列
      const startTop = calcTextStartTop(
        this.layout.textTop,
        this.material.bg.h,
        textHeights,
        this.layout.textEdgeOffset,
        this.layout.bottomMargin,
      )
      const textTops = calcTextTops(textHeights, startTop)

      const textCompositeList: sharp.OverlayOptions[] = this.material.text.map((text, i) => ({
        input: text.buf,
        left: Math.round((this.material.bg.w - text.w) / 2),
        top: Math.round(textTops[i]),
      }))

      composite.push(...textCompositeList)
    }

    const output = sharp({
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
      .toFormat('jpeg', { quality: isPreview ? 70 : (this.outputOpt.quality || 100) })

    if (isPreview) {
      const buf = await output.toBuffer()
      return `data:image/jpeg;base64,${buf.toString('base64')}`
    }

    await output.toFile(this.outputFileNames.composite)

    log.info('【%s】图片合成完毕，输出到文件: ', this.id, this.outputFileNames.composite)
    return true
  }

  private getFFmpeg() {
    const _path = ffmpegPath.path.includes('app.asar') ? ffmpegPath.path.replace('app.asar', 'app.asar.unpacked') : ffmpegPath.path
    fluentFfmpeg.setFfmpegPath(_path)
    return fluentFfmpeg()
  }

  /**
   * 写入文件，失败时重试
   *
   * Windows 上文件句柄有时会晚一点释放（例如 ffmpeg 刚写完的文件），
   * 立刻写入会报 `UNKNOWN: unknown error, open xxx`
   */
  private async writeFileRetry(filePath: string, data: Buffer, times = 30) {
    for (let i = 0; ; i++) {
      try {
        fs.writeFileSync(filePath, data)
        return
      }
      catch (e) {
        if (i >= times) throw e
        await sleep(200)
      }
    }
  }

  private async genBlurImg(width: number, height: number, toFilePath: string) {
    const ffmpeg = this.getFFmpeg()

    // 不能让 ffmpeg 与输入共用同一个文件：Windows 上原地覆盖后句柄可能还没释放，
    // 紧接着写入会失败（UNKNOWN: unknown error），这里改成中间文件 + 最后统一写入
    const srcPath = this.outputFileNames.bgSrc
    const blurPath = this.outputFileNames.bgBlur

    // 统一转成固定大小，方便控制模糊数值
    await sharp(this.path)
      .rotate()
      .resize({ width: 3025, height: 3025, fit: 'fill' })
      .toFormat('jpeg', { quality: 50 })
      .toFile(srcPath)

    const [promise, r] = usePromise()

    /**
     * luma_radius (lr)：控制在亮度（Luma）通道上的模糊半径。它决定了在视频的亮度通道上应用模糊的程度。较大的值将导致更大的模糊效果。默认值为 2。
     * chroma_radius (cr)：控制在色度（Chroma）通道上的模糊半径。它决定了在视频的色度通道上应用模糊的程度。较大的值将导致更大的模糊效果。默认值为 2。
     * luma_power (lp)：控制在亮度通道上应用模糊的程度。较大的值将导致更多的模糊效果。默认值为 1。chroma_radius (cr)：控制在色度（Chroma）通道上的模糊半径。它决定了在视频的色度通道上应用模糊的程度。较大的值将导致更大的模糊效果。默认值为 2。
     * chroma_power (cp)：控制在色度通道上应用模糊的程度。较大的值将导致更多的模糊效果。默认值为 1。
     */
    // 模糊
    ffmpeg.input(srcPath)
      .outputOptions('-vf', `boxblur=${Math.ceil(this.blur * ((this.outputOpt.bg_blur || 100) / 100))}:2`)
      .saveToFile(blurPath)
      .on('end', () => r(true))
      .on('error', (e) => {
        log.error('FFmpeg模糊异常', e)
        r(false)
      })

    if (!await promise) {
      // 模糊失败时退化成未模糊的图片，保证后续流程仍然能出图
      const fallback = tryCatch(() => fs.readFileSync(srcPath), null)
      if (fallback) await this.writeFileRetry(toFilePath, fallback)
      return
    }

    const buf = await sharp(blurPath)
      .resize({ width, height, fit: 'fill' })
      .toBuffer()
    await this.writeFileRetry(toFilePath, buf)
  }

  private async genSolidImg(width: number, height: number, toFilePath: string, color?: string | RGBA) {
    return sharp({
      create: {
        channels: 3,
        width,
        height,
        background: (typeof color === 'string' ? color : this.outputOpt.solid_color) || '#fff',
      },
    })
      .toFormat('jpeg')
      .toFile(toFilePath)
  }

  private delCacheFile() {
    for (const k in this.outputFileNames) {
      if (k === 'composite') continue

      const _path = (this.outputFileNames as any)[k]
      if (fs.existsSync(_path)) {
        tryCatch(() => fs.rmSync(_path))
      }
    }
  }

  async genMainImgShadow() {
    if (this.isCancelled) return
    const [p, r, j] = usePromise()
    let timer: NodeJS.Timeout

    // 限制生成宽高，生成后再缩放回来
    let rate = 1
    if (this.material.bg.w > 10240) {
      rate = 10240 / this.material.bg.w
    }

    const handler: Parameters<typeof genMainImgShadowQueue.on>[number] = async ({ id, data }) => {
      if (id === this.id) {
        if (this.isCancelled) {
          clearTimeout(timer)
          genMainImgShadowQueue.off(handler)
          r(false)
          return
        }
        fs.writeFileSync(this.outputFileNames.mask, Buffer.from(data.split(',')[1], 'base64'))

        if (rate !== 1) {
          await sharp(this.outputFileNames.mask)
            .resize({ width: this.material.bg.w, height: this.material.bg.h, fit: 'fill' })
            .toFormat('png')
            .toFile(`${this.outputFileNames.mask}catch.png`)
          fs.rmSync(this.outputFileNames.mask)
          fs.renameSync(`${this.outputFileNames.mask}catch.png`, this.outputFileNames.mask)
        }

        clearTimeout(timer)
        r(true)
        genMainImgShadowQueue.off(handler)
      }
    }

    timer = setTimeout(() => {
      log.error('【%s】图片阴影生成超时', this.id)
      genMainImgShadowQueue.off(handler)
      j(new Error('图片阴影生成超时'))
    }, 20e3)

    genMainImgShadowQueue.on(handler)
    mainApp.win.webContents.send(routerConfig.on.genMainImgShadow, {
      id: this.id,
      material: this.material,
      options: config.options,
      rate,
    })

    return p
  }

  /**
   * @param height - 指定内容高度，默认为创建时的输入的图片高度
   */
  clacBgImgSize(height: number = this.sizeInfo.h) {
    if (!this.isInit) throw NotInit

    let resetHeight = this.sizeInfo.resetH
    let resetWidth = this.sizeInfo.resetW

    const whRate = resetWidth / resetHeight

    // 按照重置后的宽高比算出适合内容高度的宽度
    if (height) {
      resetHeight = height
      resetWidth = Math.ceil(resetHeight * whRate)
    }
    else {
      // 主图高度比重置后的高度高，需要使用主图高度作为最终高度
      const validHeight = this.sizeInfo.h > resetHeight ? this.sizeInfo.h : resetHeight
      resetHeight = validHeight
      resetWidth = Math.ceil(resetHeight * whRate)
    }

    // 如果重置后，宽度太窄，则等比扩大宽高
    const mainImgWidthRate = (this.outputOpt.main_img_w_rate || 90) / 100
    if (this.sizeInfo.w / resetWidth > mainImgWidthRate) {
      resetWidth = Math.ceil(this.sizeInfo.w / mainImgWidthRate)
      resetHeight = Math.ceil(resetWidth / whRate)
    }

    this.material.bg = {
      path: this.outputFileNames.bg,
      h: resetHeight,
      w: resetWidth,
      top: 0,
      left: 0,
    }
  }

  calcContentHeight() {
    const layout = calcContentLayout(
      this.outputOpt,
      this.material.bg.h,
      this.material.main[0].h,
      this.material.text.map(i => i.h),
    )

    this.layout = layout
    this.contentH = layout.contentH
    this.material.main[0].top = layout.mainTop
  }

  emit<U extends keyof EventMap>(
    event: U,
    ...args: Parameters<EventMap[U]>
  ): boolean {
    return super.emit(event, ...args)
  }

  off<U extends keyof EventMap>(
    eventName: U,
    listener: EventMap[U],
  ): this {
    super.off(eventName, listener)
    return this
  }

  on<U extends keyof EventMap>(
    event: U,
    listener: EventMap[U],
  ): this {
    super.on(event, listener)
    return this
  }

  once<U extends keyof EventMap>(
    event: U,
    listener: EventMap[U],
  ): this {
    super.once(event, listener)
    return this
  }
}
