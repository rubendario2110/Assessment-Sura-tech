import { IEvent } from "@nestjs/cqrs";

export class UpstreamCallSucceededEvent implements IEvent {
  constructor(
    public readonly idempotencyKey: string,
    public readonly traceId: string,
    public readonly upstreamHttpStatus: number,
    public readonly latencyMs: number,
  ) {}
}
