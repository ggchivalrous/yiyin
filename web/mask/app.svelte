<script lang="ts">
  import { config } from '@web/store/config';
  import modelMap from '@web-utils/model-map';

  import type { TExifInfo, ExifInfo, IBoxShadowMarkOption, IFontInfo, IImgFileInfo, ITaskInfo } from './interface';
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
        const textImgList = await createTextList(task.exifInfo, [
          {
            text: '{Make} {Model}',
            opts: {
              width: blurImg.width,
              size: task.blur.height * 0.03,
              // size: task.scale.height * 0.04,
              color: task.option.solid_bg ? '#000' : '#fff',
              font: task.option.font,
              bold: true,
            },
          },
          {
            text: '{FocalLength} {FNumber} {ExposureTime} {ISO} by {PersonalSign}',
            opts: {
              width: blurImg.width,
              size: task.blur.height * 0.02,
              // size: task.scale.height * 0.025,
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
    const exif: TExifInfo = {
      Make: { type: 'text', value: '', bImg: '', wImg: '' },
      Model: { type: 'text', value: '', bImg: '', wImg: '' },
      DateTimeOriginal: { type: 'text', value: '', bImg: '', wImg: '' },
      ExposureTime: { type: 'text', value: '', bImg: '', wImg: '' },
      FNumber: { type: 'text', value: '', bImg: '', wImg: '' },
      FocalLength: { type: 'text', value: '', bImg: '', wImg: '' },
      ISO: { type: 'text', value: '', bImg: '', wImg: '' },
      ExposureProgram: { type: 'text', value: '', bImg: '', wImg: '' },
      LensModel: { type: 'text', value: '', bImg: '', wImg: '' },
      LensMake: { type: 'text', value: '', bImg: '', wImg: '' },
    };

    exif.Make.value = modelMap.INIT.make_filter(exifInfo.Make).trim();
    const _modelMap = Object.assign(modelMap.DEF, modelMap[exif.Make.value]);

    if ($config.options.model_show) {
      exif.Model.value = _modelMap.model_filter(exifInfo.Model.replace(exif.Make.value, ''))?.trim() || '';
    }

    if ($config.options.brand_show) {
      exif.Make.value = _modelMap.make_filter(exif.Make.value)?.trim() || '';
    } else {
      exif.Make.value = '';
    }

    if (exifInfo.FocalLength) {
      exif.FocalLength.value = `${Math.round(exifInfo.FocalLength)}mm`;
    }

    if (exifInfo.FNumber) {
      exif.FNumber.value = `f/${exifInfo.FNumber}`;
    }

    if (exifInfo.ExposureTime) {
      if (exifInfo.ExposureTime < 1) {
        exif.ExposureTime.value = `1/${Math.round(1 / exifInfo.ExposureTime)}s`;
      } else {
        exif.ExposureTime.value = `${exifInfo.ExposureTime}s`;
      }
    }

    if (exifInfo.ISO) {
      exif.ISO.value = `ISO${exifInfo.ISO}`;
    }

    // 强制使用自定义参数
    if ($config.cameraInfo.Force.use) {
      for (const field in $config.cameraInfo) {
        const info = $config.cameraInfo[field as keyof typeof $config.cameraInfo];
        if (info.use) {
          exif[field as keyof ExifInfo] = exif[field as keyof ExifInfo] || { type: 'text', value: '', bImg: '', wImg: '' };
          exif[field as keyof ExifInfo].type = info.type;
          exif[field as keyof ExifInfo].value = `${info.value}`;
          exif[field as keyof ExifInfo].bImg = `${info.bImg}`;
          exif[field as keyof ExifInfo].wImg = `${info.wImg}`;
        }
      }
    } else { // 非强制使用，则使用自定义参数补空
      for (const field in $config.cameraInfo) {
        const info = $config.cameraInfo[field as keyof typeof $config.cameraInfo];
        if (info.use && !exif[field as keyof ExifInfo]?.value) {
          exif[field as keyof ExifInfo] = exif[field as keyof ExifInfo] || { type: 'text', value: '', bImg: '', wImg: '' };
          exif[field as keyof ExifInfo].type = info.type;
          exif[field as keyof ExifInfo].value = `${info.value}`;
          exif[field as keyof ExifInfo].bImg = `${info.bImg}`;
          exif[field as keyof ExifInfo].wImg = `${info.wImg}`;
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
    width?: number
    /**
     * 斜体
     */
    italic?: boolean
  }

  interface ITextItem {
    text: string
    opts: ITextOption
  }

  async function createTextList(exifInfo: ExifInfo, arr: ITextItem[]): Promise<IImgFileInfo[]> {
    const _exifInfo = formatExifInfo(exifInfo);
    const imgFileInfoList: IImgFileInfo[] = [];
    console.log('设备信息', _exifInfo);

    for (const i of arr) {
      let text = i.text.trim();
      const tempList = text.match(/\{[A-Za-z0-9]+\}/ig);
      const textList = [];
      const imgList = [];

      if (tempList?.length) {
        for (const temp of tempList) {
          const [field] = temp.match(/[A-Za-z0-9]+/);
          const info = _exifInfo[field as keyof typeof _exifInfo];
          if (info.type === 'text') {
            text = text.replace(temp, info.value);
          } else {
            imgList.push(await loadImage({ path: $config.options.solid_bg ? info.bImg : info.wImg }));
            text = text.replace(temp, '{\\-/}');
          }
        }

        const _arr = text.split('{\\-/}');
        if (_arr.length === 1) {
          textList.push(..._arr);
        } else {
          for (let j = 0; j < _arr.length; j++) {
            textList.push(_arr[j], imgList[j]);
          }
        }
      } else {
        textList.push(text);
      }

      imgFileInfoList.push(createTextImg(textList, i.opts));
    }

    return imgFileInfoList;
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

  function createTextImg(textList: (string | HTMLImageElement)[], opts: ITextOption): IImgFileInfo {
    textList = textList.filter(Boolean);
    const font = createTextFont(opts);
    const can = createCanvas(0, 0);
    const ctx = can.getContext('2d');
    const textInfoList: {
      value: string | HTMLImageElement
      type: 'text' | 'img'
      w: number
      x: number
      y: number
      h: number
    }[] = [];

    const totalText = textList.reduce((t, i) => {
      if (typeof i === 'string') t += i;
      return t;
    }, '');

    ctx.font = font;
    ctx.textBaseline = 'middle';

    const textInfo = ctx.measureText(totalText as string);

    can.height = opts.height || Math.round(Math.max(textInfo.actualBoundingBoxAscent + textInfo.actualBoundingBoxDescent + 50, opts.size));
    can.width = textList.reduce((n, i, j) => {
      if (i === undefined || !i) return n;

      if ((j === textList.length - 1 || j === 0) && typeof i === 'string' && !i.trim()) return n;

      if (typeof i === 'string') {
        ctx.font = font;
        ctx.textBaseline = 'middle';
        const info = ctx.measureText(i);
        const h = info.actualBoundingBoxAscent + info.actualBoundingBoxDescent;
        const y = Math.round(h / 2 + (can.height - h) / 2);
        textInfoList.push({
          value: i,
          type: 'text',
          x: n,
          y,
          w: info.actualBoundingBoxLeft + info.actualBoundingBoxRight,
          h,
        });
        n += info.width;
      } else {
        const y = can.height * 0.02;
        const h = can.height - y;
        const w = Math.round(h * (i.width / i.height));
        textInfoList.push({
          value: i,
          type: 'img',
          x: n,
          y,
          w,
          h,
        });
        n += w;
      }
      return n;
    }, 0);

    for (const info of textInfoList) {
      if (info.type === 'text') {
        ctx.font = font;
        ctx.fillStyle = opts.color || '#000';
        ctx.textBaseline = 'middle';
        ctx.fillText(info.value as string, info.x, info.y);
      } else {
        ctx.drawImage(info.value as HTMLImageElement, info.x, info.y, info.w, info.h);
      }
    }

    return {
      width: can.width,
      height: can.height,
      path: can.toDataURL(),
    };
  }
</script>

<canvas bind:this={canvas} />
