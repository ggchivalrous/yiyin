import { ImageTool } from '@modules/image-tool';
import { Logger } from '@modules/logger';
import { Queue } from '@modules/queue';
import { config } from '@src/config';
import { cpObj } from '@utils';
import type { IImgFileInfo } from '@web/modules/text-tool/interface';

const log = new Logger('ImgToolQueue');

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

imageToolQueue.on(async (data) => {
  if (data) {
    const imgTool = new ImageTool(data.path, data.name, {
      cachePath: config.cacheDir,
      outputOption: cpObj(config.options),
      outputPath: cpObj(config.output),
    });
    await imgTool.genWatermark();
  }
});

imageToolQueue.onerror((t, e) => {
  log.error('队列执行异常 类型[%s]', t, e);
});
