import CircuitBreaker from "opossum";
import { computeBackoffMs } from "./backoff.js";
import { CircuitOpenError, TimeoutError, UpstreamError, ValidationError } from "../domain/errors.js";
import { createOutboundTraceContext, formatTraceparent } from "../domain/trace-context.js";
import type { IntegrationEnvConfig } from "../interfaces/config.js";
import type { OutboundHttpRequest } from "../interfaces/http-request.js";
import type { StructuredLogger } from "../interfaces/logger.js";
import { Bulkhead } from "../infrastructure/bulkhead.js";
import { fetchWithTimeout } from "../infrastructure/fetch-with-timeout.js";

export interface ResilientHttpClientOptions {
  baseUrl: string;
  dependencyName: string;
  serviceName: string;
  config: IntegrationEnvConfig;
  logger: StructuredLogger;
  /** Injected for deterministic tests (defaults to `Math.random`). */
  random?: () => number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const rel = path.startsWith("/") ? path.slice(1) : path;
  return new URL(rel, base).href;
}

function buildHeaders(req: OutboundHttpRequest, ctx: { traceId: string; spanId: string }): Headers {
  const h = new Headers(req.headers);
  h.set("traceparent", formatTraceparent(ctx.traceId, ctx.spanId));
  if (req.body !== undefined && !h.has("Content-Type")) {
    h.set("Content-Type", "application/json");
  }
  return h;
}

function isRetryable(e: unknown): boolean {
  if (e instanceof CircuitOpenError) return false;
  if (e instanceof ValidationError) return false;
  if (e instanceof TimeoutError) return true;
  if (e instanceof UpstreamError) return e.status >= 500;
  return e instanceof Error;
}

function normalizeError(e: unknown): Error {
  if (
    e instanceof TimeoutError ||
    e instanceof UpstreamError ||
    e instanceof CircuitOpenError ||
    e instanceof ValidationError
  ) {
    return e;
  }
  if (e instanceof Error) return e;
  return new Error(String(e));
}

type FirePayload = { url: string; init: RequestInit; timeoutMs: number };

export class ResilientHttpClient {
  private readonly bulkhead: Bulkhead;
  private readonly breaker: CircuitBreaker<[FirePayload], Response>;

  constructor(private readonly opts: ResilientHttpClientOptions) {
    this.bulkhead = new Bulkhead(opts.config.bulkheadMaxConcurrent);
    this.breaker = new CircuitBreaker<[FirePayload], Response>(
      async (payload: FirePayload) => {
        const response = await fetchWithTimeout(
          payload.url,
          payload.init,
          payload.timeoutMs,
          opts.dependencyName,
        );
        if (!response.ok) {
          const body = await response.text();
          throw new UpstreamError(`Upstream HTTP ${response.status}`, response.status, body);
        }
        return response;
      },
      {
        errorThresholdPercentage: opts.config.breakerErrorThresholdPercentage,
        resetTimeout: opts.config.breakerResetTimeoutMs,
        volumeThreshold: opts.config.breakerVolumeThreshold,
      },
    );
    this.attachBreakerListeners();
  }

  private attachBreakerListeners(): void {
    const log = this.opts.logger;
    const base = (): Pick<
      Parameters<StructuredLogger["log"]>[0],
      "service" | "dependency" | "attempt" | "latencyMs"
    > => ({
      service: this.opts.serviceName,
      dependency: this.opts.dependencyName,
      attempt: 0,
      latencyMs: 0,
    });

    this.breaker.on("open", () => {
      log.log({
        ...base(),
        level: "warn",
        outcome: "error",
        message: "breaker_open",
        breakerState: "open",
      });
    });
    this.breaker.on("halfOpen", () => {
      log.log({
        ...base(),
        level: "info",
        outcome: "success",
        message: "breaker_half_open",
        breakerState: "halfOpen",
      });
    });
    this.breaker.on("close", () => {
      log.log({
        ...base(),
        level: "info",
        outcome: "success",
        message: "breaker_closed",
        breakerState: "closed",
      });
    });
  }

  async execute(req: OutboundHttpRequest): Promise<Response> {
    const ctx = req.traceContext ?? createOutboundTraceContext();
    const url = joinUrl(this.opts.baseUrl, req.path);
    const headers = buildHeaders(req, ctx);
    const init: RequestInit = { method: req.method, headers };
    if (req.body !== undefined) {
      init.body = JSON.stringify(req.body);
    }
    const payload: FirePayload = {
      url,
      init,
      timeoutMs: this.opts.config.httpTimeoutMs,
    };

    const random = this.opts.random ?? Math.random;
    const maxAttempts = this.opts.config.retryMaxAttempts;
    let attempt = 0;

    while (true) {
      attempt++;
      const started = Date.now();
      try {
        const response = await this.bulkhead.run(() => this.breaker.fire(payload));
        const latencyMs = Date.now() - started;
        this.opts.logger.log({
          level: "info",
          service: this.opts.serviceName,
          dependency: this.opts.dependencyName,
          traceId: ctx.traceId,
          spanId: ctx.spanId,
          attempt,
          outcome: "success",
          latencyMs,
          statusCode: response.status,
        });
        return response;
      } catch (e) {
        const latencyMs = Date.now() - started;

        if (this.breaker.opened) {
          this.opts.logger.log({
            level: "warn",
            service: this.opts.serviceName,
            dependency: this.opts.dependencyName,
            traceId: ctx.traceId,
            spanId: ctx.spanId,
            attempt,
            outcome: "error",
            latencyMs,
            message: "circuit_open",
            breakerState: "open",
          });
          throw new CircuitOpenError(`Circuit breaker is open for "${this.opts.dependencyName}"`);
        }

        if (!isRetryable(e) || attempt >= maxAttempts) {
          this.opts.logger.log({
            level: "error",
            service: this.opts.serviceName,
            dependency: this.opts.dependencyName,
            traceId: ctx.traceId,
            spanId: ctx.spanId,
            attempt,
            outcome: "error",
            latencyMs,
            message: e instanceof Error ? e.message : String(e),
            statusCode: e instanceof UpstreamError ? e.status : undefined,
          });
          throw normalizeError(e);
        }

        this.opts.logger.log({
          level: "info",
          service: this.opts.serviceName,
          dependency: this.opts.dependencyName,
          traceId: ctx.traceId,
          spanId: ctx.spanId,
          attempt,
          outcome: "retry",
          latencyMs,
          message: "retry_scheduled",
        });

        const backoff = computeBackoffMs(
          attempt - 1,
          this.opts.config.retryBaseMs,
          this.opts.config.retryMaxMs,
          this.opts.config.retryJitterRatio,
          random,
        );
        await sleep(backoff);
      }
    }
  }
}
