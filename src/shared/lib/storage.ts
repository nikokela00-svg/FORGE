// Safe JSON storage adapters for zustand persist — never throw on missing or denied storage
import type { PersistStorage, StorageValue } from "zustand/middleware";

export function createSafeJSONStorage<T>(
  getStorage: () => Storage | null | undefined,
): PersistStorage<T> {
  return {
    getItem: (name) => {
      try {
        const raw = getStorage()?.getItem(name);
        if (raw === null || raw === undefined) return null;
        const parsed = JSON.parse(raw) as unknown;
        return parsed as StorageValue<T>;
      } catch {
        // Unreadable or corrupt payloads fall back to defaults rather than crash
        return null;
      }
    },
    setItem: (name, value) => {
      try {
        getStorage()?.setItem(name, JSON.stringify(value));
      } catch {
        // Quota or private-mode write failures are best-effort by design
      }
    },
    removeItem: (name) => {
      try {
        getStorage()?.removeItem(name);
      } catch {
        // Best-effort removal; nothing to surface at this boundary
      }
    },
  };
}
