export type FlakyMode = "ok" | "fail" | "slow" | "random";

export interface FlakySimulationInput {
  mode: FlakyMode;
  seed?: number;
  failRate: number;
  slowMs: number;
  latencyMs: number;
}

export interface FlakySimulationPlan {
  status: number;
  delayMs: number;
  body: Record<string, unknown>;
}
