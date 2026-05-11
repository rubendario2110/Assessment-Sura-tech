import { ValidationError } from "../domain/errors.js";

export interface IntegrationEnvConfig {
  httpTimeoutMs: number;
  retryMaxAttempts: number;
  retryBaseMs: number;
  retryMaxMs: number;
  retryJitterRatio: number;
  breakerErrorThresholdPercentage: number;
  breakerResetTimeoutMs: number;
  breakerVolumeThreshold: number;
  bulkheadMaxConcurrent: number;
}

function readInt(env: NodeJS.ProcessEnv, key: string, fallback: number): number {
  const raw = env[key];
  if (raw === undefined || raw === "") return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) {
    throw new ValidationError(`Invalid integer for ${key}: ${raw}`);
  }
  return n;
}

function readFloat(env: NodeJS.ProcessEnv, key: string, fallback: number): number {
  const raw = env[key];
  if (raw === undefined || raw === "") return fallback;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) {
    throw new ValidationError(`Invalid float for ${key}: ${raw}`);
  }
  return n;
}

/** Loads tunable integration knobs from process.env (IF_* prefix). */
export function loadIntegrationConfig(env: NodeJS.ProcessEnv = process.env): IntegrationEnvConfig {
  return {
    httpTimeoutMs: Math.max(1, readInt(env, "IF_HTTP_TIMEOUT_MS", 5_000)),
    retryMaxAttempts: Math.max(1, readInt(env, "IF_RETRY_MAX_ATTEMPTS", 3)),
    retryBaseMs: Math.max(0, readInt(env, "IF_RETRY_BASE_MS", 50)),
    retryMaxMs: Math.max(1, readInt(env, "IF_RETRY_MAX_MS", 2_000)),
    retryJitterRatio: Math.min(1, Math.max(0, readFloat(env, "IF_RETRY_JITTER_RATIO", 0.25))),
    breakerErrorThresholdPercentage: Math.min(
      100,
      Math.max(1, readInt(env, "IF_BREAKER_ERROR_THRESHOLD_PCT", 50)),
    ),
    breakerResetTimeoutMs: Math.max(1, readInt(env, "IF_BREAKER_RESET_TIMEOUT_MS", 3_000)),
    breakerVolumeThreshold: Math.max(1, readInt(env, "IF_BREAKER_VOLUME_THRESHOLD", 5)),
    bulkheadMaxConcurrent: Math.max(1, readInt(env, "IF_BULKHEAD_MAX_CONCURRENT", 8)),
  };
}
