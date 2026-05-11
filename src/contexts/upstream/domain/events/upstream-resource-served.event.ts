/** HTTP response ready to return (simulated success or failure). */
export class UpstreamResourceServedEvent {
  readonly occurredAt = new Date().toISOString();

  constructor(
    readonly outcome: "ok" | "fail",
    readonly httpStatus: number,
  ) {}
}
