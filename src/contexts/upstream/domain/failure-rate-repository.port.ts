import type { FailureRate } from "./value-objects/failure-rate.vo.js";

export interface FailureRateRepository {
  current(): FailureRate;
  set(rate: FailureRate): void;
}
