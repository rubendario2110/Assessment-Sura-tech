# Demo Runbook — Channel + Upstream Reliability Test

> Scope: this runbook covers the demo services shipped under `src/contexts/{channel,upstream}/` and the reliability harness (`src/test/reliability-test.ts`). It is intentionally tactical (commands + observable signals + decisions), not architectural.

## 0. Pre-flight

```bash
pnpm install
pnpm build
node -v          # expect >= 22 (project engines.node)
pnpm test        # Jest (ESM): framework + CQRS handlers
```

If any step above fails, **stop**. The demos and reliability test rely on compiled output (`dist/contexts/*/main.js`); running NestJS directly through `tsx` strips `emitDecoratorMetadata` and breaks DI/CQRS handler registration.

## 1. Local topology

| Component | Port (default) | Module | Notes |
| --- | --- | --- | --- |
| `upstream` simulator | `3001` (`UPSTREAM_PORT`) | `src/contexts/upstream/main.ts` | Flaky upstream (configurable failure rate) |
| `channel` consumer | `3000` (`CHANNEL_PORT`) | `src/contexts/channel/main.ts` | Calls upstream via `IntegrationHttpClient` |
| Reliability harness | n/a | `src/test/reliability-test.ts` | Spawns both compiled services on ports 3100/3101 |

Two terminals are recommended for manual demos (`pnpm start:upstream`, `pnpm start:channel`); the harness is self-contained.

## 2. Triage by symptom

### 2.1 Channel returns `503 { "error": "circuit_open" }`

**Meaning:** `opossum` has tripped the breaker for the `upstream` dependency. New requests are rejected fast (no retries, no upstream call) until the reset window elapses.

**Verify:**

```bash
curl -s http://127.0.0.1:3000/channel/integration/status | jq
```

Expect `upstream.breakerState === "open"`. The same field is also visible inside the `breakerTimeline` array of the reliability harness summary.

**Look for in logs (channel stdout):**

```json
{"message":"circuit_breaker","breakerEvent":"open","breakerState":"open","dependency":"upstream"}
```

**Decision tree:**

1. Is the upstream genuinely failing (HTTP 5xx, timeouts)?
   - Yes → wait for `OPOSSUM_RESET_TIMEOUT_MS` (default 30 s; `1200` ms in the harness). The breaker will move to `half_open` and probe; success closes it again.
   - No → tighten thresholds (`OPOSSUM_VOLUME_THRESHOLD`, `OPOSSUM_ERROR_THRESHOLD_PERCENTAGE`) — see Section 4.
2. If the breaker keeps reopening immediately after `half_open`, the probe is failing. Reproduce with a single call to `POST /channel/demo/call` and capture the `upstream` log lines (look for `upstream_http`, `httpStatus: 5xx`).

### 2.2 Channel returns `502 { "error": "upstream", "httpStatus": 5xx }`

**Meaning:** Retries were exhausted (`INTEGRATION_MAX_ATTEMPTS`) and the framework surfaced an `UpstreamError`. The breaker is still **closed** (or did not yet hit `OPOSSUM_VOLUME_THRESHOLD`).

**Verify:**

```bash
curl -i -X POST http://127.0.0.1:3000/channel/demo/call \
  -H "idempotency-key: triage-$(date +%s)" \
  -H 'content-type: application/json' \
  -d '{}'
```

Inspect the `attempt` field in `upstream_http` logs to confirm retries happened. Counts higher than 1 mean the retry orchestrator did its job; persistent failure points at upstream health.

### 2.3 Channel returns `504 { "error": "timeout" }`

**Meaning:** A single attempt exceeded `INTEGRATION_TIMEOUT_MS` and `AbortController` cancelled the request.

**Verify:**

- `upstream_timeout` lines appear in the channel log with `latencyMs` close to the configured deadline.
- Either raise `INTEGRATION_TIMEOUT_MS` (if upstream is intentionally slow under load) or fix the upstream latency.

### 2.4 Channel returns `429 { "error": "bulkhead_full" }`

**Meaning:** More than `INTEGRATION_BULKHEAD_MAX_CONCURRENT` calls to the same dependency are in flight; new ones are rejected immediately to protect the channel.

**Verify:**

- Reduce inbound load or raise the bulkhead. Bulkhead is **per dependency id**, so noisy neighbours do not bleed into each other.

### 2.5 Idempotency replay confirmation

**Meaning:** When the channel forwards `Idempotency-Key`, the upstream simulator dedupes the call and returns `{"deduped": true, ...}`. Use this to confirm at-most-once semantics under retries.

```bash
KEY="dedupe-$(date +%s)"
curl -s -X POST http://127.0.0.1:3000/channel/demo/call \
  -H "idempotency-key: $KEY" -H 'content-type: application/json' -d '{}' | jq '.upstream'
curl -s -X POST http://127.0.0.1:3000/channel/demo/call \
  -H "idempotency-key: $KEY" -H 'content-type: application/json' -d '{}' | jq '.upstream'
```

The second response should contain `"deduped": true`.

## 3. Reproduce failure scenarios

### 3.1 Force the upstream to fail every request

```bash
curl -X GET "http://127.0.0.1:3001/upstream/simulate/config?failureRate=1"
for i in $(seq 1 5); do
  curl -s -X POST http://127.0.0.1:3000/channel/demo/call \
    -H "idempotency-key: forced-$i" -H 'content-type: application/json' -d '{}'
  echo
done
curl -s http://127.0.0.1:3000/channel/integration/status | jq
```

Expect: HTTP 502 → 502 → 503 transition once `opossum` flips to `open`.

### 3.2 Recover the upstream

```bash
curl -X GET "http://127.0.0.1:3001/upstream/simulate/config?failureRate=0"
sleep 2          # >= OPOSSUM_RESET_TIMEOUT_MS (1.2 s in the harness, 30 s default)
curl -s -X POST http://127.0.0.1:3000/channel/demo/call \
  -H "idempotency-key: recovery-$(date +%s)" \
  -H 'content-type: application/json' -d '{}' | jq
```

Expect: a `half_open` log line followed by `close`; the response carries `breakerState === "closed"`.

### 3.3 Run the full automated harness

```bash
pnpm test:reliability
```

Expected JSON summary fields:

- `sawOpen: true`
- `breakerTimeline` includes `closed → open → half_open → closed` (US-027).
- `recoveryHttp: 200` and `finalStatus.upstream.breakerState === "closed"`.
- Process exits non-zero if either the breaker never opens **or** never recovers (`close` missing from timeline).

## 4. Tunable knobs (per environment)

All values are loaded by `loadIntegrationConfig` (`src/framework/config.ts`). Set them on the **channel** process.

| Env var | Default | Effect |
| --- | --- | --- |
| `INTEGRATION_TIMEOUT_MS` | `5000` | Per-attempt HTTP deadline |
| `INTEGRATION_MAX_ATTEMPTS` | `3` | Total attempts (1 + retries) |
| `INTEGRATION_BASE_DELAY_MS` | `100` | Backoff base for retry orchestrator |
| `INTEGRATION_MAX_DELAY_MS` | `2000` | Backoff cap |
| `INTEGRATION_JITTER_RATIO` | `1.0` | Full jitter |
| `INTEGRATION_BULKHEAD_MAX_CONCURRENT` | `10` | Per-dependency concurrency |
| `OPOSSUM_VOLUME_THRESHOLD` | `5` | Min calls in rolling window before breaker may trip |
| `OPOSSUM_ERROR_THRESHOLD_PERCENTAGE` | `50` | Failure ratio that trips the breaker |
| `OPOSSUM_RESET_TIMEOUT_MS` | `30000` | Time spent `open` before probe |
| `OPOSSUM_ROLLING_COUNT_TIMEOUT_MS` | `10000` | Sliding window for stats |

`SERVICE_NAME` controls the `service` field in structured logs and is helpful when tailing log streams from multiple instances.

## 5. Common pitfalls

- **`Cannot read properties of undefined (reading 'execute')`** when running through `tsx`: NestJS lost decorator metadata. Always use `pnpm start:*` (which compiles first) or `node dist/...` directly.
- **`UndefinedDependencyException` in `@nestjs/cqrs` handlers**: same root cause; affects both `EchoHandler` and `InvokeUpstreamHandler`. Compile first.
- **`429` storms from the bulkhead** when running synthetic load: increase `INTEGRATION_BULKHEAD_MAX_CONCURRENT` to match the test profile, or reduce the load.
- **Breaker never opens during demos**: lower `OPOSSUM_VOLUME_THRESHOLD` (the harness uses `1`). With the default `5`, you need at least 5 calls before `opossum` evaluates the threshold.
- **In-memory idempotency dedup behaviour resets between restarts**: by design — the upstream simulator stores keys in process memory only.

## 6. Where to look next

- Integration framework tests: `src/framework/*.spec.ts` (config, errors, HTTP client).
- CQRS handler tests: `src/contexts/{channel,upstream}/application/commands/*.spec.ts`.
- Reliability summary parser: `src/test/breaker-timeline.ts` + `breaker-timeline.spec.ts`.
- Section C narrative: `docs/assessment.md`.
- C4 component view: `docs/c4-component-integration-layer.mmd` + `docs/c4-diagram-explanations.md`.
