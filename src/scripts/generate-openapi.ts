import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "../contexts/channel/app.module.js";

async function main(): Promise<void> {
  process.env.UPSTREAM_URL ||= "http://127.0.0.1:3001";
  process.env.SERVICE_NAME ||= "channel-openapi-gen";

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { logger: false },
  );

  const cfg = new DocumentBuilder()
    .setTitle("Assessment — Channel")
    .setDescription("Demo channel consuming upstream via @assessment/integration-framework")
    .setVersion("1.0.0")
    .build();
  const document = SwaggerModule.createDocument(app, cfg);
  const target = join(process.cwd(), "docs/api/openapi.json");
  writeFileSync(target, `${JSON.stringify(document, null, 2)}\n`);
  await app.close();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
