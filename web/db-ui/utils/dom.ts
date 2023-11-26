/* eslint-disable prefer-arrow-callback */
const SPECIAL_CHARS_REGEXP = /([:\-_]+(.))/g;
const MOZ_HACK_REGEXP = /^moz([A-Z])/;
const ieVersion = Number((document as any).documentMode);

function trim(string: string) {
  return (string || '').replace(/^[\s\uFEFF]+|[\s\uFEFF]+$/g, '');
}

function camelCase(name: string) {
  return name.replace(SPECIAL_CHARS_REGEXP, function (_, separator, letter: string, offset) {
    return offset ? letter.toUpperCase() : letter;
  }).replace(MOZ_HACK_REGEXP, 'Moz$1');
}

export const on = (function () {
  if (typeof document.addEventListener === 'function') {
    return function (element: HTMLElement | Document | Window, event: string, handler: EventListener) {
      if (element && event && handler) {
        element.addEventListener(event, handler, false);
      }
    };
  }
  return function (element: HTMLElement | Document | Window, event: string, handler: EventListener) {
    if (element && event && handler) {
      (element as any).attachEvent(`on${event}`, handler);
    }
  };
}());

export const off = (function () {
  if (typeof document.removeEventListener === 'function') {
    return function (element: HTMLElement | Document | Window, event: string, handler: EventListener) {
      if (element && event) {
        element.removeEventListener(event, handler, false);
      }
    };
  }
  return function (element: HTMLElement | Document | Window, event: string, handler: EventListener) {
    if (element && event) {
      (element as any).detachEvent(`on${event}`, handler);
    }
  };
}());

export const once = function (el: HTMLElement | Document | Window, event: string, fn: EventListener) {
  const listener = function (...args) {
    if (fn) { fn.apply(this, args); }
    off(el, event, listener);
  };
  on(el, event, listener);
};

export function hasClass(el: HTMLElement, cls: string) {
  if (!el || !cls) { return false; }
  if (cls.indexOf(' ') !== -1) { throw new Error('className should not contain space.'); }
  if (el.classList) {
    return el.classList.contains(cls);
  }
  return (` ${el.className} `).indexOf(` ${cls} `) > -1;
}

export function addClass(el: HTMLElement, cls: string, isStart = false) {
  if (!el) { return; }
  let curClass = el.className;
  const classes = (cls || '').split(' ');

  for (let i = 0, j = classes.length; i < j; i++) {
    const clsName = classes[i];
    if (!clsName) { continue; }

    if (el.classList) {
      el.classList.add(clsName);
    } else if (!hasClass(el, clsName)) {
      if (isStart) {
        curClass = `${clsName} ${curClass}`;
      } else {
        curClass += ` ${clsName}`;
      }
    }
  }
  if (!el.classList) {
    el.className = curClass;
  }
}

export function removeClass(el: HTMLElement, cls: string) {
  if (!el || !cls) { return; }
  const classes = cls.split(' ');
  let curClass = ` ${el.className} `;

  for (let i = 0, j = classes.length; i < j; i++) {
    const clsName = classes[i];
    if (!clsName) { continue; }

    if (el.classList) {
      el.classList.remove(clsName);
    } else if (hasClass(el, clsName)) {
      curClass = curClass.replace(` ${clsName} `, ' ');
    }
  }
  if (!el.classList) {
    el.className = trim(curClass);
  }
}

export function replaceClass(el: HTMLElement, rcls: string, acls: string) {
  if (!el) { return; }
  let curClass = el.className;
  const rclasses = (rcls || '').split(' ').filter(Boolean);
  const aclasses = (acls || '').split(' ').filter(Boolean);

  for (let i = 0, j = rclasses.length; i < j; i++) {
    const rclsName = rclasses[i];
    const aclsName = aclasses[i];

    if (el.classList) {
      if (el.classList.contains(rclsName)) {
        el.classList.replace(rclsName, aclsName);
      } else {
        el.classList.add(aclsName);
      }
    } else if (curClass.indexOf(rclsName) !== -1) {
      curClass = curClass.replace(rclsName, aclsName);
    } else {
      curClass += ` ${aclsName}`;
    }
  }

  if (!el.classList) {
    el.className = curClass;
  }
}

export const getStyle = ieVersion < 9 ? function (element: HTMLElement, styleName: string) {
  if (!element || !styleName) { return null; }

  styleName = camelCase(styleName);

  if (styleName === 'float') {
    styleName = 'styleFloat';
  }

  try {
    switch (styleName) {
      case 'opacity':
        try {
          return (element as any).filters.item('alpha').opacity / 100;
        } catch (e) {
          return 1.0;
        }
      default:
        return element.style[styleName] as string | number;
    }
  } catch (e) {
    return element.style[styleName] as string | number;
  }
} : function (element: HTMLElement, styleName: string) {
  if (!element || !styleName) { return null; }
  styleName = camelCase(styleName);
  if (styleName === 'float') {
    styleName = 'cssFloat';
  }
  try {
    const computed = document.defaultView?.getComputedStyle(element, '') || {};
    return (element.style[styleName] || computed ? computed[styleName] : null) as string | number;
  } catch (e) {
    return element.style[styleName] as string | number;
  }
};

export function setStyle(element: HTMLElement, styleName: string | { [key: string]: string }, value: string | number) {
  if (!element || !styleName) { return; }

  if (typeof styleName === 'object') {
    for (const prop in styleName) {
      // eslint-disable-next-line no-prototype-builtins
      if (styleName.hasOwnProperty(prop)) {
        setStyle(element, prop, styleName[prop]);
      }
    }
  } else {
    styleName = camelCase(styleName);
    if (styleName === 'opacity' && ieVersion < 9) {
      element.style.filter = Number.isNaN((value as number)) ? '' : `alpha(opacity=${(value as number) * 100})`;
    } else {
      element.style[styleName] = value;
    }
  }
}

export function isScroll(el: HTMLElement, vertical: boolean) {
  const determinedDirection = vertical !== null || vertical !== undefined;
  // eslint-disable-next-line no-nested-ternary
  const overflow = determinedDirection
    ? vertical
      ? getStyle(el, 'overflow-y')
      : getStyle(el, 'overflow-x')
    : getStyle(el, 'overflow');

  return (overflow as string).match(/(scroll|auto)/);
}

/** 轮询向上查询具有滚动的dom */
export function getScrollContainer(el: HTMLElement, vertical: boolean) {
  let parent = el;

  while (parent) {
    if ([window, document, document.documentElement].includes(parent)) {
      return window;
    }
    if (isScroll(parent, vertical)) {
      return parent;
    }
    parent = parent.parentNode as HTMLElement;
  }

  return parent;
}

export function isInContainer(el: Element, container: HTMLElement) {
  if (!el || !container) { return false; }

  const elRect = el.getBoundingClientRect();
  let containerRect;

  if ([window, document, document.documentElement, null, undefined].includes(container)) {
    containerRect = {
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
      left: 0,
    };
  } else {
    containerRect = container.getBoundingClientRect();
  }

  return elRect.top < containerRect.bottom && elRect.bottom > containerRect.top && elRect.right > containerRect.left && elRect.left < containerRect.right;
}
