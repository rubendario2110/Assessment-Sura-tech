import "reflect-metadata";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { OpenAPIObject } from "@nestjs/swagger";
import { ChannelModule } from "../contexts/channel/channel.module.js";
import { UpstreamModule } from "../contexts/upstream/upstream.module.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../..");

async function buildDocument(
  mod: Parameters<typeof NestFactory.create>[0],
  globalPrefix: string,
  title: string,
  description: string,
): Promise<OpenAPIObject> {
  const app = await NestFactory.create(mod, new FastifyAdapter(), { logger: false });
  app.setGlobalPrefix(globalPrefix);
  const config = new DocumentBuilder().setTitle(title).setDescription(description).setVersion("1.0.0").build();
  const document = SwaggerModule.createDocument(app, config);
  await app.close();
  return document;
}

function mergeOpenApi(ch: OpenAPIObject, up: OpenAPIObject): OpenAPIObject {
  return {
    openapi: "3.0.3",
    info: {
      title: "Assessment — Channel & Upstream",
      version: "1.0.0",
      description: "Merged OpenAPI 3.0 document for the demo NestJS + Fastify services.",
    },
    servers: [
      { url: "http://127.0.0.1:3000", description: "Channel service (override port via CHANNEL_PORT)" },
      { url: "http://127.0.0.1:3001", description: "Upstream simulator (override via UPSTREAM_PORT)" },
    ],
    paths: {
      ...(ch.paths ?? {}),
      ...(up.paths ?? {}),
    },
    components: {
      ...(ch.components ?? {}),
      schemas: {
        ...(ch.components?.schemas ?? {}),
        ...(up.components?.schemas ?? {}),
      },
    },
    tags: [...(ch.tags ?? []), ...(up.tags ?? [])],
  };
}

async function main(): Promise<void> {
  const channelDoc = await buildDocument(
    ChannelModule,
    "channel",
    "Channel demo API",
    "Outbound HTTP calls use the reusable integration framework (`opossum` circuit breaker, retries, timeouts).",
  );
  const upstreamDoc = await buildDocument(
    UpstreamModule,
    "upstream",
    "Upstream simulator API",
    "Configurable flaky upstream used by reliability tests.",
  );
  const merged = mergeOpenApi(channelDoc, upstreamDoc);
  const outPath = join(repoRoot, "docs/api/openapi.json");
  writeFileSync(outPath, JSON.stringify(merged, null, 2));
  console.log(JSON.stringify({ message: "openapi_written", path: outPath }));
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
