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
