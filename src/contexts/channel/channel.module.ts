import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { ChannelController } from "./interfaces/http/channel.controller.js";
import { InvokeUpstreamHandler } from "./application/commands/invoke-upstream.handler.js";
import { GetIntegrationStatusHandler } from "./application/queries/get-integration-status.handler.js";
import { integrationHttpClientProvider } from "./infrastructure/integration-http-client.provider.js";
import {
  CHANNEL_UPSTREAM_BASE_URL,
  type ChannelUpstreamBaseUrl,
} from "./infrastructure/tokens.js";

@Module({
  imports: [CqrsModule],
  controllers: [ChannelController],
  providers: [
    integrationHttpClientProvider,
    {
      provide: CHANNEL_UPSTREAM_BASE_URL,
      useFactory: (): ChannelUpstreamBaseUrl =>
        process.env.UPSTREAM_BASE_URL ?? "http://127.0.0.1:3001",
    },
    InvokeUpstreamHandler,
    GetIntegrationStatusHandler,
  ],
})
export class ChannelModule {}
