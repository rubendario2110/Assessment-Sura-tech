import { afterEach, describe, expect, it } from "@jest/globals";
import { isApplicationVerboseLogging } from "../../../src/contexts/shared/application-verbose-log.js";

describe("isApplicationVerboseLogging", () => {
  afterEach(() => {
    delete process.env.APPLICATION_VERBOSE_LOGS;
  });

  it("is true when unset", () => {
    delete process.env.APPLICATION_VERBOSE_LOGS;
    expect(isApplicationVerboseLogging()).toBe(true);
  });

  it("is false when APPLICATION_VERBOSE_LOGS=false", () => {
    process.env.APPLICATION_VERBOSE_LOGS = "false";
    expect(isApplicationVerboseLogging()).toBe(false);
  });
});
