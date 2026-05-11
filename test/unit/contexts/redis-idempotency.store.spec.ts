import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { RedisClient } from "../../../src/contexts/channel/infrastructure/ioredis-loader.js";
import type { IdempotencyRecord } from "../../../src/contexts/channel/domain/idempotency-store.port.js";
import { RedisIdempotencyStore } from "../../../src/contexts/channel/infrastructure/redis-idempotency.store.js";

describe("RedisIdempotencyStore", () => {
  const get = jest.fn();
  const set = jest.fn();
  const quit = jest.fn().mockResolvedValue("OK");

  const redis = { get, set, quit } as unknown as RedisClient;

  beforeEach(() => {
    process.env.APPLICATION_VERBOSE_LOGS = "true";
    get.mockReset();
    set.mockReset();
    quit.mockClear();
  });

  afterEach(() => {
    delete process.env.APPLICATION_VERBOSE_LOGS;
    jest.restoreAllMocks();
  });

  it("get returns undefined on miss", async () => {
    get.mockResolvedValueOnce(null);
    const store = new RedisIdempotencyStore(redis, undefined);
    await expect(store.get("k")).resolves.toBeUndefined();
    expect(get).toHaveBeenCalledWith("assessment:channel:idempotency:k");
  });

  it("get parses JSON record", async () => {
    const rec: IdempotencyRecord = { statusCode: 201, body: { id: "1" } };
    get.mockResolvedValueOnce(JSON.stringify(rec));
    const store = new RedisIdempotencyStore(redis, undefined);
    await expect(store.get("k")).resolves.toEqual(rec);
  });

  it("get returns undefined on invalid JSON", async () => {
    get.mockResolvedValueOnce("{not-json");
    const store = new RedisIdempotencyStore(redis, undefined);
    await expect(store.get("k")).resolves.toBeUndefined();
  });

  it("put sets without TTL when ttl omitted", async () => {
    set.mockResolvedValueOnce("OK");
    const store = new RedisIdempotencyStore(redis, undefined);
    const rec: IdempotencyRecord = { statusCode: 201, body: { x: 1 } };
    await store.put("k", rec);
    expect(set).toHaveBeenCalledWith(
      "assessment:channel:idempotency:k",
      JSON.stringify(rec),
    );
  });

  it("put sets with EX when ttl positive", async () => {
    set.mockResolvedValueOnce("OK");
    const store = new RedisIdempotencyStore(redis, 3600);
    const rec: IdempotencyRecord = { statusCode: 201, body: {} };
    await store.put("k", rec);
    expect(set).toHaveBeenCalledWith(
      "assessment:channel:idempotency:k",
      JSON.stringify(rec),
      "EX",
      3600,
    );
  });

  it("onModuleDestroy quits redis", async () => {
    const store = new RedisIdempotencyStore(redis, undefined);
    await store.onModuleDestroy();
    expect(quit).toHaveBeenCalled();
  });
});
