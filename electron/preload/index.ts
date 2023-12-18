import routerConfig from '@root/router-config';
import { contextBridge, ipcRenderer } from 'electron';

function generateRouter(config: any): string[] {
  const list = [];
  for (const key in config) {
    if (Object.prototype.hasOwnProperty.call(config, key)) {
      const path = config[key];
      if (typeof path === 'object') {
        list.push(...generateRouter(path));
      } else {
        list.push(path);
      }
    }
  }
  return list;
}

if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.log('页面挂载路由: ', generateRouter(routerConfig).reduce((o, i) => {
    if (i.startsWith('on:')) {
      o[i] = (cb: any) => ipcRenderer.on(i, cb);
    } else {
      o[i] = () => ipcRenderer.invoke(i);
    }
    return o;
  }, {} as any));
}

contextBridge.exposeInMainWorld('api', generateRouter(routerConfig).reduce((o, i) => {
  if (i.startsWith('on:')) {
    o[i] = (cb: any) => ipcRenderer.on(i, (e, d) => cb(d, e));
  } else {
    o[i] = (data: any) => ipcRenderer.invoke(i, data);
  }
  return o;
}, {} as any));
