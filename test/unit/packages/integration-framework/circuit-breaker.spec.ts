import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  createOpossumBreaker,
  mapOpossumState,
} from "../../../../packages/integration-framework/src/circuit-breaker.js";
import type { OpossumBreakerConfig } from "../../../../packages/integration-framework/src/config.js";

const cfg: OpossumBreakerConfig = {
  actionTimeoutMs: 100,
  errorThresholdPercentage: 1,
  resetTimeoutMs: 20,
  rollingCountTimeoutMs: 1000,
  rollingCountBuckets: 1,
  volumeThreshold: 1,
};

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

describe("opossum circuit breaker (US-013)", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("invokes onStateLog with state transitions: failure → open → halfOpen → close", async () => {
    const events: Array<{ event: string; state: string }> = [];
    const breaker = createOpossumBreaker("dep", cfg, {
      onStateLog: ({ event, state }) => events.push({ event, state }),
    });
    expect(mapOpossumState(breaker)).toBe("closed");

    await expect(breaker.fire(async () => { throw new Error("boom"); })).rejects.toThrow("boom");
    expect(mapOpossumState(breaker)).toBe("open");

    await expect(breaker.fire(async () => "ignored")).rejects.toMatchObject({ code: "EOPENBREAKER" });

    await sleep(40);
    await breaker.fire(async () => "ok");
    expect(mapOpossumState(breaker)).toBe("closed");

    const eventNames = events.map((e) => e.event);
    expect(eventNames).toEqual(expect.arrayContaining(["failure", "open", "reject", "halfOpen", "success", "close"]));
  });

  it("emits 'success' event for non-failing calls", async () => {
    const events: string[] = [];
    const breaker = createOpossumBreaker("dep-success", cfg, {
      onStateLog: ({ event }) => events.push(event),
    });
    await breaker.fire(async () => "ok");
    expect(events).toContain("success");
    expect(mapOpossumState(breaker)).toBe("closed");
  });

  it("works without an onStateLog callback (optional events)", async () => {
    const breaker = createOpossumBreaker("dep-no-cb", cfg, {});
    await expect(breaker.fire(async () => "ok")).resolves.toBe("ok");
  });
});
