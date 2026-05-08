import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Test, type TestingModule } from "@nestjs/testing";
import { CqrsModule, EventBus } from "@nestjs/cqrs";
import { EchoHandler, FlakyUpstreamError } from "./echo.handler.js";
import { EchoCommand } from "./echo.command.js";
import { UpstreamIdempotencyKey } from "../../domain/value-objects/upstream-idempotency-key.vo.js";
import { FailureRate } from "../../domain/value-objects/failure-rate.vo.js";
import { InMemoryIdempotencyStore } from "../../infrastructure/in-memory-idempotency.store.js";
import { InMemoryFailureRateRepository } from "../../infrastructure/in-memory-failure-rate.repository.js";
import { FAILURE_RATE_REPOSITORY, IDEMPOTENCY_STORE } from "../../infrastructure/tokens.js";

describe("EchoHandler (Upstream BC — CQRS)", () => {
  let handler: EchoHandler;
  let store: InMemoryIdempotencyStore;
  let failureRates: InMemoryFailureRateRepository;
  let moduleRef: TestingModule;
  const realRandom = Math.random;

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

    const eventBus = moduleRef.get(EventBus);
    jest.spyOn(eventBus, "publish").mockImplementation(() => {});
  });

  afterEach(async () => {
    Math.random = realRandom;
    await moduleRef?.close();
  });

  it("returns deduped payload when idempotency key already exists", async () => {
    failureRates.set(FailureRate.zero());
    const cmd = new EchoCommand(UpstreamIdempotencyKey.fromHeader("k-1"), "hello");
    const first = await handler.execute(cmd);
    const second = await handler.execute(cmd);
    expect(first.deduped).toBeUndefined();
    expect(second.deduped).toBe(true);
    expect(store.find("k-1")).toBeDefined();
  });

  it("throws FlakyUpstreamError when failure rate triggers", async () => {
    failureRates.set(FailureRate.fromUnknown(1));
    Math.random = () => 0;
    const cmd = new EchoCommand(undefined, "hi");
    await expect(handler.execute(cmd)).rejects.toBeInstanceOf(FlakyUpstreamError);
  });
});
