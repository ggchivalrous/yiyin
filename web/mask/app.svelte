<script>
  let canvas;
  let taskList = [];
  let processing = false;
  const ORIGIN_W = 5568;
  const ORIGIN_H = 3712;
  const ORIGIN_RATIO = ORIGIN_W / ORIGIN_H;

  $: startCreateTask(taskList);

  window.api['on:createMask']((info) => {
    console.log(info);
    taskList.push(info);
    taskList = taskList;
  });

  async function startCreateTask() {
    if (processing) return;

    processing = true;
    for (let i = 0; i < taskList.length; i++) {
      const task = taskList[i];

      try {
        const blurImg = await loadImage(task.blur);
        const scaleImg = await loadImage(task.scale);
        const textImgInfo = createExifImg(task.exifInfo, task.blur.height);

        const maskUrl = await createBoxShadowMark(canvas, {
          img: blurImg,
          contentImg: scaleImg,
          shadow: {
            blur: Math.min(375 * (task.blur.width / ORIGIN_W), 250),
            radius: Math.min(250 * ((task.blur.width / task.blur.height) / ORIGIN_RATIO), 100),
          },
        });

        await window.api.composite({
          name: task.name,
          md5: task.md5,
          mask: maskUrl,
          text: textImgInfo,
        });
      } catch (e) {
        console.log(e);
      }
    }
    taskList = [];
    processing = false;
  }

  function loadImage(info) {
    const img = new Image();
    img.width = info.width;
    img.height = info.height;
    img.src = `file://${info.path}`;

    return new Promise((r, j) => {
      img.onload = () => r(img);
      img.onerror = j;
    });
  }

  function createBoxShadowMark(_canvas, option) {
    _canvas.width = option.w || option.img.width;
    _canvas.height = option.h || option.img.height;
    const ctx = _canvas.getContext('2d');

    if (option.img) {
      ctx.drawImage(option.img, 0, 0, _canvas.width, _canvas.height);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, _canvas.width, _canvas.height);
    ctx.fillStyle = 'black';

    const contentOffsetX = Math.round((_canvas.width - option.contentImg.width) / 2);
    const contentOffsetY = Math.round((_canvas.height - option.contentImg.height) / 3);

    ctx.shadowOffsetX = option.shadow.offsetX; // 阴影水平偏移
    ctx.shadowOffsetY = option.shadow.offsetY; // 阴影垂直偏移
    ctx.shadowBlur = option.shadow.blur; // 阴影模糊范围
    ctx.shadowColor = option.shadow.color || '#000'; // 阴影颜色

    const rectX = contentOffsetX || ctx.shadowBlur;
    const rectY = contentOffsetY || ctx.shadowBlur;
    const rectWidth = option.contentImg.width;
    const rectHeight = option.contentImg.height;
    const cornerRadius = option.shadow.radius;

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

  function createTextImg(option) {
    const can = createCanvas(1, option.fontSize);
    const ctx = can.getContext('2d');

    const font = option.font || `bold ${option.fontSize}px PingFang SC`;
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
      data: can.toDataURL(),
    };
  }

  function createExifImg(exifInfo, maxHeight) {
    const exif = {
      title: null,
      info: null,
    };

    if (exifInfo.Model) {
      exifInfo.Model = exifInfo.Model.replace('Z', 'ℤ');
      const titleText = exifInfo.Model && charToNumberChar(exifInfo.Model[0]) + charToNumberChar(exifInfo.Model.slice(1).toLowerCase());
  
      exif.title = createTextImg({
        text: titleText,
        color: '#ffffff',
        fontSize: 100 * (maxHeight / ORIGIN_H),
      });
    }

    const infoTextArr = [];

    if (exifInfo.FocalLength) {
      infoTextArr.push(`${exifInfo.FocalLength}mm`);
    }

    if (exifInfo.FNumber) {
      infoTextArr.push(`f/${exifInfo.FNumber}`);
    }

    if (exifInfo.ExposureTime) {
      if (exifInfo.ExposureTime < 1) {
        infoTextArr.push(`1/${1 / exifInfo.ExposureTime}s`);
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
        color: '#ffffff',
        fontSize: 80 * (maxHeight / ORIGIN_H),
      });
    }

    return exif;
  }

  function charToNumberChar(originStr, mathematicalFontStart = 0x1d63c) {
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
  }

  function createCanvas(w, h) {
    const _canvas = document.createElement('canvas');
    _canvas.width = w;
    _canvas.height = h;
    return _canvas;
  }
</script>

<canvas bind:this={canvas} />