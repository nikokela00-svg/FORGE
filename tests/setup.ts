// Vitest setup — jest-dom matchers, DOM polyfills, and cleanup between tests
import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

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
if (typeof globalRecord.Element !== "undefined") {
  const elementProto = Element.prototype as unknown as Record<string, unknown>;
  if (typeof elementProto.scrollIntoView === "undefined") {
    elementProto.scrollIntoView = () => {};
  }
}
// jsdom provides no media queries; Radix portals expect a functional API
if (typeof globalRecord.matchMedia === "undefined") {
  globalRecord.matchMedia = matchMediaStub;
}

afterEach(() => {
  cleanup();
});
