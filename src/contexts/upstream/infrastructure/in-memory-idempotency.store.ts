import { Injectable } from "@nestjs/common";
import type { IdempotencyStore } from "../domain/idempotency-store.port.js";

@Injectable()
export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly entries = new Map<string, Record<string, unknown>>();

  find(key: string): Record<string, unknown> | undefined {
    return this.entries.get(key);
  }

  put(key: string, payload: Record<string, unknown>): void {
    this.entries.set(key, payload);
  }
}
