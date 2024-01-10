import { format } from 'util';

import { IpcMainInvokeEvent, ipcMain, BrowserWindow } from 'electron';

import { Logger } from '../logger';

const log = new Logger('RouterM');

export interface Handler<Data = any, Result = any> {
  (data: Data, event: IpcMainInvokeEvent, window: BrowserWindow): Promise<void | Result>
}

export interface ResultData<Data = any> {
  code: number
  message: string
  data?: Data
}

export class Router {
  routers: Map<string, Handler[]> = new Map();

  sends: Map<string, Handler[]> = new Map();

  listen<Data = string, Result = any>(title: string, ...handlers: Handler<Data, Result>[]) {
    this.routers.set(title, handlers);
  }

  private handle<Result = any>(title: string, handlers: Handler[], win: BrowserWindow) {
    ipcMain.handle(title, (event, data, ...a) => {
      let i = 0;
      const len = handlers.length;
      const returnData: ResultData<Result> = {
        code: 0,
        message: '',
      };

      const next = async () => {
        if (i >= len) {
          return returnData;
        }

        try {
          const handler = handlers[i++];
          const _data = await handler(data, event, win);
          returnData.data = _data;
        } catch (e) {
          log.error('接口【%s】异常:', title, e);
          returnData.code = 500;
          returnData.message = format(e);
        }

        return returnData;
      };

      return next();
    });
  }

  use(ints: BrowserWindow) {
    for (const [title, handles] of this.routers) {
      this.handle(title, handles, ints);
    }
  }
}
