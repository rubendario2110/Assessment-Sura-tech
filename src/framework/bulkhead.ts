import { BulkheadFullError } from "./errors.js";

/**
 * Async bulkhead (semaphore): limits concurrent executions; queues excess instead of busy-looping.
 */
export class Bulkhead {
  private inUse = 0;
  private readonly waiters: Array<() => void> = [];

  constructor(private readonly maxConcurrent: number) {
    if (maxConcurrent < 1) throw new Error("Bulkhead maxConcurrent must be >= 1");
  }

  private async enter(): Promise<void> {
    if (this.inUse < this.maxConcurrent) {
      this.inUse += 1;
      return;
    }
    await new Promise<void>((resolve) => {
      this.waiters.push(() => {
        this.inUse += 1;
        resolve();
      });
    });
  }

  private leave(): void {
    this.inUse -= 1;
    const wake = this.waiters.shift();
    if (wake) wake();
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.waiters.length > 10_000) {
      throw new BulkheadFullError("Bulkhead wait queue exceeded safety limit");
    }
    await this.enter();
    try {
      return await fn();
    } finally {
      this.leave();
    }
  }
}
