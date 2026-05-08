# Spec A: Target Architecture and 12-Week Roadmap

## Goal
Design an end-to-end target architecture for a multi-country Digital Direct Channel that meets high availability, scalability, resilience, and observability requirements. Frame the design with Domain-Driven Design (DDD) and the C4 model, with Azure-first technical decisions, and deliver a 12-week execution roadmap covering Reliability, Integration Modernization, and Observability/Operations.

## Scope
- Customer entrypoints: web, mobile, public APIs, and partner channels via API gateway.
- Country-aware routing, configuration, and data residency considerations.
- DDD framing: bounded contexts (Customer, Quoting, Policy, Payments, Notifications, Identity, Catalog/Reference, Integration), context map and relationships (Customer/Supplier, Anti-Corruption Layer, Open Host).
- Reusable integration layer with resilience controls (timeouts, retries with exponential backoff and jitter, circuit breaker, bulkheads, idempotency, async messaging, caching).
- Asynchronous messaging for non-blocking flows (events, outbox pattern) and synchronous request/response for critical UX paths.
- Observability stack: structured logs, metrics, traces (OpenTelemetry), SLO/SLI dashboards, alerting, incident workflows.
- Multi-region active-active topology, traffic management, and DR strategy.
- 12-week roadmap with three workstreams: Reliability, Integration Modernization, Observability/Operations.

## Non-Functional Requirements
- Availability target: 99.95% for critical customer journeys.
- Active-active multi-region for critical services with health-based traffic steering.
- P95 latency: < 400 ms for synchronous channel APIs (excluding external partner latency).
- RTO ≤ 30 minutes and RPO ≤ 5 minutes for critical data domains.
- Horizontal scalability for stateless services; partitioned/replicated stores for stateful workloads.
- No hard dependency on a single vendor component (portable abstractions where feasible).
- Security and compliance: TLS in transit, encryption at rest, secret management, country-specific data residency.

## Integration Patterns Required
- Timeouts and retries with bounded exponential backoff + jitter.
- Circuit breaker (OPEN/CLOSED/HALF_OPEN) and bulkhead isolation per dependency.
- Idempotency for mutation APIs (idempotency key + dedupe store).
- Asynchronous messaging for non-blocking flows (event bus + outbox/inbox).
- Cache strategy (read-through + short TTL for hot reference data, cache stampede protection).
- Trace propagation (W3C `traceparent`) end-to-end.

## Acceptance Criteria
- Provides a written end-to-end architecture description covering HA, scalability, resilience, and observability.
- Includes DDD framing: bounded contexts, context map, and key domain events.
- Includes C4 diagrams in Mermaid: System Context, Container, and Component (Integration Layer).
- Maps each resilience and observability control to specific components/containers.
- Provides a 12-week roadmap with three workstreams (Reliability, Integration Modernization, Observability/Operations), milestones, exit criteria, and dependencies.
- Diagrams render successfully and are referenced from `docs/assessment.md`.

## Output Files / Evidence Expected
- `docs/assessment.md` (Section A narrative + 12-week roadmap)
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
