import { createCanvas, loadImage } from '@web/util/util';

import type { ImageToolOption, Material } from './interface';

export class ImageTool {
  private opt: ImageToolOption['options'];

  private material: Material;

  constructor(opt: ImageToolOption) {
    this.opt = opt.options;
    this.material = opt.material;
  }

  async genMainImgShadow() {
    const { opt } = this;
    const bgImg = await loadImage(this.material.bg.path);
    const mainImg = await loadImage(this.material.main[0].path);
    const canvas = createCanvas(bgImg.width, bgImg.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    // 添加黑色蒙层，突出主体图片
    if (!opt.solid_bg) {
      const averageBrightness = this.calcAverageBrightness(ctx, canvas.width, canvas.height);

      if (averageBrightness < 15) {
        ctx.fillStyle = 'rgba(180, 180, 180, 0.2)'; // 灰色半透明覆盖层
      } else if (averageBrightness < 20) {
        ctx.fillStyle = 'rgba(158, 158, 158, 0.2)'; // 灰色半透明覆盖层
      } else if (averageBrightness < 40) {
        ctx.fillStyle = 'rgba(128, 128, 128, 0.2)'; // 灰色半透明覆盖层
      } else {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      }

      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'black';
    }

    const contentOffsetX = Math.round((canvas.width - mainImg.width) / 2);
    const contentOffsetY = this.material.main[0].top;
    const blur = opt.shadow_show ? mainImg.height * ((opt.shadow || 6) / 100) : 0;

    if (blur) {
      ctx.shadowOffsetX = 0; // 阴影水平偏移
      ctx.shadowOffsetY = 0; // 阴影垂直偏移
      ctx.shadowBlur = blur; // 阴影模糊范围
      ctx.shadowColor = 'rgba(0, 0, 0, 1)'; // 阴影颜色
    }

    const rectX = contentOffsetX || ctx.shadowBlur;
    const rectY = contentOffsetY || ctx.shadowBlur;
    const rectWidth = mainImg.width;
    const rectHeight = mainImg.height;
    const cornerRadius = opt.radius_show ? mainImg.height * ((opt.radius || 2.1) / 100) : 0;

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

    return canvas.toDataURL('image/png', 100);
  }

  // 计算图片整体亮度
  calcAverageBrightness(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const { data } = imageData;
    let totalBrightness = 0;

    // 简单的亮度计算方法
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      totalBrightness += brightness;
    }

    return totalBrightness / (width * height);
  }
}
