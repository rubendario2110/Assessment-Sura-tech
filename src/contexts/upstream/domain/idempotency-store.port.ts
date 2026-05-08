export interface IdempotencyStore {
  find(key: string): Record<string, unknown> | undefined;
  put(key: string, payload: Record<string, unknown>): void;
}
