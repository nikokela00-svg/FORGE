// Status bar contribution point — features register items without touching shell code
import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";

export type ContributionPriority = "low" | "normal" | "high";

export interface StatusItem {
  id: string;
  node: ReactNode;
  order?: number;
  priority?: ContributionPriority;
}

const PRIORITY_RANK: Record<ContributionPriority, number> = {
  low: 0,
  normal: 1,
  high: 2,
};

export function compareStatusItems(a: StatusItem, b: StatusItem): number {
  const orderA = a.order ?? 0;
  const orderB = b.order ?? 0;
  if (orderA !== orderB) return orderA - orderB;
  const priorityA = PRIORITY_RANK[a.priority ?? "normal"];
  const priorityB = PRIORITY_RANK[b.priority ?? "normal"];
  return priorityA - priorityB;
}

// Non-persisted contribution registry. Subscribe to re-render; unregister to leave.
export function createStatusRegistry() {
  let items: StatusItem[] = [];
  const listeners = new Set<() => void>();

  function notify(): void {
    for (const listener of listeners) listener();
  }

  function register(item: StatusItem): () => void {
    if (items.some((existing) => existing.id === item.id)) {
      throw new Error(`Duplicate status item id "${item.id}"`);
    }
    items = [...items, item].sort(compareStatusItems);
    notify();
    return () => {
      unregister(item.id);
    };
  }

  function unregister(id: string): void {
    const next = items.filter((existing) => existing.id !== id);
    if (next.length !== items.length) {
      items = next;
      notify();
    }
  }

  function list(): StatusItem[] {
    return items;
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { register, unregister, list, subscribe } as const;
}

export type StatusRegistry = ReturnType<typeof createStatusRegistry>;

export const statusRegistry = createStatusRegistry();

export function useStatusRegistry(): StatusItem[] {
  return useSyncExternalStore(
    statusRegistry.subscribe,
    statusRegistry.list,
    statusRegistry.list,
  );
}
