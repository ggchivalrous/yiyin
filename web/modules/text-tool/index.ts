import { matchFields, roundDecimalPlaces } from '@common/utils';
import type { Exif } from '@modules/exiftool/interface';
import { getFieldTempInfo, getTextTempList } from '@web/modules/temp-field';
import { loadImage, createCanvas } from '@web/util/util';

import type { IFontParam, IImgFileInfo, ISlotInfo, ITextOption, TFontParam, TextInfo, TextToolOption } from './interface';

export class TextTool {
  private exif: Exif;

  private opt: TextToolOption;

  constructor(exif: Exif, opt: TextToolOption) {
    this.exif = exif;
    this.opt = opt;
  }

  async genTextImg() {
    const imgFileInfoList: IImgFileInfo[] = [];
    const fieldTemps = await getFieldTempInfo(this.exif, {
      bgHeight: this.opt.bgHeight,
      fields: this.opt.fields,
      logoPath: this.opt.logoPath,
    });
    const textTempList = getTextTempList(this.opt.temps, {
      bgHeight: this.opt.bgHeight,
      color: this.opt.options.solid_bg ? '#000' : '#fff',
      defFont: this.opt.options.font,
    });

    console.log('模版字段信息', fieldTemps);

    for (const i of textTempList) {
      let text = i.temp.trim();
      if (!text) continue;

      const textList = [];
      const slotInfoList = [];
      const fields = matchFields(text);

      if (fields && Object.keys(fields).length) {
        for (const field in fields) {
          const { temp } = fields[field];
          const fieldTemp = fieldTemps[field];
          text = text.replace(temp, fieldTemp.show ? '{---}' : '');

          if (!fieldTemp.show) {
            continue;
          }

          const slotInfo: ISlotInfo = {
            value: '',
            font: fieldTemp.font,
          };

          if (fieldTemp.type === 'text') {
            slotInfo.value = `${fieldTemp.value}`.trim();
            slotInfoList.push(slotInfo.value ? slotInfo : '');
            continue;
          }

          if (this.opt.options.solid_bg) {
            if (fieldTemp.bImg && fieldTemp.bImg !== 'false') {
              slotInfo.value = await loadImage(fieldTemp.bImg);
            }
          }
          else if (fieldTemp.wImg && fieldTemp.wImg !== 'false') {
            slotInfo.value = await loadImage(fieldTemp.wImg);
          }

          slotInfoList.push(slotInfo.value ? slotInfo : '');
        }

        const _arr = text.trim().split('{---}');

        if (
          (_arr.length === 1 && !_arr[0].trim())
          || (_arr.length > 1 && !slotInfoList.filter(Boolean).length)
        ) continue;

        for (let j = 0; j < _arr.length; j++) {
          const slotInfo = slotInfoList[j];
          let commonText = _arr[j];

          if (i.font.caseType === 'lowcase') {
            commonText = commonText.toLowerCase();
          } else if (i.font.caseType === 'upcase') {
            commonText = commonText.toUpperCase();
          }

          if (typeof slotInfo === 'string' || !(slotInfo as any)?.value) {
            textList.push(commonText);
          } else {
            textList.push(commonText, slotInfo);
          }
        }
      } else {
        textList.push(text);
      }

      if (textList.length) {
        imgFileInfoList.push(this.createTextImg(textList, {
          verticalAlign: i.verticalAlign,
          font: i.font,
          height: i.height,
          bgHeight: this.opt.bgHeight,
        }));
      }
    }

    return imgFileInfoList.filter(Boolean);
  }

  private genCanvas(w: number, h: number) {
    const can = createCanvas(w, h);
    const ctx = can.getContext('2d');

    return { can, ctx };
  }

  private createTextImg(textList: (ISlotInfo | string)[], opts: ITextOption): IImgFileInfo {
    textList = textList.filter(Boolean);

    if (!textList.length) {
      return null;
    }

    let totalText = '';
    let textValIsAllText = true;
    const textFonts: IFontParam[] = [];

    for (const textItem of textList) {
      if (typeof textItem !== 'string') {
        textFonts.push(textItem.font);
        if (typeof textItem.value === 'string') {
          let v = textItem.value;

          if (textItem.font.use) {
            if (textItem.font.caseType === 'lowcase') {
              v = v.toLowerCase();
            } else if (textItem.font.caseType === 'upcase') {
              v = v.toUpperCase();
            }
          }

          totalText += v;
        } else {
          textValIsAllText = false;
        }
        continue;
      }

      totalText += textItem;
    }

    const textInfoList: TextInfo[] = [];
    const { can, ctx } = this.genCanvas(0, 0);
    const defFont = this.getFont(opts.font);
    const maxFontParam = this.getMaxFontParam(textFonts, opts.font);

    ctx.font = this.getFont(maxFontParam);
    const textInfo = ctx.measureText(textValIsAllText ? totalText : 'QOSyYtl709');
    const defTextMargin = opts.bgHeight * ((this.opt.options.text_margin || 0) / 100);
    // TODO: 后续去掉默认的50高度，采用文本模板高度定义
    const baseline = Math.ceil(textInfo.actualBoundingBoxAscent);

    // TODO: 后续去掉默认的50高度，采用文本模板高度定义
    can.height = opts.height || Math.ceil(Math.max(textInfo.actualBoundingBoxAscent + textInfo.actualBoundingBoxDescent + defTextMargin * 2, maxFontParam.size));
    can.width = textList.reduce((n, i, j) => {
      if (!i) return n;

      const isStartOrEnd = j === textList.length - 1 || j === 0;
      if (isStartOrEnd && typeof i === 'string' && !i.trim()) return n;

      const _textInfo: TextInfo = {
        color: opts.font.color,
        font: defFont,
        value: '',
        type: 'img',
        w: 0,
        h: 0,
        x: n,
        y: 0,
      };

      if (typeof i === 'object' && i.value instanceof Image) {
        const font = this.mergeFontParam(opts.font, i.font);
        _textInfo.value = i.value;
        _textInfo.font = this.getFont(opts.font, font);

        ctx.font = _textInfo.font;
        const info = ctx.measureText('QSOPNYuiyl90');

        _textInfo.h = Math.ceil(info.actualBoundingBoxAscent);
        _textInfo.w = Math.ceil(_textInfo.h * (i.value.width / i.value.height));

        if (opts.verticalAlign === 'center') {
          _textInfo.y = roundDecimalPlaces((can.height - _textInfo.h) / 2, 2);
        } else {
          _textInfo.y = roundDecimalPlaces(baseline - _textInfo.h + _textInfo.h * 0.03 + (can.height - baseline) / 2, 2);
        }
      } else {
        _textInfo.type = 'text';
        if (typeof i === 'object') {
          const font = this.mergeFontParam(opts.font, i.font);
          _textInfo.color = i.font.color || opts.font.color;
          _textInfo.font = this.getFont(opts.font, font);
          _textInfo.value = i.value as string;

          if (font.caseType === 'lowcase') {
            _textInfo.value = _textInfo.value.toLowerCase();
          } else if (font.caseType === 'upcase') {
            _textInfo.value = _textInfo.value.toUpperCase();
          }
        } else {
          _textInfo.value = i;
        }

        ctx.font = _textInfo.font;
        const info = ctx.measureText(_textInfo.value as string);

        _textInfo.h = Math.ceil(info.actualBoundingBoxAscent + info.actualBoundingBoxDescent);
        _textInfo.w = Math.max(Math.ceil(info.actualBoundingBoxLeft + info.actualBoundingBoxRight), info.width);

        if (opts.verticalAlign === 'center') {
          _textInfo.y = roundDecimalPlaces(_textInfo.h + (can.height - _textInfo.h) / 2, 2);
        } else {
          _textInfo.y = roundDecimalPlaces(baseline + (can.height - baseline) / 2, 2);
        }
      }
      textInfoList.push(_textInfo);

      n += _textInfo.w;
      return n;
    }, 30);

    can.width += 30;

    for (const info of textInfoList) {
      if (info.type === 'text') {
        ctx.font = info.font;
        ctx.fillStyle = info.color || opts.font.color || '#000';
        ctx.fillText(info.value as string, info.x, info.y);
      } else {
        ctx.drawImage(info.value as HTMLImageElement, info.x, info.y, info.w, info.h);
      }
    }

    return {
      w: can.width,
      h: can.height,
      data: can.toDataURL('image/png', 100),
    };
  }

  private getFont(opts: Omit<IFontParam, 'use'>, extraOpts?: TFontParam) {
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
      font += `${_opts.font}, `;
    }

    font += 'PingFang SC';

    return font;
  }

  private getMaxFontParam(fontList: IFontParam[], defFont: IFontParam) {
    // 计算所有字体显示后的最高高度，作为画布高度
    const maxFontParam: IFontParam = { ...defFont };

    for (const font of fontList) {
      if (font.use) {
        if (!maxFontParam.bold && font.bold) {
          maxFontParam.bold = true;
        }

        // 使用最大的字体
        if (maxFontParam.size < font.size) {
          maxFontParam.size = font.size;
        }
      }
    }

    return maxFontParam;
  }

  private mergeFontParam(def: IFontParam, target: IFontParam): TFontParam {
    if (!target || !target.use) {
      return { ...def, use: false };
    }

    const cpDef = { ...target };
    for (const key in def) {
      const _k = key as keyof TFontParam;
      if (target && target[_k]) {
        (cpDef[_k] as any) = target[_k];
      } else {
        (cpDef[_k] as any) = def[key as keyof IFontParam];
      }
    }

    return cpDef;
  }
}
