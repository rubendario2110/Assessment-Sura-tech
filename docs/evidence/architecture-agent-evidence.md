# Architecture Agent Evidence Log

Use this file as an append-only execution log.

## Entry Template
- Timestamp (UTC):
- DDD decisions made:
- C4 artifacts created/updated:
- Explanation artifacts created/updated:
- Azure services selected and rationale:
- Architecture patterns applied and rationale:
- Tradeoffs and rationale:
- Risks and mitigations:
- Open questions:

---

## Entry: 2026-05-08T20:55:14Z
- Timestamp (UTC): 2026-05-08T20:55:14Z
- DDD decisions made:
  - Bounded contexts defined: Quoting (core), Policy (core), Payments (core), Customer/Identity (supporting), Notifications (supporting), Catalog/Reference (supporting), Country/Locale (generic), Integration (generic), Observability (generic).
  - Core vs supporting vs generic explicitly classified.
  - Context map relationships set: Customer/Identity as Open Host (OIDC); Quoting → Policy as Customer/Supplier orchestrated by a Saga; Policy → Payments via Outbox; Payments → Notifications via async events; Catalog → Quoting as Open Host with cache-aside; Country/Locale as Conformist cross-cutting; Integration provides ACL per legacy/partner.
  - High-level aggregates and domain events catalogued (`QuoteAccepted`, `PolicyIssued`, `PolicyAmended`, `PaymentRequested`, `PaymentCaptured`, `PaymentFailed`, `NotificationDispatched`, `CustomerRegistered`).
- C4 artifacts created/updated:
  - Created `docs/c4-system-context.mmd` (Level 1) — actors, system in scope, external systems with directionality.
  - Created `docs/c4-container.mmd` (Level 2) — active-active multi-region topology, BFFs, domain services, integration layer, async backbone, data, ops.
  - Created `docs/c4-component-integration-layer.mmd` (Level 3) — resilience pipeline (idempotency → bulkhead → CB → retry → timeout → cache), structured logger, traceparent, ACL adapters, Redis/Key Vault/App Configuration support.
  - Updated `docs/architecture.mmd` — executive overview replacing the placeholder.
  - Updated `docs/assessment.md` Section A — narrative for A.1 (DDD + topology + HA/SC/RES/OBS), A.2 (integration patterns + NFR mapping), A.3 (12-week roadmap), A.4 (tradeoffs/risks/mitigations).
- Azure services selected and rationale:
  - Azure Front Door + WAF: global edge, geo-routing, DDoS, country affinity.
  - Azure API Management: per-region API gateway with OAuth2/JWT and partner mTLS.
  - Azure Container Apps (default) + AKS (where finer control is needed): NestJS + Fastify services.
  - Azure Service Bus (durable commands/events) + Event Grid (system events / fan-out).
  - Azure SQL with active geo-replication for transactional Policy/Payments.
  - Cosmos DB (multi-region writes) for Quoting drafts and Catalog read models.
  - Azure Cache for Redis: idempotency dedupe store + cache-aside.
  - Azure App Configuration: feature flags + per-country tunables.
  - Azure Key Vault: secrets and rotation.
  - Microsoft Entra ID + Entra External ID (B2C): identity for staff/partners and customers.
  - OpenTelemetry → OTel Collector → Application Insights + Log Analytics + Azure Monitor.
  - GitHub Actions / Azure DevOps + Azure Policy for delivery and governance; Bicep/Terraform IaC.
- Architecture patterns applied and rationale:
  - API Gateway + BFF per channel: keep client contracts focused; isolates web/mobile/partner needs.
  - Hexagonal/Clean architecture per service: keep domain logic free of infrastructure.
  - Anti-Corruption Layer per legacy/partner: protect our model from external semantics.
  - Saga (orchestration): coordinate cross-context transactions (Quote → Issue → Pay → Notify) without distributed locks.
  - Outbox pattern in Policy/Payments: reliable event publishing without dual-write risk.
  - Cache-Aside with single-flight + TTL+jitter: stampede-safe reads for hot reference data.
  - Strangler pattern for legacy modernization: swap capabilities behind stable APIs incrementally.
  - CQRS / read-model projections in Catalog/Quoting: scale reads independently of writes.
  - Resilience pipeline (timeout → retry+jitter → CB (opossum) → bulkhead → idempotency → cache → async) composed centrally in the integration framework, mandated for all outbound calls.
- Tradeoffs and rationale:
  - Active-active multi-region trades operational complexity for availability; mitigated by pinning write-heavy stores per country and using geo-replication.
  - `opossum` mandated by repo standard introduces vendor coupling; mitigated by a thin wrapper that exposes a generic CB interface to callers.
  - Full OTel exporter pipeline kept as roadmap item; in scope ships `traceparent` propagation + structured JSON logs to keep the assessment focused.
  - Hybrid sync/async model preferred over pure event-driven for critical journeys to keep customer-facing UX deterministic; rationalized further in Section D (TDR).
  - Cosmos DB multi-region writes simplify availability but introduce eventual-consistency considerations; mitigated by domain-specific consistency choices (session/strong where required).
- Risks and mitigations:
  - R1 Vendor coupling on Azure managed services. Mitigation: portable abstractions (CB wrapper, message bus interface, config provider interface) so a future cloud move is bounded.
  - R2 Per-country regulatory drift fragments configuration. Mitigation: per-country overrides via App Configuration with strict schema, code review and Azure Policy enforcement.
  - R3 Saga complexity for Quote → Issue → Pay → Notify. Mitigation: use orchestrator with explicit compensations and idempotent steps; observability at every step.
  - R4 Cache-aside stampede on hot keys (Catalog). Mitigation: single-flight + TTL+jitter; per-key bulkhead.
  - R5 CB thresholds misconfigured under load. Mitigation: tune defaults per dependency tier; smoke tests against simulator (Spec C); change via App Configuration with audit.
  - R6 Diagram/code drift over time. Mitigation: Component diagram explicitly references `src/framework/*` modules; revisit at end of Sprint 3 per planning evidence.
- Open questions:
  - Final list of countries in scope and per-country data residency / regulatory constraints.
  - Existing Azure landing zone maturity and platform-team capabilities.
  - Authoritative legacy systems per domain and their published SLAs.
  - Maturity of an existing event backbone (reuse vs greenfield Service Bus/Event Grid).
  - Identity model: customer base on Entra External ID greenfield vs migration from existing IdP.
  - Required PCI scope for the Payments context (impacts segmentation and key management).

---

## Entry: 2026-05-08T21:04:48Z
- Timestamp (UTC): 2026-05-08T21:04:48Z
- DDD decisions made:
  - No new bounded contexts; reaffirmed core (Quoting, Policy, Payments), supporting (Customer/Identity, Notifications, Catalog/Reference) and generic (Country/Locale, Integration, Observability) classification.
  - Reaffirmed context map: Open Host (Identity, Catalog), ACL (Integration → legacy), Customer/Supplier (Quoting → Policy), Outbox (Policy → Payments), async events (Payments → Notifications), Conformist cross-cutting (Country/Locale).
- C4 artifacts created/updated:
  - No structural changes to `docs/c4-system-context.mmd`, `docs/c4-container.mmd`, `docs/c4-component-integration-layer.mmd`, or `docs/architecture.mmd`.
  - Validated alignment with Section A in `docs/assessment.md` (no narrative changes required this run).
  - Cross-link added in Section A to the new explanations document; Submission Checklist updated.
- Explanation artifacts created/updated:
  - Created `docs/c4-diagram-explanations.md` covering all four diagrams (System Context, Container, Component-Integration-Layer, Executive Overview).
  - Each entry includes the mandatory sections: Purpose, Scope and audience, Key elements/components, Main interactions/flows, Resilience/operational considerations, Key design decisions and tradeoffs.
  - Added a closing "How These Diagrams Stay In Sync" section to govern future drift between L1/L2/L3 and the executive overview.
- Azure services selected and rationale:
  - Unchanged from previous entry. Reiterated services: Front Door + WAF, APIM, Container Apps + AKS, Service Bus + Event Grid, Azure SQL (geo-replicated), Cosmos DB (multi-region writes), Redis, App Configuration, Key Vault, Microsoft Entra ID + Entra External ID, OpenTelemetry → Application Insights + Log Analytics + Azure Monitor, GitHub Actions / Azure DevOps + Azure Policy.
- Architecture patterns applied and rationale:
  - Reaffirmed: API Gateway + BFF, Hexagonal/Clean per service, Anti-Corruption Layer per legacy/partner, Saga (orchestration), Outbox pattern, Cache-Aside (single-flight + TTL+jitter), Strangler pattern, CQRS read-model projections, central resilience pipeline (timeout · retry+jitter · CB via opossum · bulkhead · idempotency · cache · async · OTel).
  - Explanation document makes the composition order of the resilience pipeline explicit (idempotency → bulkhead → CB → retry → timeout → cache → transport).
- Tradeoffs and rationale:
  - Reaffirmed prior tradeoffs (active-active complexity, opossum coupling, OTel scope, sync vs async, cosmos consistency).
  - Added documentation tradeoff: maintaining a separate explanations file alongside diagrams adds upkeep, but it lets diagrams stay terse and machine-renderable while keeping rationale human-readable. Mitigated with the "Stay In Sync" governance section.
- Risks and mitigations:
  - R7 Documentation drift between Mermaid diagrams and `docs/c4-diagram-explanations.md`. Mitigation: change-control rule documented in the explanations file; architecture-agent must update both in the same run.
  - R8 Audience mismatch (executives consuming L2/L3 details). Mitigation: explanations explicitly call out audience per diagram; executives are pointed to the overview and L1.
  - Prior risks (R1–R6) remain valid and unchanged.
- Open questions:
  - Same set as the previous entry (countries in scope, Azure landing zone maturity, legacy SLAs, event backbone reuse, IdP migration path, PCI scope).
  - New: Should the diagram explanations be auto-generated from the `.mmd` annotations in the future to reduce drift risk?

---

## Entry: 2026-05-08T22:15:00Z — US-008 SLO catalog + Section D TDRs (US-023 / US-024)
- Timestamp (UTC): 2026-05-08T22:15:00Z
- Trigger: `/architecture` for **US-008** + **Section D** (Specs D / backlog US-023, US-024).
- DDD decisions made:
  - No change to bounded-context taxonomy; **reinforced** that Observability is the SLI sink for journey metrics and Integration remains the enforcement point for resilience SLIs (dependency-level errors, CB transitions).
  - **US-008**: Formalized three **critical journeys** (J1 Quote-to-bind, J2 Issue policy, J3 Pay premium) with SLI definitions (availability, P95 latency on sync segment, integration-attributed error rate), **99.95%** monthly SLO targets aligned with NFRs, illustrative error budgets (~22 min/month equivalent), and **Green / Yellow / Red** error-budget policy with governance cadence.
  - **US-023 (TDR D.1)**: **Hybrid integration model** — centralized reusable Integration Layer + platform governance; decentralized ownership of domain-specific ACL adapters by stream-aligned teams.
  - **US-024 (TDR D.2)**: **Hybrid sync/async** — synchronous boundaries for customer confirmations and latency-SLO segments; asynchronous processing for side effects; Outbox + Service Bus for reliable post-commit events (consistent with existing Saga narrative).
- C4 artifacts created/updated:
  - **No structural change** to `docs/c4-system-context.mmd`, `docs/c4-container.mmd`, `docs/c4-component-integration-layer.mmd` — narrative alignment sufficient (SLIs consumed via existing OTel → Application Insights paths).
  - **`docs/architecture.mmd`**: Application Insights node relabeled to surface **SLO dashboards + alerts** explicitly on the executive overview.
- Explanation artifacts created/updated:
  - **`docs/c4-diagram-explanations.md`**: L2 Container § Resilience — added **SLO / SLI alignment (US-008)** paragraph (Log Analytics / App Insights queries over OTel + Integration Layer logs). L4 Executive overview § Resilience — added SLO dashboard cross-reference. **How These Diagrams Stay In Sync** — new bullet: Section A.1.4 changes must remain consistent with OTel export paths (App Insights as SLI sink).
- Azure services selected and rationale:
  - **Application Insights + Log Analytics + Azure Monitor** — journey SLIs, burn-rate alerts, workbooks; fits existing OTel Collector topology in L2.
  - No new Azure SKU introduced; catalog assumes existing instrumentation contracts (`journey_id` / `critical_path` span attributes).
- Architecture patterns applied and rationale:
  - **Error budgeting** — ties reliability investments to product decisions (freeze releases when budget burns).
  - **Hybrid integration + hybrid messaging** — avoids false dichotomies; matches Team Topologies platform-enabling-stream pattern and practical insurance UX (immediate confirmation where regulated or expected).
- Tradeoffs and rationale:
  - **SLO granularity**: Journey-level SLOs aggregate multiple containers — simpler for stakeholders; may obscure single-service regressions — mitigated by RED metrics per service under each journey dashboard.
  - **TDR brevity**: One-page constraint favors clarity over exhaustive vendor comparison — detailed RFCs can live in annexes if the program scales.
- Risks and mitigations:
  - **Instrumentation inconsistency** — SLIs wrong if teams omit span tags. Mitigation: schema lint in CI; golden trace samples in non-prod.
  - **Regulatory interpretation** — some markets may mandate synchronous audit artifacts. Mitigation: Section D.2 risk note + per-country legal review.
- Open questions:
  - Baseline SLI measurements from production-like environments (not yet available in assessment scope).
  - Whether to add a fourth journey (e.g., endorse/amend) as catalog maturity increases.

