/** Domain fact: same idempotency key replayed (no new side effect). */
export class OrderIdempotentReplayEvent {
  readonly occurredAt = new Date().toISOString();

  constructor(
    readonly idempotencyKey: string,
    readonly existingOrderId: string,
  ) {}
}
