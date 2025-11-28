/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DS_CLIENT_ID: string;
  readonly VITE_DS_REDIRECT_URI: string;
  readonly VITE_DS_ENV: string;
  readonly VITE_DS_ACCOUNT_ID: string;
  readonly VITE_DS_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
