/**
 * US-027 — Reliability harness helper.
 *
 * Parses circuit-breaker JSON log lines emitted by `IntegrationHttpClient`
 * and reduces them to a chronological timeline of *state-change* events
 * (closed → open → half_open → closed → …).
 *
 * Intentionally framework-free so it can be unit-tested without spinning
 * up Nest, Fastify, or `opossum`.
 */

export type BreakerState = "closed" | "open" | "half_open";

export type BreakerStateChangeEvent = "open" | "halfOpen" | "close";

export interface BreakerTimelineEntry {
  timestamp: string;
  dependency: string;
  breakerEvent: BreakerStateChangeEvent;
  previousState: BreakerState;
  breakerState: BreakerState;
}

interface RawBreakerLog {
  timestamp?: unknown;
  message?: unknown;
  dependency?: unknown;
  breakerEvent?: unknown;
  breakerState?: unknown;
}

const STATE_CHANGE_EVENTS = new Set<BreakerStateChangeEvent>(["open", "halfOpen", "close"]);
const VALID_STATES = new Set<BreakerState>(["closed", "open", "half_open"]);

function tryParse(line: string): RawBreakerLog | undefined {
  const start = line.indexOf("{");
  if (start === -1) return undefined;
  const candidate = line.slice(start);
  try {
    return JSON.parse(candidate) as RawBreakerLog;
  } catch {
    return undefined;
  }
}

function isStateChangeEvent(value: unknown): value is BreakerStateChangeEvent {
  return typeof value === "string" && STATE_CHANGE_EVENTS.has(value as BreakerStateChangeEvent);
}

function asState(value: unknown): BreakerState | undefined {
  return typeof value === "string" && VALID_STATES.has(value as BreakerState)
    ? (value as BreakerState)
    : undefined;
}

export function extractBreakerTimeline(lines: readonly string[]): BreakerTimelineEntry[] {
  const timeline: BreakerTimelineEntry[] = [];
  let previousState: BreakerState = "closed";

  for (const line of lines) {
    if (!line) continue;
    const parsed = tryParse(line);
    if (!parsed || parsed.message !== "circuit_breaker") continue;
    if (!isStateChangeEvent(parsed.breakerEvent)) continue;
    const breakerState = asState(parsed.breakerState);
    if (!breakerState) continue;
    const dependency = typeof parsed.dependency === "string" ? parsed.dependency : "unknown";
    const timestamp = typeof parsed.timestamp === "string" ? parsed.timestamp : new Date().toISOString();

    timeline.push({
      timestamp,
      dependency,
      breakerEvent: parsed.breakerEvent,
      previousState,
      breakerState,
    });
    previousState = breakerState;
  }

  return timeline;
}
