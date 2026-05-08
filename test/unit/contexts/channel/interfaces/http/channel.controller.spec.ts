import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { HttpException } from "@nestjs/common";
import { ChannelController } from "../../../../../../src/contexts/channel/interfaces/http/channel.controller.js";
import { ChannelHttpException } from "../../../../../../src/contexts/channel/application/commands/invoke-upstream.handler.js";

type BusFn = jest.Mock<(...args: unknown[]) => Promise<unknown>>;

interface Buses {
  commandBus: CommandBus;
  queryBus: QueryBus;
  cmd: BusFn;
  qry: BusFn;
}

const buildBuses = (): Buses => {
  const cmd = jest.fn() as unknown as BusFn;
  const qry = jest.fn() as unknown as BusFn;
  return {
    commandBus: { execute: cmd } as unknown as CommandBus,
    queryBus: { execute: qry } as unknown as QueryBus,
    cmd,
    qry,
  };
};

describe("ChannelController (interfaces/http)", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("/health returns ok", () => {
    const { commandBus, queryBus } = buildBuses();
    const ctrl = new ChannelController(commandBus, queryBus);
    expect(ctrl.health()).toEqual({ status: "ok", service: "channel" });
  });

  it("/integration/status delegates to queryBus and wraps the view", async () => {
    const buses = buildBuses();
    const view = {
      dependencyId: "upstream",
      breakerState: "closed",
      opossum: { volumeThreshold: 1, errorThresholdPercentage: 1, resetTimeoutMs: 1 },
    };
    buses.qry.mockResolvedValue(view);
    const ctrl = new ChannelController(buses.commandBus, buses.queryBus);
    await expect(ctrl.integrationStatus()).resolves.toEqual({ upstream: view });
  });

  it("/demo/call returns the command result on success (default headers)", async () => {
    const buses = buildBuses();
    const result = {
      ok: true,
      upstreamStatus: 200,
      breakerState: "closed",
      idempotencyKey: "k",
      traceId: "t",
      upstream: {},
    };
    buses.cmd.mockResolvedValue(result);
    const ctrl = new ChannelController(buses.commandBus, buses.queryBus);
    await expect(ctrl.demoCall(undefined, undefined)).resolves.toEqual(result);
  });

  it("/demo/call wraps ChannelHttpException as HttpException with body+status", async () => {
    const buses = buildBuses();
    buses.cmd.mockRejectedValue(new ChannelHttpException(503, { error: "circuit_open" }));
    const ctrl = new ChannelController(buses.commandBus, buses.queryBus);
    await expect(ctrl.demoCall("k", "tp")).rejects.toBeInstanceOf(HttpException);
  });

  it("/demo/call re-throws unknown errors unchanged", async () => {
    const buses = buildBuses();
    const boom = new Error("boom");
    buses.cmd.mockRejectedValue(boom);
    const ctrl = new ChannelController(buses.commandBus, buses.queryBus);
    await expect(ctrl.demoCall(undefined, undefined)).rejects.toBe(boom);
  });
});
