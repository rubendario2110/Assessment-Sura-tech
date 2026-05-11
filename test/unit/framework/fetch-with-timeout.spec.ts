import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { fetchWithTimeout, TimeoutError } from "@assessment/integration-framework";

describe("fetchWithTimeout", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("returns response when fetch succeeds", async () => {
    global.fetch = jest.fn(async () => new Response("ok", { status: 200 })) as typeof fetch;
    const res = await fetchWithTimeout("http://test/resource", {}, 5000, "dep");
    expect(res.ok).toBe(true);
  });

  it("maps AbortError to TimeoutError", async () => {
    global.fetch = jest.fn((_url, init) => {
      return new Promise<Response>((_, reject) => {
        const signal = init?.signal;
        if (!signal) {
          reject(new Error("no signal"));
          return;
        }
        signal.addEventListener(
          "abort",
          () => {
            reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
          },
          { once: true },
        );
      });
    }) as typeof fetch;

    await expect(fetchWithTimeout("http://test/resource", {}, 10, "dep")).rejects.toThrow(TimeoutError);
  });

  it("rethrows non-abort errors", async () => {
    global.fetch = jest.fn(async () => {
      throw new Error("network");
    }) as typeof fetch;
    await expect(fetchWithTimeout("http://test/resource", {}, 5000, "dep")).rejects.toThrow("network");
  });
});
