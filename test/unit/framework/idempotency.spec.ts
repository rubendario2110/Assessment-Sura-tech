import { describe, expect, it } from "@jest/globals";
import {
  createIdempotencyKey,
  idempotencyHeaderName,
  mergeIdempotencyHeader,
} from "@assessment/integration-framework";

describe("idempotency helpers", () => {
  it("exposes header name", () => {
    expect(idempotencyHeaderName()).toBe("Idempotency-Key");
  });

  it("creates UUID keys", () => {
    expect(createIdempotencyKey()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("mergeIdempotencyHeader adds key when provided", () => {
    expect(mergeIdempotencyHeader({ a: "b" }, "k")).toEqual({
      a: "b",
      "Idempotency-Key": "k",
    });
    expect(mergeIdempotencyHeader(undefined, undefined)).toEqual({});
  });
});
