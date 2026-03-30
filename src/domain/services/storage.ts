import { createJSONStorage, type StateStorage } from "zustand/middleware";

export const APP_STORAGE_KEY = "game-design-os::state";

const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      const raw = window.localStorage.getItem(name);
      if (!raw) {
        return null;
      }

      // If persisted JSON is malformed, clear it instead of crashing hydration.
      JSON.parse(raw);
      return raw;
    } catch {
      try {
        window.localStorage.removeItem(name);
      } catch {
        // Ignore remove failures.
      }
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // Ignore write failure and keep runtime functional.
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      // Ignore remove failure and keep runtime functional.
    }
  },
};

export const zustandStorage = createJSONStorage(() => safeStorage);
