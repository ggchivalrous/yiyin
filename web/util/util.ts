import { arrToObj, tryAsyncCatch, usePromise } from '@/common/utils';

export const toRoman = (num: number) => {
  const romanNumerals = [
    { value: 1000, numeral: 'M' },
    { value: 900, numeral: 'CM' },
    { value: 500, numeral: 'D' },
    { value: 400, numeral: 'CD' },
    { value: 100, numeral: 'C' },
    { value: 90, numeral: 'XC' },
    { value: 50, numeral: 'L' },
    { value: 40, numeral: 'XL' },
    { value: 10, numeral: 'X' },
    { value: 9, numeral: 'IX' },
    { value: 5, numeral: 'V' },
    { value: 4, numeral: 'IV' },
    { value: 1, numeral: 'I' },
  ];

  let roman = '';

  for (let i = 0; i < romanNumerals.length; i++) {
    while (num >= romanNumerals[i].value) {
      roman += romanNumerals[i].numeral;
      num -= romanNumerals[i].value;
    }
  }

  return roman;
};

export const charToNumberChar = (originStr: string, mathematicalFontStart = 0x1d63c) => {
  let str = '';

  for (let i = 0; i < originStr.length; i++) {
    const originalChar = originStr[i];
    const lowercaseOffset = originalChar.charCodeAt(0) - 'a'.charCodeAt(0); // 小写字母的偏移量
    const uppercaseOffset = originalChar.charCodeAt(0) - 'A'.charCodeAt(0); // 大写字母的偏移量

    if (lowercaseOffset >= 0 && lowercaseOffset <= 25) {
      const mathematicalCharCode = mathematicalFontStart + 26 + lowercaseOffset;
      str += String.fromCodePoint(mathematicalCharCode);
    } else if (uppercaseOffset >= 0 && uppercaseOffset <= 25) {
      const mathematicalCharCode = mathematicalFontStart + uppercaseOffset;
      str += String.fromCodePoint(mathematicalCharCode);
    } else {
      str += originalChar;
    }
  }

  return str; // 将 Unicode 码点转换成字符
};

export const loadImage = async (url: string) => {
  const img = new Image();
  img.src = url;

  const [promise, r, j] = usePromise<HTMLImageElement>();
  img.onload = () => r(img);
  img.onerror = j;

  const d = await tryAsyncCatch(promise);
  if (d) {
    return d;
  }

  img.src = `file://${url}`;
  const [promise1, r1, j1] = usePromise<HTMLImageElement>();
  img.onload = () => r1(img);
  img.onerror = j1;

  return promise1;
};

// 计算图片整体亮度
export const calcAverageBrightness = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  let totalBrightness = 0;

  for (let i = 0; i < data.length; i += 4) {
  // 简单的亮度计算方法
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    totalBrightness += brightness;
  }
  return totalBrightness / (width * height);
};

export interface IFontInfo {
  name: string
  path: string
}

const loadFonts: FontFace[] = [...(document.fonts as any).keys()];

// 导入字体
export async function importFont(arr: IFontInfo[]) {
  const fontPromise: Promise<any>[] = [];

  for (const i of arr) {
    if (!i.path) continue;
    const fontRecord = arrToObj(loadFonts, 'family');
    if (fontRecord[i.name]) continue;

    console.log('%s 字体加载....', i.name);
    const font = new FontFace(i.name, `url('${i.path}')`);
    const _font = font.load().catch((e) => console.log('%s 字体加载失败', i.name, e));

    fontPromise.push(_font);
    loadFonts.push(font);
  }

  for (const font of fontPromise) {
    const _font = await font;
    if (_font) {
      (document.fonts as any).add(_font);
    }
  }
}

export const createCanvas = (w: number, h: number) => {
  const _canvas = document.createElement('canvas');
  _canvas.width = w;
  _canvas.height = h;
  return _canvas;
};

export const smoothIncrement = (start: number, end: number, duration: number, callback: (v: number) => void) => {
  const increment = (end - start) / duration;
  let current = start;
  let flag = false;

  function calcNextInc() {
    current += increment;
    callback(Math.min(end, Math.round(current)));
    if (current < end && !flag) {
      requestAnimationFrame(calcNextInc);
    }
  }

  calcNextInc();
  return () => { flag = true; };
};
