import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Test, type TestingModule } from "@nestjs/testing";
import { CqrsModule, EventBus } from "@nestjs/cqrs";
import {
  EchoHandler,
  FlakyUpstreamError,
} from "../../../../../../src/contexts/upstream/application/commands/echo.handler.js";
import { EchoCommand } from "../../../../../../src/contexts/upstream/application/commands/echo.command.js";
import { UpstreamIdempotencyKey } from "../../../../../../src/contexts/upstream/domain/value-objects/upstream-idempotency-key.vo.js";
import { FailureRate } from "../../../../../../src/contexts/upstream/domain/value-objects/failure-rate.vo.js";
import { InMemoryIdempotencyStore } from "../../../../../../src/contexts/upstream/infrastructure/in-memory-idempotency.store.js";
import { InMemoryFailureRateRepository } from "../../../../../../src/contexts/upstream/infrastructure/in-memory-failure-rate.repository.js";
import {
  FAILURE_RATE_REPOSITORY,
  IDEMPOTENCY_STORE,
} from "../../../../../../src/contexts/upstream/infrastructure/tokens.js";

describe("EchoHandler (Upstream BC — CQRS command)", () => {
  const realRandom = Math.random;
  let moduleRef: TestingModule;
  let handler: EchoHandler;
  let store: InMemoryIdempotencyStore;
  let failureRates: InMemoryFailureRateRepository;
  let publishSpy: jest.SpiedFunction<EventBus["publish"]>;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [
        EchoHandler,
        { provide: IDEMPOTENCY_STORE, useClass: InMemoryIdempotencyStore },
        { provide: FAILURE_RATE_REPOSITORY, useClass: InMemoryFailureRateRepository },
      ],
    }).compile();

    handler = moduleRef.get(EchoHandler);
    store = moduleRef.get(IDEMPOTENCY_STORE);
    failureRates = moduleRef.get(FAILURE_RATE_REPOSITORY);
    failureRates.set(FailureRate.zero());
    const eventBus = moduleRef.get(EventBus);
    publishSpy = jest.spyOn(eventBus, "publish").mockImplementation(() => {});
  });

  afterEach(async () => {
    Math.random = realRandom;
    jest.restoreAllMocks();
    await moduleRef?.close();
  });

  it("returns deduped payload when the idempotency key already exists", async () => {
    const cmd = new EchoCommand(UpstreamIdempotencyKey.fromHeader("k-1"), "hello");
    const first = await handler.execute(cmd);
    const second = await handler.execute(cmd);
    expect(first.deduped).toBeUndefined();
    expect(second.deduped).toBe(true);
    expect(store.find("k-1")).toBeDefined();
    expect(publishSpy).toHaveBeenCalledTimes(2);
  });

  it("serves a brand-new echo (no idempotency key) and publishes EchoServedEvent", async () => {
    const result = await handler.execute(new EchoCommand(undefined, "hi-no-key"));
    expect(result).toMatchObject({ ok: true, echo: "hi-no-key", idempotencyKey: null });
    expect(publishSpy).toHaveBeenCalledTimes(1);
  });

  it("rejects with FlakyUpstreamError when the failure rate triggers", async () => {
    failureRates.set(FailureRate.fromUnknown(1));
    Math.random = () => 0;
    await expect(handler.execute(new EchoCommand(undefined, "x"))).rejects.toBeInstanceOf(FlakyUpstreamError);
    expect(publishSpy).toHaveBeenCalledTimes(1);
  });

  it("publishes EchoRejectedEvent with the supplied key when flaky", async () => {
    failureRates.set(FailureRate.fromUnknown(1));
    Math.random = () => 0;
    await expect(
      handler.execute(new EchoCommand(UpstreamIdempotencyKey.fromHeader("k-2"), "x")),
    ).rejects.toBeInstanceOf(FlakyUpstreamError);
    expect(publishSpy).toHaveBeenCalledTimes(1);
  });
});
