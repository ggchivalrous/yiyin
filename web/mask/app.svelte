<script lang="ts">
  import { config } from '@web/store/config';
  import modelMap from '@web-utils/model-map';

  import type { ExifInfo, IBoxShadowMarkOption, IFontInfo, IImgFileInfo, ITaskInfo } from './interface';
  import { calcAverageBrightness, importFont, loadImage } from './main';

  let canvas: HTMLCanvasElement;
  let taskList: ITaskInfo[] = [];
  let processing = false;
  let fontList: IFontInfo[] = [];

  $: startCreateTask(taskList);
  $: formatFontMap($config.fontMap);
  $: importFont(fontList);

  window.api['on:createMask']((info: ITaskInfo) => {
    console.log(info);
    taskList.push(info);
    taskList = taskList;
  });

  async function startCreateTask(list: ITaskInfo[]) {
    if (processing) return;

    processing = true;
    for (let i = 0; i < list.length; i++) {
      const task = taskList[i];

      try {
        const blurImg = await loadImage(task.blur);
        const scaleImg = await loadImage(task.scale);
        const textImgList = createTextList(task.exifInfo, [
          {
            text: '{Make} {Model}',
            opts: {
              size: task.scale.height * 0.04,
              color: task.option.solid_bg ? '#000' : '#fff',
              font: task.option.font,
              bold: true,
            },
          },
          {
            text: '{FocalLength}  {FNumber}  {ExposureTime}  {ISO}',
            opts: {
              size: task.scale.height * 0.025,
              color: task.option.solid_bg ? '#000' : '#fff',
              font: task.option.font,
              bold: true,
            },
          },
        ]);

        const maskUrl = await createBoxShadowMark(canvas, {
          img: blurImg,
          contentImg: scaleImg,
          textImgList,
          shadow: {
            blur: task.option.shadow_show ? task.blur.height * ((task.option.shadow || 6) / 100) : 0,
            offsetX: 0,
            offsetY: 0,
          },
          radius: task.option.radius_show ? task.blur.height * ((task.option.radius || 2.1) / 100) : 0,
          option: task.option,
        });

        await window.api.composite({
          name: task.name,
          md5: task.md5,
          mask: maskUrl,
          text: textImgList,
          option: task.option,
        });
      } catch (e) {
        console.log(e);
      }
    }
    taskList = [];
    processing = false;
  }

  function createBoxShadowMark(_canvas: HTMLCanvasElement, option: IBoxShadowMarkOption) {
    _canvas.width = option.img.width;
    _canvas.height = option.img.height;
    const ctx = _canvas.getContext('2d');

    if (option.img) {
      ctx.drawImage(option.img, 0, 0, _canvas.width, _canvas.height);

      // 添加黑色蒙层，突出主体图片
      if (!option.option.solid_bg) {
        const averageBrightness = calcAverageBrightness(ctx, _canvas.width, _canvas.height);
        if (averageBrightness < 15) {
          ctx.fillStyle = 'rgba(180, 180, 180, 0.2)'; // 灰色半透明覆盖层
        } else if (averageBrightness < 20) {
          ctx.fillStyle = 'rgba(158, 158, 158, 0.2)'; // 灰色半透明覆盖层
        } else if (averageBrightness < 40) {
          ctx.fillStyle = 'rgba(128, 128, 128, 0.2)'; // 灰色半透明覆盖层
        } else {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        }

        ctx.fillRect(0, 0, _canvas.width, _canvas.height);
        ctx.fillStyle = 'black';
      }
    }

    let heightPosition = 3;
    if ((!option.option.ext_show && !option.option.brand_show) || !option.textImgList.length) {
      heightPosition = 2;
    }

    const contentOffsetX = Math.round((_canvas.width - option.contentImg.width) / 2);
    const contentOffsetY = Math.round((_canvas.height - option.contentImg.height) / heightPosition);

    if (option.shadow.blur) {
      ctx.shadowOffsetX = option.shadow.offsetX || 0; // 阴影水平偏移
      ctx.shadowOffsetY = option.shadow.offsetY || 0; // 阴影垂直偏移
      ctx.shadowBlur = option.shadow.blur; // 阴影模糊范围
      ctx.shadowColor = '#000'; // 阴影颜色
    }

    const rectX = contentOffsetX || ctx.shadowBlur;
    const rectY = contentOffsetY || ctx.shadowBlur;
    const rectWidth = option.contentImg.width;
    const rectHeight = option.contentImg.height;
    const cornerRadius = option.radius;

    ctx.beginPath();
    ctx.moveTo(rectX + cornerRadius, rectY);
    ctx.lineTo(rectX + rectWidth - cornerRadius, rectY);
    ctx.arcTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + cornerRadius, cornerRadius);
    ctx.lineTo(rectX + rectWidth, rectY + rectHeight - cornerRadius);
    ctx.arcTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - cornerRadius, rectY + rectHeight, cornerRadius);
    ctx.lineTo(rectX + cornerRadius, rectY + rectHeight);
    ctx.arcTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - cornerRadius, cornerRadius);
    ctx.lineTo(rectX, rectY + cornerRadius);
    ctx.arcTo(rectX, rectY, rectX + cornerRadius, rectY, cornerRadius);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(rectX + cornerRadius, rectY);
    ctx.lineTo(rectX + rectWidth - cornerRadius, rectY);
    ctx.arcTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + cornerRadius, cornerRadius);
    ctx.lineTo(rectX + rectWidth, rectY + rectHeight - cornerRadius);
    ctx.arcTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - cornerRadius, rectY + rectHeight, cornerRadius);
    ctx.lineTo(rectX + cornerRadius, rectY + rectHeight);
    ctx.arcTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - cornerRadius, cornerRadius);
    ctx.lineTo(rectX, rectY + cornerRadius);
    ctx.arcTo(rectX, rectY, rectX + cornerRadius, rectY, cornerRadius);
    ctx.closePath();
    ctx.clip();
    ctx.clearRect(rectX, rectY, rectWidth, rectHeight);

    return _canvas.toDataURL('image/png');
  }

  function createCanvas(w: number, h: number) {
    const _canvas = document.createElement('canvas');
    _canvas.width = w;
    _canvas.height = h;
    return _canvas;
  }

  function formatFontMap(fontMap: Record<string, string>) {
    if (fontMap) {
      const list = [];
      for (const key in fontMap) {
        list.push({
          name: key,
          path: `file://${$config.fontDir}/${fontMap[key]}`,
        });
      }

      fontList = list;
    }
  }

  function formatExifInfo(exifInfo: ExifInfo) {
    const exif: Record<keyof ExifInfo, string | number> = { ...exifInfo };
    exif.Make = modelMap.INIT.make_filter(exifInfo.Make).trim();

    const _modelMap = Object.assign(modelMap.DEF, modelMap[exif.Make]);

    exif.Model = _modelMap.model_filter(exifInfo.Model.replace(exif.Make, ''))?.trim() || '';
    exif.Make = _modelMap.make_filter(exif.Make)?.trim() || '';

    if (exifInfo.FocalLength) {
      exif.FocalLength = `${exifInfo.FocalLength}mm`;
    }

    if (exifInfo.FNumber) {
      exif.FNumber = `f/${exifInfo.FNumber}`;
    }

    if (exifInfo.ExposureTime) {
      if (exifInfo.ExposureTime < 1) {
        exif.ExposureTime = `1/${Math.round(1 / exifInfo.ExposureTime)}s`;
      } else {
        exif.ExposureTime = `${exifInfo.ExposureTime}s`;
      }
    }

    if (exifInfo.ISO) {
      exif.ISO = `ISO${exifInfo.ISO}`;
    }

    // 强制使用自定义参数
    if ($config.cameraInfo.Force) {
      for (const field in $config.cameraInfo) {
        const info = $config.cameraInfo[field as keyof typeof $config.cameraInfo];
        if (info.use) {
          exif[field as keyof ExifInfo] = info.value as never;
        }
      }
    } else { // 非强制使用，则使用自定义参数补空
      for (const field in $config.cameraInfo) {
        const info = $config.cameraInfo[field as keyof typeof $config.cameraInfo];
        if (info.use && !exif[field as keyof ExifInfo]) {
          exif[field as keyof ExifInfo] = info.value as never;
        }
      }
    }

    return exif;
  }

  interface ITextOption {
    size: number
    font?: string
    color?: string
    bold?: boolean
    height?: number
    /**
     * 斜体
     */
    italic?: boolean
  }

  interface ITextItem {
    text: string
    opts: ITextOption
  }

  function createTextList(exifInfo: ExifInfo, arr: ITextItem[]): IImgFileInfo[] {
    const _exifInfo = formatExifInfo(exifInfo);

    return arr.map(({ text, opts }) => {
      for (const field in _exifInfo) {
        text = text.replaceAll(`{${field}}`, `${_exifInfo[field as keyof typeof _exifInfo]}`).trim();
      }
      return createTextImg(text, opts);
    });
  }

  function createTextFont(opts: ITextOption) {
    let font = '';

    if (opts.bold) {
      font += 'bold ';
    }

    if (opts.italic) {
      font += 'italic ';
    }

    if (opts.size) {
      font += `${opts.size}px `;
    }

    if (opts.font) {
      font += `${opts.font},`;
    }

    font += '"PingFang SC"';

    return font;
  }

  function createTextImg(text: string, opts: ITextOption): IImgFileInfo {
    const can = createCanvas(1, 1);
    const ctx = can.getContext('2d');
    ctx.font = createTextFont(opts);
    const textInfo = ctx.measureText(text);

    can.width = textInfo.width;
    can.height = opts.height || textInfo.actualBoundingBoxAscent + textInfo.actualBoundingBoxDescent;
    ctx.fillStyle = opts.color || '#000';
    ctx.font = createTextFont(opts);
    ctx.fillText(text, 0, textInfo.actualBoundingBoxAscent);

    return {
      width: can.width,
      height: can.height,
      path: can.toDataURL(),
    };
  }
</script>

<canvas bind:this={canvas} />
