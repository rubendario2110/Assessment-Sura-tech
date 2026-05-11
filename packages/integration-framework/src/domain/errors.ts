export class TimeoutError extends Error {
  readonly code = "TIMEOUT" as const;
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "TimeoutError";
  }
}

export class CircuitOpenError extends Error {
  readonly code = "CIRCUIT_OPEN" as const;
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "CircuitOpenError";
  }
}

export class UpstreamError extends Error {
  readonly code = "UPSTREAM" as const;
  readonly status: number;
  readonly body?: string;
  constructor(message: string, status: number, body?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "UpstreamError";
    this.status = status;
    this.body = body;
  }
}

export class ValidationError extends Error {
  readonly code = "VALIDATION" as const;
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ValidationError";
  }
}
