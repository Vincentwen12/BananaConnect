import { create } from "zustand";

export type ToastLevel = "info" | "success" | "error";

interface ToastItem {
  id: number;
  level: ToastLevel;
  message: string;
}

interface ToastState {
  toasts: ToastItem[];
  push: (level: ToastLevel, message: string) => void;
  dismiss: (id: number) => void;
}

let seed = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (level, message) => {
    const id = ++seed;
    set((state) => ({ toasts: [...state.toasts, { id, level, message }] }));
    window.setTimeout(() => get().dismiss(id), 2800);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

export const toast = {
  info: (message: string) => useToastStore.getState().push("info", message),
  success: (message: string) => useToastStore.getState().push("success", message),
  error: (message: string) => useToastStore.getState().push("error", message),
};
