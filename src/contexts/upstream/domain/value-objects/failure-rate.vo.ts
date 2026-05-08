export class FailureRate {
  private constructor(private readonly value: number) {}

  static fromUnknown(input: unknown): FailureRate {
    const n = typeof input === "string" ? Number.parseFloat(input) : Number(input);
    if (!Number.isFinite(n)) {
      throw new Error("FailureRate must be a finite number in [0,1]");
    }
    return new FailureRate(Math.min(1, Math.max(0, n)));
  }

  static zero(): FailureRate {
    return new FailureRate(0);
  }

  toNumber(): number {
    return this.value;
  }
}
