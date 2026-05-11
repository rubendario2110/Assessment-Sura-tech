/** Domain fact: order materialised for the first time (demo). */
export class OrderPlacedEvent {
  readonly occurredAt = new Date().toISOString();

  constructor(
    readonly orderId: string,
    readonly idempotencyKey: string,
    readonly productId: string,
    readonly qty: number,
  ) {}
}
