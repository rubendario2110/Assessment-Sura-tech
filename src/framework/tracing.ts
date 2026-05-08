/**
 * W3C traceparent propagation (subset compatible with OpenTelemetry trace context).
 */

const TRACE_VERSION = "00";
const TRACE_FLAGS_SAMPLED = "01";

export interface TraceContext {
  traceId: string;
  spanId: string;
  traceFlags: string;
}

function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function createTraceContext(): TraceContext {
  return {
    traceId: randomHex(16),
    spanId: randomHex(8),
    traceFlags: TRACE_FLAGS_SAMPLED,
  };
}

/** Parses `traceparent` header or returns null if invalid. */
export function parseTraceparent(header: string | undefined): TraceContext | null {
  if (!header) return null;
  const parts = header.split("-");
  if (parts.length !== 4) return null;
  const [version, traceId, spanId, traceFlags] = parts;
  if (version !== TRACE_VERSION) return null;
  if (!/^[0-9a-f]{32}$/i.test(traceId)) return null;
  if (!/^[0-9a-f]{16}$/i.test(spanId)) return null;
  if (!/^[0-9a-f]{2}$/i.test(traceFlags)) return null;
  return { traceId: traceId.toLowerCase(), spanId: spanId.toLowerCase(), traceFlags: traceFlags.toLowerCase() };
}

export function serializeTraceparent(ctx: TraceContext): string {
  return `${TRACE_VERSION}-${ctx.traceId}-${ctx.spanId}-${ctx.traceFlags}`;
}

export function resolveTraceparent(incoming: string | undefined): TraceContext {
  return parseTraceparent(incoming) ?? createTraceContext();
}
