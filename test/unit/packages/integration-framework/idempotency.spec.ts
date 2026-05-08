import { describe, expect, it } from "@jest/globals";
import { generateIdempotencyKey } from "../../../../packages/integration-framework/src/idempotency.js";

describe("generateIdempotencyKey (US-015)", () => {
  it("produces 32-char lowercase hex strings", () => {
    const key = generateIdempotencyKey();
    expect(key).toMatch(/^[0-9a-f]{32}$/);
  });

  it("returns distinct values across consecutive calls (1k samples)", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i += 1) seen.add(generateIdempotencyKey());
    expect(seen.size).toBe(1000);
  });
});
