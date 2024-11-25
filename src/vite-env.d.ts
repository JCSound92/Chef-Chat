/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_PERPLEXITY_API_KEY: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  
  declare module 'react-hot-toast' {
    const toast: {
      (message: string | React.ReactNode, options?: ToastOptions): string;
      success(message: string | React.ReactNode, options?: ToastOptions): string;
      error(message: string | React.ReactNode, options?: ToastOptions): string;
      loading(message: string | React.ReactNode, options?: ToastOptions): string;
      custom(message: string | React.ReactNode, options?: ToastOptions): string;
      dismiss(toastId?: string): void;
      remove(toastId?: string): void;
    };
  
    export interface ToastOptions {
      id?: string;
      icon?: React.ReactNode;
      duration?: number;
      position?: ToastPosition;
      className?: string;
      style?: React.CSSProperties;
      ariaProps?: {
        role?: string;
        'aria-live'?: string;
        'aria-atomic'?: string;
      };
    }
  
    type ToastPosition =
      | 'top-left'
      | 'top-center'
      | 'top-right'
      | 'bottom-left'
      | 'bottom-center'
      | 'bottom-right'
      | 'custom';
  
    export default toast;
  }