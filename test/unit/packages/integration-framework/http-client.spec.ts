import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { loadIntegrationConfig } from "../../../../packages/integration-framework/src/config.js";
import { createLogger, type Logger } from "../../../../packages/integration-framework/src/logger.js";
import {
  IntegrationHttpClient,
  normalizeBreakerError,
  shouldRetryError,
} from "../../../../packages/integration-framework/src/http-client.js";
import { CircuitOpenError, TimeoutError, UpstreamError } from "../../../../packages/integration-framework/src/errors.js";
import { createTraceContext } from "../../../../packages/integration-framework/src/tracing.js";

type FetchMock = jest.Mock<typeof fetch>;

const installFetch = (impl: (...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>): FetchMock => {
  const m = jest.fn(impl) as unknown as FetchMock;
  (global as { fetch: typeof fetch }).fetch = m as unknown as typeof fetch;
  return m;
};

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

const fastConfig = (): ReturnType<typeof loadIntegrationConfig> =>
  loadIntegrationConfig({
    SERVICE_NAME: "test",
    INTEGRATION_TIMEOUT_MS: "50",
    INTEGRATION_BASE_DELAY_MS: "1",
    INTEGRATION_MAX_DELAY_MS: "2",
    INTEGRATION_JITTER_RATIO: "0",
    INTEGRATION_MAX_ATTEMPTS: "3",
    INTEGRATION_BULKHEAD_MAX_CONCURRENT: "5",
    OPOSSUM_VOLUME_THRESHOLD: "1",
    OPOSSUM_ERROR_THRESHOLD_PERCENTAGE: "1",
    OPOSSUM_RESET_TIMEOUT_MS: "20",
    OPOSSUM_ROLLING_COUNT_TIMEOUT_MS: "1000",
    OPOSSUM_ROLLING_COUNT_BUCKETS: "1",
    OPOSSUM_TIMEOUT_MS: "100",
  });

describe("IntegrationHttpClient (US-018)", () => {
  const originalFetch = global.fetch;
  let logger: Logger;

  beforeEach(() => {
    logger = createLogger({ serviceName: "test" });
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    (global as { fetch: typeof fetch }).fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("returns the HttpResult on success and propagates traceparent + idempotency-key headers", async () => {
    const captured: { url?: string; init?: RequestInit } = {};
    installFetch(async (url, init) => {
      captured.url = String(url);
      captured.init = init;
      return new Response("hello", { status: 200, headers: { "x-foo": "bar" } });
    });

    const client = new IntegrationHttpClient(fastConfig(), logger);
    const traceContext = createTraceContext();
    const result = await client.execute({
      dependencyId: "dep-a",
      method: "GET",
      url: "http://x/y",
      idempotencyKey: "k-1",
      traceContext,
    });

    expect(result.status).toBe(200);
    expect(result.bodyText).toBe("hello");
    expect(result.headers["x-foo"]).toBe("bar");
    const headers = (captured.init?.headers ?? {}) as Record<string, string>;
    expect(headers.traceparent).toMatch(/^00-/);
    expect(headers["idempotency-key"]).toBe("k-1");
  });

  it("serialises JSON body and forwards the request method", async () => {
    const seen: { body?: string; method?: string } = {};
    installFetch(async (_url, init) => {
      seen.body = init?.body as string;
      seen.method = init?.method;
      return new Response("{}", { status: 200 });
    });
    const client = new IntegrationHttpClient(fastConfig(), logger);
    await client.execute({ dependencyId: "dep-b", method: "POST", url: "http://x", body: { a: 1 } });
    expect(seen.method).toBe("POST");
    expect(seen.body).toBe(JSON.stringify({ a: 1 }));
  });

  it("retries transient 503 then succeeds (US-012 retry surface)", async () => {
    let n = 0;
    installFetch(async () => {
      n += 1;
      if (n < 2) return new Response("x", { status: 503 });
      return new Response("ok", { status: 200 });
    });
    const client = new IntegrationHttpClient(fastConfig(), logger);
    const r = await client.execute({ dependencyId: "dep-c", method: "GET", url: "http://x" });
    expect(r.status).toBe(200);
    expect(n).toBe(2);
  });

  it("does NOT retry non-retryable HTTP statuses (e.g. 400) and surfaces UpstreamError", async () => {
    let n = 0;
    installFetch(async () => {
      n += 1;
      return new Response("bad", { status: 400 });
    });
    const client = new IntegrationHttpClient(fastConfig(), logger);
    await expect(
      client.execute({ dependencyId: "dep-d", method: "GET", url: "http://x" }),
    ).rejects.toBeInstanceOf(UpstreamError);
    expect(n).toBe(1);
  });

  it("converts AbortError into a TimeoutError and retries (TimeoutError is retryable)", async () => {
    let calls = 0;
    installFetch(async (_url, init) => {
      calls += 1;
      if (calls < 2) {
        await sleep(80);
        if (init?.signal?.aborted) {
          const e: Error & { name: string } = new Error("aborted");
          e.name = "AbortError";
          throw e;
        }
      }
      return new Response("ok", { status: 200 });
    });
    const client = new IntegrationHttpClient(fastConfig(), logger);
    const r = await client.execute({ dependencyId: "dep-e", method: "GET", url: "http://x" });
    expect(r.status).toBe(200);
    expect(calls).toBeGreaterThanOrEqual(2);
  });

  it("retries TypeError (network/DNS-style failures)", async () => {
    let n = 0;
    installFetch(async () => {
      n += 1;
      if (n < 2) throw new TypeError("ECONNREFUSED");
      return new Response("ok", { status: 200 });
    });
    const client = new IntegrationHttpClient(fastConfig(), logger);
    await expect(client.execute({ dependencyId: "dep-f", method: "GET", url: "http://x" })).resolves.toMatchObject({
      status: 200,
    });
    expect(n).toBe(2);
  });

  it("opens the breaker after a failure burst then rejects with CircuitOpenError, then closes after reset", async () => {
    installFetch(async () => new Response("err", { status: 500 }));
    const client = new IntegrationHttpClient(fastConfig(), logger);

    await expect(
      client.execute({ dependencyId: "dep-g", method: "GET", url: "http://x" }),
    ).rejects.toBeInstanceOf(UpstreamError);

    await expect(
      client.execute({ dependencyId: "dep-g", method: "GET", url: "http://x" }),
    ).rejects.toBeInstanceOf(CircuitOpenError);

    expect(client.getBreakerState("dep-g")).toBe("open");

    installFetch(async () => new Response("ok", { status: 200 }));
    await sleep(60);
    const r = await client.execute({ dependencyId: "dep-g", method: "GET", url: "http://x" });
    expect(r.status).toBe(200);
    expect(client.getBreakerState("dep-g")).toBe("closed");
  });

  it("re-throws non-Error throwables wrapped as Error via normalizeError", async () => {
    const cfg = fastConfig();
    const client = new IntegrationHttpClient(cfg, logger);
    interface InternalCB { fire: () => Promise<unknown> }
    interface Internal { breakers: Map<string, InternalCB> }
    (client as unknown as Internal).breakers.set("dep-h", { fire: async () => { throw "string-error"; } });
    await expect(
      client.execute({ dependencyId: "dep-h", method: "GET", url: "http://x" }),
    ).rejects.toThrow("string-error");
  });

  it("getBreakerState returns 'closed' for unknown dependency and getOpossumSettings exposes config", () => {
    const cfg = fastConfig();
    const client = new IntegrationHttpClient(cfg, logger);
    expect(client.getBreakerState("never-used")).toBe("closed");
    expect(client.getOpossumSettings()).toEqual({
      volumeThreshold: cfg.breaker.volumeThreshold,
      errorThresholdPercentage: cfg.breaker.errorThresholdPercentage,
      resetTimeoutMs: cfg.breaker.resetTimeoutMs,
    });
  });
});

describe("shouldRetryError (pure retry policy)", () => {
  it.each([
    ["TimeoutError", new TimeoutError("late"), true],
    ["UpstreamError 503", new UpstreamError("u", { httpStatus: 503 }), true],
    ["UpstreamError 502", new UpstreamError("u", { httpStatus: 502 }), true],
    ["UpstreamError 400", new UpstreamError("u", { httpStatus: 400 }), false],
    ["UpstreamError without status", new UpstreamError("u"), false],
    ["TypeError", new TypeError("net"), true],
    ["plain Error", new Error("x"), false],
    ["null", null as unknown, false],
  ])("classifies %s -> %s", (_label, err, expected) => {
    expect(shouldRetryError(err)).toBe(expected);
  });
});

describe("normalizeBreakerError (pure normaliser)", () => {
  it("maps EOPENBREAKER errors into CircuitOpenError preserving cause", () => {
    const raw = Object.assign(new Error("breaker"), { code: "EOPENBREAKER" });
    const out = normalizeBreakerError(raw);
    expect(out).toBeInstanceOf(CircuitOpenError);
    expect((out as CircuitOpenError).cause).toBe(raw);
  });

  it("returns Error instances unchanged", () => {
    const raw = new Error("plain");
    expect(normalizeBreakerError(raw)).toBe(raw);
  });

  it("wraps non-Error throwables (string) as Error", () => {
    const out = normalizeBreakerError("oops");
    expect(out).toBeInstanceOf(Error);
    expect(out.message).toBe("oops");
  });

  it("wraps non-Error throwables (null) as Error", () => {
    const out = normalizeBreakerError(null);
    expect(out).toBeInstanceOf(Error);
    expect(out.message).toBe("null");
  });
});
