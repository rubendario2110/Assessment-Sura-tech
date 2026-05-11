import { describe, expect, it, jest } from "@jest/globals";
import {
  createOutboundTraceContext,
  formatTraceparent,
  randomHex,
} from "@assessment/integration-framework";

describe("trace-context", () => {
  it("formatTraceparent pads ids", () => {
    expect(formatTraceparent("abc", "def")).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
  });

  it("randomHex returns fixed length", () => {
    expect(randomHex(4)).toHaveLength(8);
  });

  it("createOutboundTraceContext returns traceparent", () => {
    const ctx = createOutboundTraceContext();
    expect(ctx.traceId).toHaveLength(32);
    expect(ctx.spanId).toHaveLength(16);
    expect(ctx.traceparent).toContain(ctx.traceId);
  });

  it("randomHex uses crypto.getRandomValues", () => {
    const spy = jest.spyOn(crypto, "getRandomValues").mockImplementation((arr: ArrayBufferView) => {
      (arr as Uint8Array).fill(1);
      return arr;
    });
    expect(randomHex(2)).toBe("0101");
    spy.mockRestore();
  });
});
