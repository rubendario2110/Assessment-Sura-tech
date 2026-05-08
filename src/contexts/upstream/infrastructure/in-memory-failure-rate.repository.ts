import { Injectable } from "@nestjs/common";
import { FailureRate } from "../domain/value-objects/failure-rate.vo.js";
import type { FailureRateRepository } from "../domain/failure-rate-repository.port.js";

@Injectable()
export class InMemoryFailureRateRepository implements FailureRateRepository {
  private value: FailureRate;

  constructor() {
    const seed = process.env.UPSTREAM_FAILURE_RATE ?? "0.35";
    this.value = FailureRate.fromUnknown(seed);
  }

  current(): FailureRate {
    return this.value;
  }

  set(rate: FailureRate): void {
    this.value = rate;
  }
}
