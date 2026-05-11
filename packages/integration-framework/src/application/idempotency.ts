const HEADER = "Idempotency-Key";

/** Header name for mutation idempotency (caller-owned dedupe). */
export function idempotencyHeaderName(): typeof HEADER {
  return HEADER;
}

export function createIdempotencyKey(): string {
  return crypto.randomUUID();
}

export function mergeIdempotencyHeader(
  headers: Record<string, string> | undefined,
  key: string | undefined,
): Record<string, string> {
  const next = { ...headers };
  if (key) {
    next[HEADER] = key;
  }
  return next;
}
