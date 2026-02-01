/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  // Thêm các biến env khác nếu cần
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}