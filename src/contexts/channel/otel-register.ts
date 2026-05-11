/**
 * Load `.env` / `.env.local` **before** OpenTelemetry so `OTEL_*` match `ConfigModule` (`channel.module.ts`)
 * but are visible when the SDK starts (Nest loads env files later).
 */
import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";

const root = process.cwd();
loadDotenv({ path: resolve(root, ".env") });
loadDotenv({ path: resolve(root, ".env.local"), override: true });

import { startChannelOpenTelemetry } from "./otel-bootstrap.js";

startChannelOpenTelemetry();
