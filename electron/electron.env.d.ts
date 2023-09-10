/// <reference types="vite-plugin-electron/electron-env" />

declare module 'exif-parser';

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * electron ts构建输出目录
     */
    DIST_ELECTRON: string

    /**
     * 界面资源
     */
    WEB: string

    /**
     * 公共资源库
     * /public or /web
     */
    PUBLIC: string

    /**
     * 开发时前端访问链接
     */
    URL: string
  }
}
