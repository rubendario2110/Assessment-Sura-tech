/** Build W3C traceparent (version 00, sampled flag 01). */
export function formatTraceparent(traceId: string, spanId: string): string {
  const tid = traceId.padStart(32, "0").slice(0, 32);
  const sid = spanId.padStart(16, "0").slice(0, 16);
  return `00-${tid}-${sid}-01`;
}

export function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function createOutboundTraceContext(): { traceId: string; spanId: string; traceparent: string } {
  const traceId = randomHex(16);
  const spanId = randomHex(8);
  return {
    traceId,
    spanId,
    traceparent: formatTraceparent(traceId, spanId),
  };
}
