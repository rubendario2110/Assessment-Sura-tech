import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { FastifyInstrumentation } from "@opentelemetry/instrumentation-fastify";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";

/** Stable attribute key for the logical service name (Jaeger / backends filter on this). */
const ATTR_SERVICE_NAME = "service.name";

let sdkSingleton: NodeSDK | undefined;

function resolveOtlpHttpTracesUrl(): string | undefined {
  const traces = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT?.trim();
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim();
  const raw = traces ?? endpoint;
  if (!raw) return undefined;
  if (raw.includes("/v1/traces")) return raw;
  const base = raw.replace(/\/$/, "");
  return `${base}/v1/traces`;
}

function logOtel(message: string): void {
  console.log(`[OpenTelemetry] ${message}`);
}

/**
 * Starts OTLP export + instrumentations. Must run **before** Nest/Fastify/http load —
 * import `./otel-register.js` as the **first** line of `main.ts`.
 */
export function startChannelOpenTelemetry(): void {
  const disabled =
    process.env.OTEL_ENABLED === "false" ||
    process.env.OTEL_ENABLED === "0" ||
    process.env.OTEL_SDK_DISABLED === "true";
  if (disabled) {
    logOtel(
      `skipped — OTEL_ENABLED=${process.env.OTEL_ENABLED ?? "unset"} OTEL_SDK_DISABLED=${process.env.OTEL_SDK_DISABLED ?? "unset"}`,
    );
    return;
  }

  const tracesUrl = resolveOtlpHttpTracesUrl();
  if (!tracesUrl) {
    logOtel(
      "skipped — set OTEL_EXPORTER_OTLP_ENDPOINT or OTEL_EXPORTER_OTLP_TRACES_ENDPOINT (HTTP traces URL)",
    );
    return;
  }

  const serviceName =
    process.env.OTEL_SERVICE_NAME?.trim() ||
    process.env.SERVICE_NAME?.trim() ||
    "channel";

  const traceExporter = new OTLPTraceExporter({ url: tracesUrl });

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
    }),
    traceExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": { enabled: false },
      }),
      new FastifyInstrumentation(),
    ],
  });

  sdk.start();
  sdkSingleton = sdk;

  const shutdown = (): void => {
    void sdk.shutdown().catch(() => {});
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);

  logOtel(`NodeSDK started service=${serviceName} export=${tracesUrl}`);
}

/** Test hook / graceful extensions */
export async function shutdownChannelOpenTelemetry(): Promise<void> {
  if (sdkSingleton) {
    await sdkSingleton.shutdown();
    sdkSingleton = undefined;
  }
}
