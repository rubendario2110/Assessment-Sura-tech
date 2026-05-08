import CircuitBreaker from "opossum";
import type { OpossumBreakerConfig } from "./config.js";

export type BreakerState = "closed" | "open" | "half_open";

export function mapOpossumState(breaker: CircuitBreaker): BreakerState {
  if (breaker.opened) return "open";
  if (breaker.halfOpen) return "half_open";
  return "closed";
}

export interface BreakerEvents {
  onStateLog?: (fields: { dependencyId: string; event: string; state: BreakerState }) => void;
}

/**
 * Factory for a per-dependency {@link CircuitBreaker} using `opossum` (mandatory standard).
 * The protected action is always `await fn()` where `fn` is provided per `fire`.
 */
export function createOpossumBreaker(
  dependencyId: string,
  cfg: OpossumBreakerConfig,
  events: BreakerEvents,
): CircuitBreaker {
  const breaker = new CircuitBreaker(async (fn: () => Promise<unknown>) => fn(), {
    timeout: false,
    errorThresholdPercentage: cfg.errorThresholdPercentage,
    resetTimeout: cfg.resetTimeoutMs,
    rollingCountTimeout: cfg.rollingCountTimeoutMs,
    rollingCountBuckets: cfg.rollingCountBuckets,
    volumeThreshold: cfg.volumeThreshold,
    name: dependencyId,
  });

  const emit = (event: string): void => {
    events.onStateLog?.({
      dependencyId,
      event,
      state: mapOpossumState(breaker),
    });
  };

  breaker.on("open", () => emit("open"));
  breaker.on("halfOpen", () => emit("halfOpen"));
  breaker.on("close", () => emit("close"));
  breaker.on("failure", () => emit("failure"));
  breaker.on("success", () => emit("success"));
  breaker.on("timeout", () => emit("timeout"));
  breaker.on("reject", () => emit("reject"));

  return breaker;
}
