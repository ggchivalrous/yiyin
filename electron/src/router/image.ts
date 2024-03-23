import { OutputOption } from '@modules/image-tool/interface';
import { Router } from '@modules/router';
import routerConfig from '@root/router-config';
import { genMainImgShadowQueue, genTextImgQueue, imageToolQueue } from '@src/common/queue';

const r = new Router();

interface StartTaskData {
  fileUrlList: {
    path: string
    name: string
  }[]
  option: OutputOption
}

r.listen<any, boolean>(routerConfig.startTask, async (data: StartTaskData) => {
  for (const fileInfo of data.fileUrlList) {
    imageToolQueue.add({ ...fileInfo });
  }
  return true;
});

r.listen(routerConfig.genTextImg, async (data: any) => {
  genTextImgQueue.add(data);
});

r.listen(routerConfig.genMainImgShadow, async (data: any) => {
  genMainImgShadowQueue.add(data);
});

export default r;
