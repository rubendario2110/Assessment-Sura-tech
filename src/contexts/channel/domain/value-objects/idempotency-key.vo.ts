import { generateIdempotencyKey } from "@assessment/integration-framework";

/**
 * Idempotency key value-object for the Channel bounded context.
 * Encapsulates validation + generation rules to keep domain free of `crypto`/header concerns.
 */
export class IdempotencyKey {
  private constructor(private readonly value: string) {}

  static fromString(raw: string | undefined): IdempotencyKey {
    if (!raw || raw.trim().length === 0) return IdempotencyKey.generate();
    const trimmed = raw.trim();
    if (trimmed.length > 200) {
      throw new Error("IdempotencyKey too long (>200 chars)");
    }
    return new IdempotencyKey(trimmed);
  }

  static generate(): IdempotencyKey {
    return new IdempotencyKey(generateIdempotencyKey());
  }

  toString(): string {
    return this.value;
  }
}
