export class UpstreamIdempotencyKey {
  private constructor(private readonly value: string) {}

  static fromHeader(raw: string | undefined): UpstreamIdempotencyKey | undefined {
    if (!raw) return undefined;
    const trimmed = raw.trim();
    if (trimmed.length === 0) return undefined;
    if (trimmed.length > 200) throw new Error("Idempotency key too long (>200 chars)");
    return new UpstreamIdempotencyKey(trimmed);
  }

  toString(): string {
    return this.value;
  }
}
