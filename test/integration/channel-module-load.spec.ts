import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { Test } from "@nestjs/testing";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { ChannelModule } from "../../src/contexts/channel/channel.module.js";

describe("ChannelModule factory wiring", () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    delete process.env.REDIS_URL;
    process.env.UPSTREAM_URL = "http://127.0.0.1:31999";
    process.env.SERVICE_NAME = "channel-factory-it";
    const ref = await Test.createTestingModule({
      imports: [ChannelModule],
    }).compile();
    app = ref.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("builds ResilientHttpClient via useFactory", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
  });
});
