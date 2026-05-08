import { IEvent } from "@nestjs/cqrs";

export type RejectionReason = "circuit_open" | "timeout" | "upstream" | "bulkhead_full" | "unexpected";

export class UpstreamCallRejectedEvent implements IEvent {
  constructor(
    public readonly idempotencyKey: string,
    public readonly traceId: string,
    public readonly reason: RejectionReason,
    public readonly httpStatus?: number,
  ) {}
}
