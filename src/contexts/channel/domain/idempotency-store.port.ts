export interface IdempotencyRecord {
  statusCode: number;
  body: Record<string, unknown>;
}

/** Dedupe store owned by the channel context (in-memory or Redis-backed when configured). */
export interface IdempotencyStorePort {
  get(key: string): Promise<IdempotencyRecord | undefined>;
  put(key: string, record: IdempotencyRecord): Promise<void>;
}
