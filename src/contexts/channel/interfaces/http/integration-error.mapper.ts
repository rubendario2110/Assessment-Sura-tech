import { HttpException, HttpStatus } from "@nestjs/common";
import {
  CircuitOpenError,
  TimeoutError,
  UpstreamError,
} from "@assessment/integration-framework";

export function mapIntegrationErrorToHttp(e: unknown): HttpException {
  if (e instanceof CircuitOpenError) {
    return new HttpException(
      { error: "circuit_open", message: e.message },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
  if (e instanceof TimeoutError) {
    return new HttpException({ error: "timeout", message: e.message }, HttpStatus.GATEWAY_TIMEOUT);
  }
  if (e instanceof UpstreamError) {
    return new HttpException(
      {
        error: "upstream_error",
        status: e.status,
        body: e.body,
      },
      HttpStatus.BAD_GATEWAY,
    );
  }
  const msg = e instanceof Error ? e.message : String(e);
  return new HttpException({ error: "internal_error", message: msg }, HttpStatus.INTERNAL_SERVER_ERROR);
}
