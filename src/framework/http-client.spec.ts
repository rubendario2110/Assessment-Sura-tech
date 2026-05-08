import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { loadIntegrationConfig } from "./config.js";
import { createLogger } from "./logger.js";
import { IntegrationHttpClient } from "./http-client.js";

function mockResponse(partial: Partial<Response> & { text?: () => Promise<string> }): Response {
  return partial as Response;
}

describe("IntegrationHttpClient (US-018) — TDD contract", () => {
  const originalFetch = global.fetch;

  function installFetch(impl: jest.Mock<() => Promise<Response>>): void {
    (global as { fetch: typeof fetch }).fetch = impl as unknown as typeof fetch;
  }

  afterEach(() => {
    (global as { fetch: typeof fetch }).fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("returns parsed HTTP result on success", async () => {
    installFetch(
      jest.fn(() =>
        Promise.resolve(
          mockResponse({
            ok: true,
            status: 200,
            headers: new Headers({ "content-type": "application/json" }),
            text: async () => '{"ok":true}',
          }),
        ),
      ),
    );

    const cfg = loadIntegrationConfig({
      INTEGRATION_MAX_ATTEMPTS: "1",
      OPOSSUM_VOLUME_THRESHOLD: "1",
      SERVICE_NAME: "unit-test",
    });
    const client = new IntegrationHttpClient(cfg, createLogger({ serviceName: "unit-test" }));
    const res = await client.execute({
      dependencyId: "dep-a",
      method: "GET",
      url: "http://example.invalid/api",
    });

    expect(res.status).toBe(200);
    expect(res.bodyText).toBe('{"ok":true}');
    expect(client.getBreakerState("dep-a")).toMatch(/closed|half_open|open/);
  });

  it("maps HTTP errors to UpstreamError for retry evaluation", async () => {
    installFetch(
      jest.fn(() =>
        Promise.resolve(
          mockResponse({
            ok: false,
            status: 503,
            headers: new Headers(),
            text: async () => "fail",
          }),
        ),
      ),
    );

    const cfg = loadIntegrationConfig({
      INTEGRATION_MAX_ATTEMPTS: "1",
      OPOSSUM_VOLUME_THRESHOLD: "1",
      SERVICE_NAME: "unit-test",
    });
    const client = new IntegrationHttpClient(cfg, createLogger({ serviceName: "unit-test" }));
    await expect(
      client.execute({ dependencyId: "dep-b", method: "GET", url: "http://example.invalid/x" }),
    ).rejects.toMatchObject({ code: "UPSTREAM" });
  });
});
