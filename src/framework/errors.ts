/**
 * Typed error surface for callers (US-010).
 */

export type FrameworkErrorCode =
  | "TIMEOUT"
  | "CIRCUIT_OPEN"
  | "UPSTREAM"
  | "VALIDATION"
  | "BULKHEAD_FULL";

export abstract class FrameworkError extends Error {
  abstract readonly code: FrameworkErrorCode;
  readonly cause?: unknown;
  readonly httpStatus?: number;

  constructor(message: string, options?: { cause?: unknown; httpStatus?: number }) {
    super(message);
    this.name = new.target.name;
    this.cause = options?.cause;
    this.httpStatus = options?.httpStatus;
  }
}

export class TimeoutError extends FrameworkError {
  readonly code = "TIMEOUT" as const;
}

export class CircuitOpenError extends FrameworkError {
  readonly code = "CIRCUIT_OPEN" as const;
}

export class UpstreamError extends FrameworkError {
  readonly code = "UPSTREAM" as const;
}

export class ValidationError extends FrameworkError {
  readonly code = "VALIDATION" as const;
}

export class BulkheadFullError extends FrameworkError {
  readonly code = "BULKHEAD_FULL" as const;
}

export function isFrameworkError(err: unknown): err is FrameworkError {
  return err instanceof FrameworkError;
}
