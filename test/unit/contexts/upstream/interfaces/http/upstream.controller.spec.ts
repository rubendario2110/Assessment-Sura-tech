import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { HttpException, HttpStatus } from "@nestjs/common";
import { UpstreamController } from "../../../../../../src/contexts/upstream/interfaces/http/upstream.controller.js";
import { FlakyUpstreamError } from "../../../../../../src/contexts/upstream/application/commands/echo.handler.js";

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

describe("UpstreamController (interfaces/http)", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("/health delegates to queryBus", async () => {
    const buses = buildBuses();
    const view = { status: "ok", service: "upstream", failureRate: 0.1 };
    buses.qry.mockResolvedValue(view);
    const ctrl = new UpstreamController(buses.commandBus, buses.queryBus);
    await expect(ctrl.health()).resolves.toEqual(view);
  });

  it("/simulate/config returns the current rate when no rate is supplied", async () => {
    const buses = buildBuses();
    buses.qry.mockResolvedValue({ status: "ok", service: "upstream", failureRate: 0.5 });
    const ctrl = new UpstreamController(buses.commandBus, buses.queryBus);
    await expect(ctrl.simulateConfig(undefined)).resolves.toEqual({ failureRate: 0.5 });
  });

  it("/simulate/config dispatches an UpdateFailureRateCommand for a valid numeric rate", async () => {
    const buses = buildBuses();
    buses.cmd.mockResolvedValue(0.7);
    const ctrl = new UpstreamController(buses.commandBus, buses.queryBus);
    await expect(ctrl.simulateConfig("0.7")).resolves.toEqual({ failureRate: 0.7 });
    expect(buses.cmd).toHaveBeenCalled();
  });

  it("/simulate/config rejects non-numeric input with HTTP 400", async () => {
    const buses = buildBuses();
    const ctrl = new UpstreamController(buses.commandBus, buses.queryBus);
    await expect(ctrl.simulateConfig("not-a-number")).rejects.toMatchObject({
      message: "invalid failureRate",
      status: HttpStatus.BAD_REQUEST,
    });
  });

  it("/echo returns the command result on success", async () => {
    const buses = buildBuses();
    buses.cmd.mockResolvedValue({ ok: true });
    const ctrl = new UpstreamController(buses.commandBus, buses.queryBus);
    await expect(ctrl.echo("k", { message: "hi" })).resolves.toEqual({ ok: true });
  });

  it("/echo translates FlakyUpstreamError into HTTP 503", async () => {
    const buses = buildBuses();
    buses.cmd.mockRejectedValue(new FlakyUpstreamError("flaky"));
    const ctrl = new UpstreamController(buses.commandBus, buses.queryBus);
    await expect(ctrl.echo(undefined, {})).rejects.toBeInstanceOf(HttpException);
  });

  it("/echo re-throws unknown errors unchanged", async () => {
    const buses = buildBuses();
    const boom = new Error("boom");
    buses.cmd.mockRejectedValue(boom);
    const ctrl = new UpstreamController(buses.commandBus, buses.queryBus);
    await expect(ctrl.echo(undefined, {})).rejects.toBe(boom);
  });

  it("/echo defaults message to empty string when payload omits it", async () => {
    const buses = buildBuses();
    buses.cmd.mockResolvedValue({ ok: true });
    const ctrl = new UpstreamController(buses.commandBus, buses.queryBus);
    await ctrl.echo(undefined, {} as { message?: string });
    expect(buses.cmd).toHaveBeenCalledTimes(1);
  });
});
