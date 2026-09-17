// Vitest setup — jest-dom matchers, DOM polyfills, IndexedDB backend, and cleanup
import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";

import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom has no layout, so the real virtualizer measures zero items. Fake it as a
// flat window: every row is visible with a fixed 22px height and no scrolling.
vi.mock("@tanstack/react-virtual", () => {
  const useVirtualizer = (options: {
    count: number;
    estimateSize?: (index: number) => number;
    getItemKey?: (index: number) => string | number;
  }) => {
    const rowHeight = options.estimateSize?.(0) ?? 22;
    const items = Array.from({ length: options.count }, (_, index) => ({
      index,
      start: index * rowHeight,
      size: rowHeight,
      key: options.getItemKey?.(index) ?? index,
      measureElement: () => undefined,
    }));
    return {
      getVirtualItems: () => items,
      getTotalSize: () => options.count * rowHeight,
      scrollToIndex: () => undefined,
    };
  };
  return { useVirtualizer };
});

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

class IntersectionObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

function matchMediaStub(query: string) {
  const listenerApi = {
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  };
  return {
    matches: false,
    media: query,
    onchange: null,
    ...listenerApi,
  };
}

// jsdom lacks these APIs; index globals loosely so guards don't trigger TS never-narrowing
const globalRecord = globalThis as unknown as Record<string, unknown>;

if (typeof globalRecord.ResizeObserver === "undefined") {
  globalRecord.ResizeObserver = ResizeObserverStub;
}
if (typeof globalRecord.IntersectionObserver === "undefined") {
  globalRecord.IntersectionObserver = IntersectionObserverStub;
}
// jsdom provides no media queries; Radix portals expect a functional API
if (typeof globalRecord.matchMedia === "undefined") {
  globalRecord.matchMedia = matchMediaStub;
}
if (typeof globalRecord.Element !== "undefined") {
  const elementProto = Element.prototype as unknown as Record<string, unknown>;
  if (typeof elementProto.scrollIntoView === "undefined") {
    elementProto.scrollIntoView = () => {};
  }
  // Radix Select/popper capture the pointer during open; jsdom has no PointerEvents support
  if (typeof elementProto.hasPointerCapture === "undefined") {
    elementProto.hasPointerCapture = () => false;
  }
  if (typeof elementProto.setPointerCapture === "undefined") {
    elementProto.setPointerCapture = () => {};
  }
  if (typeof elementProto.releasePointerCapture === "undefined") {
    elementProto.releasePointerCapture = () => {};
  }
}

afterEach(() => {
  cleanup();
});
