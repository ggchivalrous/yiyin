<script lang="ts">
  import { getTempFieldsConf, getTempsConf } from '@web/modules/temp-field';
  import { config } from '@web/store/config';
  import { calcAverageBrightness, loadImage, importFont, createCanvas } from '@web-utils/util';
  import type { IFontInfo } from '@web-utils/util';

  import type {
    IBoxShadowMarkOption, ITextOption,
    IFontParam, IImgFileInfo,
    ISlotInfo, ITaskInfo, TFontParam,
  } from './interface';

  import type { ITemp } from '@/common/const/def-temps';

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
        const mainImg = await loadImage(task.mainImgInfo.path);
        const tempFieldsConf = await getTempFieldsConf(task.exifInfo, { bgHeight: task.bgImgSize.h });
        let textImgList = await getTempList(task, tempFieldsConf);
        const { contentHeight, contentTop, textButtomOffset, textOffset } = calcContentOffsetInfo(task, textImgList);

        const bgImgInfo = await window.api.createBgImg({
          md5: task.md5,
          height: contentHeight,
        });

        if (bgImgInfo.code !== 0 || !bgImgInfo.data) {
          await window.api.compositeFail({
            name: task.name,
            md5: task.md5,
            msg: bgImgInfo.message,
          });
          continue;
        }

        const bgImg = await loadImage(bgImgInfo.data.path);
        textImgList = await getTempList({
          ...task,
          bgImgSize: {
            w: bgImg.width,
            h: bgImg.height,
          },
        }, tempFieldsConf);

        const _bgImgInfo = await createBoxShadowMark(canvas, {
          img: bgImg,
          contentImg: mainImg,
          contentHeight,
          contentTop: Math.round((bgImg.height - contentHeight) / 2) + contentTop,
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
          offsetInfo: {
            contentTop,
            textButtomOffset,
            textOffset,
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

  function getTempList(task: ITaskInfo, tempFieldsConf: Awaited<ReturnType<typeof getTempFieldsConf>>) {
    return createTextList(
      getTempsConf({
        bgHeight: task.bgImgSize.h,
        color: task.option.solid_bg ? '#000' : '#fff',
      }),
      tempFieldsConf,
    );
  }

  function calcContentOffsetInfo(task: ITaskInfo, textImgList: IImgFileInfo[]) {
    const textOffset = task.bgImgSize.h * 0.009;
    const mainImgTopOffset = task.bgImgSize.h * 0.036;
    const textButtomOffset = task.bgImgSize.h * 0.027;

    // 主图上下间隔最小间隔
    let mainImgOffset = mainImgTopOffset * 2;
    let contentTop = Math.ceil(mainImgTopOffset);

    // 阴影宽度
    if (task.option.shadow_show) {
      const shadowHeight = Math.ceil(task.mainImgInfo.height * ((task.option.shadow || 6) / 100));
      const mainImgOffsetTop = Math.max(mainImgTopOffset, shadowHeight);
      mainImgOffset = mainImgOffsetTop * 2 * (3 / 4);
      contentTop = Math.ceil(mainImgOffsetTop);
    }

    if (textImgList.length) {
      mainImgOffset += textButtomOffset;
    }

    // 生成背景图片
    const contentHeight = Math.ceil(textImgList.reduce(
      (n, j, index) => n += j.height + (index === textImgList.length - 1 ? 0 : textOffset),
      task.mainImgInfo.height + Math.round(mainImgOffset),
    ));

    return {
      contentHeight,
      contentTop,
      textOffset,
      textButtomOffset,
    };
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
    const contentOffsetY = option.contentTop;

    if (option.shadow.blur) {
      ctx.shadowOffsetX = option.shadow.offsetX || 0; // 阴影水平偏移
      ctx.shadowOffsetY = option.shadow.offsetY || 0; // 阴影垂直偏移
      ctx.shadowBlur = option.shadow.blur; // 阴影模糊范围
      ctx.shadowColor = 'rgba(0, 0, 0, 1)'; // 阴影颜色
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

  async function createTextList(templateList: ITemp[], tempFieldsConf: Awaited<ReturnType<typeof getTempFieldsConf>>): Promise<IImgFileInfo[]> {
    const imgFileInfoList: IImgFileInfo[] = [];
    console.log('模版字段信息', tempFieldsConf);

    for (const i of templateList) {
      let text = i.temp.trim();
      const tempList = text.match(/\{[A-Za-z0-9]+\}/ig);
      const textList = [];
      const slotInfoList = [];

      if (tempList?.length) {
        for (const temp of tempList) {
          const [field] = temp.match(/[A-Za-z0-9]+/);
          const info = tempFieldsConf[field];

          text = text.replace(temp, info.show ? '{---}' : '');

          if (!info.show) {
            continue;
          }

          const slotInfo: ISlotInfo = {
            value: '',
            param: info.param,
          };

          if (info.type === 'text') {
            slotInfo.value = info.value;
          } else {
            if ($config.options.solid_bg) {
              if (!info.bImg || info.bImg === 'false') {
                continue;
              }
            } else if (!info.wImg || info.wImg === 'false') {
              continue;
            }

            slotInfo.value = await loadImage($config.options.solid_bg ? info.bImg : info.wImg);
          }

          slotInfoList.push(slotInfo);
        }

        const _arr = text.trim().split('{---}');
        for (let j = 0; j < _arr.length; j++) {
          if (slotInfoList[j]?.value) {
            textList.push(_arr[j], slotInfoList[j]);
          }
        }
      } else {
        textList.push(text);
      }

      imgFileInfoList.push(createTextImg(textList, i.opts));
    }

    return imgFileInfoList.filter(Boolean);
  }

  function createTextFont(opts: Omit<IFontParam, 'use' | 'offset'>, extraOpts?: TFontParam) {
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
    if (!textList.length) {
      return null;
    }

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

      if (text.param && text.param.use) {
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
    const textInfo = ctx.measureText('QOSyYtl709');
    const baseline = Math.ceil(textInfo.actualBoundingBoxAscent + 25);

    can.height = opts.height || Math.ceil(Math.max(textInfo.actualBoundingBoxAscent + textInfo.actualBoundingBoxDescent + 50, maxFontOpt.size));
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
          font = createTextFont(opts, mergeFontOpt(opts, i.param));
          value = i.value;
        }

        ctx.font = font;
        const info = ctx.measureText(value);
        const h = Math.ceil(info.actualBoundingBoxAscent + info.actualBoundingBoxDescent);
        const y = roundDecimalPlaces(baseline - 3);
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
        const fontOpt = mergeFontOpt(opts, i.param);
        ctx.font = createTextFont(opts, fontOpt);
        const info = ctx.measureText('QSOPNYuiyl90');
        const h = Math.ceil(info.actualBoundingBoxAscent);
        const y = roundDecimalPlaces(baseline - h);
        const w = Math.ceil(h * (i.value.width / i.value.height));

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
    }, 30);
    can.width += 30;

    for (const info of textInfoList) {
      if (info.type === 'text') {
        ctx.font = info.font;
        ctx.fillStyle = opts.color || '#000';
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

  function mergeFontOpt(def: ITextOption, target: IFontParam): TFontParam {
    if (!target || !target.use) {
      return { ...def, use: false };
    }

    const cpDef = { ...target };
    for (const key in def) {
      const _k = key as keyof TFontParam;
      if (target && target[_k]) {
        (cpDef[_k] as any) = target[_k];
      } else {
        (cpDef[_k] as any) = def[key as keyof ITextOption];
      }
    }

    return cpDef;
  }

  function roundDecimalPlaces(n: number, place = 2) {
    const multiplier = 10 ** place;
    const adjustedNumber = n * multiplier;
    const roundedNumber = Math.round(adjustedNumber) / multiplier;
    return roundedNumber;
  }
</script>

<canvas bind:this={canvas} />
