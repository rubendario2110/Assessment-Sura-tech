import { describe, expect, it } from "@jest/globals";
import { CircuitOpenError, TimeoutError, UpstreamError, isFrameworkError } from "./errors.js";

describe("typed errors (US-010)", () => {
  it("identifies framework errors", () => {
    expect(isFrameworkError(new TimeoutError("t"))).toBe(true);
    expect(isFrameworkError(new CircuitOpenError("c"))).toBe(true);
    expect(isFrameworkError(new UpstreamError("u", { httpStatus: 503 }))).toBe(true);
    expect(isFrameworkError(new Error("x"))).toBe(false);
  });
});
