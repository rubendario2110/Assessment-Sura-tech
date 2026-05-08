import { describe, expect, it } from "@jest/globals";
import { ChannelTraceContext } from "../../../../../../src/contexts/channel/domain/value-objects/trace-context.vo.js";

describe("ChannelTraceContext (Channel BC VO)", () => {
  it("synthesises a valid trace when no header is provided", () => {
    const ctx = ChannelTraceContext.fromHeader(undefined);
    expect(ctx.toString()).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
    expect(ctx.traceId).toMatch(/^[0-9a-f]{32}$/);
  });

  it("preserves the inbound traceparent header when valid", () => {
    const incoming = "00-" + "a".repeat(32) + "-" + "b".repeat(16) + "-01";
    const ctx = ChannelTraceContext.fromHeader(incoming);
    expect(ctx.toString()).toBe(incoming);
    expect(ctx.toFrameworkContext().traceId).toBe("a".repeat(32));
  });
});
