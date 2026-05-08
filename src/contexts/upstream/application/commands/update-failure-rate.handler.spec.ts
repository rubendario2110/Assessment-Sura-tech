import { describe, expect, it, beforeEach, afterEach } from "@jest/globals";
import { Test, type TestingModule } from "@nestjs/testing";
import { CqrsModule } from "@nestjs/cqrs";
import { UpdateFailureRateHandler } from "./update-failure-rate.handler.js";
import { UpdateFailureRateCommand } from "./update-failure-rate.command.js";
import { FailureRate } from "../../domain/value-objects/failure-rate.vo.js";
import { InMemoryFailureRateRepository } from "../../infrastructure/in-memory-failure-rate.repository.js";
import { FAILURE_RATE_REPOSITORY } from "../../infrastructure/tokens.js";

describe("UpdateFailureRateHandler (Upstream BC — CQRS command)", () => {
  let moduleRef: TestingModule;
  let handler: UpdateFailureRateHandler;
  let repo: InMemoryFailureRateRepository;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [
        UpdateFailureRateHandler,
        { provide: FAILURE_RATE_REPOSITORY, useClass: InMemoryFailureRateRepository },
      ],
    }).compile();

    handler = moduleRef.get(UpdateFailureRateHandler);
    repo = moduleRef.get(FAILURE_RATE_REPOSITORY);
  });

  afterEach(async () => {
    await moduleRef?.close();
  });

  it("clamps the requested rate into [0,1] and persists it", async () => {
    const next = await handler.execute(new UpdateFailureRateCommand(FailureRate.fromUnknown("1.5")));
    expect(next).toBe(1);
    expect(repo.current().toNumber()).toBe(1);
  });

  it("accepts the lower bound (0) and updates the repository", async () => {
    await handler.execute(new UpdateFailureRateCommand(FailureRate.fromUnknown(-0.1)));
    expect(repo.current().toNumber()).toBe(0);
  });
});
