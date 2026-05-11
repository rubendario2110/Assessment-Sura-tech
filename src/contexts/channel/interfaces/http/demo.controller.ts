import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { ApiBody, ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import { InvokeUpstreamUseCase } from "../../application/invoke-upstream.use-case.js";
import { PlaceOrderUseCase } from "../../application/place-order.use-case.js";
import type { OrderPayload } from "../../domain/order.types.js";
import { mapIntegrationErrorToHttp } from "./integration-error.mapper.js";

@ApiTags("demo")
@Controller()
export class DemoController {
  constructor(
    private readonly invokeUpstream: InvokeUpstreamUseCase,
    private readonly placeOrderUc: PlaceOrderUseCase,
  ) {}

  @Get("health")
  @ApiOperation({ summary: "Liveness probe" })
  health(): Record<string, string> {
    return { status: "ok", context: "channel" };
  }

  @Get("demo/upstream")
  @ApiOperation({ summary: "Call flaky upstream through the integration framework" })
  async callUpstream(
    @Query("mode") mode = "ok",
    @Query("seed") seed?: string,
    @Query("failRate") failRate?: string,
    @Query("slowMs") slowMs?: string,
    @Query("latencyMs") latencyMs?: string,
  ): Promise<Record<string, unknown>> {
    try {
      return await this.invokeUpstream.execute(mode, seed, failRate, slowMs, latencyMs);
    } catch (e) {
      throw mapIntegrationErrorToHttp(e);
    }
  }

  @Post("demo/order")
  @ApiOperation({
    summary: "Mutation with optional idempotency key (Redis when REDIS_URL is set, else in-memory)",
  })
  @ApiHeader({ name: "Idempotency-Key", required: false })
  @ApiBody({
    schema: {
      type: "object",
      required: ["productId", "qty"],
      properties: { productId: { type: "string" }, qty: { type: "number" } },
    },
  })
  async placeOrder(
    @Res({ passthrough: true }) reply: FastifyReply,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Body() body: OrderPayload,
  ): Promise<Record<string, unknown>> {
    if (!body?.productId || typeof body.qty !== "number") {
      throw new HttpException({ error: "validation_error", message: "Invalid payload" }, 400);
    }
    const result = await this.placeOrderUc.execute(idempotencyKey, body);
    void reply.status(result.deduped ? HttpStatus.OK : HttpStatus.CREATED);
    return result.body;
  }
}
