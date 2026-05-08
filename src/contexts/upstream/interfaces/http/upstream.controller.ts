import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Query,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ApiBody, ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import { EchoCommand } from "../../application/commands/echo.command.js";
import {
  FlakyUpstreamError,
  EchoHandler,
} from "../../application/commands/echo.handler.js";
import { UpdateFailureRateCommand } from "../../application/commands/update-failure-rate.command.js";
import { UpdateFailureRateHandler } from "../../application/commands/update-failure-rate.handler.js";
import {
  GetUpstreamStatusQuery,
  type UpstreamStatusView,
} from "../../application/queries/get-upstream-status.query.js";
import { GetUpstreamStatusHandler } from "../../application/queries/get-upstream-status.handler.js";
import { FailureRate } from "../../domain/value-objects/failure-rate.vo.js";
import { UpstreamIdempotencyKey } from "../../domain/value-objects/upstream-idempotency-key.vo.js";

@ApiTags("upstream")
@Controller()
export class UpstreamController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {
    void EchoHandler;
    void UpdateFailureRateHandler;
    void GetUpstreamStatusHandler;
  }

  @Get("health")
  @ApiOperation({ summary: "Liveness probe" })
  async health(): Promise<UpstreamStatusView> {
    return this.queryBus.execute(new GetUpstreamStatusQuery());
  }

  @Get("simulate/config")
  @ApiOperation({ summary: "Tune failure rate at runtime (CQRS command)" })
  async simulateConfig(@Query("failureRate") rate?: string): Promise<{ failureRate: number }> {
    if (rate === undefined) {
      const current = await this.queryBus.execute<GetUpstreamStatusQuery, UpstreamStatusView>(
        new GetUpstreamStatusQuery(),
      );
      return { failureRate: current.failureRate };
    }
    let value: FailureRate;
    try {
      value = FailureRate.fromUnknown(rate);
    } catch {
      throw new HttpException("invalid failureRate", HttpStatus.BAD_REQUEST);
    }
    const updated = await this.commandBus.execute<UpdateFailureRateCommand, number>(
      new UpdateFailureRateCommand(value),
    );
    return { failureRate: updated };
  }

  @Post("echo")
  @HttpCode(200)
  @ApiOperation({ summary: "Echo payload via CQRS command + flaky upstream simulation" })
  @ApiHeader({ name: "idempotency-key", required: false })
  @ApiBody({
    required: false,
    schema: {
      type: "object",
      properties: { message: { type: "string", example: "hello" } },
    },
  })
  async echo(
    @Headers("idempotency-key") key: string | undefined,
    @Body() body: { message?: string },
  ): Promise<Record<string, unknown>> {
    const command = new EchoCommand(
      UpstreamIdempotencyKey.fromHeader(key),
      typeof body?.message === "string" ? body.message : "",
    );
    try {
      return await this.commandBus.execute<EchoCommand, Record<string, unknown>>(command);
    } catch (err) {
      if (err instanceof FlakyUpstreamError) {
        throw new HttpException({ error: "upstream_flaky" }, HttpStatus.SERVICE_UNAVAILABLE);
      }
      throw err;
    }
  }
}
