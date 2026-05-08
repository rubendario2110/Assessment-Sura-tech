import { ICommand } from "@nestjs/cqrs";
import type { UpstreamIdempotencyKey } from "../../domain/value-objects/upstream-idempotency-key.vo.js";

export class EchoCommand implements ICommand {
  constructor(
    public readonly idempotencyKey: UpstreamIdempotencyKey | undefined,
    public readonly message: string,
  ) {}
}
