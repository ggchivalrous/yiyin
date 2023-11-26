import { writable } from 'svelte/store';
import { getSubscribeValue } from '..';
import { addClass, removeClass } from '../dom';
import type { IInstance, IInstances } from './interfaces';

export const idSeed = writable(1);

interface Stack {
  id: string | number
  zIndex: string | number
  modalClass: string
}

let hasModal = false;

function getModal() {
  let modalDom = PopupManager.modalDom;
  if (modalDom) {
    hasModal = true;
  } else {
    hasModal = false;
    modalDom = document.createElement('div');
    PopupManager.modalDom = modalDom;

    modalDom.addEventListener('touchmove', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });

    modalDom.addEventListener('click', () => PopupManager.doOnModalClick && PopupManager.doOnModalClick());
  }

  return modalDom;
}

class PopupManager {
  static modalDom: HTMLDivElement | null;

  static modalFade = true;

  static modalStack: Array<Stack> = [];

  private static instances: IInstances = {};

  private static _zIndex = 2022;

  static get zIndex() {
    return this._zIndex;
  }

  static set zIndex(value: number) {
    this._zIndex = value;
  }

  static getInstance(id: number | string) {
    return this.instances[id];
  }

  static register(id: number | string, instance: IInstance) {
    if (id && instance) {
      this.instances[id] = instance;
    }
  }

  static deregister(id: number | string) {
    if (id) {
      this.instances[id] = null;
      delete this.instances[id];
    }
  }

  static nextZIndex() {
    return this._zIndex++;
  }

  static doOnModalClick() {
    const topItem = this.modalStack[this.modalStack.length - 1];
    if (!topItem) { return; }

    const instance = this.getInstance(topItem.id);
    if (instance && getSubscribeValue(instance.closeOnClickModal) && instance.close) {
      instance.close();
    }
  }

  static openModal(
    id: number | string,
    zIndex: string | number,
    dom: HTMLElement,
    modalClass: string,
    _modalFade: boolean,
  ) {
    if (!id || zIndex === undefined) { return; }
    this.modalFade = _modalFade;

    for (let i = 0, j = this.modalStack.length; i < j; i++) {
      const item = this.modalStack[i];
      if (item.id === id) {
        return;
      }
    }

    const modalDom = getModal();

    addClass(modalDom, 'db-modal');
    if (_modalFade && !hasModal) {
      addClass(modalDom, 'db-modal-enter');
    }
    if (modalClass) {
      const classArr = modalClass.trim().split(/\s+/);
      classArr.forEach((item) => addClass(modalDom, item));
    }
    setTimeout(() => {
      removeClass(modalDom, 'db-modal-enter');
    }, 200);

    if (dom && dom.parentNode && dom.parentNode.nodeType !== 11) {
      dom.parentNode.appendChild(modalDom);
    } else {
      document.body.appendChild(modalDom);
    }

    if (zIndex) {
      modalDom.style.zIndex = zIndex.toString();
    }
    modalDom.tabIndex = 0;
    modalDom.style.display = '';

    this.modalStack.push({ id, zIndex, modalClass });
  }

  static closeModal(id) {
    const modalDom = getModal();

    if (this.modalStack.length > 0) {
      const topItem = this.modalStack[this.modalStack.length - 1];
      if (topItem.id === id) {
        if (topItem.modalClass) {
          const classArr = topItem.modalClass.trim().split(/\s+/);
          classArr.forEach((item) => removeClass(modalDom, item));
        }

        this.modalStack.pop();
        if (this.modalStack.length > 0) {
          modalDom.style.zIndex = this.modalStack[this.modalStack.length - 1].zIndex.toString();
        }
      } else {
        for (let i = this.modalStack.length - 1; i >= 0; i--) {
          if (this.modalStack[i].id === id) {
            this.modalStack.splice(i, 1);
            break;
          }
        }
      }
    }

    if (this.modalStack.length === 0) {
      if (this.modalFade) {
        addClass(modalDom, 'db-modal-leave');
      }
      setTimeout(() => {
        if (this.modalStack.length === 0) {
          if (modalDom.parentNode) {
            modalDom.parentNode.removeChild(modalDom);
          }
          modalDom.style.display = 'none';
          PopupManager.modalDom = null;
        }
        removeClass(modalDom, 'db-modal-leave');
      }, 200);
    }
  }
}

const getTopPopup = () => {
  if (PopupManager.modalStack.length > 0) {
    const topPopup = PopupManager.modalStack[PopupManager.modalStack.length - 1];
    if (!topPopup) { return undefined; }
    const instance = PopupManager.getInstance(topPopup.id);

    return instance;
  }
  return undefined;
};

window.addEventListener('keydown', (event) => {
  if (event.keyCode === 27) {
    const topPopup = getTopPopup();
    if (topPopup && getSubscribeValue(topPopup.closeOnPressEscape)) {
      if (topPopup.handleClose) {
        topPopup.handleClose();
      } else if (topPopup.handleAction) {
        topPopup.handleAction('cancel');
      } else if (topPopup.close) {
        topPopup.close();
      }
    }
  }
});

export default PopupManager;
