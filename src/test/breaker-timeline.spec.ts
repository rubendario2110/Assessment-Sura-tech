import { describe, expect, it } from "@jest/globals";
import { extractBreakerTimeline, type BreakerTimelineEntry } from "./breaker-timeline.js";

const SAMPLE_LOG_LINES = [
  'channel:{"timestamp":"2026-05-08T21:53:50.710Z","level":"info","service":"channel","message":"circuit_breaker","dependency":"upstream","breakerEvent":"failure","breakerState":"closed","outcome":"error"}',
  'channel:{"timestamp":"2026-05-08T21:53:50.711Z","level":"info","service":"channel","message":"circuit_breaker","dependency":"upstream","breakerEvent":"open","breakerState":"open","outcome":"success"}',
  'channel:{"timestamp":"2026-05-08T21:53:51.911Z","level":"info","service":"channel","message":"circuit_breaker","dependency":"upstream","breakerEvent":"halfOpen","breakerState":"half_open","outcome":"success"}',
  'channel:{"timestamp":"2026-05-08T21:53:52.423Z","level":"info","service":"channel","message":"circuit_breaker","dependency":"upstream","breakerEvent":"close","breakerState":"closed","outcome":"success"}',
  'channel:{"timestamp":"2026-05-08T21:53:52.423Z","level":"info","service":"channel","message":"circuit_breaker","dependency":"upstream","breakerEvent":"success","breakerState":"closed","outcome":"success"}',
  'channel:not-json',
  '',
];

describe("extractBreakerTimeline (US-027)", () => {
  it("returns a chronological timeline of state-change events only", () => {
    const timeline = extractBreakerTimeline(SAMPLE_LOG_LINES);
    expect(timeline).toHaveLength(3);
    const sequence = timeline.map((entry) => `${entry.previousState}->${entry.breakerState}`);
    expect(sequence).toEqual(["closed->open", "open->half_open", "half_open->closed"]);
  });

  it("captures timestamps + dependency for each transition", () => {
    const timeline = extractBreakerTimeline(SAMPLE_LOG_LINES);
    const open = timeline.find((entry) => entry.breakerEvent === "open") as BreakerTimelineEntry | undefined;
    expect(open).toBeDefined();
    expect(open?.dependency).toBe("upstream");
    expect(open?.timestamp).toBe("2026-05-08T21:53:50.711Z");
  });

  it("safely ignores non-circuit_breaker noise", () => {
    const timeline = extractBreakerTimeline([
      'channel:{"message":"upstream_http","httpStatus":200}',
      "garbage line",
    ]);
    expect(timeline).toEqual([]);
  });

  it("does not break on lines without channel: prefix", () => {
    const timeline = extractBreakerTimeline([
      '{"timestamp":"2026-05-08T21:54:00.000Z","message":"circuit_breaker","dependency":"upstream","breakerEvent":"open","breakerState":"open"}',
    ]);
    expect(timeline).toHaveLength(1);
    expect(timeline[0]?.breakerState).toBe("open");
    expect(timeline[0]?.previousState).toBe("closed");
  });
});
