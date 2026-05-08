import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { createLogger } from "../../../../packages/integration-framework/src/logger.js";

describe("createLogger (US-016)", () => {
  let logSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("emits valid JSON with the mandatory fields", () => {
    const logger = createLogger({ serviceName: "svc" });
    logger.log("info", "ping", { dependency: "dep", attempt: 2, outcome: "success", latencyMs: 12 });
    expect(logSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(logSpy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(payload).toMatchObject({
      level: "info",
      service: "svc",
      message: "ping",
      dependency: "dep",
      attempt: 2,
      outcome: "success",
      latencyMs: 12,
    });
    expect(typeof payload.timestamp).toBe("string");
  });

  it("merges arbitrary extra fields", () => {
    createLogger({ serviceName: "svc" }).log("warn", "x", { customField: "v" });
    const payload = JSON.parse(logSpy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(payload.customField).toBe("v");
    expect(payload.level).toBe("warn");
  });
});
