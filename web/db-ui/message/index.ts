import MessageComponent from './message.svelte';
import PopupManager from '../utils/popup';
import type { IMessage, Props, IUserCloseFun } from './interfaces';

let instance: MessageComponent;
let seed = 1;
const instances: MessageComponent[] = [];

const Message: IMessage = function (options: Props | string) {
  if (typeof options === 'string') {
    options = {
      message: options,
    };
  }

  const id = `message_${seed++}`;
  const userOnClose = options.onClose as IUserCloseFun;

  options.onClose = function () {
    Message.close(id, userOnClose);
  };

  instance = new MessageComponent({
    props: options as any,
    target: document.body,
  });

  let verticalOffset = options.offset || 20;
  instances.forEach((item: any) => {
    verticalOffset += item.el.offsetHeight + 16;
  });

  instance.$set({
    id,
    visible: true,
    verticalOffset,
    destroy: close.bind(instance),
    zIndex: PopupManager.nextZIndex(),
  });

  instances.push(instance);

  function close() {
    (this as MessageComponent).$destroy();
  }

  return instance;
};

// eslint-disable-next-line no-shadow
enum Type {
  success = 'success',
  warning = 'warning',
  info = 'info',
  error = 'error'
}

Message.success = createMessageFun(Type.success);
Message.info = createMessageFun(Type.info);
Message.waring = createMessageFun(Type.warning);
Message.error = createMessageFun(Type.error);

function createMessageFun(type: Type) {
  return function (options: Props | string) {
    if (typeof options === 'string') {
      options = {
        message: options,
      };
    }
    options.type = type;
    return Message(options);
  };
}

Message.close = function (id: string, userOnClose) {
  const len = instances.length;
  let index = -1;
  let removedHeight;

  for (let i = 0; i < len; i++) {
    // eslint-disable-next-line no-shadow
    const instance: any = instances[i];
    if (id === instance.id) {
      removedHeight = (instance.el.offsetHeight as number);
      index = i;
      if (typeof userOnClose === 'function') {
        userOnClose(instance);
      }
      instances.splice(i, 1);
      instance.$set({ visible: false });
      break;
    }
  }

  if (len <= 1 || index === -1 || index > instances.length - 1) {
    return;
  }
  for (let i = index; i < len - 1; i++) {
    const dom = (instances[i] as any).el as HTMLElement;
    dom.style.top = `${parseInt(dom.style.top, 10) - removedHeight - 16}px`;
  }
};

Message.closeAll = function () {
  for (let i = instances.length - 1; i >= 0; i--) {
    (instances[i] as any).onClose();
  }
};

export default Message;
