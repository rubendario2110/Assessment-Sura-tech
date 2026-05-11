/** Side-effect only: loads OpenTelemetry **before** any Nest/Fastify/http imports in `main.ts`. */
import { startChannelOpenTelemetry } from "./otel-bootstrap.js";

startChannelOpenTelemetry();
