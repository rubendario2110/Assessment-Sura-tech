import { describe, expect, it } from "@jest/globals";
import {
  CircuitOpenError,
  TimeoutError,
  UpstreamError,
  ValidationError,
} from "@assessment/integration-framework";

describe("typed errors", () => {
  it("carry stable codes", () => {
    expect(new TimeoutError("t").code).toBe("TIMEOUT");
    expect(new CircuitOpenError("c").code).toBe("CIRCUIT_OPEN");
    expect(new UpstreamError("u", 502, "b").code).toBe("UPSTREAM");
    expect(new ValidationError("v").code).toBe("VALIDATION");
  });
});
