import fs from 'fs';
import { join, resolve } from 'path';

import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

import pkg from './package.json';

const electronOutDir = join(__dirname, 'dist-electron');
const electronPkg = join(electronOutDir, 'package.json');
const electronAlias = {
  '@root': resolve(__dirname, 'electron'),
  '@src': resolve(__dirname, 'electron/src'),
  '@config': resolve(__dirname, 'electron/src/config.ts'),
  '@modules': resolve(__dirname, 'electron/src/modules'),
  '@utils': resolve(__dirname, 'electron/src/utils'),
  '@router': resolve(__dirname, 'electron/src/router'),
};

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
            resolve: {
              alias: electronAlias,
              extensions: ['.ts', '.js', '.mjs'],
            },
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
            resolve: {
              alias: electronAlias,
              extensions: ['.ts', '.js', '.mjs'],
            },
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
        '@components': resolve(__dirname, 'web/components'),
        '@db-ui': resolve(__dirname, 'web/db-ui'),
        ...electronAlias,
      },
      extensions: ['.js', '.mjs', '.svelte', '.ts'],
    },
  };
});
