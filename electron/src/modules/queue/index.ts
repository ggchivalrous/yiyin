import { md5, sleep, tryAsyncCatch } from '@utils';

export interface QueueOption {
  concurrency: number
  autoRun?: boolean
}

export interface QueueHandler<T> {
  (data: T, id: string): Promise<void>
}

export class Queue<T = any> {
  private opt: QueueOption;

  private status: 'close' |'running' | 'drain' = 'drain';

  private queue: Map<string, T> = new Map();

  private concurrency = 1;

  private queueHandler: QueueHandler<T>[] = [];

  private error: (type: string, e: Error) => void = () => {};

  private closeing = false;

  private awaitList: Map<string, Promise<string>> = new Map();

  get list() {
    return [...this.queue.values()];
  }

  constructor(opt?: QueueOption) {
    this.concurrency = opt?.concurrency || 1;
    this.opt = { autoRun: true, ...opt };
  }

  add(d: T, id?: string) {
    id = id || md5(`${Date.now() + Math.random() * 100000}`);
    this.queue.set(id, d);

    // 队列为空时启动轮询
    if (this.status === 'drain' && this.opt.autoRun) {
      this.run();
    }
  }

  remove(id: string) {
    return this.queue.delete(id);
  }

  drain() {
    this.queue.clear();
  }

  on(listen: QueueHandler<T>): Queue {
    if (!listen) return this;

    const _ = this.queueHandler.find((i) => i === listen);
    if (_) return this;

    this.queueHandler.push(listen);
    return this;
  }

  off(listen: QueueHandler<T>): Queue {
    if (!listen) return this;

    const index = this.queueHandler.findIndex((i) => i === listen);
    if (index !== -1) {
      this.queueHandler.splice(index, 1);
    }

    return this;
  }

  onerror(listen: (type: string, e: Error) => void) {
    this.error = listen;
  }

  async close() {
    this.closeing = true;
    this.status = 'close';
    return Promise.all(this.awaitList).catch((e) => {
      this.error('close', e);
    });
  }

  async run() {
    if (this.status === 'running') return;

    this.status = 'running';
    let flag = 1;
    const awaitList: Map<string, Promise<string>> = this.awaitList;

    while (!this.closeing && (awaitList.size || this.queue.size)) {
      for (const [id, data] of this.queue) {
        this.queue.delete(id);
        flag = 1;
        const _awaitList: any[] = [];

        // 将队列信息发布给所有监听的函数
        for (const handler of this.queueHandler) {
          _awaitList.push(handler(data, id).catch((e) => {
            this.error('Handler', e);
          }));
        }

        awaitList.set(id, (async () => {
          await tryAsyncCatch(Promise.all(_awaitList), null, (e) => {
            this.error('PromiseAll', e);
          });
          return id;
        })());

        // 达到并发数
        if (this.concurrency >= awaitList.size || this.closeing) {
          break;
        }
      }

      if (awaitList.size < this.concurrency && !awaitList.has('def')) {
        const sleepTs = Math.min(flag++ * 100, 5e3);
        awaitList.set('def', (async () => {
          await sleep(sleepTs);
          return 'def';
        })());
      }

      const id = await tryAsyncCatch(Promise.race(awaitList.values()), null, (e) => {
        this.error('PromiseRace', e);
      });
      awaitList.delete(id);
    }

    this.status = 'drain';
  }
}
