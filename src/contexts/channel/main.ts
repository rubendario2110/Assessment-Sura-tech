import "./otel-register.js";
import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { nestLoggerLevels, registerHttpAccessLog } from "../shared/demo-bootstrap.js";
import { AppModule } from "./app.module.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { logger: nestLoggerLevels() },
  );

  registerHttpAccessLog(app);

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Assessment — Channel")
    .setDescription("Demo channel consuming upstream via @assessment/integration-framework")
    .setVersion("1.0.0")
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("/api/docs", app, document, {
    jsonDocumentUrl: "/api/openapi.json",
  });

  const port = Number(process.env.CHANNEL_PORT ?? 3000);
  await app.listen(port, "0.0.0.0");
  new Logger("Channel").log(`Listening on http://0.0.0.0:${port} · Swagger /api/docs`);
}

void bootstrap();
