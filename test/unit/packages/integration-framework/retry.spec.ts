import { describe, expect, it, jest } from "@jest/globals";
import { executeWithRetry } from "../../../../packages/integration-framework/src/retry.js";

const cfg = {
  maxAttempts: 3,
  baseDelayMs: 1,
  maxDelayMs: 4,
  jitterRatio: 1,
};

describe("executeWithRetry (US-012)", () => {
  it("returns the first successful result without retrying", async () => {
    const fn = jest.fn(async (_attempt: number) => "ok");
    const out = await executeWithRetry(fn, cfg, () => true);
    expect(out).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries until success when shouldRetry returns true", async () => {
    let i = 0;
    const fn = async (): Promise<string> => {
      i += 1;
      if (i < 3) throw new Error("transient");
      return "done";
    };
    await expect(executeWithRetry(fn, cfg, () => true)).resolves.toBe("done");
    expect(i).toBe(3);
  });

  it("stops retrying once shouldRetry returns false and re-throws the last error", async () => {
    let calls = 0;
    const err = new Error("nope");
    const fn = async (): Promise<string> => {
      calls += 1;
      throw err;
    };
    await expect(executeWithRetry(fn, cfg, () => false)).rejects.toBe(err);
    expect(calls).toBe(1);
  });

  it("respects maxAttempts as a hard upper bound", async () => {
    let calls = 0;
    const err = new Error("always");
    const fn = async (): Promise<string> => {
      calls += 1;
      throw err;
    };
    await expect(executeWithRetry(fn, cfg, () => true)).rejects.toBe(err);
    expect(calls).toBe(cfg.maxAttempts);
  });

  it("supports zero jitter (deterministic backoff branch)", async () => {
    let calls = 0;
    const fn = async (): Promise<string> => {
      calls += 1;
      if (calls < 2) throw new Error("retryable");
      return "ok";
    };
    const out = await executeWithRetry(fn, { ...cfg, jitterRatio: 0 }, () => true);
    expect(out).toBe("ok");
    expect(calls).toBe(2);
  });
});
