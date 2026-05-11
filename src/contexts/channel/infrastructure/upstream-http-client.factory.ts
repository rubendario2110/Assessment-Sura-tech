import type { ConfigService } from "@nestjs/config";
import {
  ResilientHttpClient,
  createJsonLogger,
  loadIntegrationConfig,
} from "@assessment/integration-framework";

export function createResilientUpstreamClient(cfg: ConfigService): ResilientHttpClient {
  return new ResilientHttpClient({
    baseUrl: cfg.getOrThrow<string>("UPSTREAM_URL"),
    dependencyName: "upstream",
    serviceName: cfg.get<string>("SERVICE_NAME") ?? "channel",
    config: loadIntegrationConfig(process.env),
    logger: createJsonLogger(cfg.get<string>("SERVICE_NAME") ?? "channel"),
  });
}
