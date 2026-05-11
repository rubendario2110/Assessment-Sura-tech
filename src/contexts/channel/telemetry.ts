/**
 * Re-export for callers that cannot use `otel-register` import order.
 * Channel **`main.ts`** must still load `./otel-register.js` first so instrumentation hooks apply.
 */
export { startChannelOpenTelemetry as maybeBootstrapTelemetry } from "./otel-bootstrap.js";
export { shutdownChannelOpenTelemetry } from "./otel-bootstrap.js";
