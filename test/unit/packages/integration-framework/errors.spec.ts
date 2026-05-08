import { describe, expect, it } from "@jest/globals";
import {
  BulkheadFullError,
  CircuitOpenError,
  FrameworkError,
  TimeoutError,
  UpstreamError,
  ValidationError,
  isFrameworkError,
} from "../../../../packages/integration-framework/src/errors.js";

describe("typed errors (US-010)", () => {
  it("identifies framework errors and ignores plain errors", () => {
    expect(isFrameworkError(new TimeoutError("t"))).toBe(true);
    expect(isFrameworkError(new CircuitOpenError("c"))).toBe(true);
    expect(isFrameworkError(new UpstreamError("u", { httpStatus: 503 }))).toBe(true);
    expect(isFrameworkError(new ValidationError("v"))).toBe(true);
    expect(isFrameworkError(new BulkheadFullError("b"))).toBe(true);
    expect(isFrameworkError(new Error("x"))).toBe(false);
    expect(isFrameworkError(null)).toBe(false);
  });

  it("preserves cause and httpStatus when provided", () => {
    const cause = new Error("root");
    const err = new UpstreamError("boom", { cause, httpStatus: 502 });
    expect(err.cause).toBe(cause);
    expect(err.httpStatus).toBe(502);
    expect(err.name).toBe("UpstreamError");
  });

  it("defaults cause/httpStatus to undefined when not provided", () => {
    const err = new TimeoutError("late");
    expect(err.cause).toBeUndefined();
    expect(err.httpStatus).toBeUndefined();
  });

  it("exposes a stable union of error codes via FrameworkError subclasses", () => {
    const all: FrameworkError[] = [
      new TimeoutError("t"),
      new CircuitOpenError("c"),
      new UpstreamError("u"),
      new ValidationError("v"),
      new BulkheadFullError("b"),
    ];
    expect(all.map((e) => e.code)).toEqual([
      "TIMEOUT",
      "CIRCUIT_OPEN",
      "UPSTREAM",
      "VALIDATION",
      "BULKHEAD_FULL",
    ]);
  });
});
