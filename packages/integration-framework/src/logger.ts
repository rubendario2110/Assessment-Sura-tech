import type { IntegrationConfig } from "./config.js";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogFields {
  dependency?: string;
  traceId?: string;
  spanId?: string;
  attempt?: number;
  outcome?: "success" | "retry" | "timeout" | "circuit_open" | "error" | "bulkhead_reject";
  latencyMs?: number;
  breakerState?: "closed" | "open" | "half_open";
  breakerEvent?: string;
  message?: string;
  [key: string]: unknown;
}

export interface Logger {
  log(level: LogLevel, msg: string, fields: LogFields): void;
}

export function createLogger(cfg: Pick<IntegrationConfig, "serviceName">): Logger {
  const service = cfg.serviceName;
  return {
    log(level: LogLevel, msg: string, fields: LogFields): void {
      const line = JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        service,
        message: msg,
        ...fields,
      });
      console.log(line);
    },
  };
}
