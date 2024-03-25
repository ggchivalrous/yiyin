/* eslint-disable no-console */
import fs from 'fs';
import os from 'os';
import path from 'path';
import zlib from 'zlib';

import AdmZip from 'adm-zip';
import tar from 'tar';

import { tryCatch, usePromise } from '../common/utils';

const platform = os.platform();
const __dirname = path.parse(import.meta.url.slice(platform === 'win32' ? 8 : 7)).dir;
const WindowsExifToolPath = path.join(__dirname, '../static/windows-exiftool.zip');
const CommondExifToolPath = path.join(__dirname, '../static/commond-exiftool.tar.gz');

export default async (outPath: string) => {
  const outDir = path.join(outPath, 'exiftool');
  const exiftoolCommodPath = path.join(outDir, 'exiftool');

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
  }

  if (fs.existsSync(exiftoolCommodPath)) {
    return;
  }

  if (platform === 'win32') {
    await installWinExiftool(outDir);
  }
  else {
    await installCommondExiftool(outDir);
  }
};

function installWinExiftool(outDir: string) {
  const [p, r] = usePromise();

  tryCatch(() => {
    const admzip = new AdmZip(WindowsExifToolPath);
    admzip.extractAllTo(outDir);
    fs.renameSync(path.join(outDir, 'exiftool(-k).exe'), path.join(outDir, 'exiftool.exe'));
    r(true);
  }, null, () => r(false));

  return p;
}

function installCommondExiftool(outDir: string) {
  const [p, r] = usePromise();

  fs.createReadStream(CommondExifToolPath)
    .pipe(zlib.createGunzip())
    .pipe(tar.extract({ cwd: outDir }))
    .on('error', (e) => {
      console.log('Exiftool模块解压异常', e);
      r(false);
    })
    .on('finish', () => {
      console.log('Exiftool工具解压完成');

      // mac的压缩包套了一层文件夹，需要将文件夹的内容全部复制到上一层
      const fileList = fs.readdirSync(outDir);
      const filePath = path.join(outDir, fileList[0]);
      if (fs.statSync(filePath)?.isDirectory()) {
        cpDirAllFile(filePath, outDir);
      }

      r(true);
    });

  return p;
}

function cpDirAllFile(origin: string, target: string) {
  if (!fs.statSync(origin).isDirectory()) return;

  const fileList = fs.readdirSync(origin);

  for (const file of fileList) {
    const originFilePath = path.join(origin, file);
    const targetFilePath = path.join(target, file);

    if (fs.statSync(originFilePath).isDirectory()) {
      fs.cpSync(originFilePath, targetFilePath, { recursive: true });
    } else {
      fs.copyFileSync(originFilePath, targetFilePath);
    }
  }

  fs.rmSync(origin, { recursive: true });
}
