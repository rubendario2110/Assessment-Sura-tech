import { describe, expect, it } from "@jest/globals";
import { computeBackoffMs } from "@assessment/integration-framework";

describe("computeBackoffMs", () => {
  it("caps at maxMs and applies jitter with deterministic random", () => {
    const ms = computeBackoffMs(10, 50, 200, 0.25, () => 0.5);
    expect(ms).toBeLessThanOrEqual(200);
    expect(ms).toBeGreaterThanOrEqual(0);
  });

  it("attempt 0 uses base scaling", () => {
    const ms = computeBackoffMs(0, 100, 10_000, 0, () => 0);
    expect(ms).toBe(100);
  });
});
