import { afterEach, describe, expect, it } from "@jest/globals";
import { InMemoryFailureRateRepository } from "../../../../../src/contexts/upstream/infrastructure/in-memory-failure-rate.repository.js";
import { FailureRate } from "../../../../../src/contexts/upstream/domain/value-objects/failure-rate.vo.js";

describe("InMemoryFailureRateRepository", () => {
  const original = process.env.UPSTREAM_FAILURE_RATE;

  afterEach(() => {
    if (original === undefined) delete process.env.UPSTREAM_FAILURE_RATE;
    else process.env.UPSTREAM_FAILURE_RATE = original;
  });

  it("seeds from env when UPSTREAM_FAILURE_RATE is set (clamped to [0,1])", () => {
    process.env.UPSTREAM_FAILURE_RATE = "0.8";
    expect(new InMemoryFailureRateRepository().current().toNumber()).toBe(0.8);
  });

  it("falls back to 0.35 when env is unset", () => {
    delete process.env.UPSTREAM_FAILURE_RATE;
    expect(new InMemoryFailureRateRepository().current().toNumber()).toBeCloseTo(0.35, 5);
  });

  it("set() replaces the value via the FailureRate VO", () => {
    const repo = new InMemoryFailureRateRepository();
    repo.set(FailureRate.fromUnknown(0.1));
    expect(repo.current().toNumber()).toBeCloseTo(0.1, 5);
  });
});
