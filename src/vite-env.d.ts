/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PERPLEXITY_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'react-hot-toast' {
  import { ReactNode } from 'react';

  interface Toast {
    id: string;
    message: ReactNode;
    type?: 'success' | 'error' | 'loading';
    duration?: number;
    position?: string;
    icon?: ReactNode;
  }

  interface ToastOptions {
    id?: string;
    icon?: ReactNode;
    duration?: number;
    position?: string;
    className?: string;
    style?: React.CSSProperties;
  }

  type ToastPosition =
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';

  interface ToastFunction {
    (message: ReactNode, options?: ToastOptions): string;
    success(message: ReactNode, options?: ToastOptions): string;
    error(message: ReactNode, options?: ToastOptions): string;
    loading(message: ReactNode, options?: ToastOptions): string;
    custom(render: (t: Toast) => ReactNode, options?: ToastOptions): void;
    dismiss(toastId?: string): void;
    remove(toastId?: string): void;
  }

  const toast: ToastFunction;
  export default toast;
  export { Toast, ToastOptions, ToastPosition };
}

interface Window {
  readonly visualViewport: VisualViewport | null;
}