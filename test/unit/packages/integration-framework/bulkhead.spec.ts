import { describe, expect, it } from "@jest/globals";
import { Bulkhead } from "../../../../packages/integration-framework/src/bulkhead.js";

describe("Bulkhead (US-014)", () => {
  it("rejects construction with maxConcurrent < 1", () => {
    expect(() => new Bulkhead(0)).toThrow(/maxConcurrent must be >= 1/);
  });

  it("limits concurrent executions to maxConcurrent", async () => {
    const bulk = new Bulkhead(2);
    let active = 0;
    let peak = 0;
    const job = async (): Promise<void> => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 10));
      active -= 1;
    };
    await Promise.all(Array.from({ length: 6 }, () => bulk.execute(job)));
    expect(peak).toBe(2);
  });

  it("propagates the wrapped function result and releases the slot on error", async () => {
    const bulk = new Bulkhead(1);
    await expect(bulk.execute(async () => 42)).resolves.toBe(42);
    await expect(bulk.execute(async () => { throw new Error("boom"); })).rejects.toThrow("boom");
    await expect(bulk.execute(async () => "still-works")).resolves.toBe("still-works");
  });

  it("rejects when the wait queue exceeds the safety limit", async () => {
    const bulk = new Bulkhead(1);
    interface Internal { waiters: Array<unknown> }
    (bulk as unknown as Internal).waiters = new Array(10_001).fill(() => undefined);
    await expect(bulk.execute(async () => 1)).rejects.toThrow(/safety limit/);
  });
});
