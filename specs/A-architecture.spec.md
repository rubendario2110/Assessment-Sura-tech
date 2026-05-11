# Spec A: Target Architecture and 12-Week Roadmap

## Goal
Design an end-to-end target architecture for a multi-country Digital Direct Channel that meets high availability, scalability, resilience, and observability requirements. Frame the design with Domain-Driven Design (DDD) and the C4 model, with Azure-first technical decisions, and deliver a 12-week execution roadmap covering Reliability, Integration Modernization, and Observability/Operations.

## Scope
- Target: multi-country **Digital Direct Channel** end-to-end (assessment Section A), Azure-first, described with **DDD** and the **C4 model**.
- Customer entrypoints: web, mobile, public APIs, and partner channels via API gateway.
- Country-aware routing, configuration, and data residency considerations.
- DDD framing: bounded contexts (Customer, Quoting, Policy, Payments, Notifications, Identity, Catalog/Reference, Integration), context map and relationships (Customer/Supplier, Anti-Corruption Layer, Open Host).
- Reusable integration layer with resilience controls (timeouts, retries with exponential backoff and jitter, circuit breaker, bulkheads, idempotency, async messaging, caching).
- Integration patterns called out explicitly for assessors: retries + backoff + jitter, circuit breaker, idempotency, bulkheads, asynchronous messaging where applicable, caching strategies.
- Asynchronous messaging for non-blocking flows (events, outbox pattern) and synchronous request/response for critical UX paths.
- Observability stack: structured logs, metrics, traces (OpenTelemetry), SLO/SLI dashboards, alerting, incident workflows.
- Multi-region active-active topology, traffic management, and DR strategy.
- **12-week technical roadmap** with three named workstreams: **Reliability**, **Integration Modernization**, and **Observability/Operations** (milestones, dependencies, exit criteria).

## Non-Functional Requirements
- Availability target: 99.95% for critical customer journeys.
- Active-active multi-region for critical services with health-based traffic steering.
- P95 latency: < 400 ms for synchronous channel APIs (excluding external partner latency).
- RTO ≤ 30 minutes and RPO ≤ 5 minutes for critical data domains.
- Horizontal scalability for stateless services; partitioned/replicated stores for stateful workloads.
- No hard dependency on a single vendor component (portable abstractions where feasible).
- Security and compliance: TLS in transit, encryption at rest, secret management, country-specific data residency.

## Acceptance Criteria
- Provides a written end-to-end architecture description covering HA, scalability, resilience, and observability.
- Includes DDD framing: bounded contexts, context map, and key domain events.
- Includes C4 diagrams in Mermaid: System Context, Container, and Component (Integration Layer).
- Maps each resilience and observability control to specific components/containers.
- Describes how integration patterns apply in the target state: timeouts/retries/backoff+jitter, circuit breaker, idempotency, bulkheads, async messaging (if applicable), caching, and trace propagation across channel and integration boundaries.
- Provides a **12-week roadmap** that visibly allocates work across the three workstreams (**Reliability**, **Integration Modernization**, **Observability/Operations**), including milestones, exit criteria, dependencies, and sequencing notes.
- Diagrams render successfully and are referenced from `docs/assessment.md`.
- Meets written submission minimum for Section A: **one architecture diagram** (exported image and/or link to rendered diagram) plus narrative.

## Output Files / Evidence Expected
- `docs/assessment.md` (Section A narrative + 12-week roadmap)
- At least **one architecture diagram** satisfying the assessment deliverable (image under `docs/` or link embedded in `docs/assessment.md`)
- `docs/architecture.mmd` (executive overview, optional)
- `docs/c4-system-context.mmd`
- `docs/c4-container.mmd`
- `docs/c4-component-integration-layer.mmd`
- `docs/evidence/architecture-agent-evidence.md` (architecture decisions log)

## Open Questions and Assumptions
- Assumption: Azure is the primary cloud (Azure Front Door, APIM, AKS, Service Bus, Cosmos DB / Azure SQL, App Configuration, Key Vault, Azure Monitor + Application Insights, Log Analytics).
- Assumption: Initial countries in scope share a regulatory baseline; per-country overrides handled via configuration.
- Assumption: Identity provider is Azure AD B2C (or compatible) for end customers.
- Open: Exact list of countries, languages, and data residency constraints per country.
- Open: Authoritative source-of-truth systems per domain (legacy core systems) and their SLAs.
- Open: Existing event backbone vs greenfield messaging; reuse vs replace decision.
- Open: Required compliance frameworks (e.g., PCI DSS scope, local data protection laws).
