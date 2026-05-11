import type { FlakySimulationInput, FlakySimulationPlan } from "./flaky.types.js";

/** Deterministic PRNG for demo/reliability runs (LCG). */
function createRng(seed: number): () => number {
  let s = Math.floor(seed) % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Pure domain policy: given normalized controls, decide HTTP status and simulated delay. */
export function evaluateFlakyPlan(params: FlakySimulationInput): FlakySimulationPlan {
  const baseDelay = Math.max(0, params.latencyMs);
  let delayMs = baseDelay;
  let status = 200;

  switch (params.mode) {
    case "ok":
      break;
    case "fail":
      status = 503;
      break;
    case "slow":
      delayMs = baseDelay + Math.max(0, params.slowMs);
      break;
    case "random": {
      const rand =
        params.seed !== undefined ? createRng(params.seed)() : Math.random();
      status = rand < params.failRate ? 503 : 200;
      break;
    }
    default:
      status = 400;
  }

  return {
    status,
    delayMs,
    body: {
      mode: params.mode,
      seed: params.seed ?? null,
      failRate: params.failRate,
    },
  };
}
