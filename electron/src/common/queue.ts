import { ImageTool } from '@modules/image-tool';
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

export const imageToolQueue = new Queue<ImageTool>({ concurrency: 2, autoRun: false });
