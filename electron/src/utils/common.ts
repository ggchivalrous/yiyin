import fs from 'fs';
import path from 'path';

import type { INewVersionRes, IReleaseData } from '@src/interface';
import axios from 'axios';

export const tryCatch = <T = any>(p: () => T, defV?: T, errCb?: (e: Error) => void) => {
  try {
    return p();
  } catch (e: any) {
    if (typeof errCb === 'function') {
      errCb(e);
    }
    return defV;
  }
};

export const tryAsyncCatch = <T = any>(p: Promise<T>, defV?: T, errCb?: (e: Error) => void) => p.then((e) => e, (e) => {
  if (typeof errCb === 'function') {
    errCb(e);
  }
  return defV;
});

export const usePromise = <T = any>(): [Promise<T>, (value: T | PromiseLike<T>) => void, (reason?: any) => void] => {
  let res: (value: T | PromiseLike<T>) => void;
  let rej: (reason?: any) => void;
  const pro = new Promise<T>((resolve, reject) => {
    res = resolve;
    rej = reject;
  });

  return [pro, res, rej];
};

export const getFileName = (dir: string, fileName: string) => {
  const fileNameList = fs.readdirSync(dir);
  const fileNameParse = path.parse(fileName);
  fileName = `${fileNameParse.name}.jpg`;
  const isExist = fileNameList.find((i) => i === fileName);

  if (!isExist) {
    return `${fileNameParse.name}.jpg`;
  }

  const fileNameSplitArr = fileNameParse.name.split('-');
  const parseList = fileNameList
    .filter((i) => i.startsWith(fileNameParse.name))
    .sort()
    .map((i) => {
      const parse = path.parse(i);
      const arr = parse.name.split('-');
      const info = {
        ...parse,
        baseName: '',
        index: 0,
      };

      if (arr.length === fileNameSplitArr.length + 1) {
        const index = +arr.pop();
        if (!Number.isNaN(index)) {
          info.index = index;
        }
      }

      info.baseName = arr.join('-');
      return info;
    })
    .sort((a, b) => b.index - a.index);

  return `${fileNameParse.name}-${parseList[0].index + 1}.jpg`;
};

export const sleep = (ms: number) => new Promise((e) => { setTimeout(e, ms); });

export const pollSleep = async (fn: () => boolean, ms = 500, timeout = 60e3) => {
  let totalMs = 0;
  while (!fn() && totalMs < timeout) {
    await sleep(ms);
    totalMs += ms;
  }
};

export const hasNewVersion = async (): Promise<INewVersionRes> => {
  const updateInfo: INewVersionRes = {
    update: false,
    version: `v${import.meta.env.VITE_VERSION}`,
  };

  const res = await tryAsyncCatch(axios.get<IReleaseData>('https://api.github.com/repos/ggchivalrous/yiyin/releases/latest'));

  if (!res || !res.data) {
    return updateInfo;
  }
  const data = res.data;
  const latestVersion = data.tag_name;

  if (latestVersion <= updateInfo.version) {
    return updateInfo;
  }

  updateInfo.version = data.tag_name.replace('v', '');
  updateInfo.update = true;

  let ext = '';
  switch (process.platform) {
    case 'win32': ext = 'exe'; break;
    case 'darwin': ext = 'dmg'; break;
    default: ext = 'exe';
  }

  const assetsName = `yiyin-${updateInfo.version}-${process.platform}-x64.${ext}`;
  const assets = data.assets.find((i) => i.name === assetsName);

  if (assets) {
    updateInfo.downloadLink = assets.browser_download_url;
  }

  return updateInfo;
};
