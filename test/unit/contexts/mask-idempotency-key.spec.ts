import { describe, expect, it } from "@jest/globals";
import { maskIdempotencyKey } from "../../../src/contexts/shared/mask-idempotency-key.js";

describe("maskIdempotencyKey", () => {
  it("returns short keys unchanged", () => {
    expect(maskIdempotencyKey("abc")).toBe("abc");
    expect(maskIdempotencyKey("123456789012")).toBe("123456789012");
  });

  it("masks long keys", () => {
    expect(maskIdempotencyKey("12345678901234567890")).toBe("12345678…7890");
  });
});
