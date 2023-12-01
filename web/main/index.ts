import '../app.scss';
import '../app.css';
import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
import { storePopup } from '@skeletonlabs/skeleton';

import App from './app.svelte';

storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });

const app = new App({
  target: document.getElementById('app'),
});

export default app;
