import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { InvokeUpstreamUseCase } from "./application/invoke-upstream.use-case.js";
import { PlaceOrderUseCase } from "./application/place-order.use-case.js";
import { createIdempotencyStore } from "./infrastructure/create-idempotency-store.js";
import { NoOpChannelDomainEventsSink } from "./infrastructure/noop-channel-domain-events.sink.js";
import {
  CHANNEL_DOMAIN_EVENTS_SINK,
  IDEMPOTENCY_STORE,
  UPSTREAM_HTTP_CLIENT,
} from "./infrastructure/tokens.js";
import { createResilientUpstreamClient } from "./infrastructure/upstream-http-client.factory.js";
import { DemoController } from "./interfaces/http/demo.controller.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
  ],
  controllers: [DemoController],
  providers: [
    {
      provide: UPSTREAM_HTTP_CLIENT,
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => createResilientUpstreamClient(cfg),
    },
    {
      provide: IDEMPOTENCY_STORE,
      inject: [ConfigService],
      useFactory: createIdempotencyStore,
    },
    {
      provide: CHANNEL_DOMAIN_EVENTS_SINK,
      useClass: NoOpChannelDomainEventsSink,
    },
    InvokeUpstreamUseCase,
    PlaceOrderUseCase,
  ],
})
export class ChannelModule {}
