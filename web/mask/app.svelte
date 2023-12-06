<script lang="ts">
  import { config } from '@web/store/config';
  import modelMap from '@web-utils/model-map';

  import type { ExifInfo, IBoxShadowMarkOption, IExifImgInfo, IFontInfo, IImgFileInfo, ITaskInfo, ITextImgOption, OutputSetting } from './interface';
  import { importFont, calcAverageBrightness, loadImage } from './main';

  let canvas: HTMLCanvasElement;
  let taskList: ITaskInfo[] = [];
  let processing = false;
  let fontList: IFontInfo[] = [];

  const defFont = 'PingFang SC';
  const ORIGIN_H = 3712;

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
        const textImgInfo = createExifImg(task.exifInfo, task.blur.height, task.option);

        const maskUrl = await createBoxShadowMark(canvas, {
          img: blurImg,
          contentImg: scaleImg,
          textImgInfo,
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
          text: textImgInfo,
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
    if ((!option.option.ext_show && !option.option.brand_show) || (!option.textImgInfo.title && !option.textImgInfo.info)) {
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

  function createTextImg(option: ITextImgOption): IImgFileInfo {
    const can = createCanvas(1, option.fontSize);
    const ctx = can.getContext('2d');
    const font = `bold ${option.fontSize}px ${option.font},'PingFang SC'`;
    ctx.font = font;
    const textInfo = ctx.measureText(option.text);
    can.width = textInfo.width;
    can.height = textInfo.actualBoundingBoxAscent + textInfo.actualBoundingBoxDescent;

    if (option.background) {
      ctx.fillStyle = option.background;
      ctx.fillRect(0, 0, can.width, can.height);
    }

    ctx.fillStyle = option.color || '#000000';
    ctx.font = font;
    ctx.fillText(option.text, 0, 0 + textInfo.actualBoundingBoxAscent);

    return {
      width: can.width,
      height: can.height,
      path: can.toDataURL(),
    };
  }

  function createExifImg(exifInfo: ExifInfo, maxHeight: number, option: OutputSetting) {
    const exif: IExifImgInfo = {
      title: null,
      info: null,
    };

    // 先对参数做格式化
    exifInfo = formatExifInfo(exifInfo);

    // 移除厂商和型号有重复内容
    let title = '';
    if (exifInfo.Make) {
      if (option.brand_show) {
        if (option.font === defFont) {
          title = exifInfo.Make;
        } else {
          title = exifInfo.Make[0] + exifInfo.Make.slice(1);
        }
      }
    }

    if (option.model_show && exifInfo.Model) {
      title += ` ${exifInfo.Model}`;
    }

    if (title) {
      exif.title = createTextImg({
        text: title,
        color: option.solid_bg ? '#000' : '#fff',
        fontSize: (option.ext_show ? 100 : 120) * (maxHeight / ORIGIN_H),
        font: option.font,
      });
    }

    if (option.ext_show) {
      const infoTextArr = [];

      if (exifInfo.FocalLength) {
        infoTextArr.push(`${exifInfo.FocalLength}mm`);
      }

      if (exifInfo.FNumber) {
        infoTextArr.push(`f/${exifInfo.FNumber}`);
      }

      if (exifInfo.ExposureTime) {
        if (exifInfo.ExposureTime < 1) {
          infoTextArr.push(`1/${Math.round(1 / exifInfo.ExposureTime)}s`);
        } else {
          infoTextArr.push(`${exifInfo.ExposureTime}s`);
        }
      }

      if (exifInfo.ISO) {
        infoTextArr.push(`ISO${exifInfo.ISO}`);
      }

      if (infoTextArr.length) {
        exif.info = createTextImg({
          text: infoTextArr.join(' '),
          color: option.solid_bg ? '#000' : '#fff',
          fontSize: 80 * (maxHeight / ORIGIN_H),
          font: option.font,
        });
      }
    }

    return exif;
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

  function getExifInfo(exifInfo: ExifInfo) {
    const _exifInfo: ExifInfo = { ...exifInfo };

    // 强制使用自定义参数
    if ($config.cameraInfo.Force) {
      for (const field in $config.cameraInfo) {
        const info = $config.cameraInfo[field as keyof typeof $config.cameraInfo];
        if (info.use) {
          _exifInfo[field as keyof ExifInfo] = info.value as never;
        }
      }

      return _exifInfo;
    }

    // 非强制使用，则使用自定义参数补空
    for (const field in $config.cameraInfo) {
      const info = $config.cameraInfo[field as keyof typeof $config.cameraInfo];
      if (info.use && !_exifInfo[field as keyof ExifInfo]) {
        _exifInfo[field as keyof ExifInfo] = info.value as never;
      }
    }

    return _exifInfo;
  }

  function formatExifInfo(exifInfo: ExifInfo) {
    const exif: ExifInfo = { ...exifInfo };
    exif.Make = modelMap.INIT.make_filter(exifInfo.Make).trim();

    const _modelMap = Object.assign(modelMap.DEF, modelMap[exif.Make]);

    exif.Model = _modelMap.model_filter(exif.Model.replace(exif.Make, ''))?.trim() || '';
    exif.Make = _modelMap.make_filter(exif.Make)?.trim() || '';

    return getExifInfo(exif);
  }
</script>

<canvas bind:this={canvas} />
