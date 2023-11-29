import { getCustomAttrToDom } from '../utils';

export default (dom: HTMLElement, visible: any) => {
  const orginDisplay = dom.style.display;
  let oldVisible = visible;

  if (visible) {
    getCustomAttrToDom(dom, 'transitionAction', () => { })(visible);
  }

  dom.style.display = oldVisible ? orginDisplay : 'none';

  dom.addEventListener('afterEnter', () => {
    dom.style.display = oldVisible ? orginDisplay : 'none';
  });

  dom.addEventListener('afterLeave', () => {
    dom.style.display = oldVisible ? orginDisplay : 'none';
  });

  return {
    update(_visible: boolean) {
      if (oldVisible !== _visible) {
        oldVisible = _visible;
        const actionTransitionCb = getCustomAttrToDom(dom, 'transitionAction');

        if (oldVisible) {
          dom.style.display = orginDisplay;
        } else if (!actionTransitionCb) {
          dom.style.display = 'none';
        }

        if (actionTransitionCb) {
          actionTransitionCb(_visible);
        }
      }
    },
  };
};
