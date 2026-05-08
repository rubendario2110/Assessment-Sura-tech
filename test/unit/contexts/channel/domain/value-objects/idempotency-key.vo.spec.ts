import { describe, expect, it } from "@jest/globals";
import { IdempotencyKey } from "../../../../../../src/contexts/channel/domain/value-objects/idempotency-key.vo.js";

describe("IdempotencyKey (Channel BC VO)", () => {
  it("generates a fresh hex key when input is missing or whitespace", () => {
    expect(IdempotencyKey.fromString(undefined).toString()).toMatch(/^[0-9a-f]{32}$/);
    expect(IdempotencyKey.fromString("   ").toString()).toMatch(/^[0-9a-f]{32}$/);
  });

  it("trims and preserves user-supplied keys within bounds", () => {
    expect(IdempotencyKey.fromString("  abc-123  ").toString()).toBe("abc-123");
  });

  it("rejects keys longer than 200 chars", () => {
    expect(() => IdempotencyKey.fromString("x".repeat(201))).toThrow(/too long/);
  });

  it("generate() yields a 32-char lowercase hex value", () => {
    expect(IdempotencyKey.generate().toString()).toMatch(/^[0-9a-f]{32}$/);
  });
});
