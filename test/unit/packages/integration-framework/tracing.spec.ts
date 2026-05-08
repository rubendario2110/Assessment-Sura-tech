import { describe, expect, it } from "@jest/globals";
import {
  createTraceContext,
  parseTraceparent,
  resolveTraceparent,
  serializeTraceparent,
} from "../../../../packages/integration-framework/src/tracing.js";

describe("tracing (US-017)", () => {
  it("generates a syntactically valid traceparent", () => {
    const ctx = createTraceContext();
    const header = serializeTraceparent(ctx);
    expect(header).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
  });

  it("round-trips a parseable header", () => {
    const ctx = createTraceContext();
    const header = serializeTraceparent(ctx);
    expect(parseTraceparent(header)).toEqual(ctx);
  });

  it.each([
    ["", undefined],
    [undefined, undefined],
    ["bad-shape", undefined],
    ["00-only-three-parts-here", undefined],
    ["01-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01", undefined],
    ["00-XYZ-bbbbbbbbbbbbbbbb-01", undefined],
    ["00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbb-01", undefined],
    ["00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-zz", undefined],
  ])("rejects invalid header %p", (input, _expected) => {
    expect(parseTraceparent(input as string | undefined)).toBeNull();
  });

  it("normalises hex casing on parse", () => {
    const ctx = parseTraceparent("00-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA-BBBBBBBBBBBBBBBB-01");
    expect(ctx?.traceId).toBe("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    expect(ctx?.spanId).toBe("bbbbbbbbbbbbbbbb");
  });

  it("resolveTraceparent returns parsed ctx if valid, otherwise generates a new one", () => {
    const supplied = serializeTraceparent(createTraceContext());
    expect(serializeTraceparent(resolveTraceparent(supplied))).toBe(supplied);
    const generated = resolveTraceparent(undefined);
    expect(generated.traceId).toMatch(/^[0-9a-f]{32}$/);
  });
});
