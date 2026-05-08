import { IEvent } from "@nestjs/cqrs";

export class EchoRejectedEvent implements IEvent {
  constructor(public readonly idempotencyKey: string | null) {}
}
