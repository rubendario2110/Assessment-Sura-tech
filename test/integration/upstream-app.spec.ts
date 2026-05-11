import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { Test } from "@nestjs/testing";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { UpstreamModule } from "../../src/contexts/upstream/upstream.module.js";

describe("Upstream Nest app", () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [UpstreamModule],
    }).compile();
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

  it("GET /resource returns 503 on fail mode", async () => {
    const res = await app.inject({ method: "GET", url: "/resource?mode=fail" });
    expect(res.statusCode).toBe(503);
  });

  it("GET /resource returns payload on ok mode", async () => {
    const res = await app.inject({ method: "GET", url: "/resource?mode=ok" });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as { ok?: boolean };
    expect(body.ok).toBe(true);
  });

  it("GET /resource applies delay for slow mode", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/resource?mode=slow&slowMs=1&latencyMs=1",
    });
    expect(res.statusCode).toBe(200);
  });

  it("GET /resource tolerates invalid numeric query params", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/resource?mode=ok&seed=x&failRate=y&slowMs=z&latencyMs=w",
    });
    expect(res.statusCode).toBe(200);
  });
});
