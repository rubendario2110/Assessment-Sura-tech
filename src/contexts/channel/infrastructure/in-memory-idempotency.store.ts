import { Injectable } from "@nestjs/common";
import type {
  IdempotencyRecord,
  IdempotencyStorePort,
} from "../domain/idempotency-store.port.js";

@Injectable()
export class InMemoryIdempotencyStore implements IdempotencyStorePort {
  private readonly map = new Map<string, IdempotencyRecord>();

  get(key: string): IdempotencyRecord | undefined {
    return this.map.get(key);
  }

  put(key: string, record: IdempotencyRecord): void {
    this.map.set(key, record);
  }
}
