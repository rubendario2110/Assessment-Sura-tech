import { afterEach, describe, expect, it, jest } from "@jest/globals";
import {
  CircuitOpenError,
  ResilientHttpClient,
  TimeoutError,
  UpstreamError,
  createJsonLogger,
} from "@assessment/integration-framework";
import type { IntegrationEnvConfig, StructuredLogger } from "@assessment/integration-framework";

describe("ResilientHttpClient", () => {
  const originalFetch = global.fetch;
  /** Avoid async opossum timers writing to console after tests finish */
  const silentLogger: StructuredLogger = { log: jest.fn() };

  const baseConfig: IntegrationEnvConfig = {
    httpTimeoutMs: 2000,
    retryMaxAttempts: 3,
    retryBaseMs: 1,
    retryMaxMs: 5,
    retryJitterRatio: 0,
    breakerErrorThresholdPercentage: 50,
    breakerResetTimeoutMs: 400,
    breakerVolumeThreshold: 80,
    bulkheadMaxConcurrent: 4,
  };

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  function makeClient(overrides?: Partial<ConstructorParameters<typeof ResilientHttpClient>[0]>) {
    return new ResilientHttpClient({
      baseUrl: "http://example.test",
      dependencyName: "dep",
      serviceName: "svc",
      config: baseConfig,
      logger: silentLogger,
      random: () => 0,
      ...overrides,
    });
  }

  it("returns JSON on success", async () => {
    const loud = createJsonLogger("t");
    global.fetch = jest.fn(
      async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    ) as typeof fetch;
    const res = await makeClient({ logger: loud }).execute({ method: "GET", path: "/x" });
    expect(((await res.json()) as { ok: boolean }).ok).toBe(true);
  });

  it("sends JSON body for POST", async () => {
    global.fetch = jest.fn(async (_u, init) => {
      expect(init?.method).toBe("POST");
      expect(init?.body).toBe(JSON.stringify({ a: 1 }));
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    await makeClient().execute({ method: "POST", path: "/", body: { a: 1 } });
  });

  it("honours inbound traceContext", async () => {
    global.fetch = jest.fn(async (_u, init) => {
      const h = init?.headers as Headers;
      expect(h.get("traceparent")).toContain("00-");
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    await makeClient().execute({
      method: "GET",
      path: "/",
      traceContext: { traceId: "a".repeat(32), spanId: "b".repeat(16) },
    });
  });

  it("retries 503 then succeeds", async () => {
    let n = 0;
    global.fetch = jest.fn(async () => {
      n++;
      if (n < 2) return new Response("err", { status: 503 });
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    await makeClient().execute({ method: "GET", path: "/" });
    expect(n).toBe(2);
  });

  it("does not retry non-retryable HTTP errors", async () => {
    global.fetch = jest.fn(async () => new Response("bad", { status: 409 })) as typeof fetch;
    await expect(makeClient().execute({ method: "GET", path: "/" })).rejects.toThrow(UpstreamError);
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(1);
  });

  it("retries generic network Error then fails", async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error("econnreset"))
      .mockRejectedValueOnce(new Error("econnreset"))
      .mockRejectedValueOnce(new Error("econnreset")) as typeof fetch;
    await expect(makeClient({ config: { ...baseConfig, retryMaxAttempts: 3 } }).execute({ method: "GET", path: "/" })).rejects.toThrow(
      "econnreset",
    );
  });

  it("maps abort to TimeoutError", async () => {
    global.fetch = jest.fn((_url, init) => {
      return new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => reject(Object.assign(new Error("Aborted"), { name: "AbortError" })),
          { once: true },
        );
      });
    }) as typeof fetch;
    await expect(
      makeClient({ config: { ...baseConfig, httpTimeoutMs: 8, retryMaxAttempts: 2 } }).execute({
        method: "GET",
        path: "/",
      }),
    ).rejects.toThrow(TimeoutError);
  });

  it("maps non-Error rejection", async () => {
    global.fetch = jest.fn(async () => {
      throw { weird: true };
    }) as typeof fetch;
    await expect(makeClient({ config: { ...baseConfig, retryMaxAttempts: 1 } }).execute({ method: "GET", path: "/" })).rejects.toThrow(
      "[object Object]",
    );
  });

  it("opens circuit after sustained failures", async () => {
    global.fetch = jest.fn(async () => new Response("x", { status: 503 })) as typeof fetch;
    const c = makeClient({
      config: {
        ...baseConfig,
        retryMaxAttempts: 1,
        breakerVolumeThreshold: 3,
        breakerResetTimeoutMs: 600,
      },
    });
    await expect(c.execute({ method: "GET", path: "/" })).rejects.toThrow(UpstreamError);
    await expect(c.execute({ method: "GET", path: "/" })).rejects.toThrow(UpstreamError);
    await expect(c.execute({ method: "GET", path: "/" })).rejects.toThrow(CircuitOpenError);
  });

  it("half-opens then closes after upstream heals", async () => {
    let phase: "fail" | "heal" = "fail";
    global.fetch = jest.fn(async () => {
      if (phase === "fail") return new Response("x", { status: 503 });
      return new Response("{}", { status: 200 });
    }) as typeof fetch;

    const log = jest.fn();
    const logger: StructuredLogger = { log };
    const c = makeClient({
      logger,
      config: {
        ...baseConfig,
        retryMaxAttempts: 1,
        breakerVolumeThreshold: 8,
        breakerResetTimeoutMs: 350,
      },
    });

    for (let i = 0; i < 7; i++) {
      await expect(c.execute({ method: "GET", path: "/" })).rejects.toThrow(UpstreamError);
    }
    await expect(c.execute({ method: "GET", path: "/" })).rejects.toThrow(CircuitOpenError);

    phase = "heal";
    await new Promise((r) => setTimeout(r, 500));
    await c.execute({ method: "GET", path: "/" });

    const messages = log.mock.calls.map((args) => (args[0] as { message?: string }).message);
    expect(messages).toContain("breaker_half_open");
    expect(messages).toContain("breaker_closed");
  }, 15_000);
});
