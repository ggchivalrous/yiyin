import { writable } from 'svelte/store';

export const logoList = writable([]);

async function getLogoList() {
  const info = await window.api.logoList();
  if (info.code === 0) {
    logoList.set(info.data);
  }
}

getLogoList();
