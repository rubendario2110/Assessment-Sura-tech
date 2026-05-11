import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Test } from "@nestjs/testing";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import {
  CircuitOpenError,
  TimeoutError,
  UpstreamError,
} from "@assessment/integration-framework";
import { AppModule } from "../../src/contexts/channel/app.module.js";
import { UPSTREAM_HTTP_CLIENT } from "../../src/contexts/channel/infrastructure/tokens.js";

describe("Channel Nest app", () => {
  let app: NestFastifyApplication;
  const execute = jest.fn();

  beforeEach(async () => {
    jest.resetAllMocks();
    process.env.UPSTREAM_URL = "http://127.0.0.1:3001";
    process.env.SERVICE_NAME = "channel-it";

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(UPSTREAM_HTTP_CLIENT)
      .useValue({ execute })
      .compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("GET /health", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
  });

  it("maps integration errors to HTTP status", async () => {
    execute.mockRejectedValueOnce(new CircuitOpenError("open"));
    let res = await app.inject({ method: "GET", url: "/demo/upstream?mode=ok" });
    expect(res.statusCode).toBe(503);

    execute.mockRejectedValueOnce(new TimeoutError("t"));
    res = await app.inject({ method: "GET", url: "/demo/upstream?mode=ok" });
    expect(res.statusCode).toBe(504);

    execute.mockRejectedValueOnce(new UpstreamError("u", 502, "b"));
    res = await app.inject({ method: "GET", url: "/demo/upstream?mode=ok" });
    expect(res.statusCode).toBe(502);

    execute.mockRejectedValueOnce(new Error("generic"));
    res = await app.inject({ method: "GET", url: "/demo/upstream?mode=ok" });
    expect(res.statusCode).toBe(500);
  });

  it("proxies successful upstream JSON", async () => {
    execute.mockResolvedValueOnce(
      new Response(JSON.stringify({ proxy: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const res = await app.inject({
      method: "GET",
      url: "/demo/upstream?mode=random&seed=9&failRate=0.1&slowMs=1&latencyMs=2",
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).proxy).toBe(true);
    const q = (execute.mock.calls[0][0] as { path: string }).path;
    expect(q).toContain("failRate=0.1");
    expect(q).toContain("latencyMs=2");
  });

  it("POST /demo/order validates payload", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/demo/order",
      headers: { "content-type": "application/json" },
      payload: JSON.stringify({ productId: "x" }),
    });
    expect(res.statusCode).toBe(400);
  });

  it("POST /demo/order supports idempotency replay", async () => {
    const headers = { "content-type": "application/json", "idempotency-key": "ik" };
    const payload = JSON.stringify({ productId: "x", qty: 2 });
    const r1 = await app.inject({ method: "POST", url: "/demo/order", headers, payload });
    expect(r1.statusCode).toBe(201);
    const r2 = await app.inject({ method: "POST", url: "/demo/order", headers, payload });
    expect(r2.statusCode).toBe(200);
    expect(JSON.parse(r2.body).deduped).toBe(true);
  });
});
