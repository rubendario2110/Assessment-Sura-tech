import { IQuery } from "@nestjs/cqrs";

export class GetIntegrationStatusQuery implements IQuery {
  constructor(public readonly dependencyId = "upstream") {}
}

export interface IntegrationStatusView {
  dependencyId: string;
  breakerState: "closed" | "open" | "half_open";
  opossum: {
    volumeThreshold: number;
    errorThresholdPercentage: number;
    resetTimeoutMs: number;
  };
}
