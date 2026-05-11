import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { createJsonLogger } from "@assessment/integration-framework";

describe("createJsonLogger", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("writes info to console.log", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const logger = createJsonLogger("svc");
    logger.log({
      level: "info",
      service: "svc",
      dependency: "d",
      attempt: 1,
      outcome: "success",
      latencyMs: 1,
    });
    expect(logSpy).toHaveBeenCalled();
    expect(JSON.parse(logSpy.mock.calls[0][0] as string).level).toBe("info");
  });

  it("writes warn to console.warn", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const logger = createJsonLogger("svc");
    logger.log({
      level: "warn",
      service: "svc",
      dependency: "d",
      attempt: 0,
      outcome: "error",
      latencyMs: 0,
      message: "breaker_open",
      breakerState: "open",
    });
    expect(warnSpy).toHaveBeenCalled();
  });

  it("writes error to console.error", () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const logger = createJsonLogger("svc");
    logger.log({
      level: "error",
      service: "svc",
      dependency: "d",
      attempt: 1,
      outcome: "error",
      latencyMs: 2,
      message: "boom",
    });
    expect(errSpy).toHaveBeenCalled();
  });
});
