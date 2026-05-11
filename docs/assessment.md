# Technical Lead Practical Assessment

> **Implementation status:** Application code was **reset to start from scratch** (workspace placeholder under `src/` only). Sections **A** (architecture, roadmap, diagrams) and **D** (TDRs) remain the intended target narrative. Sections **B** and **C** describe the **expected** framework and demo — re-implement per `specs/*.spec.md`, `docs/backlog.md`, and `docs/plan-scrum.md` (`packages/integration-framework`, `src/contexts/*`, `test/unit/**`, demo Compose stack).

## Section A — Architecture & Roadmap

### A.1 — End-to-End Target Architecture

The Multi-Country Digital Direct Channel is an Azure-first, active-active, multi-region platform that lets customers, agents, and partners quote, issue, pay, and manage insurance products across countries. It is structured with Domain-Driven Design (DDD), exposed through an API Gateway + BFFs, served by stateless domain services, and integrated with legacy and partner systems through a single reusable Integration Layer that owns all resilience and observability concerns.

Diagrams (rendered with Mermaid; integration implementation home: **`packages/integration-framework`**):
- System Context: `docs/c4-system-context.mmd`
- Container: `docs/c4-container.mmd`
- Component (Integration Layer): `docs/c4-component-integration-layer.mmd`
- Executive overview: `docs/architecture.mmd`
- Diagram explanations (Purpose · Scope · Elements · Flows · Resilience/Ops · Decisions/Tradeoffs): `docs/c4-diagram-explanations.md`

#### A.1.1 Domain-Driven Design

Bounded contexts and classification:

| Context | Type | Responsibility |
| --- | --- | --- |
| Quoting | Core | Build and price quotes per country/product. |
| Policy | Core | Issue, amend, endorse, cancel policies; authoritative policy state. |
| Payments | Core | Authorize, capture, refund premium; reconcile with payment gateways. |
| Customer/Identity | Supporting | Customer profile, consent, AuthN/AuthZ via OIDC. |
| Notifications | Supporting | Email/SMS/push fan-out triggered by domain events. |
| Catalog/Reference | Supporting | Product catalog, coverages, rates, country-specific reference data. |
| Country/Locale | Generic | Country routing, locale, currency, regulatory toggles. |
| Integration | Generic | Reusable resilience pipeline + ACL adapters to legacy/partners. |
| Observability | Generic | Logging, tracing, metrics; SLO tooling. |

**Domain classification (Core / Supporting / Generic)**

- **Core domains** (competitive differentiators): **Quoting**, **Policy**, **Payments** — these encapsulate quote-to-bind, authoritative policy lifecycle, and money movement; they justify bespoke modeling, rigorous aggregates, and the tightest SLO/error-budget scrutiny.
- **Supporting domains**: **Customer/Identity**, **Notifications**, **Catalog/Reference** — essential capabilities that must be correct and compliant but are not the primary economic differentiator; integrate via stable contracts (OIDC, events, published catalog language).
- **Generic / cross-cutting subdomains**: **Country/Locale**, **Integration**, **Observability** — reusable capabilities shared across the portfolio; prefer vendor/platform leverage (Azure, Entra, Monitor) and thin domain wrappers.

Context map (high level — relationship, integration style, mechanism):

| Relationship | Upstream → Downstream | Integration style | Mechanism / notes |
| --- | --- | --- | --- |
| Identity | Customer/Identity → all contexts | Open Host (OIDC) | JWT validation at APIM/BFF; no embedded IAM in domain cores |
| Quote → Issue | Quoting → Policy | Customer–Supplier | Orchestrated **Saga** (issue policy); compensations on failure |
| Issue → Pay | Policy → Payments | Customer–Supplier | **Outbox** publishes `PolicyIssued`; Payments consumes via **Service Bus** |
| Pay → Notify | Payments → Notifications | Conformist | Async domain events (`PaymentCaptured`, `PaymentFailed`) |
| Catalog → Quote | Catalog/Reference → Quoting | Open Host / Published Language | Versioned catalog API + **cache-aside** on Quoting reads |
| Locale | Country/Locale → all | Conformist (cross-cutting) | **Azure App Configuration** + typed locale profile injected per request |
| Legacy / partners | Integration → cores / gateways / KYC | ACL | **Anti-Corruption Layer** per system; sync HTTP via Integration Layer policies |

Aggregates (high level):
- Quote (Quoting), Policy (Policy), Payment (Payments), Customer (Customer/Identity), Notification (Notifications), CatalogItem (Catalog/Reference), CountryProfile (Country/Locale).

Domain services (high level):
- **Quoting**, **Policy**, and **Payments** application services coordinate their aggregates and publish/consume domain events; **Notifications** worker consumes async commands/events; **Catalog/Reference** serves published language queries with optional CQRS projections; **Country/Locale** exposes configuration-backed locale routing; the **Integration** context supplies **domain-agnostic outbound orchestration** (`packages/integration-framework`) and **ACL adapters** per external system.

Domain events (high level):
- `QuoteAccepted`, `PolicyIssued`, `PolicyAmended`, `PaymentRequested`, `PaymentCaptured`, `PaymentFailed`, `NotificationDispatched`, `CustomerRegistered`.

#### A.1.2 Runtime Topology (Azure-first)

- **Global edge**: Azure Front Door + WAF (TLS, DDoS, geo-routing, country affinity, health-based failover).
- **API layer**: Azure API Management per region (OAuth2/JWT, throttling, request shaping, partner mTLS).
- **Compute**: Azure Container Apps (default for stateless services) and AKS where finer control is needed; NestJS + Fastify across BFFs and domain services.
- **Async backbone**: Azure Service Bus (commands and durable events) + Azure Event Grid (system events / fan-out).
- **Data**:
  - Azure SQL with active geo-replication for Policy/Payments transactional data.
  - Cosmos DB (multi-region writes) for Quoting drafts and Catalog read models.
  - Azure Cache for Redis for idempotency keys and cache-aside.
  - Azure App Configuration for flags and per-country tunables.
  - Azure Key Vault for secrets and key rotation.
- **Identity**: Microsoft Entra External ID (B2C) for customers; Microsoft Entra ID for staff and partner apps.
- **Observability**: OpenTelemetry SDK in all services; OTel Collector → Application Insights, Log Analytics, Azure Monitor with dashboards and SLO alerts.
- **Delivery & governance**: GitHub Actions / Azure DevOps pipelines, Azure Policy, IaC with Bicep/Terraform.
- **Multi-region**: active-active across two Azure regions with traffic steering at Front Door; databases use geo-replication / multi-region writes; per-region BFFs and domain services.

#### A.1.3 High Availability, Scalability, Resilience, Observability

- **Availability**: 99.95% target for critical journeys (quote, issue, pay). Active-active multi-region; health probes drive failover.
- **Scalability**: Stateless services scaled by HTTP/queue depth; KEDA autoscaling for workers; Cosmos DB and Service Bus scale independently.
- **Resilience controls (explicit)** — enforced by **`packages/integration-framework`** on synchronous outbound HTTP and complemented by messaging for slow/non-critical work:
  - **Timeouts**: Per-call `AbortController` deadlines (no unbounded waits); aligned with APIM/BFF budgets.
  - **Retries**: Bounded attempts with **exponential backoff + full jitter** and retry-budget guards; only retryable failures (network, 5xx, 408, 429).
  - **Circuit breaker**: `opossum` per dependency (OPEN / HALF_OPEN / CLOSED); fast-fail while OPEN to shed load.
  - **Idempotency**: Mutation calls carry `Idempotency-Key`; dedupe backed by **Redis** for at-most-once side effects across retries.
  - **Bulkheads**: Per-dependency concurrency caps so one sick upstream cannot exhaust thread pools.
  - **Async messaging**: **Azure Service Bus** / **Event Grid** for notifications, post-commit propagation, and load smoothing; **Outbox** where transactional consistency with Azure SQL is required.
  - **Caching**: **Cache-aside** (Redis + optional Cosmos read models) for hot catalog/country reference reads with TTL + jitter and stampede protection.
- **Observability**: Structured JSON logs, RED/USE metrics, end-to-end traces via W3C `traceparent`. SLOs are defined per critical journey; error budgets drive release decisions (**catalog:** Section A.1.4).
- **Disaster Recovery**: RTO ≤ 30 min, RPO ≤ 5 min for critical data. Periodic DR drills; runbooks per failure mode.
- **Security & compliance**: TLS in transit, encryption at rest, secret rotation in Key Vault, per-country data residency by region pinning, Azure Policy guardrails.

#### A.1.4 SLO / SLI catalog and error budgets (US-008)

This catalog ties the **99.95% availability** NFR and **P95 &lt; 400 ms** latency goal to **measurable SLIs** on Azure (Application Insights + Log Analytics + Azure Monitor workbooks). SLIs are computed per **journey** (user- or system-initiated slice across BFF → domain services → Integration Layer → externals), using OpenTelemetry spans and request telemetry tagged with `journey_id` (or equivalent routing dimension).

**Critical journeys (minimum set)**

| Journey | User outcome | Primary containers | SLI sources (Azure) |
| --- | --- | --- | --- |
| **J1 — Quote to bind** | Customer obtains a priced quote and reaches bind-ready state for a selected product/country. | Web/Mobile BFF → Quoting → Catalog (read) → Integration ACL to catalog/rates sources | APIM + BFF + Quoting `server.duration` P95; availability = `count(success) / count(all)` for journey span |
| **J2 — Issue policy** | Policy is issued and confirmed to the customer (authoritative state in Policy context). | BFF → Quoting/Policy saga → Azure SQL → Outbox → Service Bus | End-to-end trace completeness; Policy API success ratio excluding 4xx validation |
| **J3 — Pay premium** | Premium authorization/capture completes and customer sees confirmation. | BFF → Payments → Payments Gateway via Integration Layer → webhook/async reconciliation | Payments operation success rate; P95 for sync confirmation path; duplicate capture rate (should be ~0 with idempotency) |

**SLI definitions (examples)**

| SLI | Definition | Notes |
| --- | --- | --- |
| **Availability** | Ratio of successful journey completions to attempts over the window. **Success** = HTTP 2xx/3xx or domain success without technical failure; **exclude** client validation errors (4xx) from the denominator unless they indicate a defect. | Measured monthly per journey; regional rollup optional. |
| **Latency** | **P95** server-side duration for the synchronous segment of the journey (span marked `critical_path=true`). | Aligns with NFR P95 &lt; 400 ms for sync APIs; catalog-heavy reads may use a separate SLO tier if justified. |
| **Error rate** | Share of journey attempts ending in 5xx, timeout, or circuit-open fast-fail attributable to the channel/integration stack. | Correlated with Integration Layer logs (`upstream_http`, `circuit_breaker`). |

**SLO targets (starting points)**

| Journey | Availability SLO (monthly) | Latency SLO (sync segment) | Error budget (monthly, illustrative) |
| --- | --- | --- | --- |
| J1 Quote to bind | **99.95%** | P95 **&lt; 400 ms** | ~22 minutes downtime equivalent |
| J2 Issue policy | **99.95%** | P95 **&lt; 400 ms** on sync confirmation API | same order of magnitude |
| J3 Pay premium | **99.95%** | P95 **&lt; 400 ms** on payment confirmation path | same order of magnitude |

*Exact budget minutes derive from `(1 − SLO) × window length`; teams calibrate alerts on **burn rate**, not static thresholds only.*

**Error budget policy**

1. **Measurement**: Rolling **30-day** window per journey (calendar month for reporting). Burn rate = rate of budget consumption vs ideal (multi-window alerts in Azure Monitor / App Insights recommended).
2. **Green**: Budget remaining &gt; 50% at mid-window — normal feature velocity.
3. **Yellow**: Budget 25–50% — reliability tasks prioritized in sprint; freeze low-value releases.
4. **Red**: Budget exhausted or projected exhaustion within days — stop non-critical deployments; incident review mandatory; focus on resilience backlog (timeouts, CB tuning, bulkheads, dependency health).
5. **Governance**: Weekly SLO review with Product + SRE; Section D Decision 2 defines sync vs async boundaries that affect how latency SLOs apply.

This catalog is consistent with the observability path in Section A.1.2 (`OpenTelemetry → Application Insights`) and with the Integration Layer controls in Section A.2.

### A.2 — Integration Patterns

All integrations are realized through the Integration Layer. The **canonical reusable implementation** is the TypeScript package under **`packages/integration-framework`** (workspace package `@assessment/integration-framework` per Spec B), consumed by domain services as a **Hexagonal port/adapter–friendly** client (`IntegrationHttpClient` and helpers). Section B/C may reference demo paths for historical layout; **architecture, governance, and diagrams treat `packages/integration-framework` as the integration-home**.

The Integration Layer exposes a single client SDK contract to domain services and applies the following controls in a deterministic composition order:

1. **Idempotency**: Mutation calls accept/propagate `Idempotency-Key`; Redis-backed dedupe store ensures at-most-once side effects across retries.
2. **Bulkhead**: Per-dependency concurrency cap (semaphore) prevents one slow upstream from exhausting the channel.
3. **Circuit Breaker (opossum, mandatory)**: OPEN/HALF_OPEN/CLOSED transitions per dependency; fast-fail with `CircuitOpenError` while OPEN; HALF_OPEN probe for recovery.
4. **Retry with Exponential Backoff + Jitter**: Bounded attempts, full jitter, retry-budget guard; only retryable errors (network, 5xx, 408, 429) are retried.
5. **Timeout + Safe Cancellation**: `AbortController`-based per-call deadline; emits `TimeoutError` with deadline metadata.
6. **Cache-Aside (read paths)**: Single-flight + TTL with jitter for hot reference data (Catalog, Country); stampede protection.
7. **Async Messaging**: Service Bus / Event Grid for non-blocking flows (notifications, downstream propagation); Outbox pattern in Policy/Payments for reliable event publishing.
8. **Trace Propagation**: W3C `traceparent` injected/extracted on every hop; OTel-compatible exporter to Application Insights.
9. **Structured Logging**: JSON with `traceId`, `dependency`, `attempt`, `outcome`, `latencyMs`; no PII by default.
10. **Centralized Configuration**: All thresholds (timeouts, retries, CB, bulkhead, cache TTLs) live in Azure App Configuration, validated at startup; per-country overrides supported.

Pattern catalog beyond resilience:
- **API Gateway + BFF** per channel (web, mobile, partner) to keep client contracts focused.
- **Hexagonal/Clean architecture** in each service to keep domain logic free of infrastructure concerns.
- **Anti-Corruption Layer (ACL)** per legacy/partner adapter, isolating their models from ours.
- **Saga (orchestration)** for cross-context transactions (e.g., Quote → Issue Policy → Charge Premium → Notify).
- **Outbox pattern** in Policy and Payments for reliable event publishing (no dual-write risk).
- **Strangler pattern** for legacy core-system modernization, replacing capabilities behind the same APIs.
- **CQRS / read-model projections** in Catalog and Quoting where read load dwarfs write load.

NFR mapping (resilience controls → NFR):

| NFR | Control(s) |
| --- | --- |
| Availability 99.95% | Active-active multi-region, CB, bulkhead, async fallback |
| P95 < 400 ms (sync APIs) | Cache-aside, timeouts, bulkhead, CB fast-fail |
| RTO ≤ 30 min / RPO ≤ 5 min | Geo-replicated SQL, multi-region Cosmos, runbooks |
| At-most-once mutation | Idempotency keys + Redis dedupe |
| Triage in < 5 min | Structured logs + traces, dashboards, on-call runbooks |

### A.3 — 12-Week Technical Roadmap

Three workstreams executed in parallel; quality gates at the end of each fortnight (aligned with `docs/plan-scrum.md`).

| Week | Reliability | Integration Modernization | Observability / Operations |
| --- | --- | --- | --- |
| 1 | Define error-budget policy; HA baseline review | Framework scaffold (config, errors, HTTP client) | Logging schema standard + log fields contract |
| 2 | DR strategy draft (RTO/RPO per domain) | Public API freeze for framework client | Bootstrap App Insights workspace + per-service tags |
| 3 | Health probes + readiness gates per service | Timeout + AbortController | OTel Collector PoC; trace fields contract |
| 4 | Rolling restart drills in non-prod | Retries + jitter + retry budget | Trace propagation across BFF → services |
| 5 | Active-active routing PoC at Front Door | Circuit breaker (opossum) wrapper + events | CB transitions visible in dashboards |
| 6 | Bulkhead defaults per dependency tier | Idempotency support (Redis-backed) | RED metrics per service + alerting baseline |
| 7 | Failover drill (region A→B) | Cache-aside for Catalog/Reference | SLOs published for top-3 critical journeys |
| 8 | Chaos in non-prod (latency, 5xx, partial) | Async outbox PoC for Policy events → Azure Service Bus | Error-budget burn alerts wired |
| 9 | Capacity plan + load test of critical journeys | Strangler PoC for one legacy capability | On-call rotation + paging policy live |
| 10 | DR drill end-to-end with measured RTO/RPO | ACL adapters formalized; partner mTLS hardening | Runbooks per failure mode published |
| 11 | Game day: sustained outage scenario | Per-country config rollout via App Configuration | Post-mortem template + blameless review process |
| 12 | Final reliability review + sign-off | Submission of framework v1 + adapters | Submission of observability standard v1 |

Workstream exit criteria:
- **Reliability**: 99.95% measured for the top-3 critical journeys over the last two weeks; DR drill within RTO/RPO; documented chaos results.
- **Integration Modernization**: All outbound calls go through the framework; ACL adapters cover the top dependencies; idempotency demonstrated under retries.
- **Observability/Operations**: SLOs/SLIs in place with error budgets; trace correlation end-to-end; runbooks and on-call live.

### A.4 — Tradeoffs, Risks, Mitigations

- **Active-active complexity vs availability**: Multi-region active-active raises operational burden (replication conflicts, cost). Mitigation: document conflict-resolution policy; start with read-heavy contexts replicated, write-heavy contexts pinned and failed over.
- **`opossum` coupling**: Mandated CB library introduces vendor coupling. Mitigation: isolate behind framework wrapper; expose generic CB interface to callers.
- **OTel exporter scope**: Full OTel pipeline may be excessive for the assessment. Mitigation: ship `traceparent` propagation + structured logs; treat exporter to App Insights as roadmap item.
- **Sync vs async for critical flows**: Pure event-driven introduces eventual consistency in customer-facing UX. Mitigation: synchronous for the read path of critical journeys; async for side effects (notifications, downstream propagation). **Formal decision:** Section D — TDR 2 (Event-driven vs synchronous for critical flows).
- **Per-country regulatory variability**: Could fragment configuration. Mitigation: per-country overrides via App Configuration with strict schema and review.

---

## Section B — Reusable Integration Framework

### Implementation outline

The reusable integration layer ships as the workspace package **`packages/integration-framework`** (import alias **`@assessment/integration-framework`**). Domain services obtain a Nest-friendly **`IntegrationHttpClient`** from `packages/integration-framework/src/http-client.ts`, typically via a small infrastructure provider that calls `loadIntegrationConfig`, `createLogger`, and `new IntegrationHttpClient(...)`. Outbound calls execute with fixed composition: **bulkhead (async semaphore) → `opossum` circuit breaker → bounded retries with exponential backoff + jitter → `fetch` + `AbortSignal` timeout**.

### Design decisions

| Decision | Rationale |
| --- | --- |
| `opossum` mandatory CB | Assessment/repo standard; exposes `open`, `halfOpen`, `close`, `reject`, `failure`, `success`, `timeout` events for structured logs. |
| CB timeout disabled (`timeout: false`) | Avoid duplicate timers vs HTTP-level deadline (`INTEGRATION_TIMEOUT_MS` via `AbortController`). |
| Retries inside `breaker.fire` | One CB observation per logical outbound invocation after retries exhaust — avoids counting each retry as independent breaker stats while still absorbing bursts. |
| Centralised JSON logging | `logger.ts` emits single-line JSON suitable for Log Analytics / ELK; circuit events logged at `info` with field `message":"circuit_breaker"`. |
| W3C `traceparent` | Parsed/generated in `tracing.ts`; propagated as HTTP header on upstream calls. |
| Idempotency keys | `generateIdempotencyKey()` + `Idempotency-Key` header for mutation-style demos (upstream dedupes in-memory). |

### Configuration (`US-009`)

| Env var | Purpose |
| --- | --- |
| `SERVICE_NAME` | Service label inside logs |
| `INTEGRATION_TIMEOUT_MS` | Per-attempt HTTP deadline |
| `INTEGRATION_MAX_ATTEMPTS` | Total attempts including first try |
| `INTEGRATION_BASE_DELAY_MS`, `INTEGRATION_MAX_DELAY_MS`, `INTEGRATION_JITTER_RATIO` | Backoff + jitter |
| `INTEGRATION_BULKHEAD_MAX_CONCURRENT` | Concurrent upstream calls per dependency id |
| `OPOSSUM_*` | Volume/threshold/rolling window/reset timeout |

Typed errors (`errors.ts`): `TimeoutError`, `CircuitOpenError`, `UpstreamError`, `BulkheadFullError`, … map cleanly to HTTP semantics in the Channel controller.

### Runtime caveat — NestJS DI + `tsx`

Bootstrapping with `tsx` **drops `emitDecoratorMetadata`**, so Nest (and `@nestjs/cqrs` handlers) cannot resolve constructor parameters such as `IntegrationHttpClient`. Always run from compiled output (`pnpm build && node dist/contexts/<bc>/main.js`). All `pnpm start:*`, `pnpm openapi:generate`, and `pnpm test:reliability` scripts compile first.

### Automated tests (TDD evidence)

Specs run on **Jest** (`ts-jest/presets/default-esm` + `--experimental-vm-modules`), aligned with the official NestJS preset:

- `test/unit/packages/integration-framework/*.spec.ts` — config, tracing, retry/bulkhead/CB, typed errors, mocked `fetch` contract for `IntegrationHttpClient`.
- `test/unit/contexts/upstream/application/commands/echo.handler.spec.ts` — CQRS handler validated end-to-end with `@nestjs/testing` (idempotent replay, flaky failure mode).
- `test/unit/contexts/channel/application/commands/invoke-upstream.handler.spec.ts` — CQRS handler validates success path and translates `CircuitOpenError` into `ChannelHttpException(503)`.

---

## Section C — Demo Service & Reliability Test

### Components (DDD + CQRS layout)

Both bounded contexts follow the same shape: `domain/` (value objects, events, ports), `application/` (CQRS commands, queries, handlers, DTOs), `infrastructure/` (in-memory adapters, DI providers and tokens), `interfaces/http/` (NestJS controllers that simply translate HTTP → command/query bus).

| Path | Role |
| --- | --- |
| `src/contexts/upstream/` | Flaky upstream BC — `EchoCommand`, `UpdateFailureRateCommand`, `GetUpstreamStatusQuery`; in-memory `IdempotencyStore` + `FailureRateRepository` |
| `src/contexts/channel/` | Outbound BC — `InvokeUpstreamCommand`, `GetIntegrationStatusQuery`, value objects `IdempotencyKey` / `ChannelTraceContext`, domain events `UpstreamCallSucceededEvent` / `UpstreamCallRejectedEvent`; wires **`@assessment/integration-framework`** via `integration-http-client.provider.ts` |
| `packages/integration-framework/` | Shared library — `IntegrationHttpClient` (`opossum` + bulkhead + retry + timeout + `traceparent`), config/logger/errors/idempotency helpers; consumed by Channel (and any other service) as the single outbound integration surface |
| `src/test/reliability-test.ts` | Spawns compiled `dist/contexts/*/main.js`, drives failure → open circuit → recovery |

Upstream exposes `GET /upstream/simulate/config?failureRate=` (handled via `UpdateFailureRateCommand`) for runtime tuning (default seeded by `UPSTREAM_FAILURE_RATE`).

### How to run locally

```bash
pnpm install
pnpm build
UPSTREAM_PORT=3001 SERVICE_NAME=upstream node dist/contexts/upstream/main.js &
CHANNEL_PORT=3000 UPSTREAM_BASE_URL=http://127.0.0.1:3001 SERVICE_NAME=channel node dist/contexts/channel/main.js &
```

(Prefer placing each command in its own terminal session instead of background `&` for clarity.)

Swagger UI (generated decorators):

- Channel: `http://127.0.0.1:3000/channel/api-docs`
- Upstream: `http://127.0.0.1:3001/upstream/api-docs`

### Reliability harness

```bash
pnpm test:reliability   # runs `pnpm build` then orchestrates both services
```

Expected stdout highlights JSON lines where **`breakerEvent` transitions through `open → halfOpen → close`** once upstream failures cease after `resetTimeout`.

### Failure behaviour narrative

1. With `failureRate=1`, upstream returns HTTP 503 → retries exhaust → **`UpstreamError`** bubbles → **`opossum`** records failures → circuit **`open`** (`CircuitOpenError` → HTTP 503 payload `{ error: "circuit_open" }`).
2. After cool-down (`OPOSSUM_RESET_TIMEOUT_MS`), **`halfOpen`** probe runs; successful echo **`close`**s the breaker.
3. Structured logs (`circuit_breaker`) capture transitions for interviews (`open`, `halfOpen`, `close`, `failure`, `success`).

### Operational runbook (US-026)

`docs/runbook.md` documents triage steps for each demo failure mode (`circuit_open`, `upstream`, `timeout`, `bulkhead_full`), reproduction commands for forced failure / recovery, idempotency replay verification, and the tunable opossum knobs. The reliability harness output now embeds a structured **`breakerTimeline`** field (US-027) with timestamps and `previousState → breakerState` transitions, making OPEN → HALF_OPEN → CLOSED cycles directly auditable from the JSON summary.

### API artifacts

- Machine-readable OpenAPI: `docs/api/openapi.json` (`pnpm openapi:generate`)
- Postman Collection v2.1: `docs/postman/assessment.postman_collection.json` (`pnpm postman:generate`)

## Section D — Technical Decision Record

One-page decision-grade narrative covering **two** program-level architecture choices. Both align with Spec A (target architecture), Spec B (integration framework), and Section A.1.4 (SLO catalog).

---

### D.1 — Centralized integration platform vs decentralized team-owned integrations

**Context.** The Multi-Country Digital Direct Channel must integrate with legacy cores, payment gateways, and partners across countries. Teams want autonomy and fast iteration; the program needs consistent resilience, security, and observability so SLOs in Section A.1.4 are achievable.

**Options considered.**

| Option | Summary | Strengths | Weaknesses |
| --- | --- | --- | --- |
| **A — Fully centralized** | A single integration platform team owns all adapters, routing, and partner onboarding. | One place for standards, certifications, and reuse; uniform dashboards and runbooks. | Bottleneck for delivery; domain nuance lives far from feature teams; scaling the platform team is expensive. |
| **B — Fully decentralized** | Each domain/stream-aligned team ships and operates its own HTTP clients, retries, and partner logic. | Maximum autonomy and localized velocity. | Inconsistent resilience (retry storms, CB gaps); duplicated ACL logic; harder audits and on-call; SLO fragmentation. |
| **C — Hybrid (platform framework + federated ownership)** | A **reusable Integration Layer** (framework SDK, ACL patterns, golden CI templates) is owned by a **platform team**; **domain teams own** bounded-context-specific adapters and release cadence behind contracts governed by architecture review + automated policy checks. | Combines standard **timeouts, retries+jitter, opossum CB, bulkheads, idempotency, traceparent** everywhere with teams retaining ownership of domain mapping and backlog. | Requires investment in platform + governance; teams must adopt the SDK contract and participate in shared observability standards. |

**Decision.** Adopt **Option C — Hybrid**. Mandate outbound traffic through the shared Integration Layer (per Section A.2 and Spec B); centralize **policy, telemetry schema, and dependency tier defaults**; decentralize **adapter implementation and backlog** to stream-aligned teams with platform guardrails (design reviews, linting, smoke tests against simulators).

**Consequences.** **Positive:** predictable failure modes and shared SLIs; lower audit surface for security/compliance; aligns with Azure-first ops (App Insights, Key Vault, App Configuration). **Negative:** coordination tax between platform and domains; teams may resist SDK upgrades — mitigated by semver, migration guides, and office hours. **Neutral:** partner onboarding still requires a single architectural thread through the Integration Layer, which adds latency to kickoff but reduces production incidents later.

---

### D.2 — Event-driven vs synchronous request/response for critical flows

**Context.** Critical journeys (quote, issue, pay) need strong UX and regulatory clarity. Pure async maximizes decoupling but complicates “did it succeed?” moments for customers; pure synchronous coupling increases blast radius and tail latency.

**Options considered.**

| Option | Summary | Strengths | Weaknesses |
| --- | --- | --- | --- |
| **A — Event-driven first** | Publish commands/events; UI polls or uses WebSockets for outcome. | Scales well; absorbs spikes; fits notifications and downstream propagation. | Eventual consistency in UX; harder debugging for money movements; customer-facing “confirmation” timing unclear without extra design. |
| **B — Synchronous only** | End-to-end HTTP/RPC until completion for every step. | Simple mental model for confirmations; easier tracing for auditors on one request ID. | Fragile under slow legacy systems; cascading failures without aggressive timeouts/CBs; poor isolation of side effects. |
| **C — Hybrid by journey phase** | **Synchronous** request/response for **customer-visible confirmations** and **read paths** where latency SLOs apply (Section A.1.4). **Asynchronous** processing for side effects (notifications, downstream replication, analytics). **Outbox + Service Bus** for reliable events after commits (Policy/Payments). | Balances UX and resilience; matches Saga + Outbox already assumed in Section A; Integration Layer contains timeouts/CB on sync legs while async absorbs load. | Teams must classify operations explicitly (“sync boundary” vs “async continuation”); requires discipline in idempotency and duplicate-event handling. |

**Decision.** Adopt **Option C — Hybrid**. Define a **sync boundary** per critical journey (e.g., payment authorization acknowledgment, policy issue confirmation number) with strict latency SLOs; push non-blocking work to queues/topics; use **outbox** for consistency between writes and events.

**Consequences.** **Positive:** SLOs remain measurable on clear HTTP paths; Integration Layer patterns apply uniformly to sync outbound calls; async handles notification storms. **Negative:** dual programming model (sync + messaging) increases training and test matrix size — mitigated by templates, arch guild, and contract tests. **Risk:** country-specific regulation mandating synchronous audit trails — mitigated by durable logs + correlation IDs on both sync and async legs; revisit per country if regulators require stronger guarantees.

---

### D.3 — Traceability

| Topic | Where reflected |
| --- | --- |
| Hybrid integration ownership | Section A.2 (Integration patterns), `packages/integration-framework` (`IntegrationHttpClient`), L3 component diagram |
| Hybrid sync/async | Section A.2 items 7–8 (async + trace), A.1.4 SLO scope for sync segments |
| Error budgets | Section A.1.4 error budget policy |

## Submission Checklist

- [x] Section A architecture, DDD framing, and 12-week roadmap completed.
- [x] C4 diagrams (System Context, Container, Component) committed under `docs/`.
- [x] Executive overview diagram updated.
- [x] Diagram explanations published in `docs/c4-diagram-explanations.md` (L1/L2/L3 C4 files; executive overview aligned in `docs/architecture.mmd`).
- [ ] Section B — integration framework **code** and design notes (**code reset — re-implement `packages/integration-framework`**).
- [ ] Section C — demo run instructions and failure behavior (**services/harness removed — restore per Spec C**).
- [x] Section D — TDR (one page, two decisions).
- [ ] All evidence logs updated in `docs/evidence/` (`spec`, `planning`, `architecture`, `implementation`, `review`) — **refresh after each implementation milestone**.
