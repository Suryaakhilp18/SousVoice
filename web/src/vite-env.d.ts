/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MOCK_MODE?: string;
  readonly VITE_TOKEN_SERVER_URL?: string;
  readonly VITE_RIME_MODEL?: string;
  readonly VITE_RIME_SPEAKER?: string;
  readonly VITE_RIME_LANG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
