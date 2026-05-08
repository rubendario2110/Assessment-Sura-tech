/**
 * Centralized integration configuration (US-009). All values are env-driven for tunability without code changes.
 */

export interface OpossumBreakerConfig {
  /** opossum `timeout` (ms) — max time for a single protected action */
  actionTimeoutMs: number;
  errorThresholdPercentage: number;
  resetTimeoutMs: number;
  rollingCountTimeoutMs: number;
  rollingCountBuckets: number;
  volumeThreshold: number;
}

export interface IntegrationConfig {
  serviceName: string;
  defaultTimeoutMs: number;
  baseDelayMs: number;
  maxDelayMs: number;
  /** 0..1 portion of delay range used as random jitter (full jitter strategy) */
  jitterRatio: number;
  /** Max attempts per logical call (includes first attempt; 1 = no retry) */
  maxAttempts: number;
  breaker: OpossumBreakerConfig;
  bulkhead: { maxConcurrent: number };
}

function readInt(env: NodeJS.ProcessEnv, key: string, fallback: number): number {
  const raw = env[key];
  if (raw === undefined || raw === "") return fallback;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) {
    throw new Error(`Invalid integer for ${key}: ${raw}`);
  }
  return n;
}

function readFloat(env: NodeJS.ProcessEnv, key: string, fallback: number): number {
  const raw = env[key];
  if (raw === undefined || raw === "") return fallback;
  const n = Number.parseFloat(raw);
  if (Number.isNaN(n)) {
    throw new Error(`Invalid float for ${key}: ${raw}`);
  }
  return n;
}

function readString(env: NodeJS.ProcessEnv, key: string, fallback: string): string {
  const raw = env[key];
  return raw === undefined || raw === "" ? fallback : raw;
}

/**
 * Loads and validates integration configuration from process.env (or a provided env bag for tests).
 */
export function loadIntegrationConfig(env: NodeJS.ProcessEnv = process.env): IntegrationConfig {
  const cfg: IntegrationConfig = {
    serviceName: readString(env, "SERVICE_NAME", "integration-client"),
    defaultTimeoutMs: readInt(env, "INTEGRATION_TIMEOUT_MS", 5_000),
    baseDelayMs: readInt(env, "INTEGRATION_BASE_DELAY_MS", 50),
    maxDelayMs: readInt(env, "INTEGRATION_MAX_DELAY_MS", 2_000),
    jitterRatio: readFloat(env, "INTEGRATION_JITTER_RATIO", 1),
    maxAttempts: readInt(env, "INTEGRATION_MAX_ATTEMPTS", 4),
    breaker: {
      actionTimeoutMs: readInt(env, "OPOSSUM_TIMEOUT_MS", 10_000),
      errorThresholdPercentage: readInt(env, "OPOSSUM_ERROR_THRESHOLD_PERCENTAGE", 50),
      resetTimeoutMs: readInt(env, "OPOSSUM_RESET_TIMEOUT_MS", 3_000),
      rollingCountTimeoutMs: readInt(env, "OPOSSUM_ROLLING_COUNT_TIMEOUT_MS", 10_000),
      rollingCountBuckets: readInt(env, "OPOSSUM_ROLLING_COUNT_BUCKETS", 10),
      volumeThreshold: readInt(env, "OPOSSUM_VOLUME_THRESHOLD", 5),
    },
    bulkhead: {
      maxConcurrent: readInt(env, "INTEGRATION_BULKHEAD_MAX_CONCURRENT", 20),
    },
  };

  if (cfg.defaultTimeoutMs <= 0) throw new Error("INTEGRATION_TIMEOUT_MS must be > 0");
  if (cfg.maxAttempts < 1) throw new Error("INTEGRATION_MAX_ATTEMPTS must be >= 1");
  if (cfg.bulkhead.maxConcurrent < 1) throw new Error("INTEGRATION_BULKHEAD_MAX_CONCURRENT must be >= 1");
  if (cfg.jitterRatio < 0 || cfg.jitterRatio > 1) throw new Error("INTEGRATION_JITTER_RATIO must be in [0,1]");

  return cfg;
}
