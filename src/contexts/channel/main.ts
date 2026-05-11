import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";
import { maybeBootstrapTelemetry } from "./telemetry.js";

maybeBootstrapTelemetry();

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { logger: ["error", "warn"] },
  );

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
}

void bootstrap();
