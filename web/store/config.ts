/* eslint-disable no-console */
import { Message } from '@ggchivalrous/db-ui';
import { writable } from 'svelte/store';

import type { IConfig } from '../main/interface';

let initConfig = false;
let loadConfig = false;

export const config = writable<IConfig>({
  options: {
    landscape: false,
    solid_bg: false,
    origin_wh_output: true,
    radius: 2.1,
    radius_show: true,
    shadow: 6,
    shadow_show: true,
    bg_rate_show: true,
    font: '',
    bg_rate: {
      w: 0,
      h: 0,
    },
  },
  fontMap: {},
  fontDir: '',
  tempFields: [],
  output: '',
  staticDir: '',
});

export async function getConfig() {
  loadConfig = true;
  const defConf = await window.api.getConfig();
  if (defConf.code === 0) {
    config.update((v) => {
      v.options = defConf.data.options;
      v.output = defConf.data.output;
      v.fontMap = defConf.data.font.map;
      v.fontDir = defConf.data.font.dir;
      v.tempFields = defConf.data.tempFields;
      v.staticDir = defConf.data.staticDir;
      return v;
    });
    console.log('配置信息:', defConf.data);
    config.subscribe((v) => console.log('使用配置信息:', v))();
  }
  loadConfig = false;
}

export async function resetConfig() {
  const res = await window.api.resetConfig();
  if (res.code !== 0) {
    Message.error(`重置失败！！${res.message}`);
    return;
  }

  config.update((v) => {
    v.options = res.data.options;
    v.output = res.data.output;
    v.fontMap = res.data.font.map;
    v.fontDir = res.data.font.dir;
    v.tempFields = res.data.tempFields;
    v.staticDir = res.data.staticDir;
    return v;
  });
  Message.success({ message: '重置成功' });
}

export const pathInfo = writable({
  public: '',
  logo: '',
});

config.subscribe(async (v) => {
  if (initConfig && !loadConfig) {
    console.log('持久化配置信息');

    const _conf = await window.api.setConfig(v);
    if (_conf.code !== 0) {
      console.log('持久化配置信息失败:', _conf.message);
      Message.error(`配置持久化失败!!${_conf.message}`);
      return;
    }

    console.log('配置信息:', _conf.data);
    config.subscribe((_v) => console.log('使用配置信息:', _v))();
  }
});

getConfig().then(() => { initConfig = true; });

async function getPathInfo() {
  const info = await window.api.pathInfo();
  if (info.code === 0) {
    pathInfo.set(info.data);
  }
}

getPathInfo();
