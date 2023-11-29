import { setCustomAttrToDom } from '../utils';
import { isFunction } from '../utils/types';
import { removeClass, replaceClass, addClass } from '../utils/dom';

interface IOptions {
  delayEnter?: number,
  delayLeave?: number,
  duration?: number,
  name: string
}

interface ITransitionCallBack {
  (): void
  cancelled?: boolean
}

export default (
  dom: HTMLElement & {
    __db_transition_leave_cb?: ITransitionCallBack,
    __db_transition_enter_cb?: ITransitionCallBack
  },
  options: IOptions | string,
) => {
  setCustomAttrToDom(dom, 'transitionAction', (visible: boolean) => (visible ? enter() : leave()));

  const {
    enterActiveCls, enterCls, enterToCls,
    delayEnter, leaveActiveCls, leaveCls,
    leaveToCls, delayLeave,
  } = resolveTransition(options);

  function enter() {
    // 进入动画还未执行完毕，直接取消进入动画
    if (isFunction(dom.__db_transition_leave_cb)) {
      (dom as any).__db_transition_leave_cb.cancelled = true;
      (dom as any).__db_transition_leave_cb();
    }

    // eslint-disable-next-line no-multi-assign
    const cb = (dom as any).__db_transition_enter_cb = onceFun(() => {
      removeClass(dom, `${enterToCls} ${enterActiveCls}`);

      // 取消动画
      if (cb.cancelled) {
        removeClass(dom, enterCls);
        dom.dispatchEvent(new CustomEvent('cancelEnter', { detail: dom }));
      } else {
        dom.dispatchEvent(new CustomEvent('afterEnter', { detail: dom }));
      }

      (dom as any).__db_transition_enter_cb = null;
    });

    if (delayEnter) {
      setTimeout(performEnter, delayEnter);
    } else {
      performEnter();
    }

    function performEnter() {
      if (cb.cancelled) {
        return;
      }
      dom.dispatchEvent(new CustomEvent('beforeEnter', { detail: dom }));

      addClass(dom, `${enterCls} ${enterActiveCls}`);

      nextFrame(() => {
        const { duration, type } = getDomTransitionInfo(dom, options);
        replaceClass(dom, enterCls, enterToCls);

        if (!cb.cancelled) {
          if (duration) {
            setTimeout(cb, duration);
          } else {
            listenTransitionEnd(dom, type, cb);
          }
        }

        dom.dispatchEvent(new CustomEvent('enter', { detail: dom }));
      });
    }
  }

  function leave() {
    // 进入动画还未执行完毕，直接取消进入动画
    if (isFunction(dom.__db_transition_enter_cb)) {
      (dom as any).__db_transition_enter_cb.cancelled = true;
      (dom as any).__db_transition_enter_cb();
    }

    // eslint-disable-next-line no-multi-assign
    const cb = dom.__db_transition_leave_cb = onceFun(() => {
      removeClass(dom, `${leaveToCls} ${leaveActiveCls}`);

      // 取消动画
      if (cb.cancelled) {
        removeClass(dom, leaveCls);
        dom.dispatchEvent(new CustomEvent('cancelLeave', { detail: dom }));
      } else {
        dom.dispatchEvent(new CustomEvent('afterLeave', { detail: dom }));
      }

      (dom as any).__db_transition_leave_cb = null;
    });

    if (delayLeave) {
      setTimeout(performLeave, delayLeave);
    } else {
      performLeave();
    }

    function performLeave() {
      if (cb.cancelled) {
        return;
      }
      dom.dispatchEvent(new CustomEvent('beforeLeave', { detail: dom }));

      addClass(dom, `${leaveCls} ${leaveActiveCls}`);

      nextFrame(() => {
        const { duration, type } = getDomTransitionInfo(dom, options);
        replaceClass(dom, leaveCls, leaveToCls);
        if (!cb.cancelled) {
          if (duration) {
            setTimeout(cb, duration);
          } else {
            listenTransitionEnd(dom, type, cb);
          }
        }

        dom.dispatchEvent(new CustomEvent('leave', { detail: dom }));
      });
    }
  }
};

function resolveTransition(options: IOptions | string) {
  if (typeof options === 'string') {
    options = {
      name: options,
    };
  }

  const prefix = options.name || 'db';
  const data = {
    enterCls: `${prefix}-enter`,
    leaveCls: `${prefix}-leave`,
    enterActiveCls: `${prefix}-enter-active`,
    leaveActiveCls: `${prefix}-leave-active`,
    enterToCls: `${prefix}-enter-to`,
    leaveToCls: `${prefix}-leave-to`,
    delayEnter: options.delayEnter,
    delayLeave: options.delayLeave,
  };

  return data;
}

function getDomTransitionInfo(dom: HTMLElement, options: any) {
  if (typeof options === 'string') {
    options = {
      name: options,
    };
  }

  const style = getComputedStyle(dom);
  const animatReg = /([0-9.]+)/.exec(style.animationDuration);
  const transiReg = /([0-9.]+)/.exec(style.transitionDuration);
  const animatDur = animatReg ? (animatReg[0] as any) * 1000 : 0;
  const transitionDur = transiReg ? (transiReg[0] as any) * 1000 : 0;
  const data = {
    duration: options.duration || transitionDur >= animatDur ? transitionDur : animatDur,
    type: transitionDur >= animatDur ? 'transitionend' : 'animationend',
  };

  return data;
}

function listenTransitionEnd(dom: HTMLElement, type: string, cb: () => any) {
  if (type === 'transitionend') {
    dom.addEventListener('transitionend', cb, false);
  } else {
    dom.addEventListener('animationend', cb, false);
  }
}

function onceFun(fn: any): ITransitionCallBack {
  let res: ITransitionCallBack;
  return (...args: any) => {
    if (fn) {
      res = fn.apply(this, args);
      fn = null;
    }
    return res;
  };
}

function nextFrame(cb: FrameRequestCallback | any) {
  if (window.requestAnimationFrame) {
    window.requestAnimationFrame(cb as FrameRequestCallback);
  } else {
    setTimeout(cb);
  }
}
