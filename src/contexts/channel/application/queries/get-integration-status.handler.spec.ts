import { describe, expect, it, beforeEach, afterEach } from "@jest/globals";
import { Test, type TestingModule } from "@nestjs/testing";
import { CqrsModule } from "@nestjs/cqrs";
import { GetIntegrationStatusHandler } from "./get-integration-status.handler.js";
import { GetIntegrationStatusQuery } from "./get-integration-status.query.js";
import {
  IntegrationHttpClient,
  createLogger,
  loadIntegrationConfig,
} from "../../../../framework/index.js";

describe("GetIntegrationStatusHandler (Channel BC — CQRS query)", () => {
  let moduleRef: TestingModule;
  let handler: GetIntegrationStatusHandler;

  beforeEach(async () => {
    const cfg = loadIntegrationConfig({
      OPOSSUM_VOLUME_THRESHOLD: "7",
      OPOSSUM_ERROR_THRESHOLD_PERCENTAGE: "42",
      OPOSSUM_RESET_TIMEOUT_MS: "1500",
      SERVICE_NAME: "channel-test",
    });

    moduleRef = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [
        GetIntegrationStatusHandler,
        {
          provide: IntegrationHttpClient,
          useValue: new IntegrationHttpClient(cfg, createLogger({ serviceName: "channel-test" })),
        },
      ],
    }).compile();

    handler = moduleRef.get(GetIntegrationStatusHandler);
  });

  afterEach(async () => {
    await moduleRef?.close();
  });

  it("exposes the breaker state and opossum settings for a fresh dependency", async () => {
    const view = await handler.execute(new GetIntegrationStatusQuery("upstream"));
    expect(view.dependencyId).toBe("upstream");
    expect(view.breakerState).toBe("closed");
    expect(view.opossum).toEqual({
      volumeThreshold: 7,
      errorThresholdPercentage: 42,
      resetTimeoutMs: 1500,
    });
  });
});
