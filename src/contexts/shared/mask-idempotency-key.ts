/** Shorten idempotency keys for logs (avoid leaking full client-supplied values). */
export function maskIdempotencyKey(key: string): string {
  if (key.length <= 12) return key;
  return `${key.slice(0, 8)}…${key.slice(-4)}`;
}
