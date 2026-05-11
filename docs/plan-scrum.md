# Scrum Plan — 12 Weeks · 6 Sprints (2 Weeks Each)

Derived from `docs/assessment-input.md`, `specs/A-architecture.spec.md`, `specs/B-integration-framework.spec.md`, `specs/C-demo-service.spec.md`, `specs/D-tdr.spec.md`. Authoritative backlog and estimates: `docs/backlog.md`.

## Planning Assumptions

- **Cadence:** 6 sprints × 2 weeks = **12 weeks**.
- **Team:** 1 Tech Lead + 2 Senior Engineers + 1 SRE (**4 FTE**). The Tech Lead owns architecture coherence, backlog refinement, and submission readiness.
- **Capacity:** ~30 ideal focus hours per FTE per week → **~240 h/sprint** gross. **~140–160 h/sprint** treated as sustainable delivery capacity after ceremonies, incidents, and clarifications (assessment-shaped workload).
- **Velocity:** Target **18–24 SP/sprint**; backlog totals **121 SP** (~20 SP/sprint average).
- **Estimation:** Story points (Fibonacci) for stories; ideal hours on tasks (see `docs/backlog.md`). Approximate **2.0 h/SP** portfolio average for this backlog (248 task hours / 121 SP).
- **Quality gates:** `pnpm exec tsc --noEmit` green where applicable; Mermaid diagrams render; `pnpm build` before Nest demos; reliability script completes in target duration (~2 minutes per Spec C intent).
- **Tooling alignment:** Integration framework under `packages/integration-framework`; demo contexts under `src/contexts/channel` and `src/contexts/upstream`; circuit breaker via `opossum` per Spec B.

## Workstreams (Assessment Section A.3)

Workstreams are reflected **both** in roadmap narrative (US-007) and in epic tagging in `docs/backlog.md`:

| Workstream | Primary epics |
| --- | --- |
| Reliability | E-01, E-02 (HA/DR, patterns), E-04 (reliability exercise) |
| Integration Modernization | E-03 (framework), E-04 (consumption & scenarios) |
| Observability/Operations | E-05, plus observability acceptance in E-03/E-04 |

---

## Distribution Snapshot (must match `docs/backlog.md`)

| Sprint | Weeks | Sprint goal (one line) | Committed stories | Story points | Est. task hours (sum of tasks) |
| --- | --- | --- | --- | --- | --- |
| S1 | 1–2 | Establish domain/C4 vocabulary, HA posture, and SLO narrative foundations | US-001, US-002, US-005, US-017 | 19 | 37 |
| S2 | 3–4 | Freeze topology diagrams, integration pattern catalog, and written 12-week roadmap | US-003, US-004, US-006, US-007 | 20 | 37 |
| S3 | 5–6 | Deliver resilient HTTP core, configuration/logging, and idempotency plumbing | US-008, US-009, US-011 | 21 | 50 |
| S4 | 7–8 | Complete tracing/errors/tests and operationalize telemetry smoke path | US-010, US-012, US-016 | 18 | 42 |
| S5 | 9–10 | Implement flaky upstream and channel demo plus first TDR decision | US-013, US-014, US-018 | 19 | 34 |
| S6 | 11–12 | Automate reliability scenarios, finish second TDR, and lock submission package | US-015, US-019, US-020 | 24 | 48 |
| **Total** | **12 weeks** | Coverage for Assessment Sections **A–D** | **US-001–US-020** | **121** | **248** |

---

## Definition of Ready

- Acceptance criteria are testable and trace to specs A/B/C/D.
- Dependencies mapped to an equal or earlier sprint in this plan.
- Risks logged with mitigations (see `docs/backlog.md`).
- UX/demo flows identified where stories touch Section C.

## Definition of Done (global)

- Acceptance criteria satisfied and reviewed by Tech Lead or delegate.
- Code compiles and tests relevant to the story pass (`pnpm` scripts as applicable).
- Diagrams render where stories produced or modified Mermaid sources.
- `docs/assessment.md` updated when the story affects submission narrative (Sections A–D).
- Evidence appended to the appropriate `docs/evidence/*.md` file when the story produces decisions or runs.

---

## Sprint 1 — Weeks 1–2 · Foundations & Reliability Narrative

- **Sprint goal:** Establish shared domain language, external System Context, HA/DR posture, and observability targets narrative.
- **Stories committed:** US-001 (5), US-002 (3), US-005 (8), US-017 (3) → **19 SP**.
- **Key tasks / milestones:** T-001–T-003 bounded contexts; T-004–T-005 system context diagram; T-011–T-013 HA/DR alignment; T-040 SLO/SLI draft.
- **Exit criteria / DoD:** `docs/c4-system-context.mmd` renders; HA/RTO/RPO narrative present in assessment draft; SLO subsection drafted and consistent with NFRs.

## Sprint 2 — Weeks 3–4 · Topology, Patterns, Roadmap

- **Sprint goal:** Complete Container and Integration Component diagrams, publish integration pattern catalog, and lock the 12-week roadmap story.
- **Stories committed:** US-003 (5), US-004 (5), US-006 (5), US-007 (5) → **20 SP**.
- **Key tasks / milestones:** T-006–T-008 container diagram; T-009–T-010 integration components; T-014 pattern catalog; T-015–T-016 roadmap chapter synchronized with this file.
- **Exit criteria / DoD:** Container + integration component diagrams render; roadmap explicitly budgets Reliability / Integration Modernization / Observability workstreams; no contradictions between roadmap tables and sprint commitments.

## Sprint 3 — Weeks 5–6 · Framework Execution Core

- **Sprint goal:** Ship resilient outbound HTTP behavior with tunable policies and early idempotency support.
- **Stories committed:** US-008 (13), US-009 (5), US-011 (3) → **21 SP**.
- **Key tasks / milestones:** T-017–T-021 client/timeout/retry/breaker/bulkhead; T-022–T-023 configuration + JSON logging; T-027 idempotency helper; **milestone:** public client API freeze checkpoint.
- **Exit criteria / DoD:** Framework demonstrates timeout + retry+jitter + `opossum` breaker + bulkhead on stub upstream; env knobs documented; idempotency header path implemented.

## Sprint 4 — Weeks 7–8 · Observability Plumbing & Test Harness

- **Sprint goal:** Finalize tracing/error taxonomy, strengthen unit tests, and validate OTel collector smoke path.
- **Stories committed:** US-010 (5), US-012 (8), US-016 (5) → **18 SP**.
- **Key tasks / milestones:** T-024–T-026 tracing/errors/OTLP hooks; T-028–T-029 DDD layout + unit tests; T-038–T-039 collector validation + checklist.
- **Exit criteria / DoD:** Typed errors consumed by sample caller; unit tests cover core policies; collector config validated against local Jaeger path expectations.

## Sprint 5 — Weeks 9–10 · Demo Services & First TDR

- **Sprint goal:** Stand up flaky upstream and channel services integrated with the framework; publish first architectural TDR.
- **Stories committed:** US-013 (8), US-014 (8), US-018 (3) → **19 SP**.
- **Key tasks / milestones:** T-030–T-031 upstream simulator; T-032–T-033 channel integration + mapped HTTP failures; T-041 centralized vs decentralized TDR.
- **Exit criteria / DoD:** Both contexts build and run via documented `dist/` flow; controlled failure responses verified manually; first TDR merged into `docs/assessment.md`.

## Sprint 6 — Weeks 11–12 · Reliability Automation & Submission

- **Sprint goal:** Execute scripted reliability scenarios, complete remaining TDR, and finalize submission assets.
- **Stories committed:** US-015 (13), US-019 (3), US-020 (8) → **24 SP**.
- **Key tasks / milestones:** T-034 reliability driver; T-035–T-036 Compose + scripts; T-037 demo idempotency verification; T-042 second TDR; T-043–T-045 assessment consolidation + diagram evidence + evidence sweep.
- **Exit criteria / DoD:** `pnpm test:reliability` summarizes retries/breaker/idempotency outcomes; `pnpm demo:*` scripts validated; Sections A–D cohesive; architecture diagram deliverable satisfied; evidence logs updated.

---

## Traceability Matrix (Assessment Sections → Stories)

| Section | Scope | Stories |
| --- | --- | --- |
| A — Architecture & roadmap | E2E architecture, patterns, roadmap | US-001–US-007, US-017 |
| B — Integration framework | Module requirements | US-008–US-012 |
| C — Demo & reliability | Services + automation | US-013–US-015 |
| D — TDR | Dual decisions | US-018–US-019 |
| Submission | Packaging | US-020 |

---

## Dependency & Risk Highlights

- **Critical path:** US-008 → US-014 → US-015 (framework stability before demo wiring and automation).
- **Platform narrative dependency:** Diagrams (US-003, US-004) precede detailed roadmap references (US-007).
- **Top risks:** framework API churn (mitigated by Sprint 3 freeze), nondeterministic reliability runs (seed + thresholds), local Docker friction for OTel/Jaeger (documented overrides), diagram drift vs code (scheduled reviews).
