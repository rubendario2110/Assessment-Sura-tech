import { Injectable } from "@nestjs/common";
import type { UpstreamDomainEventsSink } from "../domain/domain-events.sink.port.js";

@Injectable()
export class NoOpUpstreamDomainEventsSink implements UpstreamDomainEventsSink {
  publish(_event: unknown): void {}
}
