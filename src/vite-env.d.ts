/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set to `"true"` to enable `[EW]` console diagnostics in production bundles */
  readonly VITE_DEBUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
