import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ChannelModule } from "./channel.module.js";

async function bootstrap(): Promise<void> {
  process.env.SERVICE_NAME ??= "channel";

  const app = await NestFactory.create<NestFastifyApplication>(ChannelModule, new FastifyAdapter(), {
    logger: false,
  });
  app.setGlobalPrefix("channel");

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Channel demo API (CQRS)")
    .setDescription("Outbound calls go through CQRS handlers + integration framework (`opossum`).")
    .setVersion("1.0.0")
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api-docs", app, document);

  const port = Number(process.env.CHANNEL_PORT ?? 3000);
  await app.listen(port, "0.0.0.0");
  console.log(JSON.stringify({ message: "channel_listening", port, swaggerUiPath: "/channel/api-docs" }));
}

void bootstrap();
