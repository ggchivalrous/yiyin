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
    genFileName('hasu-b.svg'),
    genFileName('hasu-w.svg'),
    genFileName('leica-b.svg'),
    genFileName('leica-w.svg'),
    genFileName('lumix-b.svg'),
    genFileName('lumix-w.svg'),
    genFileName('nikon-b.svg'),
    genFileName('nikon-w.svg'),
    genFileName('olpmpus-b.svg'),
    genFileName('olpmpus-w.svg'),
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
  ]);
});
