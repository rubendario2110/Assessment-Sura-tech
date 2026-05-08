import { describe, expect, it } from "@jest/globals";
import { loadIntegrationConfig } from "./config.js";

describe("loadIntegrationConfig (US-009)", () => {
  it("uses safe defaults when env keys are missing", () => {
    const c = loadIntegrationConfig({});
    expect(c.serviceName).toBe("integration-client");
    expect(c.defaultTimeoutMs).toBe(5000);
    expect(c.breaker.volumeThreshold).toBeGreaterThanOrEqual(0);
  });

  it("throws on invalid numeric env", () => {
    expect(() => loadIntegrationConfig({ INTEGRATION_TIMEOUT_MS: "not-a-number" })).toThrow(/Invalid integer/);
  });
});
