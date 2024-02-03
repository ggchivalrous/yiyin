import { get, writable } from 'svelte/store';

import { staticInfo } from './config';

function genFileName(name: string) {
  return `${get(staticInfo).webDir}/logo/${name}`;
}

export const staticList = writable([]);

staticInfo.subscribe(() => {
  staticList.set([
    genFileName('canon-b.svg'),
    genFileName('canon-w.svg'),
    genFileName('fujifilm-b.svg'),
    genFileName('fujifilm-w.svg'),
    genFileName('hasselblad-b.svg'),
    genFileName('hasselblad-w.svg'),
    genFileName('leica-b.svg'),
    genFileName('leica-w.svg'),
    genFileName('panasonic-b.svg'),
    genFileName('panasonic-w.svg'),
    genFileName('nikon-b.svg'),
    genFileName('nikon-w.svg'),
    genFileName('olympus-b.svg'),
    genFileName('olympus-w.svg'),
    genFileName('pentax-b.svg'),
    genFileName('pentax-w.svg'),
    genFileName('ricoh-b.svg'),
    genFileName('ricoh-w.svg'),
    genFileName('sigma-b.svg'),
    genFileName('sigma-w.svg'),
    genFileName('songdian-b.svg'),
    genFileName('songdian-w.svg'),
    genFileName('sony-b.svg'),
    genFileName('sony-w.svg'),
    genFileName('dji-b.svg'),
    genFileName('dji-w.svg'),
  ]);
});
