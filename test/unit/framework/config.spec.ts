import { describe, expect, it } from "@jest/globals";
import { ValidationError, loadIntegrationConfig } from "@assessment/integration-framework";

describe("loadIntegrationConfig", () => {
  it("applies defaults", () => {
    const c = loadIntegrationConfig({});
    expect(c.httpTimeoutMs).toBe(5_000);
    expect(c.retryMaxAttempts).toBe(3);
    expect(c.bulkheadMaxConcurrent).toBe(8);
  });

  it("reads overrides", () => {
    const c = loadIntegrationConfig({
      IF_HTTP_TIMEOUT_MS: "1200",
      IF_RETRY_MAX_ATTEMPTS: "5",
    });
    expect(c.httpTimeoutMs).toBe(1200);
    expect(c.retryMaxAttempts).toBe(5);
  });

  it("clamps retry attempts and jitter bounds", () => {
    const c = loadIntegrationConfig({
      IF_RETRY_MAX_ATTEMPTS: "0",
      IF_RETRY_JITTER_RATIO: "5",
    });
    expect(c.retryMaxAttempts).toBe(1);
    expect(c.retryJitterRatio).toBe(1);
  });

  it("rejects invalid integers", () => {
    expect(() => loadIntegrationConfig({ IF_HTTP_TIMEOUT_MS: "x" })).toThrow(ValidationError);
  });

  it("rejects invalid floats", () => {
    expect(() => loadIntegrationConfig({ IF_RETRY_JITTER_RATIO: "nan" })).toThrow(ValidationError);
  });
});
