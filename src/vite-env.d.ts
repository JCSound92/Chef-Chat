/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_PERPLEXITY_API_KEY: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  
  declare module 'react-hot-toast' {
    import { ReactNode } from 'react';
  
    interface ToastOptions {
      id?: string;
      icon?: ReactNode;
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
  
    interface Toast {
      (message: string | ReactNode, options?: ToastOptions): string;
      success(message: string | ReactNode, options?: ToastOptions): string;
      error(message: string | ReactNode, options?: ToastOptions): string;
      loading(message: string | ReactNode, options?: ToastOptions): string;
      custom<T = any>(render: (t: T) => ReactNode, options?: ToastOptions): string;
      dismiss(toastId?: string): void;
      remove(toastId?: string): void;
    }
  
    const toast: Toast;
    export default toast;
  }