import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Test, type TestingModule } from "@nestjs/testing";
import { CqrsModule, EventBus } from "@nestjs/cqrs";
import {
  ChannelHttpException,
  InvokeUpstreamHandler,
} from "../../../../../../src/contexts/channel/application/commands/invoke-upstream.handler.js";
import { InvokeUpstreamCommand } from "../../../../../../src/contexts/channel/application/commands/invoke-upstream.command.js";
import { IdempotencyKey } from "../../../../../../src/contexts/channel/domain/value-objects/idempotency-key.vo.js";
import { ChannelTraceContext } from "../../../../../../src/contexts/channel/domain/value-objects/trace-context.vo.js";
import { CHANNEL_UPSTREAM_BASE_URL } from "../../../../../../src/contexts/channel/infrastructure/tokens.js";
import {
  BulkheadFullError,
  CircuitOpenError,
  IntegrationHttpClient,
  TimeoutError,
  UpstreamError,
  createLogger,
  loadIntegrationConfig,
} from "@assessment/integration-framework";

const buildModule = async (): Promise<TestingModule> => {
  const cfg = loadIntegrationConfig({
    INTEGRATION_MAX_ATTEMPTS: "1",
    OPOSSUM_VOLUME_THRESHOLD: "1",
    SERVICE_NAME: "channel-test",
  });
  return Test.createTestingModule({
    imports: [CqrsModule],
    providers: [
      InvokeUpstreamHandler,
      {
        provide: IntegrationHttpClient,
        useValue: new IntegrationHttpClient(cfg, createLogger({ serviceName: "channel-test" })),
      },
      { provide: CHANNEL_UPSTREAM_BASE_URL, useValue: "http://upstream.invalid/" },
    ],
  }).compile();
};

describe("InvokeUpstreamHandler (Channel BC — CQRS)", () => {
  const originalFetch = global.fetch;
  let moduleRef: TestingModule;
  let handler: InvokeUpstreamHandler;
  let client: IntegrationHttpClient;
  let publishSpy: jest.SpiedFunction<EventBus["publish"]>;

  beforeEach(async () => {
    moduleRef = await buildModule();
    handler = moduleRef.get(InvokeUpstreamHandler);
    client = moduleRef.get(IntegrationHttpClient);
    const eventBus = moduleRef.get(EventBus);
    publishSpy = jest.spyOn(eventBus, "publish").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(async () => {
    (global as { fetch: typeof fetch }).fetch = originalFetch;
    jest.restoreAllMocks();
    await moduleRef?.close();
  });

  it("returns InvokeUpstreamResult on success and publishes UpstreamCallSucceededEvent", async () => {
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
    expect(publishSpy).toHaveBeenCalledTimes(1);
  });

  it("translates non-JSON upstream body into 502 invalid_upstream_json", async () => {
    (global as { fetch: typeof fetch }).fetch = (async () =>
      ({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async () => "<html>not json</html>",
      }) as Response) as unknown as typeof fetch;

    await expect(
      handler.execute(
        new InvokeUpstreamCommand(IdempotencyKey.generate(), ChannelTraceContext.fromHeader(undefined), {}),
      ),
    ).rejects.toMatchObject({
      httpStatus: 502,
      body: expect.objectContaining({ error: "invalid_upstream_json" }),
    } satisfies Partial<ChannelHttpException>);
  });

  it.each<[string, Error, number, string]>([
    ["CircuitOpenError -> 503", new CircuitOpenError("open"), 503, "circuit_open"],
    ["TimeoutError -> 504", new TimeoutError("late"), 504, "timeout"],
    ["UpstreamError -> 502", new UpstreamError("u", { httpStatus: 503 }), 502, "upstream"],
    ["BulkheadFullError -> 429", new BulkheadFullError("full"), 429, "bulkhead_full"],
  ])("translates %s", async (_label, err, status, errorCode) => {
    jest.spyOn(client, "execute").mockRejectedValue(err);
    await expect(
      handler.execute(
        new InvokeUpstreamCommand(IdempotencyKey.generate(), ChannelTraceContext.fromHeader(undefined), {}),
      ),
    ).rejects.toMatchObject({
      httpStatus: status,
      body: expect.objectContaining({ error: errorCode }),
    });
  });

  it("falls back to 502 'unexpected' for unknown errors and includes message", async () => {
    jest.spyOn(client, "execute").mockRejectedValue(new Error("boom"));
    await expect(
      handler.execute(
        new InvokeUpstreamCommand(IdempotencyKey.generate(), ChannelTraceContext.fromHeader(undefined), {}),
      ),
    ).rejects.toMatchObject({
      httpStatus: 502,
      body: expect.objectContaining({ error: "unexpected", message: "boom" }),
    });
  });

  it("falls back to 502 'unexpected' for non-Error throwables (string)", async () => {
    jest.spyOn(client, "execute").mockRejectedValue("string-error");
    await expect(
      handler.execute(
        new InvokeUpstreamCommand(IdempotencyKey.generate(), ChannelTraceContext.fromHeader(undefined), {}),
      ),
    ).rejects.toMatchObject({
      httpStatus: 502,
      body: expect.objectContaining({ error: "unexpected", message: "string-error" }),
    });
  });

  it("re-throws ChannelHttpException unchanged when client returns invalid JSON twice", async () => {
    jest.spyOn(client, "execute").mockResolvedValue({
      status: 200,
      headers: {},
      bodyText: "<not-json>",
    });
    await expect(
      handler.execute(
        new InvokeUpstreamCommand(IdempotencyKey.generate(), ChannelTraceContext.fromHeader(undefined), {}),
      ),
    ).rejects.toBeInstanceOf(ChannelHttpException);
  });

  it("ChannelHttpException default message falls back when error field is missing", () => {
    const ex = new ChannelHttpException(500, { other: "x" });
    expect(ex.message).toBe("channel_error");
  });
});
