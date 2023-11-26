import { getCustomAttrToDom } from '../utils';

export default function (dom: HTMLElement, visible: any) {
  const orginDisplay = dom.style.display;
  let oldVisible = visible;

  // eslint-disable-next-line no-unused-expressions
  visible && getCustomAttrToDom(dom, 'transitionAction', () => { })(visible);
  dom.style.display = oldVisible ? orginDisplay : 'none';

  dom.addEventListener('afterEnter', () => {
    dom.style.display = oldVisible ? orginDisplay : 'none';
  });

  dom.addEventListener('afterLeave', () => {
    dom.style.display = oldVisible ? orginDisplay : 'none';
  });

  return {
    // eslint-disable-next-line no-shadow
    update(visible) {
      if (oldVisible !== visible) {
        oldVisible = visible;
        const actionTransitionCb = getCustomAttrToDom(dom, 'transitionAction');

        if (oldVisible) {
          dom.style.display = orginDisplay;
        } else if (!actionTransitionCb) {
          dom.style.display = 'none';
        }
        // eslint-disable-next-line no-unused-expressions
        actionTransitionCb && actionTransitionCb(visible);
      }
    },
  };
}
