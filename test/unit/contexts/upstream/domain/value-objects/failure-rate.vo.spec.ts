import { describe, expect, it } from "@jest/globals";
import { FailureRate } from "../../../../../../src/contexts/upstream/domain/value-objects/failure-rate.vo.js";

describe("FailureRate (Upstream BC VO)", () => {
  it.each([
    ["0.5", 0.5],
    [0.5, 0.5],
    [-1, 0],
    [2, 1],
    ["1.5", 1],
  ])("clamps %s -> %s", (input, expected) => {
    expect(FailureRate.fromUnknown(input).toNumber()).toBe(expected);
  });

  it("zero() returns 0", () => {
    expect(FailureRate.zero().toNumber()).toBe(0);
  });

  it.each(["nope", Number.NaN, Number.POSITIVE_INFINITY])("rejects non-finite input %p", (bad) => {
    expect(() => FailureRate.fromUnknown(bad)).toThrow(/finite number/);
  });
});
