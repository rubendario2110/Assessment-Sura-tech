export interface UpstreamDomainEventsSink {
  publish(event: unknown): void;
}
