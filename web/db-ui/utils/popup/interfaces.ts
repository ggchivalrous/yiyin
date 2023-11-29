import type { Writable } from 'svelte/store';

export interface IInstances {
  [key: string]: IInstance | null
}

type Fn = (...any: any) => any

export interface IInstance {
  visible?: Writable<boolean>,
  openDelay?: Writable<number>,
  closeDelay?: Writable<number>,
  zIndex?: Writable<number>,
  modal?: Writable<boolean>,
  modalFade?: Writable<boolean>,
  modalClass?: Writable<string>,
  modalAppendToBody?: Writable<boolean>,
  lockScroll?: Writable<boolean>,
  closeOnPressEscape?: Writable<boolean>,
  closeOnClickModal?: Writable<boolean>,
  open?: Fn,
  doOpen?: Fn,
  doAfterOpen?: Fn,
  close?: Fn,
  doClose?: Fn,
  doAfterClose?: Fn,
  restoreBodyStyle?: Fn,
  handleClose?: Fn,
  handleAction?: Fn
}
