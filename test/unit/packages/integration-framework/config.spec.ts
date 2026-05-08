import { describe, expect, it } from "@jest/globals";
import { loadIntegrationConfig } from "../../../../packages/integration-framework/src/config.js";

describe("loadIntegrationConfig (US-009)", () => {
  it("uses safe defaults when env keys are missing", () => {
    const c = loadIntegrationConfig({});
    expect(c.serviceName).toBe("integration-client");
    expect(c.defaultTimeoutMs).toBe(5000);
    expect(c.maxAttempts).toBe(4);
    expect(c.bulkhead.maxConcurrent).toBe(20);
    expect(c.breaker.errorThresholdPercentage).toBe(50);
  });

  it("respects all overrides including float jitter and string service name", () => {
    const c = loadIntegrationConfig({
      SERVICE_NAME: "svc-x",
      INTEGRATION_TIMEOUT_MS: "1500",
      INTEGRATION_BASE_DELAY_MS: "10",
      INTEGRATION_MAX_DELAY_MS: "100",
      INTEGRATION_JITTER_RATIO: "0.5",
      INTEGRATION_MAX_ATTEMPTS: "2",
      INTEGRATION_BULKHEAD_MAX_CONCURRENT: "3",
      OPOSSUM_TIMEOUT_MS: "100",
      OPOSSUM_ERROR_THRESHOLD_PERCENTAGE: "70",
      OPOSSUM_RESET_TIMEOUT_MS: "500",
      OPOSSUM_ROLLING_COUNT_TIMEOUT_MS: "1000",
      OPOSSUM_ROLLING_COUNT_BUCKETS: "5",
      OPOSSUM_VOLUME_THRESHOLD: "2",
    });
    expect(c.serviceName).toBe("svc-x");
    expect(c.jitterRatio).toBe(0.5);
    expect(c.maxAttempts).toBe(2);
    expect(c.bulkhead.maxConcurrent).toBe(3);
    expect(c.breaker).toMatchObject({
      actionTimeoutMs: 100,
      errorThresholdPercentage: 70,
      resetTimeoutMs: 500,
      rollingCountTimeoutMs: 1000,
      rollingCountBuckets: 5,
      volumeThreshold: 2,
    });
  });

  it("treats empty-string env values as missing (uses fallback)", () => {
    const c = loadIntegrationConfig({ SERVICE_NAME: "", INTEGRATION_JITTER_RATIO: "" });
    expect(c.serviceName).toBe("integration-client");
    expect(c.jitterRatio).toBe(1);
  });

  it("throws on invalid integer env", () => {
    expect(() => loadIntegrationConfig({ INTEGRATION_TIMEOUT_MS: "not-a-number" })).toThrow(/Invalid integer/);
  });

  it("throws on invalid float env", () => {
    expect(() => loadIntegrationConfig({ INTEGRATION_JITTER_RATIO: "not-a-float" })).toThrow(/Invalid float/);
  });

  it.each([
    ["INTEGRATION_TIMEOUT_MS", "0", /INTEGRATION_TIMEOUT_MS must be > 0/],
    ["INTEGRATION_MAX_ATTEMPTS", "0", /INTEGRATION_MAX_ATTEMPTS must be >= 1/],
    ["INTEGRATION_BULKHEAD_MAX_CONCURRENT", "0", /INTEGRATION_BULKHEAD_MAX_CONCURRENT must be >= 1/],
    ["INTEGRATION_JITTER_RATIO", "1.2", /INTEGRATION_JITTER_RATIO must be in \[0,1\]/],
    ["INTEGRATION_JITTER_RATIO", "-0.1", /INTEGRATION_JITTER_RATIO must be in \[0,1\]/],
  ])("rejects invalid range for %s=%s", (key, value, re) => {
    expect(() => loadIntegrationConfig({ [key]: value })).toThrow(re);
  });
});
