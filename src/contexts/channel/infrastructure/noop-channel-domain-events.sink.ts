import { Injectable } from "@nestjs/common";
import type { ChannelDomainEventsSink } from "../domain/domain-events.sink.port.js";

/** Demo implementation: no persistence or message bus; swap for a real adapter. */
@Injectable()
export class NoOpChannelDomainEventsSink implements ChannelDomainEventsSink {
  publish(_event: unknown): void {}
}
