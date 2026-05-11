import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { ResilientHttpClient } from "@assessment/integration-framework";
import {
  CircuitOpenError,
  TimeoutError,
  UpstreamError,
} from "@assessment/integration-framework";
import type { ChannelDomainEventsSink } from "../../../src/contexts/channel/domain/domain-events.sink.port.js";
import { OrderIdempotentReplayEvent } from "../../../src/contexts/channel/domain/events/order-idempotent-replay.event.js";
import { OrderPlacedEvent } from "../../../src/contexts/channel/domain/events/order-placed.event.js";
import { UpstreamProxySucceededEvent } from "../../../src/contexts/channel/domain/events/upstream-proxy-succeeded.event.js";
import { InvokeUpstreamUseCase } from "../../../src/contexts/channel/application/invoke-upstream.use-case.js";
import { PlaceOrderUseCase } from "../../../src/contexts/channel/application/place-order.use-case.js";
import { InMemoryIdempotencyStore } from "../../../src/contexts/channel/infrastructure/in-memory-idempotency.store.js";

describe("Channel application use cases", () => {
  const execute = jest.fn();
  const sink: ChannelDomainEventsSink = { publish: jest.fn() };

  function makeInvokeUpstream(): InvokeUpstreamUseCase {
    return new InvokeUpstreamUseCase(
      { execute } as unknown as ResilientHttpClient,
      sink,
    );
  }

  beforeEach(() => {
    execute.mockReset();
    jest.mocked(sink.publish).mockClear();
  });

  it("InvokeUpstreamUseCase proxies upstream and parses JSON", async () => {
    execute.mockResolvedValueOnce(
      new Response(JSON.stringify({ hello: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const out = await makeInvokeUpstream().execute("ok", "1");
    expect(out.hello).toBe(true);
    expect((execute.mock.calls[0][0] as { path: string }).path).toContain("mode=ok");
    expect(sink.publish).toHaveBeenCalledWith(expect.any(UpstreamProxySucceededEvent));
  });

  it("PlaceOrderUseCase dedupes idempotent mutations", () => {
    const store = new InMemoryIdempotencyStore();
    const uc = new PlaceOrderUseCase(store, sink);
    const a = uc.execute("k1", { productId: "p", qty: 1 });
    const b = uc.execute("k1", { productId: "p", qty: 1 });
    expect(a.deduped).toBe(false);
    expect(b.deduped).toBe(true);
    expect((a.body as { id: string }).id).toBe((b.body as { id: string }).id);
    expect(sink.publish).toHaveBeenCalledWith(expect.any(OrderPlacedEvent));
    expect(sink.publish).toHaveBeenCalledWith(expect.any(OrderIdempotentReplayEvent));
  });

  it("PlaceOrderUseCase exposes idempotency header name", () => {
    const uc = new PlaceOrderUseCase(new InMemoryIdempotencyStore(), sink);
    expect(uc.idempotencyHeaderName()).toBe("Idempotency-Key");
  });

  it("InvokeUpstreamUseCase surfaces client failures", async () => {
    execute.mockRejectedValueOnce(new CircuitOpenError("x"));
    await expect(makeInvokeUpstream().execute("ok")).rejects.toThrow(CircuitOpenError);
    execute.mockRejectedValueOnce(new TimeoutError("t"));
    await expect(makeInvokeUpstream().execute("ok")).rejects.toThrow(TimeoutError);
    execute.mockRejectedValueOnce(new UpstreamError("u", 502, "b"));
    await expect(makeInvokeUpstream().execute("ok")).rejects.toThrow(UpstreamError);
  });
});
