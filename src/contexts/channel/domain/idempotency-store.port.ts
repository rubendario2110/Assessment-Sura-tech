export interface IdempotencyRecord {
  statusCode: number;
  body: Record<string, unknown>;
}

/** Demo boundary: dedupe store owned by the channel context (no durable guarantee). */
export interface IdempotencyStorePort {
  get(key: string): IdempotencyRecord | undefined;
  put(key: string, record: IdempotencyRecord): void;
}
