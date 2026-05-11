import { spawn, type ChildProcess } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const ROOT = process.cwd();
const UP_PORT = process.env.RELIABILITY_UPSTREAM_PORT ?? "43100";
const CH_PORT = process.env.RELIABILITY_CHANNEL_PORT ?? "43101";

async function waitForOk(url: string, attempts = 60): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      /* retry */
    }
    await delay(250);
  }
  throw new Error(`Timeout waiting for ${url}`);
}

function runService(cmd: string, args: string[], env: NodeJS.ProcessEnv): ChildProcess {
  return spawn(cmd, args, {
    cwd: ROOT,
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function pipeStructuredLogs(stream: NodeJS.ReadableStream, bucket: string[]): void {
  stream.on("data", (chunk: Buffer) => {
    for (const line of chunk.toString().split("\n")) {
      const t = line.trim();
      if (t.startsWith("{")) bucket.push(t);
    }
  });
}

async function main(): Promise<void> {
  const upstream = runService("node", ["dist/contexts/upstream/main.js"], {
    UPSTREAM_PORT: UP_PORT,
  });
  const channel = runService("node", ["dist/contexts/channel/main.js"], {
    CHANNEL_PORT: CH_PORT,
    UPSTREAM_URL: `http://127.0.0.1:${UP_PORT}`,
    SERVICE_NAME: "channel-reliability",
    IF_BREAKER_VOLUME_THRESHOLD: "3",
    IF_BREAKER_ERROR_THRESHOLD_PCT: "50",
    IF_BREAKER_RESET_TIMEOUT_MS: "1500",
    IF_RETRY_MAX_ATTEMPTS: "4",
    IF_HTTP_TIMEOUT_MS: "4000",
    IF_BULKHEAD_MAX_CONCURRENT: "4",
    IF_RETRY_BASE_MS: "20",
    IF_RETRY_MAX_MS: "400",
    IF_RETRY_JITTER_RATIO: "0.2",
  });

  const channelLogs: string[] = [];
  if (channel.stdout) pipeStructuredLogs(channel.stdout, channelLogs);
  if (channel.stderr) pipeStructuredLogs(channel.stderr, channelLogs);

  const killQuiet = (p: ChildProcess): void => {
    try {
      p.kill("SIGTERM");
    } catch {
      /* ignore */
    }
  };

  try {
    await waitForOk(`http://127.0.0.1:${UP_PORT}/health`);
    await waitForOk(`http://127.0.0.1:${CH_PORT}/health`);

    const base = `http://127.0.0.1:${CH_PORT}`;
    const stats = {
      ok: 0,
      badGateway: 0,
      serviceUnavailable: 0,
      gatewayTimeout: 0,
    };

    for (let i = 0; i < 3; i++) {
      const r = await fetch(`${base}/demo/upstream?mode=ok`);
      if (r.ok) stats.ok++;
    }

    for (let i = 0; i < 8; i++) {
      const r = await fetch(`${base}/demo/upstream?mode=random&seed=${1000 + i}&failRate=0.7`);
      await r.text();
      if (r.ok) stats.ok++;
      else if (r.status === 502) stats.badGateway++;
      else if (r.status === 503) stats.serviceUnavailable++;
      else if (r.status === 504) stats.gatewayTimeout++;
    }

    for (let i = 0; i < 18; i++) {
      const r = await fetch(`${base}/demo/upstream?mode=fail`);
      await r.text();
      if (r.ok) stats.ok++;
      else if (r.status === 502) stats.badGateway++;
      else if (r.status === 503) stats.serviceUnavailable++;
      else if (r.status === 504) stats.gatewayTimeout++;
    }

    await delay(Number(process.env.RELIABILITY_RECOVERY_MS ?? "1800"));

    for (let i = 0; i < 8; i++) {
      const r = await fetch(`${base}/demo/upstream?mode=ok`);
      if (r.ok) stats.ok++;
      await delay(120);
    }

    const retriesObserved = channelLogs.filter((l) => l.includes('"outcome":"retry"')).length;
    const breakerEvents = channelLogs.filter(
      (l) =>
        l.includes('"breakerState":"open"') ||
        l.includes('"breakerState":"halfOpen"') ||
        l.includes('"breakerState":"closed"') ||
        l.includes('"message":"breaker_open"') ||
        l.includes('"message":"breaker_half_open"') ||
        l.includes('"message":"breaker_closed"'),
    );

    const key = "reliability-demo-key";
    const body = JSON.stringify({ productId: "P1", qty: 1 });
    const headers = { "Content-Type": "application/json", "Idempotency-Key": key };
    const o1 = await fetch(`${base}/demo/order`, { method: "POST", headers, body });
    const o2 = await fetch(`${base}/demo/order`, { method: "POST", headers, body });
    const j1 = (await o1.json()) as Record<string, unknown>;
    const j2 = (await o2.json()) as Record<string, unknown>;

    console.log(
      JSON.stringify(
        {
          summary: {
            http: stats,
            retriesObserved,
            breakerTimelineLines: breakerEvents.slice(-15),
            idempotency: {
              firstStatus: o1.status,
              secondStatus: o2.status,
              secondDeduped: j2.deduped === true,
              sameId: j1.id === j2.id,
            },
          },
        },
        null,
        2,
      ),
    );

    if (!j2.deduped) {
      throw new Error("Idempotency replay not observed on second request");
    }
    if (breakerEvents.length < 1) {
      throw new Error("Expected at least one breaker timeline log line from channel output");
    }
  } finally {
    killQuiet(channel);
    killQuiet(upstream);
    await delay(400);
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
