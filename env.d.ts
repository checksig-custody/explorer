/// <reference types="vite/client" />
/// <reference types="vite-plugin-pages/client" />

// vite-plugin-vue-layouts/client is not reachable through its package exports.
declare module 'virtual:generated-layouts' {
  import type { RouteRecordRaw } from 'vue-router';
  export function setupLayouts(routes: RouteRecordRaw[]): RouteRecordRaw[];
}

// typescript-eslint does not read .vue files; vue-tsc does and ignores this.
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

declare module '@personaxyz/ad-sdk';

// Wallet extensions inject themselves into window.
interface Window {
  keplr?: { experimentalSuggestChain(chainInfo: unknown): Promise<void> };
  unisat?: { experimentalSuggestChain(chainInfo: unknown): Promise<void> };
}
interface ImportMetaEnv {
    readonly VITE_REFRESH_INTERVAL?: number,
    readonly VITE_FETCH_ALL_BLOCKS?: boolean,
    readonly VITE_RECENT_BLOCK_LIMIT?: number,
    readonly VITE_COINGECKO_URL?: string,
    readonly VITE_GITHUB_API_URL?: string,
    readonly VITE_PINGPUB_API_URL?: string,
    readonly VITE_IBC_USE_GITHUB_API?: string,
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
