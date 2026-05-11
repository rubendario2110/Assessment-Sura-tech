import { Inject, Injectable } from "@nestjs/common";
import type { UpstreamDomainEventsSink } from "../domain/domain-events.sink.port.js";
import { UpstreamResourceServedEvent } from "../domain/events/upstream-resource-served.event.js";
import { UpstreamSimulationEvaluatedEvent } from "../domain/events/upstream-simulation-evaluated.event.js";
import { evaluateFlakyPlan } from "../domain/flaky-simulation.policy.js";
import type { FlakySimulationInput } from "../domain/flaky.types.js";
import { UPSTREAM_DOMAIN_EVENTS_SINK } from "../infrastructure/tokens.js";

export type ServeResourceResult =
  | { outcome: "ok"; body: Record<string, unknown> }
  | { outcome: "fail"; status: number; body: Record<string, unknown> };

@Injectable()
export class ServeResourceUseCase {
  constructor(
    @Inject(UPSTREAM_DOMAIN_EVENTS_SINK)
    private readonly domainEvents: UpstreamDomainEventsSink,
  ) {}

  async execute(input: FlakySimulationInput): Promise<ServeResourceResult> {
    const plan = evaluateFlakyPlan(input);
    this.domainEvents.publish(new UpstreamSimulationEvaluatedEvent(plan));
    if (plan.delayMs > 0) {
      await new Promise((r) => setTimeout(r, plan.delayMs));
    }
    if (plan.status >= 400) {
      const fail: ServeResourceResult = {
        outcome: "fail",
        status: plan.status,
        body: {
          error: "upstream_unavailable",
          statusCode: plan.status,
          ...plan.body,
        },
      };
      this.domainEvents.publish(new UpstreamResourceServedEvent("fail", plan.status));
      return fail;
    }
    this.domainEvents.publish(new UpstreamResourceServedEvent("ok", 200));
    return { outcome: "ok", body: { ok: true, ...plan.body } };
  }
}
