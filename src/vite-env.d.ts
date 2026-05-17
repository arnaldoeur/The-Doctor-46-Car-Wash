/// <reference types="vite/client" />

interface ImportMetaEnv {
 readonly VITE_APP_API_ENDPOINT?: string;
 readonly VITE_DEV_API_PROXY_TARGET?: string;
}

interface ImportMeta {
 readonly env: ImportMetaEnv;
}
