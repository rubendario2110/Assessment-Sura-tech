/** Outbound port: wire message bus / outbox / read-model projections without coupling the domain to Nest or persistence. */
export interface ChannelDomainEventsSink {
  publish(event: unknown): void;
}
