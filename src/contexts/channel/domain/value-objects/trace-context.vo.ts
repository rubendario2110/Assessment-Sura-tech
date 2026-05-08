import { resolveTraceparent, serializeTraceparent, type TraceContext } from "../../../../framework/index.js";

/**
 * Wraps W3C trace context as a value-object so handlers stay framework-agnostic.
 */
export class ChannelTraceContext {
  private constructor(private readonly raw: TraceContext) {}

  static fromHeader(header: string | undefined): ChannelTraceContext {
    return new ChannelTraceContext(resolveTraceparent(header));
  }

  toFrameworkContext(): TraceContext {
    return this.raw;
  }

  toString(): string {
    return serializeTraceparent(this.raw);
  }

  get traceId(): string {
    return this.raw.traceId;
  }
}
