import { describe, expect, it } from "@jest/globals";
import {
  CircuitOpenError,
  TimeoutError,
  UpstreamError,
} from "@assessment/integration-framework";
import { mapIntegrationErrorToHttp } from "../../../src/contexts/channel/interfaces/http/integration-error.mapper.js";

describe("mapIntegrationErrorToHttp", () => {
  it("maps typed integration errors to status codes", () => {
    expect(mapIntegrationErrorToHttp(new CircuitOpenError("c")).getStatus()).toBe(503);
    expect(mapIntegrationErrorToHttp(new TimeoutError("t")).getStatus()).toBe(504);
    expect(mapIntegrationErrorToHttp(new UpstreamError("u", 502, "b")).getStatus()).toBe(502);
    expect(mapIntegrationErrorToHttp(new Error("x")).getStatus()).toBe(500);
    expect(mapIntegrationErrorToHttp("oops").getStatus()).toBe(500);
  });
});
