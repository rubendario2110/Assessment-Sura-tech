import { afterEach, describe, expect, it, jest } from "@jest/globals";
import {
  nestLoggerLevels,
  registerHttpAccessLog,
} from "../../../src/contexts/shared/demo-bootstrap.js";

describe("demo-bootstrap", () => {
  afterEach(() => {
    delete process.env.NEST_LOG_LEVELS;
    delete process.env.HTTP_ACCESS_LOG;
  });

  it("nestLoggerLevels defaults to error,warn,log", () => {
    delete process.env.NEST_LOG_LEVELS;
    expect(nestLoggerLevels()).toEqual(["error", "warn", "log"]);
  });

  it("nestLoggerLevels parses NEST_LOG_LEVELS", () => {
    process.env.NEST_LOG_LEVELS = "warn, error , log";
    expect(nestLoggerLevels()).toEqual(["warn", "error", "log"]);
  });

  it("nestLoggerLevels ignores unknown tokens", () => {
    process.env.NEST_LOG_LEVELS = "log,silly,verbose";
    expect(nestLoggerLevels()).toEqual(["log", "verbose"]);
  });

  it("nestLoggerLevels falls back when every token is invalid", () => {
    process.env.NEST_LOG_LEVELS = "silly,invalid";
    expect(nestLoggerLevels()).toEqual(["error", "warn", "log"]);
  });

  it("registerHttpAccessLog no-ops when HTTP_ACCESS_LOG=false", async () => {
    process.env.HTTP_ACCESS_LOG = "false";
    const addHook = jest.fn();
    const app = {
      getHttpAdapter: () => ({
        getInstance: () => ({ addHook }),
      }),
    };
    registerHttpAccessLog(app as never);
    expect(addHook).not.toHaveBeenCalled();
  });

  it("registerHttpAccessLog registers hook by default", async () => {
    const addHook = jest.fn();
    const app = {
      getHttpAdapter: () => ({
        getInstance: () => ({ addHook }),
      }),
    };
    registerHttpAccessLog(app as never);
    expect(addHook).toHaveBeenCalledWith("onResponse", expect.any(Function));
  });
});
