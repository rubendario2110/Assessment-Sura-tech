import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { UpstreamDomainEventsSink } from "../../../../src/contexts/upstream/domain/domain-events.sink.port.js";
import { UpstreamResourceServedEvent } from "../../../../src/contexts/upstream/domain/events/upstream-resource-served.event.js";
import { UpstreamSimulationEvaluatedEvent } from "../../../../src/contexts/upstream/domain/events/upstream-simulation-evaluated.event.js";
import { ServeResourceUseCase } from "../../../../src/contexts/upstream/application/serve-resource.use-case.js";

describe("ServeResourceUseCase", () => {
  const sink: UpstreamDomainEventsSink = { publish: jest.fn() };
  let uc: ServeResourceUseCase;

  beforeEach(() => {
    jest.mocked(sink.publish).mockClear();
    uc = new ServeResourceUseCase(sink);
  });

  it("returns ok body without delay", async () => {
    const r = await uc.execute({
      mode: "ok",
      failRate: 0.5,
      slowMs: 0,
      latencyMs: 0,
    });
    expect(r.outcome).toBe("ok");
    expect(r.body.ok).toBe(true);
    expect(sink.publish).toHaveBeenCalledWith(expect.any(UpstreamSimulationEvaluatedEvent));
    expect(sink.publish).toHaveBeenCalledWith(expect.any(UpstreamResourceServedEvent));
  });

  it("returns failure envelope for error status", async () => {
    const r = await uc.execute({
      mode: "fail",
      failRate: 0,
      slowMs: 0,
      latencyMs: 0,
    });
    expect(r.outcome).toBe("fail");
    expect(r.status).toBe(503);
    expect(r.body.error).toBe("upstream_unavailable");
    const served = jest.mocked(sink.publish).mock.calls.map((c) => c[0]);
    expect(served.some((e) => e instanceof UpstreamResourceServedEvent && e.outcome === "fail")).toBe(
      true,
    );
  });

  it("waits when policy requests delay", async () => {
    const started = Date.now();
    const r = await uc.execute({
      mode: "slow",
      failRate: 0,
      slowMs: 15,
      latencyMs: 2,
    });
    expect(Date.now() - started).toBeGreaterThanOrEqual(10);
    expect(r.outcome).toBe("ok");
  });
});
