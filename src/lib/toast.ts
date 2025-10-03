import { toast as hotToast, type ToastOptions, type ToasterProps } from 'react-hot-toast';

const baseOptions: ToastOptions = {
  duration: 4000,
  className:
    'rounded-lg border border-neutral-200/60 bg-white/95 px-4 py-3 text-sm font-medium text-neutral-900 shadow-lg backdrop-blur dark:border-neutral-800/60 dark:bg-neutral-900/95 dark:text-neutral-100',
};

const successOptions: ToastOptions = {
  iconTheme: {
    primary: '#7c3aed',
    secondary: '#f4f4f5',
  },
};

const errorOptions: ToastOptions = {
  iconTheme: {
    primary: '#ef4444',
    secondary: '#f4f4f5',
  },
};

export const toast = {
  success: (message: string, options?: ToastOptions) =>
    hotToast.success(message, { ...baseOptions, ...successOptions, ...options }),
  error: (message: string, options?: ToastOptions) =>
    hotToast.error(message, { ...baseOptions, ...errorOptions, ...options }),
  dismiss: hotToast.dismiss,
};

export const toasterProps: ToasterProps = {
  position: 'top-right',
  gutter: 12,
};
