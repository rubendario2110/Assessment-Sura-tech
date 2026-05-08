# Scrum Plan — 12 Weeks · 6 Sprints (2 weeks each)

Built from `specs/*.spec.md` and `docs/assessment-input.md`. Backlog reference: `docs/backlog.md`.

## Planning Assumptions

- Cadence: 6 sprints × 2 weeks = 12 weeks.
- Team: 1 Tech Lead + 2 Senior Engineers + 1 SRE (4 FTE). Tech Lead carries planning/architecture/review load.
- Capacity (focus): ~30 focus h/week per FTE → ~240 focus h per sprint per team. Engineering capacity reserved for delivery is ~120 h/sprint after planning/review/incidents/research overhead.
- Velocity target: 17–19 SP per sprint (conservative for an assessment-grade workload). Average ~5 h per SP.
- Working agreement: Definition of Ready before Sprint Planning; Definition of Done validated in Sprint Review.
- Quality gates: `pnpm exec tsc --noEmit` green; Mermaid diagrams render; demo end-to-end runs.
- Subagent usage: `architecture-agent`, `implementation-agent`, `review-agent` invoked per sprint goal as noted.

## Distribution Snapshot

| Sprint | Weeks | Goal | SP | Focus h | Stories |
| --- | --- | --- | --- | --- | --- |
| S1 | 1–2 | Architecture foundations + framework scaffold | 18 | ~35 | US-001, US-002, US-009, US-010, US-018 |
| S2 | 3–4 | Runtime topology + retry/timeout policies | 18 | ~33 | US-003, US-004, US-011, US-012 |
| S3 | 5–6 | Resilience core + HA/DR + structured logging | 19 | ~33 | US-005, US-013, US-014, US-015, US-016 |
| S4 | 7–8 | Observability + Section A narrative + demo services | 19 | ~33 | US-017, US-019, US-020, US-006, US-025 |
| S5 | 9–10 | Reliability test + demo polish + roadmap | 17 | ~26 | US-021, US-022, US-027, US-026, US-007 |
| S6 | 11–12 | SLOs + TDRs + submission package | 17 | ~23 | US-008, US-023, US-024, US-028, US-029, US-030 |
| Total |  |  | 108 | ~183 |  |

---

## Definition of Ready (per story)

- Acceptance criteria are unambiguous and testable.
- Dependencies are resolved or scheduled in the same/earlier sprint.
- Owner identified; subagent identified if applicable.
- Risks listed with mitigation.

## Definition of Done (per story)

- Acceptance criteria verified.
- Code compiles (`pnpm exec tsc --noEmit`) where applicable.
- Diagrams render (Mermaid) where applicable.
- Documentation/section in `docs/assessment.md` updated where applicable.
- Evidence appended to the appropriate `docs/evidence/<agent>-evidence.md`.

---

## Sprint 1 — Weeks 1–2 · Foundations  (18 SP · ~35 h)

- Sprint goal: Establish architecture vocabulary (DDD + System Context) and the integration framework skeleton (config, errors, HTTP client abstraction).
- Stories committed: US-001 (5), US-002 (3), US-009 (3), US-010 (2), US-018 (5).
- Subagents:
  - `architecture-agent`: drives US-001, US-002.
  - `implementation-agent`: drives US-009, US-010, US-018.
- Key tasks/milestones:
  - T-001..T-003 DDD context map (M1: bounded contexts approved).
  - T-004..T-005 C4 System Context diagram (M2: Mermaid renders).
  - T-023..T-025 Centralized config module (M3: env vars documented).
  - T-026..T-027 Typed error model (M4: error types frozen).
  - T-047..T-049 HTTP client abstraction (M5: public API draft published).
- Exit criteria / DoD:
  - `docs/c4-system-context.mmd` present and renders.
  - `src/framework/{config,errors,http-client}.ts` compile with `pnpm exec tsc --noEmit`.
  - Public API of `http-client` documented in `src/framework/index.ts`.
  - Evidence appended to `docs/evidence/{architecture,implementation}-agent-evidence.md`.

## Sprint 2 — Weeks 3–4 · Topology + Retry/Timeout  (18 SP · ~33 h)

- Sprint goal: Lock runtime topology (Container + Component diagrams) and ship the first resilience policies (timeout + retry with jitter).
- Stories committed: US-003 (5), US-004 (5), US-011 (3), US-012 (5).
- Subagents:
  - `architecture-agent`: US-003, US-004.
  - `implementation-agent`: US-011, US-012.
- Key tasks/milestones:
  - T-006..T-008 Container diagram (M1: tech choices Azure-first frozen).
  - T-009..T-011 Component diagram for integration layer (M2: components mapped to framework modules).
  - T-028..T-029 Timeout + AbortController (M3: hangs eliminated under flaky upstream).
  - T-030..T-033 Retry orchestrator with jitter + retry budget (M4: storms prevented).
- Exit criteria / DoD:
  - `docs/c4-container.mmd` and `docs/c4-component-integration-layer.mmd` render.
  - `src/framework/{retry,timeout helpers}.ts` compile and pass smoke checks against a stub upstream.
  - Evidence appended to architecture + implementation logs.

## Sprint 3 — Weeks 5–6 · Resilience Core + HA  (19 SP · ~33 h)

- Sprint goal: Land circuit breaker (`opossum`), bulkhead, idempotency, and structured logging; document HA/DR posture.
- Stories committed: US-005 (5), US-013 (5), US-014 (3), US-015 (3), US-016 (3).
- Subagents:
  - `architecture-agent`: US-005.
  - `implementation-agent`: US-013, US-014, US-015, US-016.
- Key tasks/milestones:
  - T-012..T-014 HA/DR strategy (M1: RTO/RPO documented per critical domain).
  - T-034..T-037 `opossum` wrapper + events wired to logger (M2: OPEN/HALF_OPEN/CLOSED visible).
  - T-038..T-039 Bulkhead semaphore (M3: BULKHEAD_FULL surfaced as typed error).
  - T-040..T-042 Idempotency key generator + propagation (M4: contract documented).
  - T-043..T-044 JSON logger module (M5: required fields enforced).
- Exit criteria / DoD:
  - HA/DR section drafted (will be folded into `docs/assessment.md` Section A in S4).
  - `src/framework/{circuit-breaker,bulkhead,idempotency,logger}.ts` compile.
  - `pnpm add opossum` reflected in `package.json` and `pnpm-lock.yaml`.
  - Evidence appended.

## Sprint 4 — Weeks 7–8 · Observability + Section A + Demo Services  (19 SP · ~33 h)

- Sprint goal: Complete observability primitives, finalize Section A narrative, and stand up the demo services (`upstream`, `channel`).
- Stories committed: US-017 (3), US-019 (5), US-020 (5), US-006 (3), US-025 (3).
- Subagents:
  - `architecture-agent`: US-006.
  - `implementation-agent`: US-017, US-019, US-020, US-025 (run in parallel where files don't overlap).
- Key tasks/milestones:
  - T-045..T-046 W3C `traceparent` propagation (M1: end-to-end correlation works).
  - T-050..T-052 Flaky upstream simulator (M2: failure modes configurable via env).
  - T-053..T-055 Channel service consuming framework (M3: degraded responses on failure).
  - T-015..T-016 Section A.1 + A.2 narrative in `docs/assessment.md` (M4: cross-linked to diagrams).
  - T-065..T-066 Logger wired into both demo services (M5: shared trace ids per request).
- Exit criteria / DoD:
  - `src/contexts/upstream/main.ts` and `src/contexts/channel/main.ts` start with `pnpm start:upstream` / `pnpm start:channel` (compile-then-run; `tsx` strips `emitDecoratorMetadata` and breaks Nest/CQRS DI).
  - `docs/assessment.md` Sections A.1 and A.2 complete and reference C4 diagrams.
  - Evidence appended.

## Sprint 5 — Weeks 9–10 · Reliability Test + Demo Polish + Roadmap  (17 SP · ~26 h)

- Sprint goal: Prove resilience end-to-end with the reliability test, polish demo runbook, and publish the 12-week roadmap matrix.
- Stories committed: US-021 (5), US-022 (3), US-027 (2), US-026 (2), US-007 (5).
- Subagents:
  - `implementation-agent`: US-021, US-022, US-027.
  - `architecture-agent`: US-007.
  - `review-agent`: spot-check on outcome summary correctness for US-021/US-027.
- Key tasks/milestones:
  - T-056..T-058 Traffic generator + outcome summary (M1: < 2 min run; expected status mix).
  - T-068..T-069 CB transitions surfaced in summary (M2: OPEN→HALF_OPEN→CLOSED visible).
  - T-067 Runbook notes (M3: triage steps documented).
  - T-059..T-060 Section C narrative + run instructions (M4: reproducible).
  - T-017..T-019 Roadmap matrix + KPIs (M5: 12 weeks × 3 workstreams).
- Exit criteria / DoD:
  - Reliability test runs to completion with documented outcome.
  - Section C complete in `docs/assessment.md`.
  - Section A.3 (roadmap) drafted.
  - Evidence appended.

## Sprint 6 — Weeks 11–12 · SLOs + TDRs + Submission  (17 SP · ~23 h)

- Sprint goal: Ship the SLO/SLI catalog, the two TDRs (Section D), and the final submission package with quality gates.
- Stories committed: US-008 (3), US-023 (3), US-024 (3), US-028 (3), US-029 (2), US-030 (3).
- Subagents:
  - `architecture-agent`: US-008, US-023, US-024.
  - `review-agent`: US-028, US-029, US-030.
- Key tasks/milestones:
  - T-020..T-022 SLO/SLI catalog + error budget policy (M1: aligned to 99.95%).
  - T-061..T-064 Two TDRs in Section D (M2: one-page format respected).
  - T-070..T-071 Final pass on `docs/assessment.md` (M3: all sections cross-linked).
  - T-072..T-073 Evidence audit + backfill (M4: every agent has up-to-date entries).
  - T-074..T-076 Quality gates: static checks + demo end-to-end + review evidence (M5: submission-ready).
- Exit criteria / DoD:
  - All four sections (A/B/C/D) in `docs/assessment.md` complete.
  - All evidence logs current.
  - `pnpm exec tsc --noEmit` green; demo end-to-end demonstrated and captured.
  - Submission checklist ticked in `docs/assessment.md`.

---

## Cross-Sprint Dependencies (high-level)

- E-03 (framework) must reach minimum viable state by end of S3 to unblock E-04 demo (S4–S5).
- C4 Component diagram (US-004, S2) depends on framework module map (US-009/US-010/US-018, S1).
- Section A narrative (US-006, S4) depends on US-001..US-005 completion.
- TDRs (S6) reference Spec A and Spec B outcomes; safe to author last.
- Reliability test (US-021, S5) depends on `upstream` + `channel` + framework being feature-complete.

## Risks (sprint-level)

- S1: Public API of HTTP client churns later sprints → mitigate with explicit API freeze at end of S1.
- S2: Mermaid C4 diagrams may diverge from final framework → re-validate at end of S3.
- S3: `opossum` event semantics under load may surprise → add smoke tests against simulator.
- S4: Demo services may surface framework defects → reserve buffer in S4 for hot-fixes.
- S5: Reliability test flakiness may obscure assertions → use seeded RNG and scenario presets.
- S6: One-page constraint on TDR vs depth → review-agent enforces length cap.

## Working Agreements

- Daily 15-min sync; written async update in evidence logs at sprint boundaries.
- Pull-request small and reviewed; linked to story ID and task ID.
- Spec change requests handled via `/specs` re-run; never edited ad hoc.
- Architecture changes require `architecture-agent` evidence entry.
- All resilience-related changes require `implementation-agent` evidence entry plus a smoke run against the upstream simulator.
