import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { nestLoggerLevels, registerHttpAccessLog } from "../shared/demo-bootstrap.js";
import { UpstreamModule } from "./upstream.module.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    UpstreamModule,
    new FastifyAdapter(),
    { logger: nestLoggerLevels() },
  );

  registerHttpAccessLog(app);

  const port = Number(process.env.UPSTREAM_PORT ?? 3001);
  await app.listen(port, "0.0.0.0");
  new Logger("Upstream").log(`Listening on http://0.0.0.0:${port} · flaky /resource`);
}

void bootstrap();
