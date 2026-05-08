import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { extractBreakerTimeline } from "./breaker-timeline.js";

const channelPort = process.env.CHANNEL_PORT ?? "3100";
const upstreamPort = process.env.UPSTREAM_PORT ?? "3101";
const upstreamBase = process.env.UPSTREAM_BASE_URL ?? `http://127.0.0.1:${upstreamPort}`;

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

async function waitFor(url: string, attempts = 50): Promise<void> {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await delay(100);
  }
  throw new Error(`Timeout waiting for ${url}`);
}

function startService(jsEntry: string, extraEnv: NodeJS.ProcessEnv): ChildProcess {
  return spawn("node", [join(repoRoot, jsEntry)], {
    cwd: repoRoot,
    env: {
      ...process.env,
      ...extraEnv,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function main(): Promise<void> {
  const upstreamProc = startService("dist/contexts/upstream/main.js", {
    UPSTREAM_PORT: upstreamPort,
    SERVICE_NAME: "upstream",
    UPSTREAM_FAILURE_RATE: "0",
  });

  const channelProc = startService("dist/contexts/channel/main.js", {
    CHANNEL_PORT: channelPort,
    UPSTREAM_PORT: upstreamPort,
    UPSTREAM_BASE_URL: upstreamBase,
    SERVICE_NAME: "channel",
    INTEGRATION_MAX_ATTEMPTS: "2",
    OPOSSUM_VOLUME_THRESHOLD: "1",
    OPOSSUM_ERROR_THRESHOLD_PERCENTAGE: "50",
    OPOSSUM_RESET_TIMEOUT_MS: "1200",
    OPOSSUM_ROLLING_COUNT_TIMEOUT_MS: "5000",
  });

  const transitions: string[] = [];
  const logBreakerLines: string[] = [];

  const tap = (proc: ChildProcess, label: string): void => {
    const append = (buf: Buffer): void => {
      const s = buf.toString();
      for (const line of s.split("\n")) {
        if (line.includes('"circuit_breaker"')) logBreakerLines.push(`${label}:${line}`);
      }
    };
    proc.stderr?.on("data", append);
    proc.stdout?.on("data", append);
  };
  tap(channelProc, "channel");

  try {
    await waitFor(`${upstreamBase}/upstream/health`);
    await waitFor(`http://127.0.0.1:${channelPort}/channel/health`);

    await fetch(`${upstreamBase}/upstream/simulate/config?failureRate=1`);

    let sawOpen = false;
    for (let i = 0; i < 60; i += 1) {
      const res = await fetch(`http://127.0.0.1:${channelPort}/channel/demo/call`, {
        method: "POST",
        headers: { "idempotency-key": `rel-${i}-${Date.now()}` },
      });
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      const status = await fetch(`http://127.0.0.1:${channelPort}/channel/integration/status`).then((r) =>
        r.json() as Promise<{ upstream?: { breakerState?: string } }>,
      );
      const br = status.upstream?.breakerState ?? "?";
      transitions.push(`i=${i} http=${res.status} breaker=${br}`);
      if (br === "open") sawOpen = true;
      if (body.error === "circuit_open" || res.status === 503) sawOpen = true;
      if (sawOpen && br === "open") break;
    }

    await fetch(`${upstreamBase}/upstream/simulate/config?failureRate=0`);
    await delay(Number(process.env.OPOSSUM_RESET_TIMEOUT_MS ?? 1200) + 500);

    const recovery = await fetch(`http://127.0.0.1:${channelPort}/channel/demo/call`, {
      method: "POST",
      headers: { "idempotency-key": `recovery-${Date.now()}` },
    });
    const recoveryBody = await recovery.json().catch(() => ({}));

    const finalStatus = await fetch(`http://127.0.0.1:${channelPort}/channel/integration/status`).then((r) =>
      r.json(),
    );

    const breakerTimeline = extractBreakerTimeline(logBreakerLines);

    const summary = {
      message: "reliability_harness_complete",
      sawOpen,
      transitions: transitions.slice(-12),
      recoveryHttp: recovery.status,
      recoveryBody,
      finalStatus,
      breakerTimeline,
      circuitBreakerLogSample: logBreakerLines.slice(0, 15),
    };
    console.log(JSON.stringify(summary, null, 2));

    if (!sawOpen) {
      console.error("Expected circuit breaker to reach open state under sustained upstream failure.");
      process.exitCode = 1;
    }
    const sawRecovery = breakerTimeline.some((entry) => entry.breakerEvent === "close");
    if (!sawRecovery) {
      console.error("Expected breaker timeline to include a 'close' event after recovery.");
      process.exitCode = 1;
    }
  } finally {
    upstreamProc.kill("SIGTERM");
    channelProc.kill("SIGTERM");
    await delay(200);
  }
}

void main();
