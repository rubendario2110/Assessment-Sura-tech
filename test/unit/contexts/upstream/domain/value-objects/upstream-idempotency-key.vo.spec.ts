import { describe, expect, it } from "@jest/globals";
import { UpstreamIdempotencyKey } from "../../../../../../src/contexts/upstream/domain/value-objects/upstream-idempotency-key.vo.js";

describe("UpstreamIdempotencyKey (Upstream BC VO)", () => {
  it("returns undefined for missing or whitespace headers", () => {
    expect(UpstreamIdempotencyKey.fromHeader(undefined)).toBeUndefined();
    expect(UpstreamIdempotencyKey.fromHeader("")).toBeUndefined();
    expect(UpstreamIdempotencyKey.fromHeader("    ")).toBeUndefined();
  });

  it("trims and preserves user-supplied keys", () => {
    expect(UpstreamIdempotencyKey.fromHeader(" abc ")?.toString()).toBe("abc");
  });

  it("rejects keys longer than 200 chars", () => {
    expect(() => UpstreamIdempotencyKey.fromHeader("x".repeat(201))).toThrow(/too long/);
  });
});
