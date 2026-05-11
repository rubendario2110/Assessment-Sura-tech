import type { LogLevel } from "@nestjs/common";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";

/** Mirrors Nest `LOG_LEVELS` — used to validate `NEST_LOG_LEVELS`. */
const VALID_LEVELS: LogLevel[] = ["verbose", "debug", "log", "warn", "error", "fatal"];

/** Nest logger levels; default includes `log` so bootstrap and NestLogger output are visible. */
export function nestLoggerLevels(): LogLevel[] {
  const raw = process.env.NEST_LOG_LEVELS ?? "error,warn,log";
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const picked = parts.filter((p): p is LogLevel =>
    VALID_LEVELS.includes(p as LogLevel),
  );
  return picked.length > 0 ? picked : (["error", "warn", "log"] as LogLevel[]);
}

/** One-line access log per request (stdout). Disable with `HTTP_ACCESS_LOG=false`. */
export function registerHttpAccessLog(app: NestFastifyApplication): void {
  if (process.env.HTTP_ACCESS_LOG === "false") return;
  const fastify = app.getHttpAdapter().getInstance();
  fastify.addHook("onResponse", async (request, reply) => {
    console.log(`[http] ${request.method} ${request.url} ${reply.statusCode}`);
  });
}
