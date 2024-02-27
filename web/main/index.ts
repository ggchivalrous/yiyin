import '../app.scss';
import '@ggchivalrous/db-ui/components/theme/index.css';

import App from './app.svelte';

const app = new App({
  target: document.getElementById('app'),
});

export default app;
