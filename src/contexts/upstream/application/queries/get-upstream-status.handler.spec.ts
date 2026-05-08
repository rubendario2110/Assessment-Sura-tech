import { describe, expect, it, beforeEach, afterEach } from "@jest/globals";
import { Test, type TestingModule } from "@nestjs/testing";
import { CqrsModule } from "@nestjs/cqrs";
import { GetUpstreamStatusHandler } from "./get-upstream-status.handler.js";
import { GetUpstreamStatusQuery } from "./get-upstream-status.query.js";
import { InMemoryFailureRateRepository } from "../../infrastructure/in-memory-failure-rate.repository.js";
import { FailureRate } from "../../domain/value-objects/failure-rate.vo.js";
import { FAILURE_RATE_REPOSITORY } from "../../infrastructure/tokens.js";

describe("GetUpstreamStatusHandler (Upstream BC — CQRS query)", () => {
  let moduleRef: TestingModule;
  let handler: GetUpstreamStatusHandler;
  let repo: InMemoryFailureRateRepository;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [
        GetUpstreamStatusHandler,
        { provide: FAILURE_RATE_REPOSITORY, useClass: InMemoryFailureRateRepository },
      ],
    }).compile();

    handler = moduleRef.get(GetUpstreamStatusHandler);
    repo = moduleRef.get(FAILURE_RATE_REPOSITORY);
  });

  afterEach(async () => {
    await moduleRef?.close();
  });

  it("reports the seeded failure rate via the read-side", async () => {
    repo.set(FailureRate.fromUnknown(0.42));
    const view = await handler.execute(new GetUpstreamStatusQuery());
    expect(view).toEqual({ status: "ok", service: "upstream", failureRate: 0.42 });
  });
});
