import { ICommand } from "@nestjs/cqrs";
import { IdempotencyKey } from "../../domain/value-objects/idempotency-key.vo.js";
import { ChannelTraceContext } from "../../domain/value-objects/trace-context.vo.js";

export class InvokeUpstreamCommand implements ICommand {
  constructor(
    public readonly idempotencyKey: IdempotencyKey,
    public readonly trace: ChannelTraceContext,
    public readonly payload: Record<string, unknown>,
  ) {}
}
