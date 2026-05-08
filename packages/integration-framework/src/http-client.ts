import { Injectable } from "@nestjs/common";
import CircuitBreaker from "opossum";
import type { IntegrationConfig, OpossumBreakerConfig } from "./config.js";
import { Bulkhead } from "./bulkhead.js";
import { createOpossumBreaker, mapOpossumState } from "./circuit-breaker.js";
import { CircuitOpenError, TimeoutError, UpstreamError, type FrameworkError } from "./errors.js";
import type { Logger } from "./logger.js";
import { executeWithRetry } from "./retry.js";
import type { TraceContext } from "./tracing.js";
import { serializeTraceparent } from "./tracing.js";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface HttpRequest {
  dependencyId: string;
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  idempotencyKey?: string;
  traceContext?: TraceContext;
}

export interface HttpResult {
  status: number;
  headers: Record<string, string>;
  bodyText: string;
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}

function isOpenBreakerError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "EOPENBREAKER";
}

const RETRYABLE_HTTP_STATUS = new Set([408, 429, 502, 503, 504]);

/** Pure retry policy used by {@link IntegrationHttpClient}. Exported for direct testing. */
export function shouldRetryError(err: unknown): boolean {
  if (err instanceof TimeoutError) return true;
  if (err instanceof UpstreamError) {
    return err.httpStatus !== undefined && RETRYABLE_HTTP_STATUS.has(err.httpStatus);
  }
  if (err instanceof TypeError) return true;
  return false;
}

/** Pure error normalisation used by {@link IntegrationHttpClient}. Exported for direct testing. */
export function normalizeBreakerError(err: unknown): Error | FrameworkError {
  if (isOpenBreakerError(err)) {
    return new CircuitOpenError("Circuit breaker rejected call while open", { cause: err });
  }
  return err instanceof Error ? err : new Error(String(err));
}

/**
 * Reusable HTTP integration client (US-018): bulkhead → opossum circuit breaker → retry+jitter → fetch+timeout.
 */
@Injectable()
export class IntegrationHttpClient {
  private readonly bulkheads = new Map<string, Bulkhead>();
  private readonly breakers = new Map<string, CircuitBreaker>();

  constructor(
    private readonly cfg: IntegrationConfig,
    private readonly logger: Logger,
  ) {}

  getBreakerState(dependencyId: string): "closed" | "open" | "half_open" {
    const b = this.breakers.get(dependencyId);
    return b ? mapOpossumState(b) : "closed";
  }

  /** Exposes opossum raw `{ volumeThreshold, errorThresholdPercentage, resetTimeout }` for observability. */
  getOpossumSettings(): Pick<OpossumBreakerConfig, "volumeThreshold" | "errorThresholdPercentage" | "resetTimeoutMs"> {
    return {
      volumeThreshold: this.cfg.breaker.volumeThreshold,
      errorThresholdPercentage: this.cfg.breaker.errorThresholdPercentage,
      resetTimeoutMs: this.cfg.breaker.resetTimeoutMs,
    };
  }

  private getBulkhead(id: string): Bulkhead {
    let b = this.bulkheads.get(id);
    if (!b) {
      b = new Bulkhead(this.cfg.bulkhead.maxConcurrent);
      this.bulkheads.set(id, b);
    }
    return b;
  }

  private getBreaker(id: string): CircuitBreaker {
    let b = this.breakers.get(id);
    if (!b) {
      b = createOpossumBreaker(id, this.cfg.breaker, {
        onStateLog: (f) => {
          this.logger.log("info", "circuit_breaker", {
            service: this.cfg.serviceName,
            dependency: f.dependencyId,
            breakerEvent: f.event,
            breakerState: f.state,
            outcome: f.event === "failure" ? "error" : "success",
          });
        },
      });
      this.breakers.set(id, b);
    }
    return b;
  }

  async execute(req: HttpRequest): Promise<HttpResult> {
    const dep = req.dependencyId;
    const bulk = this.getBulkhead(dep);
    const breaker = this.getBreaker(dep);
    const traceparent = req.traceContext ? serializeTraceparent(req.traceContext) : undefined;

    try {
      const result = await bulk.execute(async () =>
        breaker.fire(
          async (): Promise<HttpResult> =>
            executeWithRetry<HttpResult>(
              async (attempt) => this.performFetch(req, attempt, traceparent),
              this.cfg,
              shouldRetryError,
            ),
        ),
      );
      return result as HttpResult;
    } catch (err) {
      throw normalizeBreakerError(err);
    }
  }

  private async performFetch(req: HttpRequest, attempt: number, traceparent?: string): Promise<HttpResult> {
    const headers: Record<string, string> = { ...req.headers };
    if (traceparent) headers.traceparent = traceparent;
    if (req.idempotencyKey) headers["idempotency-key"] = req.idempotencyKey;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.cfg.defaultTimeoutMs);
    const started = Date.now();

    try {
      const res = await fetch(req.url, {
        method: req.method,
        headers,
        body: req.body !== undefined ? JSON.stringify(req.body) : undefined,
        signal: controller.signal,
      });

      const latencyMs = Date.now() - started;
      const bodyText = await res.text();

      this.logger.log(res.ok ? "info" : "warn", "upstream_http", {
        service: this.cfg.serviceName,
        dependency: req.dependencyId,
        traceId: req.traceContext?.traceId,
        attempt,
        outcome: res.ok ? "success" : "error",
        latencyMs,
        httpStatus: res.status,
      });

      if (!res.ok) {
        throw new UpstreamError(`Upstream HTTP ${res.status}`, {
          httpStatus: res.status,
          cause: bodyText.slice(0, 500),
        });
      }

      return {
        status: res.status,
        headers: Object.fromEntries(res.headers.entries()),
        bodyText,
      };
    } catch (err) {
      if (isAbortError(err)) {
        this.logger.log("warn", "upstream_timeout", {
          service: this.cfg.serviceName,
          dependency: req.dependencyId,
          traceId: req.traceContext?.traceId,
          attempt,
          outcome: "timeout",
          latencyMs: Date.now() - started,
        });
        throw new TimeoutError(`Request timed out after ${this.cfg.defaultTimeoutMs}ms`, { cause: err });
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}
