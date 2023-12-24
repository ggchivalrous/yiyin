<script lang="ts">
  import { config } from '@web/store/config';
  import modelMap from '@web-utils/model-map';

  import type {
    ICreateTextOption, ISlotInfo, ITextOption, ExifInfo,
    IBoxShadowMarkOption, IFontInfo, IFontParam, IImgFileInfo,
    ITaskInfo, TExifInfo, TTemplateFieldInfo,
  } from './interface';
  import { calcAverageBrightness, importFont, loadImage, createCanvas } from './main';

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
        const scaleImg = await loadImage(task.mainImgInfo);
        const templateFieldInfoConf = getTemplateFieldInfoConf($config.templateFieldInfo, {
          bgHeight: task.bgImgSize.h,
        });

        const textImgList = await createTextList(task.exifInfo, {
          templateList: [
            {
              text: '{Make} {Model}',
              opts: {
                width: task.bgImgSize.w,
                size: task.bgImgSize.h * 0.04,
                color: task.option.solid_bg ? '#000' : '#fff',
                font: task.option.font,
                bold: true,
                italic: false,
              },
            },
            {
              text: '{FocalLength} {FNumber} {ExposureTime} {ISO} {PersonalSign}',
              opts: {
                width: task.bgImgSize.w,
                size: task.bgImgSize.h * 0.025,
                color: task.option.solid_bg ? '#000' : '#fff',
                font: task.option.font,
                bold: true,
                italic: false,
              },
            },
          ],
          templateFieldConf: templateFieldInfoConf,
        });

        // 生成背景图片
        const bgImgInfo = await window.api.createBgImg({
          md5: task.md5,
          height: Math.ceil(textImgList.reduce(
            (n, j, index) => n += j.height + (index === textImgList.length - 1 ? 0 : 50),
            scaleImg.height
            + (task.option.shadow_show ? Math.ceil(task.mainImgInfo.height * ((task.option.shadow || 6) / 100) * 2) : 0),
          )),
        });

        if (bgImgInfo.code !== 0 || !bgImgInfo.data) {
          await window.api.compositeFail({
            name: task.name,
            md5: task.md5,
            msg: bgImgInfo.message,
          });
          continue;
        }

        const bgImg = await loadImage(bgImgInfo.data);
        const _bgImgInfo = await createBoxShadowMark(canvas, {
          img: bgImg,
          contentImg: scaleImg,
          textImgList,
          shadow: {
            blur: task.option.shadow_show ? task.mainImgInfo.height * ((task.option.shadow || 6) / 100) : 0,
            offsetX: 0,
            offsetY: 0,
          },
          radius: task.option.radius_show ? task.mainImgInfo.height * ((task.option.radius || 2.1) / 100) : 0,
          option: task.option,
        });

        await window.api.composite({
          name: task.name,
          md5: task.md5,
          bgImgInfo: _bgImgInfo,
          mainImgOffset: {
            top: _bgImgInfo.contentTop,
            left: _bgImgInfo.contentLeft,
          },
          text: textImgList,
          option: task.option,
        });
      } catch (e) {
        console.log(e);

        await window.api.compositeFail({
          name: task.name,
          md5: task.md5,
          msg: e,
        });
      }
    }
    taskList = [];
    processing = false;
  }

  interface IGetTemplateFieldInfoConfOption {
    bgHeight: number
  }

  function getTemplateFieldInfoConf(fieldInfo: TTemplateFieldInfo, opts: IGetTemplateFieldInfoConfOption) {
    const templateFieldInfo: TTemplateFieldInfo = {};

    for (const field in fieldInfo) {
      const info = fieldInfo[field];
      templateFieldInfo[field] = {
        ...info,
        param: info.param && {
          ...info.param,
          size: Math.round(opts.bgHeight * (info.param.size / 100)),
        },
      };
    }

    return templateFieldInfo;
  }

  function createBoxShadowMark(_canvas: HTMLCanvasElement, option: IBoxShadowMarkOption): {
    data: string
    width: number
    height: number
    contentTop: number
    contentLeft: number
  } {
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

    const contentOffsetX = Math.round((_canvas.width - option.contentImg.width) / 2);
    const contentOffsetY = Math.round(option.shadow.blur);

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

    return {
      data: _canvas.toDataURL('image/png', 100),
      width: _canvas.width,
      height: _canvas.height,
      contentTop: contentOffsetY,
      contentLeft: contentOffsetX,
    };
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
      Make: { type: 'text', value: '', bImg: '', wImg: '', param: undefined },
      Model: { type: 'text', value: '', bImg: '', wImg: '', param: undefined },
      DateTimeOriginal: { type: 'text', value: '', bImg: '', wImg: '', param: undefined },
      ExposureTime: { type: 'text', value: '', bImg: '', wImg: '', param: undefined },
      FNumber: { type: 'text', value: '', bImg: '', wImg: '', param: undefined },
      FocalLength: { type: 'text', value: '', bImg: '', wImg: '', param: undefined },
      ISO: { type: 'text', value: '', bImg: '', wImg: '', param: undefined },
      ExposureProgram: { type: 'text', value: '', bImg: '', wImg: '', param: undefined },
      LensModel: { type: 'text', value: '', bImg: '', wImg: '', param: undefined },
      LensMake: { type: 'text', value: '', bImg: '', wImg: '', param: undefined },
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

    return exif;
  }

  function fillTemplateFieldInfo(templateFieldConf: TTemplateFieldInfo, exifInfo?: TTemplateFieldInfo) {
    exifInfo = exifInfo || {};

    for (const field in templateFieldConf) {
      const info = templateFieldConf[field];
      if (!exifInfo[field]) {
        exifInfo[field] = {
          use: info.use,
          type: 'text',
          value: '',
          bImg: '',
          wImg: '',
          param: {
            use: false,
            bold: false,
            italic: false,
            size: 0,
            font: '',
          },
        };
      }

      if ((templateFieldConf?.Force?.use && info.use) || (info.use && !exifInfo[field].value)) {
        exifInfo[field].type = info.type;
        exifInfo[field].value = `${info.value}`;
        exifInfo[field].bImg = `${info.bImg}`;
        exifInfo[field].wImg = `${info.wImg}`;
        exifInfo[field].param = info.param || exifInfo[field].param;
      }
    }

    return exifInfo;
  }

  async function createTextList(exifInfo: ExifInfo, opts: ICreateTextOption): Promise<IImgFileInfo[]> {
    const templateFields = fillTemplateFieldInfo(opts.templateFieldConf, formatExifInfo(exifInfo));

    const imgFileInfoList: IImgFileInfo[] = [];
    console.log('模版字段信息', templateFields);

    for (const i of opts.templateList) {
      let text = i.text.trim();
      const tempList = text.match(/\{[A-Za-z0-9]+\}/ig);
      const textList = [];
      const slotInfoList = [];

      if (tempList?.length) {
        for (const temp of tempList) {
          const [field] = temp.match(/[A-Za-z0-9]+/);
          const info = templateFields[field];

          text = text.replace(temp, '{---}');
          const slotInfo: ISlotInfo = {
            value: '',
            param: info.param,
          };

          if (info.type === 'text') {
            slotInfo.value = info.value;
          } else {
            slotInfo.value = await loadImage({ path: $config.options.solid_bg ? info.bImg : info.wImg });
          }

          slotInfoList.push(slotInfo);
        }

        const _arr = text.split('{---}');
        for (let j = 0; j < _arr.length; j++) {
          textList.push(_arr[j], slotInfoList[j]);
        }
      } else {
        textList.push(text);
      }

      imgFileInfoList.push(createTextImg(textList, i.opts));
    }

    return imgFileInfoList;
  }

  function createTextFont(opts: Omit<IFontParam, 'use'>, extraOpts?: IFontParam) {
    const _opts = { ...opts };

    if (extraOpts?.use) {
      Object.assign(_opts, extraOpts);
      if (!opts.size) {
        _opts.size = opts.size;
      }
    }

    let font = '';

    if (_opts.bold) {
      font += 'bold ';
    }

    if (_opts.italic) {
      font += 'italic ';
    }

    if (_opts.size) {
      font += `${_opts.size}px `;
    }

    if (_opts.font) {
      font += `${_opts.font},`;
    }

    font += '"PingFang SC"';

    return font;
  }

  function createTextImg(textList: (ISlotInfo | string)[], opts: ITextOption): IImgFileInfo {
    textList = textList.filter(Boolean);
    const can = createCanvas(0, 0);
    const ctx = can.getContext('2d');
    const defFont = createTextFont(opts);
    const textInfoList: {
      font: string
      value: string | HTMLImageElement
      type: 'text' | 'img'
      w: number
      x: number
      y: number
      h: number
    }[] = [];

    let totalText = '';
    const maxFontOpt: ITextOption = { ...opts };

    for (const text of textList) {
      if (typeof text === 'string') {
        totalText += text;
        continue;
      }

      if (typeof text.value === 'string') {
        totalText += text.value;
      }

      if (text.param) {
        // 加粗
        if (!maxFontOpt.bold && text.param.bold) {
          maxFontOpt.bold = true;
        }

        // 使用最大的字体
        if (maxFontOpt.size < text.param.size) {
          maxFontOpt.size = text.param.size;
        }
      }
    }

    ctx.font = createTextFont(maxFontOpt);
    ctx.textBaseline = 'middle';
    const textInfo = ctx.measureText(totalText);
    can.height = opts.height || Math.round(Math.max(textInfo.actualBoundingBoxAscent + textInfo.actualBoundingBoxDescent + 50, maxFontOpt.size));

    can.width = textList.reduce((n, i, j) => {
      if (i === undefined || !i) return n;
      if ((j === textList.length - 1 || j === 0) && typeof i === 'string' && !i.trim()) return n;

      if (typeof i === 'string' || typeof i.value === 'string') {
        let font = '';
        let value = '';

        if (typeof i === 'string') {
          font = defFont;
          value = i;
        } else if (typeof i.value === 'string') {
          font = createTextFont(opts, i.param);
          value = i.value;
        }

        ctx.font = font;
        ctx.textBaseline = 'middle';
        const info = ctx.measureText(value);
        const h = info.actualBoundingBoxAscent + info.actualBoundingBoxDescent;
        const y = Math.round(h / 2 + (can.height - h) / 2);
        textInfoList.push({
          font,
          value,
          type: 'text',
          x: n,
          y,
          w: info.actualBoundingBoxLeft + info.actualBoundingBoxRight,
          h,
        });
        n += info.width;
      } else {
        const canHeight = i.param?.size || can.height;
        const h = canHeight * 0.98;
        const y = (can.height - h) / 2;
        const w = Math.round(h * (i.value.width / i.value.height));
        textInfoList.push({
          font: defFont,
          value: i.value,
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
        ctx.font = info.font;
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
