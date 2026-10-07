import type { INewVersionRes, IReleaseData } from '@src/interface'
import fs from 'node:fs'

import path from 'node:path'
import process from 'node:process'
import axios from 'axios'

import { tryAsyncCatch } from '@/common/utils'

export * from '@/common/utils'

const FORMAT_EXT: Record<string, string> = {
  jpeg: 'jpg',
  webp: 'webp',
  png: 'png',
}

/**
 * 根据输出格式名获取文件扩展名（不带点）
 *
 * @default 'jpg'
 */
export function getFormatExt(fmt?: string) {
  return FORMAT_EXT[fmt || 'jpeg'] || 'jpg'
}

export function getFileName(dir: string, fileName: string, ext: string = 'jpg') {
  const fileNameList = fs.readdirSync(dir)
  const fileNameParse = path.parse(fileName)
  fileName = `${fileNameParse.name}.${ext}`
  const isExist = fileNameList.find(i => i === fileName)

  if (!isExist) {
    return `${fileNameParse.name}.${ext}`
  }

  const fileNameSplitArr = fileNameParse.name.split('-')
  const parseList = fileNameList
    .filter(i => i.startsWith(fileNameParse.name))
    .sort()
    .map((i) => {
      const parse = path.parse(i)
      const arr = parse.name.split('-')
      const info = {
        ...parse,
        baseName: '',
        index: 0,
      }

      if (arr.length === fileNameSplitArr.length + 1) {
        const index = +arr.pop()
        if (!Number.isNaN(index)) {
          info.index = index
        }
      }

      info.baseName = arr.join('-')
      return info
    })
    .sort((a, b) => b.index - a.index)

  return `${fileNameParse.name}-${parseList[0].index + 1}.${ext}`
}

export async function hasNewVersion(): Promise<INewVersionRes> {
  const updateInfo: INewVersionRes = {
    update: false,
    version: `v${import.meta.env.VITE_VERSION}`,
  }

  const res = await tryAsyncCatch(axios.get<IReleaseData>('https://api.github.com/repos/ggchivalrous/yiyin/releases/latest'))

  if (!res || !res.data) {
    return updateInfo
  }
  const data = res.data
  const latestVersion = data.tag_name

  if (latestVersion <= updateInfo.version) {
    return updateInfo
  }

  updateInfo.version = data.tag_name.replace('v', '')
  updateInfo.update = true

  let ext = ''
  switch (process.platform) {
    case 'win32': ext = 'exe'
      break
    case 'darwin': ext = 'dmg'
      break
    default: ext = 'exe'
  }

  const assetsName = `yiyin-${updateInfo.version}-${process.platform}-x64.${ext}`
  const assets = data.assets.find(i => i.name === assetsName)

  if (assets) {
    updateInfo.downloadLink = assets.browser_download_url
  }

  return updateInfo
}
