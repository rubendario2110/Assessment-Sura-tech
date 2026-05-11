import { describe, expect, it } from "@jest/globals";
import { evaluateFlakyPlan } from "../../../../src/contexts/upstream/domain/flaky-simulation.policy.js";
import type { FlakyMode } from "../../../../src/contexts/upstream/domain/flaky.types.js";

describe("evaluateFlakyPlan (upstream domain)", () => {
  it("ok mode stays fast", () => {
    const r = evaluateFlakyPlan({
      mode: "ok",
      failRate: 0.5,
      slowMs: 500,
      latencyMs: 0,
    });
    expect(r.status).toBe(200);
    expect(r.delayMs).toBe(0);
  });

  it("fail mode returns 503", () => {
    const r = evaluateFlakyPlan({ mode: "fail", failRate: 0, slowMs: 0, latencyMs: 0 });
    expect(r.status).toBe(503);
  });

  it("slow mode adds slowMs", () => {
    const r = evaluateFlakyPlan({ mode: "slow", failRate: 0, slowMs: 120, latencyMs: 5 });
    expect(r.delayMs).toBe(125);
    expect(r.status).toBe(200);
  });

  it("random mode is deterministic with seed", () => {
    const a = evaluateFlakyPlan({
      mode: "random",
      seed: 42,
      failRate: 0.99,
      slowMs: 0,
      latencyMs: 0,
    });
    const b = evaluateFlakyPlan({
      mode: "random",
      seed: 42,
      failRate: 0.99,
      slowMs: 0,
      latencyMs: 0,
    });
    expect(a.status).toBe(b.status);
  });

  it("unknown mode yields 400", () => {
    const r = evaluateFlakyPlan({
      mode: "nope" as FlakyMode,
      failRate: 0,
      slowMs: 0,
      latencyMs: 0,
    });
    expect(r.status).toBe(400);
  });
});
