import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpException,
  Post,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ChannelTraceContext } from "../../domain/value-objects/trace-context.vo.js";
import { IdempotencyKey } from "../../domain/value-objects/idempotency-key.vo.js";
import {
  ChannelHttpException,
  InvokeUpstreamHandler,
} from "../../application/commands/invoke-upstream.handler.js";
import { InvokeUpstreamCommand } from "../../application/commands/invoke-upstream.command.js";
import {
  GetIntegrationStatusQuery,
  type IntegrationStatusView,
} from "../../application/queries/get-integration-status.query.js";
import type { InvokeUpstreamResult } from "../../application/dto/invoke-upstream-result.dto.js";

@ApiTags("channel")
@Controller()
export class ChannelController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {
    void InvokeUpstreamHandler;
  }

  @Get("health")
  @ApiOperation({ summary: "Liveness probe" })
  health(): Record<string, string> {
    return { status: "ok", service: "channel" };
  }

  @Get("integration/status")
  @ApiOperation({ summary: "Expose upstream circuit breaker state (opossum)" })
  async integrationStatus(): Promise<{ upstream: IntegrationStatusView }> {
    const view = await this.queryBus.execute<GetIntegrationStatusQuery, IntegrationStatusView>(
      new GetIntegrationStatusQuery("upstream"),
    );
    return { upstream: view };
  }

  @Post("demo/call")
  @HttpCode(200)
  @ApiOperation({ summary: "Invoke flaky upstream through integration framework (CQRS)" })
  @ApiHeader({ name: "idempotency-key", required: false })
  @ApiHeader({ name: "traceparent", required: false })
  async demoCall(
    @Headers("idempotency-key") idem?: string,
    @Headers("traceparent") tp?: string,
  ): Promise<InvokeUpstreamResult> {
    const command = new InvokeUpstreamCommand(
      IdempotencyKey.fromString(idem),
      ChannelTraceContext.fromHeader(tp),
      { message: "demo", ts: Date.now() },
    );

    try {
      return await this.commandBus.execute<InvokeUpstreamCommand, InvokeUpstreamResult>(command);
    } catch (err) {
      if (err instanceof ChannelHttpException) {
        throw new HttpException(err.body, err.httpStatus);
      }
      throw err;
    }
  }
}
