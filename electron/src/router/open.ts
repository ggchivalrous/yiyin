import { shell } from 'electron';
import routerConfig from '../../router-config';
import { Router } from '../modules/router';

const r = new Router();

r.listen(routerConfig.open.dir, async (data) => shell.openPath(data));

export default r;
