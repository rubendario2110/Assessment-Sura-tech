# Technical Lead Practical Assessment

## Section A — Architecture & Roadmap

### A.1 — End-to-End Target Architecture

The Multi-Country Digital Direct Channel is an Azure-first, active-active, multi-region platform that lets customers, agents, and partners quote, issue, pay, and manage insurance products across countries. It is structured with Domain-Driven Design (DDD), exposed through an API Gateway + BFFs, served by stateless domain services, and integrated with legacy and partner systems through a single reusable Integration Layer that owns all resilience and observability concerns.

Diagrams (rendered with Mermaid):
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

Context map (high level):

- Customer/Identity is an Open Host (OIDC) consumed by all other contexts.
- Quoting → Policy: Customer/Supplier; orchestrated via Saga (Issue Policy).
- Policy → Payments: Customer/Supplier; Outbox pattern publishes `PolicyIssued` to trigger premium charge.
- Payments → Notifications: Conformist via async events (`PaymentCaptured`, `PaymentFailed`).
- Catalog → Quoting: Open Host / Published Language; cache-aside on Quoting side.
- Country/Locale: Conformist cross-cutting; injected as configuration into all contexts.
- Integration → Core Policy / Core Customer / Payments Gateway / KYC: Anti-Corruption Layer (ACL) per legacy system to keep our model clean.

Aggregates (high level):
- Quote (Quoting), Policy (Policy), Payment (Payments), Customer (Customer/Identity), Notification (Notifications), CatalogItem (Catalog/Reference), CountryProfile (Country/Locale).

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
- **Resilience**: Every outbound call goes through the reusable Integration Layer (timeouts, retries with backoff + jitter, circuit breaker via `opossum`, bulkheads, idempotency, optional cache-aside). Async messaging absorbs spikes and shields the channel from slow upstreams.
- **Observability**: Structured JSON logs, RED/USE metrics, end-to-end traces via W3C `traceparent`. SLOs are defined per critical journey; error budgets drive release decisions.
- **Disaster Recovery**: RTO ≤ 30 min, RPO ≤ 5 min for critical data. Periodic DR drills; runbooks per failure mode.
- **Security & compliance**: TLS in transit, encryption at rest, secret rotation in Key Vault, per-country data residency by region pinning, Azure Policy guardrails.

### A.2 — Integration Patterns

All integrations are realized through the Integration Layer, which exposes a single client SDK to domain services and applies the following controls in a deterministic composition order:

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
| 8 | Chaos in non-prod (latency, 5xx, partial) | Async outbox PoC for Policy events | Error-budget burn alerts wired |
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
- **Sync vs async for critical flows**: Pure event-driven introduces eventual consistency in customer-facing UX. Mitigation: synchronous for the read path of critical journeys; async for side effects (notifications, downstream propagation). Decision rationalized in Section D.
- **Per-country regulatory variability**: Could fragment configuration. Mitigation: per-country overrides via App Configuration with strict schema and review.

---

## Section B — Reusable Integration Framework

To be completed by `/implementation`. The framework lives under `src/framework/` and is referenced by `src/channel/` and `src/upstream/`.

## Section C — Demo Service & Reliability Test

To be completed by `/implementation`. Includes run instructions for `channel`, `upstream`, and the reliability test, plus a behavior narrative under failure scenarios.

## Section D — Technical Decision Record

To be completed in Sprint 6. Two one-page decisions:
1. Centralized integration platform vs decentralized team-owned integrations.
2. Event-driven vs synchronous request/response architecture for critical flows.

## Submission Checklist

- [x] Section A architecture, DDD framing, and 12-week roadmap completed.
- [x] C4 diagrams (System Context, Container, Component) committed under `docs/`.
- [x] Executive overview diagram updated.
- [x] Diagram explanations published in `docs/c4-diagram-explanations.md`.
- [ ] Section B — integration framework code and design notes.
- [ ] Section C — demo run instructions and failure behavior.
- [ ] Section D — TDR (one page).
- [ ] All evidence logs updated in `docs/evidence/`.
