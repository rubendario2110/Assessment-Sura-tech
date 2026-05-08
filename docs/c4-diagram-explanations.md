# C4 Diagram Explanations — Multi-Country Digital Direct Channel

Companion document to the Mermaid diagrams in `docs/`. Each section explains one diagram with the same structure: Purpose · Scope and audience · Key elements/components · Main interactions/flows · Resilience/operational considerations · Key design decisions and tradeoffs.

Diagram index:
- L1 System Context — `docs/c4-system-context.mmd`
- L2 Container — `docs/c4-container.mmd`
- L3 Component (Integration Layer) — `docs/c4-component-integration-layer.mmd`
- Executive overview — `docs/architecture.mmd`

---

## 1) System Context (L1) — `docs/c4-system-context.mmd`

### Purpose
Show the Multi-Country Digital Direct Channel as a single system in its environment: who uses it and which external systems it depends on. It frames the boundary of what we own versus what we integrate with.

### Scope and audience
- Scope: end-to-end channel as one black box; external actors and systems with directionality.
- Audience: executive sponsors, business stakeholders, country leads, partner managers, security/compliance, new joiners onboarding to the program.

### Key elements/components
- Personas: Customer (web/mobile, multi-country), Customer Service Agent (assisted sales), Broker/Partner (B2B), Regulator/Compliance Officer (per country).
- System in scope: Multi-Country Digital Direct Channel (Quote · Issue · Pay · Notify; Azure-first; active-active multi-region).
- External systems: Core Policy/Underwriting (legacy), Core Customer/CRM, Payments Gateway (per country), Microsoft Entra External ID (B2C), Notifications providers (email/SMS/push), Product Catalog/Rates source, Fraud/KYC service, Observability backbone (Azure Monitor + Application Insights + Log Analytics).

### Main interactions/flows
- Customers and partners enter via HTTPS (partners with mTLS); agents do assisted operations; regulators access audit/reports.
- Outbound: synchronous calls to Core Policy and Core Customer through an Anti-Corruption Layer (ACL); idempotent calls to Payments Gateway with webhook callbacks; OIDC AuthN/AuthZ against Entra External ID; async notifications via events; cache-aside reads against Catalog source; KYC checks with strict timeouts and circuit breakers.
- All outbound legs flow through the reusable Integration Framework (timeouts, retries+jitter, circuit breaker via `opossum`, bulkhead, idempotency, trace propagation).

### Resilience/operational considerations
- Country affinity at the edge (Azure Front Door + WAF) drives traffic to the right region with health-based failover.
- Telemetry is exported continuously to the observability backbone for SLO tracking and incident triage.
- Compliance/regulatory access is segregated and auditable.

### Key design decisions and tradeoffs
- Treat Identity as an Open Host (OIDC) rather than embedding identity logic per service: lowers duplication; couples the system to the IdP roadmap.
- Front Door + per-country routing at L1 simplifies the contract for partners and agents but adds an extra hop and cost; mitigated by edge caching and TLS offload.
- The Integration Framework is a first-class L1 concept (visible in flow labels) so the boundary is explicit; this raises governance overhead but keeps resilience consistent across countries.

---

## 2) Container (L2) — `docs/c4-container.mmd`

### Purpose
Reveal the runtime topology: what containers exist, where they run, and how they communicate. It shows that the channel is active-active multi-region on Azure managed services.

### Scope and audience
- Scope: containers (apps, gateways, datastores, messaging, ops), grouped by region and by responsibility (Domain, Integration, Data, Async, Ops).
- Audience: tech leads, senior engineers, SREs, platform engineers, security architects, DBAs.

### Key elements/components
- Global edge: Azure Front Door + WAF.
- Per region (A and B, both active):
  - Azure API Management (per-region, OAuth2/JWT, throttling, partner mTLS).
  - Web BFF, Mobile BFF, Partner API (NestJS + Fastify).
  - Domain services: Quoting, Policy, Payments, Notifications Worker, Catalog/Reference, Country/Locale.
  - Integration Layer (reusable framework + ACL adapters).
  - Async backbone: Azure Service Bus (queues + topics) and Event Grid (system events).
  - Data: Azure SQL (geo-replicated for Policy/Payments), Cosmos DB (multi-region writes for Quoting drafts and Catalog reads), Azure Cache for Redis (idempotency + cache-aside), Azure App Configuration (flags + per-country tunables), Azure Key Vault.
- External systems: Core Policy, Core Customer, Payments Gateway, Entra External ID, Email/SMS/Push providers, Product Catalog source, Fraud/KYC.
- Operations: OpenTelemetry Collector → Application Insights + Azure Monitor + Log Analytics; GitHub Actions/Azure DevOps + Azure Policy.

### Main interactions/flows
- Ingress: customers/partners → Front Door → APIM → BFFs → Domain services.
- Outbound: every Domain service goes through the Integration Layer (framework + ACL) to reach external systems.
- Async: Domain services exchange commands/events through Service Bus; Event Grid feeds the Notifications Worker.
- Data: Policy/Payments persist in Azure SQL (geo-replicated); Quoting/Catalog use Cosmos DB; the Integration Layer uses Redis for idempotency keys and cache-aside.
- Telemetry: every container exports OTel signals to the Collector → Application Insights/Log Analytics.
- Delivery: pipelines deploy APIM, BFFs, Domain services, and Integration Layer in both regions.

### Resilience/operational considerations
- Active-active across two Azure regions; Front Door drives traffic by health and country affinity.
- Geo-replicated SQL and multi-region Cosmos DB satisfy RTO ≤ 30 min and RPO ≤ 5 min for critical domains.
- Redis is per-region; idempotency keys are namespaced per region to avoid cross-region replication during the window.
- Async backbone absorbs traffic spikes and decouples Notifications and downstream events from the customer-facing path.
- Azure App Configuration exposes timeouts, retries, CB thresholds, bulkhead limits, and cache TTLs at runtime so we can tune without redeploys.
- All secrets and credentials live in Key Vault with rotation policies; ACL adapters fetch credentials lazily and cache short-lived tokens.

### Key design decisions and tradeoffs
- Azure Container Apps is the default compute for stateless services; AKS is reserved for services that need finer scheduling/networking. Tradeoff: two compute options to operate, mitigated by shared platform standards (CI/CD, OTel, base images).
- Per-region APIM rather than a single global APIM: lower latency and blast radius at the cost of duplicated policy management; mitigated by IaC (Bicep/Terraform) and policy-as-code.
- Cosmos DB multi-region writes for catalog/quoting reads enables low-latency reads everywhere but requires per-domain consistency choices; we choose session/strong only where needed.
- Mandating that all outbound traffic flows through the Integration Layer reduces flexibility per service but enforces resilience and observability uniformly across countries.

---

## 3) Component — Integration Layer (L3) — `docs/c4-component-integration-layer.mmd`

### Purpose
Decompose the Integration Layer into components, showing the resilience pipeline applied to every outbound call and the cross-cutting observability and configuration. This is the diagram the engineering team uses day-to-day.

### Scope and audience
- Scope: components inside the Integration Layer container, plus the cross-cutting stores (Redis, Key Vault, App Configuration) and the externals reached via ACL adapters.
- Audience: engineers building/consuming the framework, SRE, code reviewers, security reviewers.

### Key elements/components
- Inbound API: Framework Client SDK (`src/framework/index.ts`, `client.execute(req, opts)`) and Typed Error Model (`TimeoutError`, `CircuitOpenError`, `UpstreamError`, `ValidationError`).
- Resilience pipeline (composition order): Centralized Config → Idempotency → Bulkhead → Circuit Breaker (`opossum`) → Retry + Backoff + Jitter → Timeout + AbortController → Cache-Aside (read-only).
- Observability: Structured JSON Logger (`traceId`, `dependency`, `attempt`, `outcome`, `latencyMs`) and Trace Propagation (W3C `traceparent`, OTel-compatible).
- Outbound transport: HTTP Transport (fetch + AbortController) and Async Publisher (Service Bus / Event Grid client).
- Anti-Corruption Layer adapters: per legacy/partner (Core Policy, Core Customer, Payments Gateway, KYC, Catalog).
- Stateful supports: Azure Cache for Redis (idempotency store + cache-aside), Azure Key Vault (secrets), Azure App Configuration (per-country thresholds).

### Main interactions/flows
- Each call entering the SDK is composed left-to-right: Idempotency → Bulkhead → CB → Retry → Timeout → Cache → Transport.
- Configuration is loaded at startup from App Configuration (with env var fallbacks) and is consumed by all policies; invalid config fails fast.
- Observability is cross-cutting: every component emits structured logs and propagates `traceparent`; CB/Retry/Timeout/Bulkhead emit lifecycle events that the Logger ships to Application Insights.
- Idempotency persists keys in Redis with TTL; same key returns the previous logical outcome without re-executing the side effect.
- Errors thrown by Timeout/CB/Retry/Bulkhead surface as Typed Errors so callers branch on failure modes rather than parsing strings.
- Transport hands off requests to ACL adapters; adapters translate our model to the legacy/partner contract and back.

### Resilience/operational considerations
- Composition order is deliberate: idempotency before retry guarantees safe retries; bulkhead before CB caps resource usage even when the breaker is OPEN HALF; timeout last in the synchronous chain ensures a hard upper bound on attempt latency.
- Circuit Breaker uses `opossum` (mandatory) wrapped behind a generic interface so the framework can be swapped without touching callers.
- Cache-aside has stampede protection (single-flight + TTL with jitter) for hot reference data.
- Bulkhead semaphore is per-dependency and per-instance; sized via App Configuration per dependency tier.
- Logger enforces a no-PII default policy; redaction rules live in the framework, not in services.
- Health/readiness probes feed APIM/Front Door; CB transitions are visible in dashboards (Application Insights + Azure Monitor).

### Key design decisions and tradeoffs
- Single client SDK for all outbound traffic (decoupled from business domain logic): consistent policies and telemetry, at the cost of a stricter contract that all services must adopt.
- Idempotency store is shared (Redis) instead of per-service: reduces duplicates across replicas; introduces a hard dependency on Redis availability — mitigated with local circuit breakers around Redis itself.
- Async publishing is exposed through the same SDK as the HTTP path: simpler mental model, at the cost of a slightly larger SDK surface.
- ACL adapters live inside the Integration Layer rather than per-service: keeps legacy semantics out of domain services; concentrates the legacy knowledge in one team — mitigated by clear ownership and domain-event publishing on top of ACLs.
- Mandating `opossum` per repo standard introduces vendor coupling; mitigated by a thin wrapper exposing a generic CB interface.

---

## 4) Executive Overview — `docs/architecture.mmd`

### Purpose
Provide a single one-pager that communicates the architecture across edge, channel, integration, data, async, externals, and ops. It is the picture for steering committees and onboarding.

### Scope and audience
- Scope: high-level slice of the L2 topology with the same managed services and the Integration Layer at the center.
- Audience: executive sponsors, program managers, country GMs, hiring/onboarding.

### Key elements/components
- Edge: Azure Front Door + WAF.
- Channel (per region, active-active): API Management; Web/Mobile/Partner BFFs (NestJS + Fastify); Domain services (Quoting · Policy · Payments · Notifications · Catalog · Country).
- Reusable Integration Layer with the resilience pipeline and ACL adapters.
- Data & state: Azure SQL, Cosmos DB, Redis, App Configuration, Key Vault.
- Async backbone: Service Bus + Event Grid.
- External systems: Core Policy, Core Customer/CRM, Payments Gateway, Entra External ID, Email/SMS/Push providers, Product Catalog/Rates, Fraud/KYC.
- Observability & Ops: OpenTelemetry Collector, Application Insights + Log Analytics + Azure Monitor; GitHub Actions / Azure DevOps + Azure Policy.

### Main interactions/flows
- Customer/Partner/Agent → Edge → APIM → BFF → Domain → Integration Framework → ACL → External systems.
- Domain services persist in Azure SQL/Cosmos DB; Integration uses Redis (idempotency + cache), Key Vault (secrets), App Configuration (per-country tunables).
- Service Bus and Event Grid carry async flows and feed the Integration Layer back from the async side.
- All containers export OTel signals to Application Insights; pipelines deploy across BFFs, Domain, and Integration Layer.

### Resilience/operational considerations
- One-page view that highlights the Integration Layer as the place where all resilience is enforced.
- Active-active multi-region implied by APIM/Domain/Integration replication; per-region data stores synced via geo-replication or multi-region writes.
- Observability and delivery are shown as first-class concerns, not afterthoughts.

### Key design decisions and tradeoffs
- Keeping the executive overview simple intentionally hides region-pair detail and per-domain consistency choices; for those, readers are pointed to the L2/L3 diagrams.
- Showing the Integration Framework explicitly at this level signals its strategic importance and forces alignment between business stakeholders and engineering on resilience expectations.

---

## How These Diagrams Stay In Sync

- L1 changes (new actor, new external system, new country) trigger updates in L1 and the executive overview.
- L2 changes (new container, region split, datastore change) trigger updates in L2 and Section A.1.2 narrative.
- L3 changes inside the Integration Layer (new policy, new adapter) trigger updates in L3 and `src/framework/*` references in the diagram annotations.
- Architecture-agent evidence captures every revision with timestamp and rationale (`docs/evidence/architecture-agent-evidence.md`).
