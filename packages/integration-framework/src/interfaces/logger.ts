export type LogOutcome = "success" | "error" | "retry";

export interface StructuredLogEntry {
  level: "info" | "warn" | "error";
  timestamp?: string;
  service: string;
  traceId?: string;
  spanId?: string;
  dependency: string;
  attempt: number;
  outcome: LogOutcome;
  latencyMs: number;
  message?: string;
  breakerState?: string;
  statusCode?: number;
}

export interface StructuredLogger {
  log(entry: StructuredLogEntry): void;
}
