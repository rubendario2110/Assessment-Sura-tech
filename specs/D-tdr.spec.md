# Spec D: Technical Decision Record

## Goal
Produce a one-page Technical Decision Record (TDR) covering two architectural decisions for the Digital Direct Channel program:
1. Centralized integration platform vs decentralized team-owned integrations.
2. Event-driven vs synchronous request/response architecture for critical flows.

## Scope
- Single one-page document (rendered as Section D of `docs/assessment.md`).
- Each decision uses the structure: Context, Options Considered, Decision, Consequences.
- Captures evaluation dimensions and explicit tradeoffs, not just a verdict.
- Aligned with the target architecture (Spec A) and the integration framework (Spec B).

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
