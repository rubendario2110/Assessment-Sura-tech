import { afterEach, describe, expect, it, jest } from "@jest/globals";
import type { ConfigService } from "@nestjs/config";
import { Redis } from "../../../src/contexts/channel/infrastructure/ioredis-loader.js";
import { createIdempotencyStore } from "../../../src/contexts/channel/infrastructure/create-idempotency-store.js";
import { InMemoryIdempotencyStore } from "../../../src/contexts/channel/infrastructure/in-memory-idempotency.store.js";
import { RedisIdempotencyStore } from "../../../src/contexts/channel/infrastructure/redis-idempotency.store.js";

describe("createIdempotencyStore", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns InMemoryIdempotencyStore when REDIS_URL is unset", async () => {
    const config = {
      get: jest.fn((key: string) => (key === "REDIS_URL" ? undefined : undefined)),
    } as unknown as ConfigService;
    const store = await createIdempotencyStore(config);
    expect(store).toBeInstanceOf(InMemoryIdempotencyStore);
  });

  it("returns InMemoryIdempotencyStore when REDIS_URL is blank", async () => {
    const config = {
      get: jest.fn((key: string) => (key === "REDIS_URL" ? "   " : undefined)),
    } as unknown as ConfigService;
    const store = await createIdempotencyStore(config);
    expect(store).toBeInstanceOf(InMemoryIdempotencyStore);
  });

  it("falls back to in-memory when Redis connect fails", async () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === "REDIS_URL") return "redis://127.0.0.1:63998";
        return undefined;
      }),
    } as unknown as ConfigService;

    const spy = jest.spyOn(Redis.prototype, "connect").mockRejectedValue(new Error("ECONNREFUSED"));
    const store = await createIdempotencyStore(config);
    expect(store).toBeInstanceOf(InMemoryIdempotencyStore);
    spy.mockRestore();
  });

  it("returns RedisIdempotencyStore when Redis is reachable", async () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === "REDIS_URL") return "redis://127.0.0.1:6379";
        if (key === "IDEMPOTENCY_REDIS_TTL_SECONDS") return "";
        return undefined;
      }),
    } as unknown as ConfigService;

    const ping = jest.spyOn(Redis.prototype, "ping").mockResolvedValue("PONG");
    const connect = jest.spyOn(Redis.prototype, "connect").mockResolvedValue(undefined);
    jest.spyOn(Redis.prototype, "disconnect").mockImplementation(() => {});
    const quit = jest.spyOn(Redis.prototype, "quit").mockResolvedValue("OK");

    const store = await createIdempotencyStore(config);
    expect(store).toBeInstanceOf(RedisIdempotencyStore);

    await (store as RedisIdempotencyStore).onModuleDestroy();

    ping.mockRestore();
    connect.mockRestore();
    quit.mockRestore();
  });

  it("passes TTL to Redis store when IDEMPOTENCY_REDIS_TTL_SECONDS is valid", async () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === "REDIS_URL") return "redis://127.0.0.1:6379";
        if (key === "IDEMPOTENCY_REDIS_TTL_SECONDS") return "120";
        return undefined;
      }),
    } as unknown as ConfigService;

    jest.spyOn(Redis.prototype, "ping").mockResolvedValue("PONG");
    jest.spyOn(Redis.prototype, "connect").mockResolvedValue(undefined);
    const quit = jest.spyOn(Redis.prototype, "quit").mockResolvedValue("OK");

    const store = await createIdempotencyStore(config);
    expect(store).toBeInstanceOf(RedisIdempotencyStore);
    await (store as RedisIdempotencyStore).onModuleDestroy();
    quit.mockRestore();
  });

  it("ignores non-positive TTL", async () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === "REDIS_URL") return "redis://127.0.0.1:6379";
        if (key === "IDEMPOTENCY_REDIS_TTL_SECONDS") return "0";
        return undefined;
      }),
    } as unknown as ConfigService;

    jest.spyOn(Redis.prototype, "ping").mockResolvedValue("PONG");
    jest.spyOn(Redis.prototype, "connect").mockResolvedValue(undefined);
    const quit = jest.spyOn(Redis.prototype, "quit").mockResolvedValue("OK");

    const store = await createIdempotencyStore(config);
    expect(store).toBeInstanceOf(RedisIdempotencyStore);
    await (store as RedisIdempotencyStore).onModuleDestroy();
    quit.mockRestore();
  });

  it("ignores unparsable TTL", async () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === "REDIS_URL") return "redis://127.0.0.1:6379";
        if (key === "IDEMPOTENCY_REDIS_TTL_SECONDS") return "not-a-number";
        return undefined;
      }),
    } as unknown as ConfigService;

    jest.spyOn(Redis.prototype, "ping").mockResolvedValue("PONG");
    jest.spyOn(Redis.prototype, "connect").mockResolvedValue(undefined);
    const quit = jest.spyOn(Redis.prototype, "quit").mockResolvedValue("OK");

    const store = await createIdempotencyStore(config);
    expect(store).toBeInstanceOf(RedisIdempotencyStore);
    await (store as RedisIdempotencyStore).onModuleDestroy();
    quit.mockRestore();
  });
});
