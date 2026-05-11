# Spec D: Technical Decision Record

## Goal
Produce a one-page Technical Decision Record (TDR) covering two architectural decisions for the Digital Direct Channel program:
1. Centralized integration platform vs decentralized team-owned integrations.
2. Event-driven vs synchronous request/response architecture for critical flows.

## Scope
- Single **one-page** Technical Decision Record (assessment Section D), rendered as Section D of `docs/assessment.md`.
- Covers exactly two comparisons:
  1. **Centralized integration platform** vs **decentralized team-owned integrations**.
  2. **Event-driven** vs **synchronous request-response** for **critical flows**.
- Each decision uses the structure: **Context**, **Options Considered**, **Decision**, **Consequences**.
- Captures evaluation dimensions and explicit tradeoffs, not only the chosen option.
- Aligned with the target architecture (Spec A), Azure-first constraints, and the integration framework (Spec B).

## Non-Functional Requirements
- Length and density: **one printed page** (or equivalent) — concise, decision-grade, suitable for leadership review.
- Language: **English** only (matches assessment submission rules).
- Traceability: recommendations must remain consistent with Spec A (multi-country Digital Direct Channel) and Spec B (standardized resilience + observability).
- Auditability: consequences must state **positive and negative** outcomes and practical mitigations (no hand-waving).

## Evaluation Dimensions
- Team autonomy vs standardization.
- Change lead time and developer experience.
- Reliability, fault isolation, and blast radius.
- Operational complexity (run, observe, support).
- Governance, security, and compliance.
- Cost (people + platform) and time-to-value.
- Country rollout impact (multi-country considerations).

## Acceptance Criteria
- Two decisions documented, each with Context, Options, Decision, Consequences.
- Tradeoffs and risks explicitly stated for each option, not only the chosen one.
- Clear, justified recommendation per decision, consistent with Spec A and Spec B.
- Document fits a one-page narrative (concise, decision-grade).
- Consequences include both positive and negative outcomes plus mitigations.

## Output Files / Evidence Expected
- `docs/assessment.md` (Section D: one-page TDR with both decisions)
- `docs/evidence/architecture-agent-evidence.md` and/or `docs/evidence/review-agent-evidence.md` (entries for the decisions and review)

## Open Questions and Assumptions
- Assumption: A hybrid model is acceptable as a recommendation (e.g., centralized framework + decentralized ownership) when justified.
- Assumption: "Critical flows" include policy issuance, payments confirmation, and customer-facing transactional UX paths.
- Open: Existing platform/team topology (Team Topologies framing) — assumed stream-aligned teams with one platform team.
- Open: Current event backbone availability and maturity (assumed: Azure Service Bus available; Event Grid/Event Hubs evaluated as needed).
- Open: Regulatory constraints that could force synchronous flows for auditability in specific countries.
