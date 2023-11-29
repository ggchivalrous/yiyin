import { Writable } from 'svelte/store';

export const generateId = () => Math.floor(Math.random() * 0xFFFFFF);

export function getSubscribeValue<T>(store?: Writable<T>): T {
  let value: T;
  if (store && store.subscribe) {
    store.subscribe((v) => { value = v; })();
  } else {
    value = store as T;
  }

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

export function getCustomAttrToDom<T = any>(dom: HTMLElement, key: string, defaultVal?: any): T | void {
  if (dom) {
    if (!(dom as any).__db_ui || !Object.prototype.hasOwnProperty.call((dom as any).__db_ui, key)) {
      return defaultVal;
    }
    return (dom as any).__db_ui[key];
  }
  return undefined;
}
