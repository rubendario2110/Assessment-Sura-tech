import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ServeResourceUseCase } from "./application/serve-resource.use-case.js";
import { NoOpUpstreamDomainEventsSink } from "./infrastructure/noop-upstream-domain-events.sink.js";
import { UPSTREAM_DOMAIN_EVENTS_SINK } from "./infrastructure/tokens.js";
import { FlakyController } from "./interfaces/http/flaky.controller.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
  ],
  controllers: [FlakyController],
  providers: [
    {
      provide: UPSTREAM_DOMAIN_EVENTS_SINK,
      useClass: NoOpUpstreamDomainEventsSink,
    },
    ServeResourceUseCase,
  ],
})
export class UpstreamModule {}
