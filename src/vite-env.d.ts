/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TBH_CATALOG_URL?: string;
  readonly VITE_TBH_INSTALL_API_BASE?: string;
  readonly VITE_TBH_INSTALL_PATH?: string;
  readonly VITE_TBH_DEEPLINK_SCHEME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
