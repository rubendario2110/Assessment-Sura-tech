import { IEvent } from "@nestjs/cqrs";

export class EchoServedEvent implements IEvent {
  constructor(
    public readonly idempotencyKey: string | null,
    public readonly deduped: boolean,
  ) {}
}
