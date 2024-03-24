/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_URL: string
  readonly VITE_DIST_ELECTRON: string
  readonly VITE_WEB: string
  readonly VITE_PUBLIC: string
  readonly VITE_VERSION: string
  readonly VITE_EXIFTOOL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
