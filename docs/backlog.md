# Product Backlog — Technical Lead Practical Assessment

Traceable backlog derived from `specs/A-architecture.spec.md`, `specs/B-integration-framework.spec.md`, `specs/C-demo-service.spec.md`, `specs/D-tdr.spec.md`, and `docs/assessment-input.md`.

## Conventions

- IDs: Epics `E-NN`, Stories `US-NNN`, Tasks `T-NNN`.
- Estimates: Story Points (SP) on Fibonacci (1, 2, 3, 5, 8, 13). Tasks in focus hours.
- Story format: `As a <role>, I want <capability>, so that <outcome>`.
- Tags: `[A]` Architecture, `[I]` Integration/Resilience, `[O]` Observability/Operations, `[D]` Decision Record, `[S]` Submission/Governance.
- Spec trace: each story cites the originating spec section.

---

## Epic Index

| Epic | Title | Spec | Stories | SP |
| --- | --- | --- | --- | --- |
| E-01 | Target Architecture & Multi-Country Foundations | A | US-001..US-006 | 26 |
| E-02 | 12-Week Roadmap & Operating Model | A.3 | US-007..US-008 | 8 |
| E-03 | Reusable Integration Framework | B | US-009..US-018 | 35 |
| E-04 | Demo Channel Service & Reliability Test | C | US-019..US-022 | 18 |
| E-05 | Technical Decision Record (TDR) | D | US-023..US-024 | 6 |
| E-06 | Observability & Operations Foundation | A/B/C | US-025..US-027 | 7 |
| E-07 | Submission Package & Governance | All | US-028..US-030 | 8 |
| Total |  |  | 30 stories | 108 |

---

## E-01 Target Architecture & Multi-Country Foundations  `[A]`

### US-001 — DDD bounded contexts and context map  `5 SP`
> As an architect, I want bounded contexts and their context map documented, so that teams have clear ownership boundaries across the multi-country channel.

- Spec trace: A — Scope (DDD framing), Acceptance (DDD framing).
- Acceptance criteria:
  - Lists Customer, Quoting, Policy, Payments, Notifications, Identity, Catalog/Reference, Integration as bounded contexts.
  - Context map shows relationships (Customer/Supplier, ACL, Open Host) for each pair that interacts.
  - Domain events per context are enumerated (at least 1 per context).
- Tasks:
  - T-001 Identify bounded contexts and ownership — 4h
  - T-002 Draft context map (Mermaid) — 4h
  - T-003 Enumerate domain events and aggregates — 4h
- Dependencies: none. Risks: business inputs missing → use assumptions.

### US-002 — C4 System Context diagram  `3 SP`
> As an architect, I want a C4 System Context diagram, so that stakeholders can see external actors and systems.

- Spec trace: A — Output Files `docs/c4-system-context.mmd`.
- Acceptance criteria:
  - Customers, partners, regulators, internal back-office actors are represented.
  - External systems (core policy, payments gateway, IdP) are shown with directionality.
  - Renders in Mermaid without errors.
- Tasks:
  - T-004 Draft Mermaid C4 System Context — 3h
  - T-005 Validate render and review — 1h
- Dependencies: US-001 (actors). Risks: missing external system catalog.

### US-003 — C4 Container diagram  `5 SP`
> As an architect, I want a C4 Container diagram, so that we communicate the runtime topology clearly.

- Spec trace: A — Output Files `docs/c4-container.mmd`.
- Acceptance criteria:
  - Includes API gateway, channel BFF, integration layer, async backbone, data stores, IdP, observability stack.
  - Each container labeled with technology choice (Azure-first, e.g., AKS, APIM, Service Bus, Cosmos DB / Azure SQL, Application Insights).
  - Multi-region notation present.
- Tasks:
  - T-006 Inventory containers and tech choices — 3h
  - T-007 Draft Mermaid C4 Container — 4h
  - T-008 Peer-review and adjust — 2h
- Dependencies: US-002. Risks: tech choice churn.

### US-004 — C4 Component diagram for the Integration Layer  `5 SP`
> As an architect, I want a C4 Component diagram for the integration layer, so that resilience controls are explicit per component.

- Spec trace: A — Output Files `docs/c4-component-integration-layer.mmd`; A — Acceptance (resilience mapping).
- Acceptance criteria:
  - Components: HTTP client, Retry policy, Circuit Breaker (opossum), Bulkhead, Idempotency, Logger, Tracing.
  - Each component annotated with related NFR/control.
  - Cross-references to `src/framework/*` modules.
- Tasks:
  - T-009 Map framework modules to components — 3h
  - T-010 Draft Mermaid C4 Component — 4h
  - T-011 Annotate resilience/observability controls — 2h
- Dependencies: US-003, E-03 scaffold (informational). Risks: drift if framework changes.

### US-005 — HA/DR strategy (active-active, RTO/RPO)  `5 SP`
> As an SRE, I want HA/DR strategy documented (active-active, RTO/RPO), so that we can meet the 99.95% availability target.

- Spec trace: A — NFRs (availability, RTO/RPO, multi-region).
- Acceptance criteria:
  - Active-active topology described with traffic management (Front Door / Traffic Manager).
  - RTO ≤ 30 min and RPO ≤ 5 min documented per critical data domain.
  - Failure modes and DR drills outlined.
- Tasks:
  - T-012 Draft HA topology section — 3h
  - T-013 Draft DR strategy and runbook intent — 3h
  - T-014 Document failure modes and mitigations — 3h
- Dependencies: US-003. Risks: vendor SLA assumptions.

### US-006 — Section A narrative in `docs/assessment.md`  `3 SP`
> As an architect, I want Section A narrative in `docs/assessment.md`, so that the deliverable is submission-ready.

- Spec trace: A — Output Files `docs/assessment.md` (Sections A + roadmap).
- Acceptance criteria:
  - Section A.1 (architecture) and A.2 (integration patterns) complete.
  - References to all C4 diagrams.
  - Resilience and observability controls explicitly mapped to components.
- Tasks:
  - T-015 Write A.1 end-to-end architecture — 3h
  - T-016 Write A.2 integration patterns — 3h
- Dependencies: US-001..US-005. Risks: length vs depth.

---

## E-02 12-Week Roadmap & Operating Model  `[A][O]`

### US-007 — 12-week technical roadmap (3 workstreams)  `5 SP`
> As a delivery lead, I want a 12-week roadmap with three workstreams (Reliability, Integration Modernization, Observability/Operations), so that execution is sequenced and measurable.

- Spec trace: A — Acceptance (12-week roadmap), assessment input Section A.3.
- Acceptance criteria:
  - 12 weeks listed with milestones, exit criteria, and dependencies per workstream.
  - At least one milestone per workstream per phase (kickoff, mid, delivery).
  - References roadmap-level KPIs.
- Tasks:
  - T-017 Draft roadmap matrix (week × workstream) — 4h
  - T-018 Define exit criteria and KPIs — 3h
  - T-019 Review with stakeholders (mock) — 1h
- Dependencies: E-01 mostly. Risks: scope churn.

### US-008 — SLO/SLI catalog for critical journeys  `3 SP`
> As an SRE, I want an SLO/SLI catalog for critical customer journeys, so that we can monitor reliability against targets.

- Spec trace: A — NFRs (99.95%, P95 < 400 ms).
- Acceptance criteria:
  - At least 3 critical journeys (e.g., quote → issue → pay) with SLOs (availability, latency, error rate).
  - Error budget policy outlined.
  - Aligned with observability stack from US-003.
- Tasks:
  - T-020 Identify critical journeys — 2h
  - T-021 Define SLIs and SLOs — 3h
  - T-022 Document error budget policy — 1h
- Dependencies: US-005, US-007. Risks: data availability for SLI baselines.

---

## E-03 Reusable Integration Framework  `[I][O]`

### US-009 — Centralized configuration module  `3 SP`
> As a developer, I want a centralized config module loaded from environment, so that all integration knobs are tunable without code changes.

- Spec trace: B — Required Capabilities (centralized configuration).
- Acceptance criteria:
  - Single typed config object exposed.
  - Env vars documented with defaults (timeouts, retries, jitter, CB thresholds, concurrency).
  - Invalid config fails fast at startup.
- Tasks:
  - T-023 Define config schema and types — 2h
  - T-024 Implement env loader + validation — 3h
  - T-025 Document env vars — 1h
- Dependencies: pnpm install. Risks: defaults may need tuning.

### US-010 — Typed error model  `2 SP`
> As a developer, I want typed error classes, so that callers can branch on failure modes deterministically.

- Spec trace: B — Design Constraints (clear error types).
- Acceptance criteria:
  - Errors: `TimeoutError`, `CircuitOpenError`, `UpstreamError`, `ValidationError` exported.
  - Each error carries `code`, `cause`, optional `httpStatus`.
- Tasks:
  - T-026 Define error hierarchy — 2h
  - T-027 Add type guards / helpers — 1h
- Dependencies: none. Risks: API stability across services.

### US-011 — Per-call timeout with safe cancellation  `3 SP`
> As a developer, I want per-call timeouts with safe cancellation, so that outbound calls never hang indefinitely.

- Spec trace: B — Required Capabilities (timeout + cancellation).
- Acceptance criteria:
  - Uses `AbortController` to cancel in-flight requests on timeout.
  - Throws `TimeoutError` with deadline metadata.
- Tasks:
  - T-028 Implement timeout wrapper — 3h
  - T-029 Add unit-style smoke check — 2h
- Dependencies: US-009, US-010. Risks: leaking timers.

### US-012 — Retries with exponential backoff + jitter  `5 SP`
> As a developer, I want bounded retries with exponential backoff and jitter, so that transient upstream failures are absorbed without thundering herds.

- Spec trace: B — Required Capabilities (retry policy).
- Acceptance criteria:
  - Configurable max attempts and base delay.
  - Full jitter strategy implemented.
  - Retries skipped for non-retryable errors (e.g., 4xx except 408/429).
- Tasks:
  - T-030 Implement backoff + jitter algorithm — 3h
  - T-031 Implement retry orchestrator — 3h
  - T-032 Add retry-budget guard — 2h
  - T-033 Smoke test against simulator — 2h
- Dependencies: US-011. Risks: retry storms if budget misconfigured.

### US-013 — Circuit breaker via `opossum`  `5 SP`
> As an SRE, I want a circuit breaker via `opossum`, so that failing dependencies are isolated from the rest of the system.

- Spec trace: B — Required Capabilities (CB OPEN/CLOSED/HALF_OPEN); repo standard mandates `opossum`.
- Acceptance criteria:
  - Wrapper exposes thresholds (error %, volume, sleep window) via env.
  - Emits events for transitions; observable in logs.
  - Opens on sustained failure and recovers via HALF_OPEN probe.
- Tasks:
  - T-034 Add `opossum` dependency — 1h
  - T-035 Implement CB wrapper — 4h
  - T-036 Hook CB events to logger — 2h
  - T-037 Smoke test transitions — 2h
- Dependencies: US-009, US-010, US-016. Risks: vendor coupling → mitigated by wrapper.

### US-014 — Bulkhead / concurrency limit per dependency  `3 SP`
> As an SRE, I want bulkhead concurrency limits per dependency, so that one slow upstream cannot exhaust channel resources.

- Spec trace: B — Scope (bulkhead/concurrency limit).
- Acceptance criteria:
  - Configurable max in-flight calls per dependency.
  - Excess calls rejected with `UpstreamError(code=BULKHEAD_FULL)`.
- Tasks:
  - T-038 Implement semaphore-based bulkhead — 3h
  - T-039 Wire bulkhead into HTTP client — 2h
- Dependencies: US-018. Risks: tuning per dependency.

### US-015 — Idempotency-key support  `3 SP`
> As a developer, I want idempotency-key support, so that retries on mutations do not duplicate side effects.

- Spec trace: B — Required Capabilities (idempotency-key support).
- Acceptance criteria:
  - Helper to generate stable keys.
  - HTTP client propagates `Idempotency-Key` header.
  - Documented contract for downstream services.
- Tasks:
  - T-040 Implement key generator — 2h
  - T-041 Implement header propagation — 2h
  - T-042 Document contract — 1h
- Dependencies: US-018. Risks: dedupe responsibility belongs to consumer.

### US-016 — Unified JSON structured logging  `3 SP`
> As an SRE, I want unified JSON structured logging, so that all outbound calls are triagable consistently.

- Spec trace: B — Required Capabilities (unified logging).
- Acceptance criteria:
  - Fields: `timestamp`, `level`, `service`, `dependency`, `traceId`, `spanId`, `attempt`, `outcome`, `latencyMs`.
  - Outputs valid JSON to stdout.
  - No PII in logs by default.
- Tasks:
  - T-043 Implement logger module — 3h
  - T-044 Apply across framework hooks — 2h
- Dependencies: US-009. Risks: log volume.

### US-017 — W3C `traceparent` propagation  `3 SP`
> As an SRE, I want W3C `traceparent` propagation, so that traces are correlated end-to-end across services.

- Spec trace: B — Required Capabilities (trace propagation, OpenTelemetry-compatible).
- Acceptance criteria:
  - Generates `traceparent` if absent; otherwise propagates incoming.
  - Helpers to inject/extract from HTTP headers.
- Tasks:
  - T-045 Implement W3C parser/generator — 3h
  - T-046 Wire into HTTP client + logger — 2h
- Dependencies: US-016, US-018. Risks: full OTel exporter out of scope.

### US-018 — Single HTTP client abstraction  `5 SP`
> As a tech lead, I want a single HTTP client abstraction composing all policies, so that the framework is reusable across services.

- Spec trace: B — Design Constraints (one client abstraction).
- Acceptance criteria:
  - Public API: `client.execute(request, options)` with options for timeout, retry, CB, bulkhead, idempotency.
  - Returns typed response or throws typed error.
  - Decoupled from business domain logic.
- Tasks:
  - T-047 Define public API and types — 3h
  - T-048 Implement composition pipeline — 5h
  - T-049 Write usage example — 2h
- Dependencies: US-009..US-017. Risks: API churn → freeze before E-04.

---

## E-04 Demo Channel Service & Reliability Test  `[I][O]`

### US-019 — Flaky upstream simulator  `5 SP`
> As a demo operator, I want a flaky upstream simulator (NestJS + Fastify), so that we can drive resilience scenarios.

- Spec trace: C — Scope (`upstream` service).
- Acceptance criteria:
  - Configurable failure rate, latency, sustained outage mode (env or query param).
  - Returns deterministic outputs given same idempotency key + body for verification.
  - Health endpoint exposed.
- Tasks:
  - T-050 Bootstrap NestJS + Fastify app — 2h
  - T-051 Implement flakiness controls — 4h
  - T-052 Implement deterministic echo + idempotency support — 3h
- Dependencies: pnpm install. Risks: nondeterminism → seeded RNG.

### US-020 — Demo channel service consuming the framework  `5 SP`
> As a demo operator, I want a channel service consuming the integration framework, so that we can demonstrate end-to-end resilient calls.

- Spec trace: C — Scope (`channel` service).
- Acceptance criteria:
  - POST endpoint accepts `Idempotency-Key` and forwards to upstream via framework.
  - Returns degraded-but-controlled responses on upstream failure (5xx with structured body).
  - Logs include trace ids.
- Tasks:
  - T-053 Bootstrap NestJS + Fastify app — 2h
  - T-054 Wire framework client into controller — 4h
  - T-055 Implement degraded response mapping — 3h
- Dependencies: E-03 complete, US-019. Risks: API contract drift.

### US-021 — Reliability test script + outcome summary  `5 SP`
> As a tester, I want a reliability test script driving failure scenarios, so that we can verify resilience patterns automatically.

- Spec trace: C — Scope (reliability script + outcome summary).
- Acceptance criteria:
  - Scenarios: steady, burst, sustained outage, recovery.
  - Prints status code distribution, retry count, CB transitions, idempotency dedupes.
  - Completes in < 2 minutes locally.
- Tasks:
  - T-056 Implement traffic generator — 4h
  - T-057 Implement metrics aggregator and summary printer — 4h
  - T-058 Add scenario presets — 2h
- Dependencies: US-019, US-020. Risks: timing flakiness.

### US-022 — Section C behavior narrative + run instructions  `3 SP`
> As an evaluator, I want Section C in `docs/assessment.md` with run instructions and behavior narrative, so that the demo is reproducible and explainable.

- Spec trace: C — Output Files (`docs/assessment.md` Section C).
- Acceptance criteria:
  - Step-by-step run commands for `upstream`, `channel`, and reliability test.
  - Narrative explains expected behavior under each scenario.
  - Cross-links to logs example and outcome summary.
- Tasks:
  - T-059 Write run instructions — 2h
  - T-060 Write behavior narrative — 2h
- Dependencies: US-019..US-021. Risks: doc drift if commands change.

---

## E-05 Technical Decision Record  `[D]`

### US-023 — TDR: Centralized vs Decentralized Integration Platform  `3 SP`
> As a tech lead, I want a TDR comparing centralized vs decentralized integration ownership, so that the program-wide model is documented.

- Spec trace: D — Decision 1.
- Acceptance criteria:
  - Sections: Context, Options, Decision, Consequences.
  - Tradeoffs and risks per option, not only the chosen one.
  - Recommendation aligned with Spec A and Spec B.
- Tasks:
  - T-061 Draft Context + Options — 2h
  - T-062 Draft Decision + Consequences — 2h
- Dependencies: US-006, US-018. Risks: bias toward chosen option.

### US-024 — TDR: Event-Driven vs Synchronous for Critical Flows  `3 SP`
> As a tech lead, I want a TDR comparing event-driven vs synchronous request/response for critical flows, so that the architectural pattern is decided.

- Spec trace: D — Decision 2.
- Acceptance criteria:
  - Sections: Context, Options, Decision, Consequences.
  - Includes evaluation against blast radius, lead time, governance.
  - Recommendation per critical flow type.
- Tasks:
  - T-063 Draft Context + Options — 2h
  - T-064 Draft Decision + Consequences — 2h
- Dependencies: US-006. Risks: regulatory constraints not fully known.

---

## E-06 Observability & Operations Foundation  `[O]`

### US-025 — Demo logs include trace ids and structured fields  `3 SP`
> As an SRE, I want logs from the demo services to include trace ids and structured fields, so that incident triage is fast.

- Spec trace: C — Required Demonstrations (logs include trace ids).
- Acceptance criteria:
  - Both `channel` and `upstream` log JSON with shared `traceId` per request.
  - Logs include latency, outcome, and dependency name.
- Tasks:
  - T-065 Wire framework logger into channel — 2h
  - T-066 Wire structured logger into upstream — 2h
- Dependencies: US-016, US-017, US-019, US-020. Risks: header propagation gaps.

### US-026 — Demo runbook notes  `2 SP`
> As an SRE, I want runbook notes for the demo, so that operators can troubleshoot common failure modes.

- Spec trace: C — Runbook Expectations.
- Acceptance criteria:
  - Documents how to interpret CB transitions, retry exhaustion, and idempotency dedupes.
  - Includes commands to reproduce scenarios.
- Tasks:
  - T-067 Write runbook notes — 2h
- Dependencies: US-021, US-022. Risks: out-of-date if behavior changes.

### US-027 — CB state transitions visible in summary  `2 SP`
> As an SRE, I want circuit breaker state transitions visible in the reliability summary, so that recovery is verifiable end-to-end.

- Spec trace: C — Required Demonstrations (recovery path).
- Acceptance criteria:
  - Summary includes timeline of OPEN → HALF_OPEN → CLOSED transitions.
  - Transitions correlate with logs.
- Tasks:
  - T-068 Subscribe to CB events in test harness — 1h
  - T-069 Render transitions in summary — 1h
- Dependencies: US-013, US-021. Risks: timing variance.

---

## E-07 Submission Package & Governance  `[S]`

### US-028 — `docs/assessment.md` complete and cross-linked  `3 SP`
> As an evaluator, I want all sections of `docs/assessment.md` complete and cross-linked, so that the submission is coherent.

- Spec trace: All specs.
- Acceptance criteria:
  - Sections A, B, C, D filled.
  - Cross-links to diagrams, code, and logs.
  - Submission checklist ticked.
- Tasks:
  - T-070 Final pass on Section A — 1h
  - T-071 Final pass on Sections B/C/D — 2h
- Dependencies: All upstream stories. Risks: last-minute drift.

### US-029 — Evidence logs updated for all agents  `2 SP`
> As an evaluator, I want all agent evidence logs updated, so that the SDD process is auditable.

- Spec trace: README — Evidence Standard.
- Acceptance criteria:
  - `docs/evidence/{spec,planning,architecture,implementation,review}-agent-evidence.md` each have at least one entry per execution.
  - Entries follow the prescribed minimum fields.
- Tasks:
  - T-072 Audit evidence files — 1h
  - T-073 Append missing entries — 1h
- Dependencies: All agent runs. Risks: forgotten entries.

### US-030 — Final review pass (quality gates)  `3 SP`
> As a tech lead, I want a final review pass against quality gates, so that the submission meets the assessment standard.

- Spec trace: review-agent mission.
- Acceptance criteria:
  - All acceptance criteria from specs verified.
  - Lints/builds pass (`pnpm exec tsc --noEmit`).
  - Diagrams render; demo runs end-to-end.
- Tasks:
  - T-074 Run static checks — 1h
  - T-075 Run demo end-to-end — 2h
  - T-076 File `review-agent-evidence.md` summary — 1h
- Dependencies: US-028, US-029. Risks: late defects.

---

## Totals

- Stories: 30
- Story points: 108
- Tasks: 76
- Estimated hours: ~183h focus time (avg ~2.4h/task)
- Per-epic hours: E-01 49h · E-02 14h · E-03 63h · E-04 32h · E-05 8h · E-06 8h · E-07 9h
