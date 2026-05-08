import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { UpstreamModule } from "./upstream.module.js";

async function bootstrap(): Promise<void> {
  process.env.SERVICE_NAME ??= "upstream";

  const app = await NestFactory.create<NestFastifyApplication>(UpstreamModule, new FastifyAdapter(), {
    logger: false,
  });
  app.setGlobalPrefix("upstream");

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Upstream simulator API (CQRS)")
    .setDescription("Flaky dependency exposed via CQRS handlers; in-memory idempotency store.")
    .setVersion("1.0.0")
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api-docs", app, document);

  const port = Number(process.env.UPSTREAM_PORT ?? 3001);
  await app.listen(port, "0.0.0.0");
  console.log(JSON.stringify({ message: "upstream_listening", port, swaggerUiPath: "/upstream/api-docs" }));
}

void bootstrap();
