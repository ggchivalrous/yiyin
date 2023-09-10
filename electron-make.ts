/* eslint-disable no-template-curly-in-string */
import { Configuration } from 'electron-builder';

const outputFileNameTemp = 'yiyin-${version}-${platform}-${arch}.${ext}';

export default {
  appId: 'com.ggchivalrous.yiyin',
  productName: '壹印',
  copyright: 'Copyright © 2023 ${author}',
  directories: {},
  extends: [],
  extraMetadata: {
    main: './main/index.js',
    type: 'commonjs',
  },
  artifactName: outputFileNameTemp,
  files: [
    {
      from: 'dist-electron',
      to: '.',
      filter: [
        '**/*',
        '!package.json',
      ],
    },
    'package.json',
  ],
  mac: {
    icon: './icon/icon.icns',
    category: 'public.app-category.productivity',
  },
  dmg: {
    icon: './icon/icon.icns',
    iconSize: 100,
    contents: [
      {
        x: 380,
        y: 280,
        type: 'link',
        path: '/Applications',
      },
      {
        x: 110,
        y: 280,
        type: 'file',
      },
    ],
  },
  win: {
    icon: './icon/icon.ico',
    target: [
      'msi',
      'nsis',
    ],
  },
  nsis: {
    allowToChangeInstallationDirectory: true,
    oneClick: false,
    perMachine: false,
  },
  linux: {
    icon: './icon/icon.ico',
    target: [
      'deb',
      'rpm',
    ],
  },
} as Configuration;
