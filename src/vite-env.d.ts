/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PERPLEXITY_API_KEY: string
  readonly MODE: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly SSR: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'virtual:*' {
  const result: any;
  export default result;
}

declare module 'react-hot-toast';

// Extend VisualViewport interface instead of redefining it
declare global {
  interface VisualViewport {
    readonly height: number;
    readonly width: number;
    readonly scale: number;
    readonly offsetLeft: number;
    readonly offsetTop: number;
    readonly pageLeft: number;
    readonly pageTop: number;
  }
}

export {};