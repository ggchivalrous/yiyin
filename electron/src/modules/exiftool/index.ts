import { execSync } from 'child_process';
import fs from 'fs';

import { Logger } from '@modules/logger';
import paths from '@src/path';
import { formatDate, tryCatch } from '@utils';
import ExifParser from 'exif-parser';

import { Exif } from './interface';

const log = new Logger('ExifTool');

export class ExifTool {
  private hasExiftool = false;

  private exifBuf: Buffer;

  private path: string;

  private commonFilePath: string;

  constructor(path: string) {
    this.path = path;
    this.commonFilePath = path.replace(/[\s]/g, (match) => `\\${match}`);
    this.hasExiftool = fs.existsSync(paths.exiftool);
    this.init();
  }

  private init() {
    const buffer = Buffer.alloc(1024 * 1024);
    const openImg = fs.openSync(this.path, 'r');

    fs.readSync(openImg, buffer, 0, buffer.length, 0);
    fs.closeSync(openImg);

    this.exifBuf = buffer;
  }

  parse() {
    let parseRes;

    if (this.hasExiftool) {
      parseRes = tryCatch(
        this.exiftoolParse.bind(this),
        null,
        (e) => log.error('使用ExifTool获取图片 %s 相机参数失败', this.path, e),
      );
    }

    if (!parseRes) {
      parseRes = tryCatch(
        this.exifparserParse.bind(this),
        null,
        (e) => log.error('使用ExifParser获取图片 %s 相机参数失败', this.path, e),
      );
    }

    // 校验所有字段是否为空
    if (parseRes && Object.values(parseRes).every((i) => i === '' || i === 0)) {
      return null;
    }

    return parseRes;
  }

  private exiftoolParse(): Exif {
    const res = execSync(`${paths.exiftool.replace(/[\s]/g, (match) => `\\${match}`)} ${this.commonFilePath}`);
    const text = res.toString();
    const strList = text.split('\n');
    const kvList = strList.map((i) => {
      const arr = i.split(':');
      return [arr.shift().trim(), arr.join(':').trim()];
    });
    const record = kvList.reduce((o, [k, v]) => {
      // 移除 空格 和 /
      const key = k.replace(/[\s/]/g, '');
      if (key) o[key] = v;
      return o;
    }, {} as Record<string, string>);

    return this.formatExiftoolParseInfo(record);
  }

  private formatExiftoolParseInfo(record: Record<string, string>): Exif {
    const FNumber = Number.isNaN(+record.FNumber) ? '' : `${+record.FNumber}`;

    const exif: Exif = {
      Make: record.Make || '',
      Model: record.CameraModelName || '',
      LensMake: record.LensMake || '',
      LensModel: record.LensModel || '',
      FNumber: FNumber || '',
      ISO: record.ISO || '',
      FocalLength: record.FocalLength?.split('.')[0] || '',
      FocalLengthIn35mmFormat: record.FocalLengthIn35mmFormat?.split(' ')[0] || record.FocalLength?.split('.')[0] || '',
      ExposureTime: record.ExposureTime || '',
      DateTimeOriginal: record.DateTimeOriginal || '',
      ExposureCompensation: record.ExposureCompensation || '',
      WhiteBalance: record.WhiteBalance || '',
      ExposureProgram: record.ExposureProgram || '',
      MeteringMode: record.MeteringMode || '',
    };

    if (exif.ExposureTime.includes('undef')) {
      exif.ExposureTime = '';
    }

    if (exif.ExposureProgram) {
      if (exif.ExposureProgram === 'Not Defined') {
        exif.ExposureProgram = 'Auto';
      } else {
        exif.ExposureProgram = exif.ExposureProgram[0].toUpperCase();
      }
    }

    if (exif.DateTimeOriginal) {
      const [date, hour] = exif.DateTimeOriginal.split(' ');
      const d = new Date(`${date.replaceAll(':', '/')} ${hour}`);
      if (Number.isNaN(d.getTime())) {
        exif.DateTimeOriginal = '';
      } else {
        exif.DateTimeOriginal = formatDate('yyyy/MM/dd hh:mm:ss', d);
      }
    }

    if (exif.WhiteBalance) {
      if (exif.WhiteBalance.includes('Auto')) {
        exif.WhiteBalance = 'Auto';
      } else if (exif.WhiteBalance === 'Manual') {
        exif.WhiteBalance = '手动';
      }
    }

    if (exif.MeteringMode) {
      switch (exif.MeteringMode.toLowerCase()) {
        case 'evaluative':
        case 'multi-segment':
        case 'multi-zone': exif.MeteringMode = '评价测光'; break;
        case 'spot': exif.MeteringMode = '点测光'; break;
        case 'partial': exif.MeteringMode = '局部测光'; break;
        case 'average': exif.MeteringMode = '平均测光'; break;
        case 'center-weighted': exif.MeteringMode = '中央重点测光'; break;
        case 'highlight-weighted ': exif.MeteringMode = '斑马测光'; break;
        default: exif.MeteringMode = ''; break;
      }
    }

    return exif;
  }

  private exifparserParse(): Exif {
    const info = ExifParser.create(this.exifBuf).parse();
    const record = info?.tags;
    return this.formatExifParserInfo(record);
  }

  private formatExifParserInfo(record: Record<string, string>): Exif {
    const exif: Exif = {
      Make: record.Make || '',
      Model: record.Model || '',
      LensMake: record.LensMake || '',
      LensModel: record.LensModel || '',
      FNumber: `${record.FNumber || ''}`,
      ISO: `${record.ISO || ''}`,
      FocalLength: `${record.FocalLength || ''}`,
      FocalLengthIn35mmFormat: `${record.FocalLengthIn35mmFormat || record.FocalLength || ''}`,
      ExposureTime: record.ExposureTime || '',
      DateTimeOriginal: record.DateTimeOriginal || '',
      ExposureCompensation: `${record.ExposureCompensation || ''}`,
      WhiteBalance: record.WhiteBalance || '',
      ExposureProgram: record.ExposureProgram || '',
      MeteringMode: '',
    };

    if (exif.ExposureTime && !Number.isNaN(+exif.ExposureTime) && +exif.ExposureTime < 1) {
      exif.ExposureTime = `1/${Math.round(1 / +exif.ExposureTime)}`;
    }

    if (exif.ExposureProgram) {
      switch (+exif.ExposureProgram) {
        case 0: exif.ExposureProgram = 'Auto'; break;
        case 1: exif.ExposureProgram = 'M'; break;
        case 2: exif.ExposureProgram = 'P'; break;
        case 3: exif.ExposureProgram = 'A'; break;
        case 4: exif.ExposureProgram = 'S'; break;
        default: break;
      }
    }

    if (exif.DateTimeOriginal) {
      let time = +exif.DateTimeOriginal;

      if (record.undefined) {
        const [hour] = record.undefined.split(':');
        time += -hour * 3600;
      }

      exif.DateTimeOriginal = formatDate('yyyy/MM/dd hh:mm:ss', time * 1e3);
    }

    if (exif.WhiteBalance) {
      switch (+exif.WhiteBalance) {
        case 0: exif.WhiteBalance = 'Auto'; break;
        case 1: exif.WhiteBalance = '手动'; break;
        default: break;
      }
    }

    return exif;
  }
}
