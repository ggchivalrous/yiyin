import type { IFontInfo, IImgFileInfo } from './interface';

// 计算图片整体亮度
export function calcAverageBrightness(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  let totalBrightness = 0;

  for (let i = 0; i < data.length; i += 4) {
  // 简单的亮度计算方法
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    totalBrightness += brightness;
  }
  return totalBrightness / (width * height);
}

// 加载图片
export function loadImage(info: IImgFileInfo): Promise<HTMLImageElement> {
  const img = new Image();
  if (info.width) img.width = info.width;
  if (info.height) img.height = info.height;
  img.src = `file://${info.path}`;

  return new Promise<HTMLImageElement>((r, j) => {
    img.onload = () => r(img);
    img.onerror = j;
  });
}

// 导入字体
export async function importFont(arr: IFontInfo[]) {
  for (const i of arr) {
    const font = new FontFace(i.name, `url('${i.path}')`);
    const _font = await font.load().catch((e) => console.log('%s 字体加载失败', i.name, e));
    if (_font) {
      (document.fonts as any).add(_font);
    }
  }
}

export function createCanvas(w: number, h: number) {
  const _canvas = document.createElement('canvas');
  _canvas.width = w;
  _canvas.height = h;
  return _canvas;
}
