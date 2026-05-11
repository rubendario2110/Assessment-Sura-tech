# Product Backlog — Technical Lead Practical Assessment

Traceable backlog derived from `docs/assessment-input.md`, `specs/A-architecture.spec.md`, `specs/B-integration-framework.spec.md`, `specs/C-demo-service.spec.md`, and `specs/D-tdr.spec.md`.

## Conventions

- IDs: Epics `E-NN`, Stories `US-NNN`, Tasks `T-NNN`.
- Estimates: Story Points (SP) on Fibonacci scale (1, 2, 3, 5, 8, 13). Tasks in ideal focus hours.
- Story format: `As a <role>, I want <capability>, so that <outcome>`.
- Tags: `[A]` Architecture/Roadmap, `[I]` Integration Modernization / resilience, `[O]` Observability/Operations, `[D]` Technical Decision Record, `[S]` Submission/Governance.
- **Dependencies:** and **Risks:** appear per story as required for traceability.

---

## Epic Index

| Epic | Workstream | Title | Spec | Stories | SP | Est. task hours |
| --- | --- | --- | --- | --- | --- | --- |
| E-01 | Architecture / DDD / C4 | Target architecture foundations | A | US-001–US-004 | 18 | 36 |
| E-02 | Reliability + Roadmap | HA/DR, patterns, 12-week roadmap | A | US-005–US-007 | 18 | 34 |
| E-03 | Integration Modernization | Reusable integration framework | B | US-008–US-012 | 34 | 84 |
| E-04 | Integration Modernization | Demo services & reliability exercise | C | US-013–US-015 | 29 | 58 |
| E-05 | Observability/Operations | Telemetry path & SLO narrative | A, C | US-016–US-017 | 8 | 12 |
| E-06 | Governance / Release | TDR & submission package | D, All | US-018–US-020 | 14 | 24 |
| **Total** | | | | **20 stories** | **121 SP** | **248 h** |

---

## E-01 — Target Architecture Foundations `[A]`

### US-001 — DDD bounded contexts and context map · `5 SP`

> As an enterprise architect, I want bounded contexts and a context map documented for the Digital Direct Channel, so that teams align on ownership and integration seams across countries.

**Traceability:** Assessment Section A; Spec A — Scope (DDD), Acceptance (DDD framing).

**Acceptance criteria:**

- Bounded contexts include Customer, Quoting, Policy, Payments, Notifications, Identity, Catalog/Reference, and Integration (per Spec A).
- Context map expresses Customer/Supplier, Anti-Corruption Layer, and Open Host relationships where applicable.
- Key domain events are listed per context (at least one per context).

**Tasks:**

- T-001 Facilitate context workshop and freeze context list — 4h
- T-002 Author context map (Mermaid) — 4h
- T-003 Enumerate domain events and aggregates — 4h

**Dependencies:** None.  
**Risks:** Missing authoritative domain SMEs → document assumptions in `docs/assessment.md` and evidence.

---

### US-002 — C4 System Context diagram · `3 SP`

> As a stakeholder, I want a C4 System Context view, so that external actors and systems are visible at a glance.

**Traceability:** Spec A — Output `docs/c4-system-context.mmd`; Assessment Section A deliverable (diagram trace).

**Acceptance criteria:**

- Diagram renders as Mermaid without errors.
- Customers, partners, regulators/back-office, and core external systems appear with directional relationships.
- References embedded or linked from `docs/assessment.md`.

**Tasks:**

- T-004 Draft `docs/c4-system-context.mmd` — 3h
- T-005 Validate render and narrative alignment — 2h

**Dependencies:** US-001 (shared vocabulary).  
**Risks:** Incomplete inventory of legacy cores → mark open questions explicitly.

---

### US-003 — C4 Container diagram · `5 SP`

> As a solution architect, I want a Container diagram for the Azure-first topology, so that runtime responsibilities and multi-region posture are clear.

**Traceability:** Spec A — Output `docs/c4-container.mmd`; NFRs (HA, latency, DR).

**Acceptance criteria:**

- Containers include channel entry (gateway/BFF), domain services, integration layer, messaging backbone, data stores, identity, and observability sinks (Azure-first labels).
- Multi-region active-active intent is represented.
- Technology choices are consistent with Spec A assumptions (APIM, AKS, Service Bus, Cosmos DB/Azure SQL, Monitor/App Insights, Key Vault, App Configuration).

**Tasks:**

- T-006 Inventory containers and interfaces — 4h
- T-007 Implement `docs/c4-container.mmd` — 4h
- T-008 Peer review vs NFR checklist — 2h

**Dependencies:** US-002.  
**Risks:** Scope creep on optional platforms → timebox and defer to open questions.

---

### US-004 — C4 Component diagram (Integration Layer) · `5 SP`

> As an integration lead, I want a Component diagram for the integration layer, so that resilience controls map to concrete modules.

**Traceability:** Spec A — Output `docs/c4-component-integration-layer.mmd`; resilience mapping acceptance.

**Acceptance criteria:**

- Components cover outbound client, retry policy, circuit breaker (`opossum`), bulkhead/concurrency guard, idempotency helper, structured logger, and tracing propagation.
- Each component notes related controls (timeout, retry+jitter, breaker, trace propagation).
- Cross-reference to `packages/integration-framework` layout (domain/application/infrastructure/interfaces).

**Tasks:**

- T-009 Draft component breakdown aligned to package modules — 5h
- T-010 Complete `docs/c4-component-integration-layer.mmd` + legend — 4h

**Dependencies:** US-003; US-008 started (conceptual API alignment).  
**Risks:** Diagram drift vs implementation → review checkpoint end of Sprint 3.

---

## E-02 — Reliability, Patterns & 12-Week Program Roadmap `[A]` `[I]`

### US-005 — Multi-region HA/DR and availability posture · `8 SP`

> As a reliability engineer, I want HA/DR narrative with measurable targets, so that we defend 99.95% journeys, RTO/RPO, and traffic steering.

**Traceability:** Spec A — NFR (availability, DR, multi-region).

**Acceptance criteria:**

- States availability objective (99.95% critical journeys) and active-active posture with health-based steering.
- Documents RTO ≤ 30 minutes and RPO ≤ 5 minutes for critical domains (per Spec A).
- Explains blast-radius containment hooks (bulkheads, breaker boundaries) at platform level.

**Tasks:**

- T-011 Author HA/active-active narrative — 6h
- T-012 Author DR, backup, and failover flows — 6h
- T-013 Cross-check against Container diagram — 4h

**Dependencies:** US-003 (topology).  
**Risks:** Unknown legacy RPO realities → flag assumptions and verification tasks.

---

### US-006 — Integration patterns catalog in target architecture · `5 SP`

> As an assessor, I want explicit mapping of resilience patterns, so that Section A ties to the implemented framework (Spec B) and demo (Spec C).

**Traceability:** Assessment Section A.2; Spec A — integration patterns; Spec B/C linkage.

**Acceptance criteria:**

- Describes timeouts, retries with exponential backoff and jitter, circuit breaker, idempotency, bulkheads, asynchronous messaging (where applicable), and caching strategies.
- Maps each pattern to components/containers and notes boundaries (sync UX vs async workflows).

**Tasks:**

- T-014 Write pattern catalog section for `docs/assessment.md` — 8h

**Dependencies:** US-004 (integration components).  
**Risks:** Overlap with Spec B prose → single source of truth with cross-links.

---

### US-007 — 12-week technical roadmap (three workstreams) · `5 SP`

> As a program lead, I want a 12-week roadmap spanning Reliability, Integration Modernization, and Observability/Operations, so that Section A.3 and Spec A acceptance are satisfied.

**Traceability:** Assessment Section A.3; Spec A — roadmap acceptance.

**Acceptance criteria:**

- Roadmap spans 12 weeks with visible allocation across **Reliability**, **Integration Modernization**, and **Observability/Operations**.
- Includes milestones, sequencing notes, dependencies, and exit criteria per workstream.
- Aligns sprint breakdown in `docs/plan-scrum.md` with narrative (no contradiction).

**Tasks:**

- T-015 Draft roadmap chapter with milestones — 6h
- T-016 Align wording to sprint goals S1–S6 — 4h

**Dependencies:** US-005, US-006 (content inputs).  
**Risks:** Roadmap vs backlog drift → TL owns single update ritual each sprint.

---

## E-03 — Reusable Integration Framework `[B]`

### US-008 — Resilient HTTP execution core · `13 SP`

> As a service developer, I want outbound HTTP calls with timeout, bounded retries (backoff+jitter), circuit breaker (`opossum`), and bulkhead limits, so that upstream instability is isolated.

**Traceability:** Assessment Section B; Spec B — Scope & NFR.

**Acceptance criteria:**

- AbortController (or equivalent) enforces per-call timeout with safe cancellation.
- Retry policy uses exponential backoff with jitter and a retry budget.
- Circuit breaker exhibits CLOSED/OPEN/HALF_OPEN behavior per dependency.
- Bulkhead/concurrency limit is configurable per dependency.
- Package lives under `packages/integration-framework` with clean abstraction decoupled from domain code.

**Tasks:**

- T-017 Implement HTTP client abstraction + plumbing — 8h
- T-018 Implement retry orchestrator (backoff + jitter + budget) — 8h
- T-019 Integrate `opossum` circuit breaker wrapper — 8h
- T-020 Implement bulkhead / concurrency guard — 6h
- T-021 Wire timeout + cancellation — 4h

**Dependencies:** US-009 recommended in parallel for configuration knobs.  
**Risks:** API churn blocking Spec C → freeze public client surface by end of Sprint 3.

---

### US-009 — Centralized configuration and structured logging · `5 SP`

> As an operator, I want env-driven configuration and unified JSON logs, so that behavior is tunable without code changes and logs are triage-ready.

**Traceability:** Spec B — centralized configuration, unified logging fields.

**Acceptance criteria:**

- All major knobs (timeouts, retries, breaker thresholds, concurrency) configurable via environment variables (documented).
- Logs are structured JSON including timestamp, level, service, traceId, spanId, dependency, attempt, outcome, latencyMs (per Spec B).

**Tasks:**

- T-022 Implement configuration module + env schema — 6h
- T-023 Implement structured logger facade — 6h

**Dependencies:** Package scaffold exists (Sprint 1–2).  
**Risks:** Secret leakage via logs → redaction rules documented.

---

### US-010 — Trace propagation, typed errors, and OTLP-ready telemetry · `5 SP`

> As an SRE, I want W3C `traceparent` propagation and typed errors, so that failures are diagnosable and OpenTelemetry export can be enabled in demo/prod-like setups.

**Traceability:** Spec B — tracing.ts conventions, typed errors, OTLP env configuration.

**Acceptance criteria:**

- Outbound calls propagate trace context (`traceparent`) consistent with existing tracing helpers.
- Callers can branch on TimeoutError, CircuitOpenError, UpstreamError, ValidationError (minimum set per Spec B intent).
- OTLP endpoint configuration supported via env vars without coupling to a single vendor exporter.

**Tasks:**

- T-024 Extend tracing helpers + header propagation — 6h
- T-025 Implement typed error taxonomy — 4h
- T-026 OTLP/demo wiring hooks (non-domain) — 4h

**Dependencies:** US-008 (call path).  
**Risks:** Collector misconfiguration → covered by US-016 smoke checklist.

---

### US-011 — Idempotency key support · `3 SP`

> As an API designer, I want idempotency key generation and header propagation for mutations, so that duplicate submissions are safe at the edge of integration.

**Traceability:** Assessment Section B; Spec B — idempotency scope (caller-owned persistence).

**Acceptance criteria:**

- Helpers generate/propagate idempotency keys for mutation operations.
- Documentation states persistence/dedupe is owned by services (framework does not claim durable dedupe).

**Tasks:**

- T-027 Implement idempotency helper + header pass-through — 4h

**Dependencies:** US-008 (HTTP pipeline).  
**Risks:** Teams assume framework-level dedupe → explicit narrative in `docs/assessment.md`.

---

### US-012 — DDD package layout and unit tests · `8 SP`

> As a maintainer, I want DDD layering and unit tests mirroring modules, so that the package meets Spec B structure and quality gates.

**Traceability:** Spec B — DDD folders and unit tests under `test/unit/**`.

**Acceptance criteria:**

- Folders exist: `domain/`, `application/`, `infrastructure/`, `interfaces/`, `index.ts` exports stable surface.
- Unit tests cover retry, breaker policy interactions (mocked), timeout behavior, logging fields, and idempotency helper.

**Tasks:**

- T-028 Restructure or verify package layers — 4h
- T-029 Author/expand unit tests — 16h

**Dependencies:** US-008–US-011 (behaviors to test).  
**Risks:** Flaky timing tests → use fake timers and deterministic jitter in tests.

---

## E-04 — Demo Service & Reliability Exercise `[C]`

### US-013 — Flaky upstream simulator · `8 SP`

> As a demo operator, I want a configurable flaky upstream service, so that failure modes are reproducible for interviews and automation.

**Traceability:** Spec C — `src/contexts/upstream/**`, Non-functional (deterministic-enough demo).

**Acceptance criteria:**

- NestJS + Fastify bounded context under `src/contexts/upstream/` exposes behaviors: random latency, intermittent 5xx, sustained outage, slow responses.
- Controls via environment variables and/or query parameters per Spec C.
- Documented default ports and startup commands (`pnpm build` then `dist/` execution pattern).

**Tasks:**

- T-030 Implement upstream modules + flakiness controls — 10h
- T-031 Document run parameters — 6h

**Dependencies:** US-008 (for integration testing hooks optional).  
**Risks:** Nondeterministic scenarios → seed randomness where applicable for reliability script stability.

---

### US-014 — Channel service consuming the framework · `8 SP`

> As a channel engineer, I want a channel endpoint that calls upstream through `@assessment/integration-framework`, so that resilience behavior is end-to-end visible.

**Traceability:** Spec C — `src/contexts/channel/**`; failure response expectations.

**Acceptance criteria:**

- Channel uses framework client for outbound calls with timeouts/retries/breaker/bulkhead/idempotency headers as configured.
- Under upstream failures, channel returns controlled errors (e.g., 502/503 with structured body) rather than hanging or unhandled exceptions.
- Build-then-run flow documented (Nest metadata preserved).

**Tasks:**

- T-032 Implement channel modules/controllers/handlers — 8h
- T-033 Map upstream faults to stable HTTP contracts — 6h

**Dependencies:** US-008, US-011; US-013 for simulation.  
**Risks:** DI/metadata issues if devs skip `pnpm build` → enforce scripts.

---

### US-015 — Reliability driver, Compose stack, and demo scripts · `13 SP`

> As a QA engineer, I want `pnpm test:reliability` and Docker Compose for Redis/OTel/Jaeger, so that Spec C demonstrations are scripted and fast (< ~2 minutes target).

**Traceability:** Spec C — reliability test, compose, observability path acceptance.

**Acceptance criteria:**

- `src/test/reliability-test.ts` executes scenarios showing retries, breaker transitions OPEN→HALF_OPEN→CLOSED, and summary metrics (status mix, retries, breaker timeline, idempotency dedupe counts).
- `docker-compose.demo.yml` starts Redis + OTel Collector + Jaeger; `pnpm demo:config`, `pnpm demo:up` / `pnpm demo:down` behave as specified.
- Idempotency dedupe demonstrated with in-memory store for demo (Map) per Spec C assumptions.
- Telemetry path documented: app → collector → Jaeger.

**Tasks:**

- T-034 Implement reliability traffic driver + assertions/summary — 10h
- T-035 Author `docker-compose.demo.yml` + `observability/otel-collector-config.yaml` — 8h
- T-036 Wire `package.json` scripts (`test:reliability`, demo scripts) — 4h
- T-037 Implement demo idempotency store + verification hooks — 6h

**Dependencies:** US-013, US-014; US-016 for collector validation.  
**Risks:** Local Docker variance → document prerequisites and fallback single-host mode.

---

## E-05 — Observability & Operations `[A]` `[O]` `[C]`

### US-016 — OTel Collector integration and operational hooks · `5 SP`

> As an operations engineer, I want a verified OTLP pipeline and runbook notes, so that traces/logs are demonstrable during the assessment demo.

**Traceability:** Spec A observability stack; Spec C — collector config & Jaeger visibility.

**Acceptance criteria:**

- `observability/otel-collector-config.yaml` reviewed against receivers/exporters used locally.
- Smoke checklist documents ports, Jaeger UI link, and common failure modes.
- References added to `docs/runbook.md` or `docs/assessment.md` Section C as appropriate.

**Tasks:**

- T-038 Validate/adjust collector configuration — 4h
- T-039 Write operational smoke checklist — 4h

**Dependencies:** US-010 (instrumentation); US-015 partial overlap acceptable.  
**Risks:** Port collisions on developer laptops → document overrides.

---

### US-017 — SLO/SLI and alerting narrative · `3 SP`

> As a service owner, I want SLIs/SLOs and alerting principles documented, so that Observability/Operations workstream closure criteria in Spec A are met.

**Traceability:** Spec A — observability stack & operational workflows.

**Acceptance criteria:**

- Defines SLIs for availability/latency/error budget for critical APIs (aligned with P95 < 400 ms sync path).
- Describes dashboards (Azure Monitor/App Insights alignment) and incident workflow hooks at high level.

**Tasks:**

- T-040 Author SLO/SLI + alerting subsection — 4h

**Dependencies:** US-005 (targets).  
**Risks:** Lack of production telemetry → keep hypothesis-level with validation tasks flagged.

---

## E-06 — Governance & Technical Decisions `[D]` `[S]`

### US-018 — TDR: centralized integration platform vs decentralized ownership · `3 SP`

> As a steering committee member, I want a concise decision on centralized vs decentralized integrations, so that organizational tradeoffs are explicit.

**Traceability:** Assessment Section D.1; Spec D — evaluation dimensions.

**Acceptance criteria:**

- Sections: Context, Options Considered, Decision, Consequences (positives, negatives, mitigations).
- Addresses autonomy, lead time, reliability blast radius, operational complexity, governance/security/compliance, cost, and multi-country rollout impact.

**Tasks:**

- T-041 Author decision record fragment in `docs/assessment.md` — 4h

**Dependencies:** US-006 (architectural alignment).  
**Risks:** Decision churn → timebox review with Tech Lead sign-off.

---

### US-019 — TDR: event-driven vs synchronous critical flows · `3 SP`

> As a product architect, I want a documented stance on event-driven versus synchronous patterns for critical flows, so that UX-critical paths are defensible.

**Traceability:** Assessment Section D.2; Spec D — critical flows definition.

**Acceptance criteria:**

- Same TDR structure as US-018 with explicit tradeoffs (not only the chosen option).
- Aligns with Spec A messaging + synchronous API narrative.

**Tasks:**

- T-042 Author second decision fragment — 4h

**Dependencies:** US-007 (roadmap/workstreams).  
**Risks:** Country-specific regulatory mandates unknown → capture mitigations and review gates.

---

### US-020 — Submission package: Sections A–D integration and diagram evidence · `8 SP`

> As a submitter, I want consolidated `docs/assessment.md` plus diagram exports/links and evidence pointers, so that written submission requirements are satisfied.

**Traceability:** Assessment submission format; Spec A–D output files list.

**Acceptance criteria:**

- `docs/assessment.md` contains coherent Sections A–D without contradiction to diagrams/specs.
- At least one architecture diagram satisfies Assessment Section A (image under `docs/` or rendered link).
- Evidence entries appended/updated in `docs/evidence/*` for architecture, implementation, review as applicable.

**Tasks:**

- T-043 Consolidate narrative + cross-links — 8h
- T-044 Export/verify diagram artifact — 4h
- T-045 Evidence sweep and checklist — 4h

**Dependencies:** All prior stories (final sweep).  
**Risks:** Last-minute edits breaking Mermaid → CI/render check before submission.

---

## Dependency Register (high level)

| From | To | Reason |
| --- | --- | --- |
| US-003 | US-002 | Container inherits actors/systems |
| US-004 | US-003 | Components map to containers |
| US-006 | US-004 | Pattern mapping references integration components |
| US-007 | US-005, US-006 | Roadmap content inputs |
| US-008 | Package scaffold | Implementation start |
| US-010 | US-008 | Trace/error hooks on call path |
| US-011 | US-008 | Header/idempotency on pipeline |
| US-012 | US-008–US-011 | Tests require behaviors |
| US-014 | US-008, US-011, US-013 | End-to-end demo path |
| US-015 | US-013, US-014 | Driver needs running services |
| US-016 | US-010, US-015 | Collector path validation |
| US-020 | US-001–US-019 | Final packaging |

---

## Risk Register (summary)

| ID | Risk | Mitigation |
| --- | --- | --- |
| R-01 | Framework public API churn blocks demo | API freeze review end Sprint 3; semantic versioning note in package |
| R-02 | Flaky reliability test undermines demo | Seeded randomness, bounded timeouts, narrative tolerance bands |
| R-03 | OTel/Jaeger mismatch | Smoke checklist (US-016), pinned collector image tags |
| R-04 | Diagram vs code drift | Quarterly-ish review tied to Sprint 3/6 milestones |
| R-05 | One-page TDR density vs completeness | `review-agent` editorial pass; appendix ban |
