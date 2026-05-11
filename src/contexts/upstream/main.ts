import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { UpstreamModule } from "./upstream.module.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    UpstreamModule,
    new FastifyAdapter(),
    { logger: ["error", "warn"] },
  );
  const port = Number(process.env.UPSTREAM_PORT ?? 3001);
  await app.listen(port, "0.0.0.0");
}

void bootstrap();
