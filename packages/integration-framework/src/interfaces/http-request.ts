export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface OutboundHttpRequest {
  method: HttpMethod;
  /** Path relative to client baseUrl (may start with `/`). */
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  traceContext?: { traceId: string; spanId: string };
}
