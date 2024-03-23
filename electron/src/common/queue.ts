import { Queue } from '@modules/queue';
import type { IImgFileInfo } from '@web/modules/text-tool/interface';

export const genTextImgQueue = new Queue<{
  id: string
  textImgList: IImgFileInfo[]
}>({ concurrency: 2 });

export const genMainImgShadowQueue = new Queue<{
  id: string
  data: string
}>({ concurrency: 2 });

export const imageToolQueue = new Queue<{
  path: string
  name: string
}>({ concurrency: 2 });
