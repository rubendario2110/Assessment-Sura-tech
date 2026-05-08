import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Test, type TestingModule } from "@nestjs/testing";
import { CqrsModule, EventBus } from "@nestjs/cqrs";
import { InvokeUpstreamHandler, ChannelHttpException } from "./invoke-upstream.handler.js";
import { InvokeUpstreamCommand } from "./invoke-upstream.command.js";
import { IdempotencyKey } from "../../domain/value-objects/idempotency-key.vo.js";
import { ChannelTraceContext } from "../../domain/value-objects/trace-context.vo.js";
import { CHANNEL_UPSTREAM_BASE_URL } from "../../infrastructure/tokens.js";
import {
  CircuitOpenError,
  IntegrationHttpClient,
  createLogger,
  loadIntegrationConfig,
} from "../../../../framework/index.js";

describe("InvokeUpstreamHandler (Channel BC — CQRS)", () => {
  let moduleRef: TestingModule;
  let handler: InvokeUpstreamHandler;
  const originalFetch = global.fetch;

  beforeEach(async () => {
    const cfg = loadIntegrationConfig({
      INTEGRATION_MAX_ATTEMPTS: "1",
      OPOSSUM_VOLUME_THRESHOLD: "1",
      SERVICE_NAME: "channel-test",
    });

    moduleRef = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [
        InvokeUpstreamHandler,
        {
          provide: IntegrationHttpClient,
          useValue: new IntegrationHttpClient(cfg, createLogger({ serviceName: "channel-test" })),
        },
        { provide: CHANNEL_UPSTREAM_BASE_URL, useValue: "http://upstream.invalid" },
      ],
    }).compile();

    handler = moduleRef.get(InvokeUpstreamHandler);
    const eventBus = moduleRef.get(EventBus);
    jest.spyOn(eventBus, "publish").mockImplementation(() => {});
  });

  afterEach(async () => {
    (global as { fetch: typeof fetch }).fetch = originalFetch;
    jest.restoreAllMocks();
    await moduleRef?.close();
  });

  it("returns InvokeUpstreamResult on successful call", async () => {
    (global as { fetch: typeof fetch }).fetch = (async () =>
      ({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        text: async () => '{"ok":true,"echo":"hi"}',
      }) as Response) as unknown as typeof fetch;

    const result = await handler.execute(
      new InvokeUpstreamCommand(IdempotencyKey.fromString("k"), ChannelTraceContext.fromHeader(undefined), {
        message: "hi",
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.upstreamStatus).toBe(200);
    expect(result.upstream).toMatchObject({ ok: true });
  });

  it("translates CircuitOpenError into 503 ChannelHttpException", async () => {
    const client = moduleRef.get(IntegrationHttpClient);
    jest.spyOn(client, "execute").mockRejectedValue(new CircuitOpenError("open"));

    await expect(
      handler.execute(
        new InvokeUpstreamCommand(IdempotencyKey.generate(), ChannelTraceContext.fromHeader(undefined), {}),
      ),
    ).rejects.toMatchObject({
      httpStatus: 503,
      body: expect.objectContaining({ error: "circuit_open" }),
    } satisfies Partial<ChannelHttpException>);
  });
});
