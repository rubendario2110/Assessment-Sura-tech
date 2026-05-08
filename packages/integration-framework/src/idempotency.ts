import { randomBytes } from "node:crypto";

export function generateIdempotencyKey(): string {
  return randomBytes(16).toString("hex");
}
