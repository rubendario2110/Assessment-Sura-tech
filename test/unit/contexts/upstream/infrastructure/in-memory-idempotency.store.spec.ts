import { describe, expect, it } from "@jest/globals";
import { InMemoryIdempotencyStore } from "../../../../../src/contexts/upstream/infrastructure/in-memory-idempotency.store.js";

describe("InMemoryIdempotencyStore", () => {
  it("returns undefined for unknown keys", () => {
    expect(new InMemoryIdempotencyStore().find("missing")).toBeUndefined();
  });

  it("persists payloads keyed by idempotency key", () => {
    const s = new InMemoryIdempotencyStore();
    s.put("k", { value: 1 });
    expect(s.find("k")).toEqual({ value: 1 });
  });

  it("overwrites previous payloads on conflict", () => {
    const s = new InMemoryIdempotencyStore();
    s.put("k", { v: 1 });
    s.put("k", { v: 2 });
    expect(s.find("k")).toEqual({ v: 2 });
  });
});
