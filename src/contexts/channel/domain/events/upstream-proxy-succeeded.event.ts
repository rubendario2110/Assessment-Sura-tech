/** Domain fact: outbound upstream call completed with HTTP success (demo). */
export class UpstreamProxySucceededEvent {
  readonly occurredAt = new Date().toISOString();

  constructor(readonly resourcePath: string) {}
}
