import { Writable } from 'svelte/store';

export const generateId = () => Math.floor(Math.random() * 0xFFFFFF);

export function getSubscribeValue<T>(store?: Writable<T>): T {
  let value;
  if (store && store.subscribe) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    store.subscribe((v) => { value = v; })();
  } else {
    value = store;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return value;
}

export function setCustomAttrToDom(dom: HTMLElement, key: string, val: any) {
  if (dom) {
    if (!(dom as any).__db_ui) {
      (dom as any).__db_ui = {
        [key]: val,
      };
    } else {
      (dom as any).__db_ui[key] = val;
    }
  }
}

// eslint-disable-next-line consistent-return
export function getCustomAttrToDom<T = any>(dom: HTMLElement, key: string, defaultVal?: any): T | void {
  if (dom) {
    if (!(dom as any).__db_ui || !Object.prototype.hasOwnProperty.call((dom as any).__db_ui, key)) {
      return defaultVal;
    }
    return (dom as any).__db_ui[key];
  }
}
