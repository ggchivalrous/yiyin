import type { INewVersionRes } from '@src/interface';
import { writable } from 'svelte/store';

export const version = writable<{
  curVersion: string
  newVersion: string
  downloadLink: string
}>({
  curVersion: import.meta.env.VITE_VERSION,
  newVersion: import.meta.env.VITE_VERSION,
  downloadLink: '',
});

window.api['on:assetsUpdate']((versionInfo: INewVersionRes) => {
  if (!versionInfo) return;

  version.update((d) => {
    d.newVersion = versionInfo.version;
    d.downloadLink = versionInfo.downloadLink;
    return d;
  });
});
