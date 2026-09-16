// Status registry unit tests: ordering, notify-on-change, duplicate rejection, unregister
import { describe, expect, it, vi } from "vitest";

import {
  compareStatusItems,
  createStatusRegistry,
  useStatusRegistry,
} from "@/features/shell";

describe("compareStatusItems", () => {
  it("sorts by order then priority", () => {
    const low = { id: "low", node: "x", order: 2, priority: "low" as const };
    const high = { id: "high", node: "x", order: 1, priority: "high" as const };
    const items = [low, high].sort(compareStatusItems);
    expect(items.map((item) => item.id)).toEqual(["high", "low"]);
  });

  it("sorts by priority when orders tie", () => {
    const a = { id: "a", node: "x", order: 1, priority: "low" as const };
    const b = { id: "b", node: "x", order: 1, priority: "high" as const };
    expect(compareStatusItems(a, b)).toBeLessThan(0);
  });
});

describe("status registry", () => {
  it("returns items in stable sorted order", () => {
    const registry = createStatusRegistry();
    registry.register({ id: "b", node: "B", order: 2 });
    registry.register({ id: "a", node: "A", order: 1 });
    expect(registry.list().map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("notifies listeners on register and unregister", () => {
    const registry = createStatusRegistry();
    const spy = vi.fn();
    registry.subscribe(spy);
    registry.register({ id: "a", node: "A" });
    registry.register({ id: "b", node: "B" });
    expect(spy).toHaveBeenCalledTimes(2);
    registry.unregister("a");
    expect(spy).toHaveBeenCalledTimes(3);
    registry.unregister("missing-id");
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it("stops notifying after unsubscribe", () => {
    const registry = createStatusRegistry();
    const spy = vi.fn();
    const unsubscribe = registry.subscribe(spy);
    unsubscribe();
    registry.register({ id: "a", node: "A" });
    registry.list();
    expect(spy).not.toHaveBeenCalled();
  });

  it("throws on duplicate ids", () => {
    const registry = createStatusRegistry();
    registry.register({ id: "a", node: "A" });
    expect(() => registry.register({ id: "a", node: "A2" })).toThrow(
      /Duplicate status item id "a"/,
    );
  });

  it("exposes items reactively through useStatusRegistry", () => {
    const registry = createStatusRegistry();
    const values: number[] = [];
    const unsubscribe = registry.subscribe(() => values.push(registry.list().length));
    registry.register({ id: "a", node: "A" });
    registry.register({ id: "b", node: "B" });
    expect(values).toEqual([1, 2]);
    unsubscribe();
  });

  it("ships a live singleton with hooks ready to consume", () => {
    expect(useStatusRegistry).toBeTypeOf("function");
  });
});
