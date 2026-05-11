import { describe, expect, it } from "@jest/globals";
import { Bulkhead, ValidationError } from "@assessment/integration-framework";

describe("Bulkhead", () => {
  it("rejects invalid maxConcurrent", () => {
    expect(() => new Bulkhead(0)).toThrow(ValidationError);
    expect(() => new Bulkhead(Number.NaN)).toThrow(ValidationError);
  });

  it("serializes when maxConcurrent is 1", async () => {
    const b = new Bulkhead(1);
    const order: number[] = [];
    await Promise.all([
      b.run(async () => {
        order.push(1);
        await new Promise((r) => setTimeout(r, 20));
      }),
      b.run(async () => {
        order.push(2);
      }),
    ]);
    expect(order[0]).toBe(1);
    expect(order[1]).toBe(2);
  });
});
