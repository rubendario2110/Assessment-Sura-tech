/** Exponential backoff capped at maxMs with jitterRatio in [0,1]. */
export function computeBackoffMs(
  attemptIndex: number,
  baseMs: number,
  maxMs: number,
  jitterRatio: number,
  random: () => number,
): number {
  const raw = Math.min(maxMs, baseMs * 2 ** attemptIndex);
  const span = raw * jitterRatio;
  const jitter = random() * span;
  return Math.floor(raw - span / 2 + jitter);
}
