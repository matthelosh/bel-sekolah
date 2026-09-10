import { ref } from 'vue';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

let toastId = 0;
const toasts = ref<Toast[]>([]);

export function useToast() {
  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = ++toastId;
    toasts.value.push({ id, message, type });
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id);
    }, 3000);
  };

  const success = (message: string) => addToast(message, 'success');
  const error = (message: string) => addToast(message, 'error');
  const warning = (message: string) => addToast(message, 'warning');
  const info = (message: string) => addToast(message, 'info');

  return {
    toasts,
    addToast,
    success,
    error,
    warning,
    info
  };
}
