import type { IntegrationConfig } from "./config.js";

export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterRatio: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeBackoffDelay(attempt: number, cfg: RetryOptions): number {
  const exp = Math.min(cfg.maxDelayMs, cfg.baseDelayMs * 2 ** Math.max(0, attempt - 1));
  const jitterRange = exp * cfg.jitterRatio;
  const jitter = Math.floor(Math.random() * (jitterRange + 1));
  return Math.min(cfg.maxDelayMs, exp - jitterRange / 2 + jitter);
}

export type RetryPredicate = (err: unknown, attempt: number) => boolean;

/**
 * Executes `fn` with bounded exponential backoff + full jitter between attempts.
 */
export async function executeWithRetry<T>(
  fn: (attempt: number) => Promise<T>,
  cfg: Pick<IntegrationConfig, "maxAttempts" | "baseDelayMs" | "maxDelayMs" | "jitterRatio">,
  shouldRetry: RetryPredicate,
): Promise<T> {
  const opts: RetryOptions = {
    maxAttempts: cfg.maxAttempts,
    baseDelayMs: cfg.baseDelayMs,
    maxDelayMs: cfg.maxDelayMs,
    jitterRatio: cfg.jitterRatio,
  };

  let lastError: unknown;
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      const canRetry = attempt < opts.maxAttempts && shouldRetry(err, attempt);
      if (!canRetry) break;
      const delay = computeBackoffDelay(attempt, opts);
      await sleep(delay);
    }
  }
  throw lastError;
}
