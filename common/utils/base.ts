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

export const sleep = (ms: number) => new Promise((e) => { setTimeout(e, ms); });

export const pollSleep = async (fn: () => boolean, ms = 500, timeout = 60e3) => {
  let totalMs = 0;
  while (!fn() && totalMs < timeout) {
    await sleep(ms);
    totalMs += ms;
  }
};

interface IArrToObjCb<T, R = T> {
  (item: T, objV: R, index: number): R
}

export const arrToObj = <T = any, R = T>(arr: T[], field?: string, cb?: IArrToObjCb<T, R>): Record<any, R> => {
  const _obj: Record<any, any> = {};

  if (typeof cb !== 'function') {
    cb = (item) => item as any;
  }

  for (let i = 0; i < arr.length; i++) {
    const item: any = arr[i];

    if (field === undefined || field === null) {
      _obj[i] = cb(item, _obj[i], i);
    } else {
      _obj[item[field]] = cb(item, _obj[item[field]], i);
    }
  }

  return _obj;
};
