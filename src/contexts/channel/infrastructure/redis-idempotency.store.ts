import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import { isApplicationVerboseLogging } from "../../shared/application-verbose-log.js";
import { maskIdempotencyKey } from "../../shared/mask-idempotency-key.js";
import type { IdempotencyRecord, IdempotencyStorePort } from "../domain/idempotency-store.port.js";
import type { RedisClient } from "./ioredis-loader.js";

const KEY_PREFIX = "assessment:channel:idempotency:";

@Injectable()
export class RedisIdempotencyStore implements IdempotencyStorePort, OnModuleDestroy {
  private readonly log = new Logger(RedisIdempotencyStore.name);

  constructor(
    private readonly redis: RedisClient,
    private readonly ttlSeconds: number | undefined,
  ) {}

  async get(key: string): Promise<IdempotencyRecord | undefined> {
    const raw = await this.redis.get(KEY_PREFIX + key);
    if (isApplicationVerboseLogging()) {
      this.log.log(
        `redis GET key=${maskIdempotencyKey(key)} hit=${raw != null}`,
      );
    }
    if (raw == null) return undefined;
    try {
      return JSON.parse(raw) as IdempotencyRecord;
    } catch {
      return undefined;
    }
  }

  async put(key: string, record: IdempotencyRecord): Promise<void> {
    const payload = JSON.stringify(record);
    if (this.ttlSeconds != null && this.ttlSeconds > 0) {
      await this.redis.set(KEY_PREFIX + key, payload, "EX", this.ttlSeconds);
      if (isApplicationVerboseLogging()) {
        this.log.log(
          `redis SET key=${maskIdempotencyKey(key)} EX=${this.ttlSeconds}s`,
        );
      }
    } else {
      await this.redis.set(KEY_PREFIX + key, payload);
      if (isApplicationVerboseLogging()) {
        this.log.log(`redis SET key=${maskIdempotencyKey(key)} (no TTL)`);
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
