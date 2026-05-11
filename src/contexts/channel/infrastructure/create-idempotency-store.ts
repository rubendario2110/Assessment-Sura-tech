import { Logger } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { Redis } from "./ioredis-loader.js";
import type { IdempotencyStorePort } from "../domain/idempotency-store.port.js";
import { InMemoryIdempotencyStore } from "./in-memory-idempotency.store.js";
import { RedisIdempotencyStore } from "./redis-idempotency.store.js";

const log = new Logger("IdempotencyStore");

function redisUrlForLog(connectionUrl: string): string {
  try {
    const u = new URL(connectionUrl);
    const port = u.port || (u.protocol === "redis:" ? "6379" : "");
    return `${u.protocol}//${u.hostname}${port ? `:${port}` : ""}`;
  } catch {
    return "(invalid REDIS_URL)";
  }
}

/** Uses Redis when `REDIS_URL` is set and reachable; otherwise in-memory. */
export async function createIdempotencyStore(config: ConfigService): Promise<IdempotencyStorePort> {
  const url = config.get<string>("REDIS_URL")?.trim();
  const ttlRaw = config.get<string>("IDEMPOTENCY_REDIS_TTL_SECONDS")?.trim();
  let ttlSeconds: number | undefined;
  if (ttlRaw !== undefined && ttlRaw !== "") {
    const n = Number.parseInt(ttlRaw, 10);
    if (Number.isFinite(n) && n > 0) ttlSeconds = n;
  }

  if (!url) {
    log.log("store=in-memory (REDIS_URL unset)");
    return new InMemoryIdempotencyStore();
  }

  const redis = new Redis(url, {
    lazyConnect: true,
    connectTimeout: 3000,
    maxRetriesPerRequest: 2,
  });

  try {
    await redis.connect();
    await redis.ping();
    log.log(
      `store=Redis ${redisUrlForLog(url)} ttlSeconds=${ttlSeconds ?? "none"} — idempotency payloads stored as JSON`,
    );
    return new RedisIdempotencyStore(redis, ttlSeconds);
  } catch (err: unknown) {
    redis.disconnect();
    const msg = err instanceof Error ? err.message : String(err);
    log.warn(
      `store=in-memory fallback — Redis unreachable (${msg}). Idempotency keys are NOT shared across instances.`,
    );
    return new InMemoryIdempotencyStore();
  }
}
