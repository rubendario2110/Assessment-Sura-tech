import { Controller, Get, HttpException, Query } from "@nestjs/common";
import type { FlakyMode } from "../../domain/flaky.types.js";
import { ServeResourceUseCase } from "../../application/serve-resource.use-case.js";

@Controller()
export class FlakyController {
  constructor(private readonly serveResource: ServeResourceUseCase) {}

  @Get("health")
  health(): Record<string, string> {
    return { status: "ok", context: "upstream" };
  }

  @Get("resource")
  async resource(
    @Query("mode") mode: FlakyMode = "ok",
    @Query("seed") seedRaw?: string,
    @Query("failRate") failRateRaw?: string,
    @Query("slowMs") slowMsRaw?: string,
    @Query("latencyMs") latencyMsRaw?: string,
  ): Promise<Record<string, unknown>> {
    const seed = seedRaw !== undefined ? Number.parseInt(seedRaw, 10) : undefined;
    const failRate =
      failRateRaw !== undefined ? Number.parseFloat(failRateRaw) : 0.5;
    const slowMs = slowMsRaw !== undefined ? Number.parseInt(slowMsRaw, 10) : 2_000;
    const latencyMs =
      latencyMsRaw !== undefined ? Number.parseInt(latencyMsRaw, 10) : 0;

    const result = await this.serveResource.execute({
      mode,
      seed: Number.isFinite(seed) ? seed : undefined,
      failRate: Number.isFinite(failRate) ? Math.min(1, Math.max(0, failRate)) : 0.5,
      slowMs: Number.isFinite(slowMs) ? slowMs : 2_000,
      latencyMs: Number.isFinite(latencyMs) ? latencyMs : 0,
    });

    if (result.outcome === "fail") {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }
}
