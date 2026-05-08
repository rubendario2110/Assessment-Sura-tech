import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import {
  GetUpstreamStatusQuery,
  type UpstreamStatusView,
} from "./get-upstream-status.query.js";
import { FAILURE_RATE_REPOSITORY } from "../../infrastructure/tokens.js";
import type { FailureRateRepository } from "../../domain/failure-rate-repository.port.js";

@QueryHandler(GetUpstreamStatusQuery)
export class GetUpstreamStatusHandler implements IQueryHandler<GetUpstreamStatusQuery, UpstreamStatusView> {
  constructor(
    @Inject(FAILURE_RATE_REPOSITORY) private readonly failureRates: FailureRateRepository,
  ) {}

  async execute(_query: GetUpstreamStatusQuery): Promise<UpstreamStatusView> {
    void _query;
    return {
      status: "ok",
      service: "upstream",
      failureRate: this.failureRates.current().toNumber(),
    };
  }
}
