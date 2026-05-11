import { describe, expect, it, jest } from "@jest/globals";
import type { ConfigService } from "@nestjs/config";
import { createResilientUpstreamClient } from "../../../src/contexts/channel/infrastructure/upstream-http-client.factory.js";

describe("createResilientUpstreamClient", () => {
  it("wires Nest ConfigService into ResilientHttpClient", () => {
    const cfg = {
      getOrThrow: jest.fn().mockReturnValue("http://upstream.test"),
      get: jest.fn().mockImplementation((key: string) =>
        key === "SERVICE_NAME" ? "channel-unit" : undefined,
      ),
    } as unknown as ConfigService;

    const client = createResilientUpstreamClient(cfg);
    expect(client).toBeDefined();
    expect(cfg.getOrThrow).toHaveBeenCalledWith("UPSTREAM_URL");
    expect(cfg.get).toHaveBeenCalledWith("SERVICE_NAME");
  });

  it("defaults service name when ConfigService omits SERVICE_NAME", () => {
    const cfg = {
      getOrThrow: jest.fn().mockReturnValue("http://upstream.test"),
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;

    expect(createResilientUpstreamClient(cfg)).toBeDefined();
  });
});
