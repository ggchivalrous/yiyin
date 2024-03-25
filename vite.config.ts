import fs from 'fs';
import { join, resolve } from 'path';

import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

import pkg from './package.json';
import installExiftool from './scripts/install-exiftool';

const electronOutDir = join(__dirname, 'dist-electron');
const electronPkg = join(electronOutDir, 'package.json');
const electronAlias = {
  '@': __dirname,
  '@root': resolve(__dirname, 'electron'),
  '@src': resolve(__dirname, 'electron/src'),
  '@config': resolve(__dirname, 'electron/src/config.ts'),
  '@modules': resolve(__dirname, 'electron/src/modules'),
  '@utils': resolve(__dirname, 'electron/src/utils'),
  '@router': resolve(__dirname, 'electron/src/router'),
};

function objToEnvStr(obj: Record<string, any>) {
  const arr: string[] = [];

  for (const k in obj) {
    arr.push(`VITE_${k}=${obj[k]}`);
  }

  return arr.join('\n');
}

export default defineConfig(async ({ command }) => {
  const port = 5173;
  const isServe = command === 'serve';
  const isBuild = command === 'build';
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

  const env: Record<string, any> = {
    VERSION: pkg.version,
    DIST_ELECTRON: electronOutDir,
    WEB: join(electronOutDir, 'web'),
    URL: isServe ? `http://localhost:${port}` : '',
  };

  env.PUBLIC = isServe ? join(__dirname, 'web/public') : env.WEB;
  env.EXIFTOOL = env.DIST_ELECTRON;

  fs.writeFileSync(join(__dirname, '.env.local'), objToEnvStr(env));
  if (!fs.existsSync(electronOutDir)) {
    fs.mkdirSync(electronOutDir);
  }

  // electron输出目录添加package文件
  fs.writeFileSync(electronPkg, JSON.stringify({
    ...pkg,
    main: 'main/index.js',
    type: 'commonjs',
  }, null, 2));

  // exiftool工具打包进来
  await installExiftool(env.DIST_ELECTRON);

  return {
    root: 'web',
    envDir: join(__dirname, './'),
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
      outDir: env.WEB,
      rollupOptions: {
        input: {
          main: join(__dirname, './web/main/index.html'),
        },
      },
    },
    resolve: {
      alias: {
        '@web': resolve(__dirname, 'web'),
        '@components': resolve(__dirname, 'web/components'),
        '@common': resolve(__dirname, 'common'),
        '@web-utils': resolve(__dirname, 'web/util'),
        ...electronAlias,
      },
      extensions: ['.js', '.mjs', '.svelte', '.ts'],
    },
  };
});
