import { Injectable, Logger } from "@nestjs/common";
import { isApplicationVerboseLogging } from "../../shared/application-verbose-log.js";
import { maskIdempotencyKey } from "../../shared/mask-idempotency-key.js";
import type {
  IdempotencyRecord,
  IdempotencyStorePort,
} from "../domain/idempotency-store.port.js";

@Injectable()
export class InMemoryIdempotencyStore implements IdempotencyStorePort {
  private readonly log = new Logger(InMemoryIdempotencyStore.name);
  private readonly map = new Map<string, IdempotencyRecord>();

  get(key: string): Promise<IdempotencyRecord | undefined> {
    const hit = this.map.get(key);
    if (isApplicationVerboseLogging()) {
      this.log.log(`memory GET key=${maskIdempotencyKey(key)} hit=${hit != null}`);
    }
    return Promise.resolve(hit);
  }

  put(key: string, record: IdempotencyRecord): Promise<void> {
    this.map.set(key, record);
    if (isApplicationVerboseLogging()) {
      this.log.log(
        `memory SET key=${maskIdempotencyKey(key)} size=${this.map.size}`,
      );
    }
    return Promise.resolve();
  }
}
