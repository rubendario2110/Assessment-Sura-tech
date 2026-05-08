export interface InvokeUpstreamResult {
  ok: boolean;
  upstreamStatus: number;
  breakerState: "closed" | "open" | "half_open";
  idempotencyKey: string;
  traceId: string;
  upstream: Record<string, unknown>;
}
