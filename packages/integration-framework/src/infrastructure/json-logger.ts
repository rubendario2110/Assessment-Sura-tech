import type { StructuredLogger, StructuredLogEntry } from "../interfaces/logger.js";

export function createJsonLogger(defaultService: string): StructuredLogger {
  return {
    log(entry: StructuredLogEntry): void {
      const line = JSON.stringify({
        timestamp: entry.timestamp ?? new Date().toISOString(),
        level: entry.level,
        service: entry.service ?? defaultService,
        traceId: entry.traceId,
        spanId: entry.spanId,
        dependency: entry.dependency,
        attempt: entry.attempt,
        outcome: entry.outcome,
        latencyMs: entry.latencyMs,
        message: entry.message,
        breakerState: entry.breakerState,
        statusCode: entry.statusCode,
      });
      if (entry.level === "error") console.error(line);
      else if (entry.level === "warn") console.warn(line);
      else console.log(line);
    },
  };
}
