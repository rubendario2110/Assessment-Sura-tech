import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { NodeSDK } from "@opentelemetry/sdk-node";

/** Starts OTLP export when standard OTEL env vars are present (demo / Compose). */
export function maybeBootstrapTelemetry(): void {
  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT && !process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT) {
    return;
  }
  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter(),
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": { enabled: false },
      }),
    ],
  });
  sdk.start();
}
