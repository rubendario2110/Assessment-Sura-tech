import { Inject, Injectable } from "@nestjs/common";
import { ResilientHttpClient } from "@assessment/integration-framework";
import type { ChannelDomainEventsSink } from "../domain/domain-events.sink.port.js";
import { UpstreamProxySucceededEvent } from "../domain/events/upstream-proxy-succeeded.event.js";
import { CHANNEL_DOMAIN_EVENTS_SINK, UPSTREAM_HTTP_CLIENT } from "../infrastructure/tokens.js";

@Injectable()
export class InvokeUpstreamUseCase {
  constructor(
    @Inject(UPSTREAM_HTTP_CLIENT)
    private readonly upstream: ResilientHttpClient,
    @Inject(CHANNEL_DOMAIN_EVENTS_SINK)
    private readonly domainEvents: ChannelDomainEventsSink,
  ) {}

  async execute(
    mode: string,
    seed?: string,
    failRate?: string,
    slowMs?: string,
    latencyMs?: string,
  ): Promise<Record<string, unknown>> {
    const qs = new URLSearchParams({ mode });
    if (seed) qs.set("seed", seed);
    if (failRate) qs.set("failRate", failRate);
    if (slowMs) qs.set("slowMs", slowMs);
    if (latencyMs) qs.set("latencyMs", latencyMs);
    const path = `/resource?${qs.toString()}`;
    const res = await this.upstream.execute({ method: "GET", path });
    const json = (await res.json()) as Record<string, unknown>;
    this.domainEvents.publish(new UpstreamProxySucceededEvent(path));
    return json;
  }
}
