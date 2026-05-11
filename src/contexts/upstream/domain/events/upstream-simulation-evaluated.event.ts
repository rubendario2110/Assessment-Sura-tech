import type { FlakySimulationPlan } from "../flaky.types.js";

/** Emitted after evaluating the pure simulation policy (before HTTP delays). */
export class UpstreamSimulationEvaluatedEvent {
  readonly occurredAt = new Date().toISOString();

  constructor(readonly plan: FlakySimulationPlan) {}
}
