import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import fs from 'fs';
import { join, resolve } from 'path';
import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import pkg from './package.json';

const electronOutDir = join(__dirname, 'dist-electron');
const electronPkg = join(electronOutDir, 'package.json');

export default defineConfig(({ command }) => {
  const port = 5173;
  const isServe = command === 'serve';
  const isBuild = command === 'build';
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

  process.env.DIST_ELECTRON = electronOutDir;
  process.env.VITE_WEB = join(electronOutDir, 'web');
  process.env.PUBLIC = isServe ? join(__dirname, 'public') : process.env.VITE_WEB;
  process.env.URL = isServe ? `http://localhost:${port}` : '';

  if (!fs.existsSync(electronOutDir)) {
    fs.mkdirSync(electronOutDir);
  }
  fs.writeFileSync(electronPkg, JSON.stringify({
    ...pkg,
    main: 'main/index.js',
    type: 'commonjs',
  }, null, 2));

  return {
    root: 'web',
    plugins: [
      electron([
        {
          entry: 'electron/main/index.ts',
          onstart(options) {
            if (process.env.VSCODE_DEBUG) {
              console.log(/* For `.vscode/.debug.script.mjs` */'[startup] Electron App');
            } else {
              options.startup();
            }
          },
          vite: {
            build: {
              sourcemap: sourcemap ? 'inline' : undefined,
              minify: isBuild,
              outDir: join(electronOutDir, 'main'),
              rollupOptions: {
                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
              },
            },
          },
        },
        {
          entry: 'electron/preload/index.ts',
          onstart(options) {
            options.reload();
          },
          vite: {
            build: {
              sourcemap: sourcemap ? 'inline' : undefined,
              minify: isBuild,
              outDir: join(electronOutDir, 'preload'),
              rollupOptions: {
                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
              },
            },
          },
        },
      ]),
      // Use Node.js API in the Renderer-process
      renderer(),
      svelte({
        preprocess: vitePreprocess(),
      }),
    ],
    clearScreen: false,
    server: {
      open: false,
      host: '0.0.0.0',
      port,
    },
    build: {
      outDir: process.env.VITE_WEB,
      rollupOptions: {
        input: {
          main: join(__dirname, './web/main/index.html'),
          mask: join(__dirname, './web/mask/index.html'),
        },
      },
    },
    resolve: {
      alias: {
        '@web': resolve(__dirname, 'web'),
        '@page': resolve(__dirname, 'web/page'),
        '@pages': resolve(__dirname, 'web/pages'),
      },
      extensions: ['.js', '.mjs', '.svelte', '.ts'],
    },
  };
});
