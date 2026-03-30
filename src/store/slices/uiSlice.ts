import type { StateCreator } from "zustand";
import { createSeedState } from "@/store/seedState";
import type { AppStore, UiSlice } from "@/store/types";

export const createUiSlice: StateCreator<AppStore, [], [], UiSlice> = (set) => {
  const seed = createSeedState();

  return {
    language: seed.language,
    sidebarCollapsed: seed.sidebarCollapsed,
    helpOpen: false,
    toasts: [],
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setLanguage: (language) => set(() => ({ language })),
    openHelp: () => set(() => ({ helpOpen: true })),
    closeHelp: () => set(() => ({ helpOpen: false })),
    pushToast: (message, tone = "info") => {
      const id = `toast_${crypto.randomUUID()}`;
      set((state) => ({
        toasts: [...state.toasts, { id, message, tone }],
      }));
    },
    removeToast: (id) =>
      set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
      })),
  };
};
