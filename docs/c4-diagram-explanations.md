# C4 Diagram Explanations — Multi-Country Digital Direct Channel

Companion document to the Mermaid diagrams in `docs/`. **Each section below maps one-to-one** to a C4 diagram file and uses this structure: Purpose · Scope and audience · Key elements/components · Main interactions/flows · Resilience/operational considerations · Key design decisions and tradeoffs.

The executive overview in `docs/architecture.mmd` stays aligned with Section A narrative and these diagrams; it does not have a separate explanation section here to preserve strict traceability with the three `.mmd` files below.

Diagram index:

- L1 System Context — `docs/c4-system-context.mmd`
- L2 Container — `docs/c4-container.mmd`
- L3 Component (Integration Layer) — `docs/c4-component-integration-layer.mmd`

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
- External systems: Core Policy/Underwriting (legacy), Core Customer/CRM, Payments Gateway (per country), **Microsoft Entra External ID (B2C) for customers**, **Microsoft Entra ID for workforce/partner applications**, Notifications providers (email/SMS/push), Product Catalog/Rates source, Fraud/KYC service, Observability backbone (Azure Monitor + Application Insights + Log Analytics).

### Main interactions/flows

- Customers and partners enter via HTTPS (partners with mTLS); agents do assisted operations; regulators access audit/reports.
- Outbound: synchronous calls to Core Policy and Core Customer through an Anti-Corruption Layer (ACL); idempotent calls to Payments Gateway with webhook callbacks; OIDC against **Entra External ID (customers)** and **Entra ID (staff/partners)** as appropriate; async notifications via events; cache-aside reads against Catalog source; KYC checks with strict **timeouts** and **circuit breakers**.
- All outbound HTTP legs are implemented through **`packages/integration-framework`** (Integration Layer): **timeouts**, **retries with backoff + jitter**, **circuit breaker** (`opossum`), **bulkheads**, **idempotency**, **async messaging** where applicable, and **W3C traceparent** propagation.

### Resilience/operational considerations

- Country affinity at the edge (**Azure Front Door + WAF**) drives traffic to the right region with health-based failover.
- Telemetry is exported continuously to the observability backbone for SLO tracking and incident triage (Section A.1.4).
- Compliance/regulatory access is segregated and auditable.
- Labels remind readers that resilience is centralized in the integration package rather than reimplemented per integration point.

### Key design decisions and tradeoffs

- Treat Identity as an **Open Host (OIDC)** split by population (**B2C vs Entra ID**) rather than embedding identity logic per service: lowers duplication; couples the program to Microsoft identity roadmaps.
- Front Door + per-country routing at L1 simplifies the contract for partners and agents but adds an extra hop and cost; mitigated by TLS offload and centralized WAF policy.
- Naming **`packages/integration-framework`** explicitly at L1 (commentary) keeps governance clear: one SDK contract for all countries, at the cost of mandatory adoption for outbound HTTP.

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
  - Integration Layer (**reusable `packages/integration-framework` + ACL adapters**).
  - Async backbone: Azure Service Bus (queues + topics) and Event Grid (system events).
  - Data: Azure SQL (geo-replicated for Policy/Payments), Cosmos DB (multi-region writes for Quoting drafts and Catalog reads), Azure Cache for Redis (**idempotency + cache-aside**), Azure App Configuration (flags + per-country tunables), Azure Key Vault.
- External systems: Core Policy, Core Customer, Payments Gateway, **Microsoft Entra External ID (customers)**, **Microsoft Entra ID (staff/partner apps)**, Email/SMS/Push providers, Product Catalog source, Fraud/KYC.
- Operations: OpenTelemetry Collector → Application Insights + Azure Monitor + Log Analytics; GitHub Actions/Azure DevOps + Azure Policy.

### Main interactions/flows

- Ingress: customers/partners → Front Door → APIM → BFFs → Domain services.
- Outbound: every Domain service goes through the Integration Layer (framework + ACL) to reach external systems.
- Async: Domain services exchange commands/events through **Service Bus**; **Event Grid** feeds the Notifications Worker; **Outbox** (Policy/Payments) feeds reliable post-commit messages (see Section A.2).
- Data: Policy/Payments persist in Azure SQL (geo-replicated); Quoting/Catalog use Cosmos DB; the Integration Layer uses Redis for **idempotency keys** and **cache-aside**.
- Telemetry: every container exports OTel signals to the Collector → Application Insights/Log Analytics.
- Delivery: pipelines deploy APIM, BFFs, Domain services, and Integration Layer in both regions.

### Resilience/operational considerations

- Active-active across two Azure regions; Front Door drives traffic by health and country affinity.
- Geo-replicated SQL and multi-region Cosmos DB support DR objectives (Section A.1.3 / A.4).
- Redis is per-region; idempotency keys are namespaced per region to avoid ambiguous dedupe during failover drills.
- **Async messaging** absorbs spikes and decouples Notifications and downstream propagation from synchronous customer paths.
- Azure App Configuration exposes **timeouts**, **retry/CB/bulkhead** thresholds, and **cache TTLs** so teams tune resilience without full redeploys.
- Secrets and credentials live in Key Vault with rotation policies; ACL adapters fetch credentials lazily.
- **SLO / SLI alignment (US-008)**: Journey-level availability and latency SLOs in `docs/assessment.md` Section A.1.4 are implemented as Log Analytics / Application Insights queries over OpenTelemetry spans and structured logs from BFFs, domain services, and the Integration Layer (`traceId`, dependency attribution).

### Key design decisions and tradeoffs

- Azure Container Apps is the default compute for stateless services; AKS is reserved for services that need finer scheduling/networking. Tradeoff: two compute SKUs to operate, mitigated by shared platform standards (CI/CD, OTel, base images).
- Per-region APIM rather than a single global APIM: lower latency and blast radius at the cost of duplicated policy management; mitigated by IaC (Bicep/Terraform) and policy-as-code.
- Cosmos DB multi-region writes for catalog/quoting workloads enables low-latency reads everywhere but requires explicit consistency choices; session/strong only where the domain demands it.
- Mandating that all outbound traffic flows through the Integration Layer reduces per-team flexibility but enforces **timeouts, retries+jitter, CB, bulkheads, idempotency, caching**, and observability uniformly across countries.

---

## 3) Component — Integration Layer (L3) — `docs/c4-component-integration-layer.mmd`

### Purpose

Decompose the Integration Layer into components, showing the resilience pipeline applied to every outbound call and the cross-cutting observability and configuration. This is the diagram the engineering team uses day-to-day.

### Scope and audience

- Scope: components inside the Integration Layer container, plus cross-cutting stores (Redis, Key Vault, App Configuration) and externals reached via ACL adapters.
- Audience: engineers building/consuming **`@assessment/integration-framework`**, SRE, code reviewers, security reviewers.

### Key elements/components

- Inbound API: **`IntegrationHttpClient`** and exports from `packages/integration-framework/src/index.ts`; Typed Error Model (`TimeoutError`, `CircuitOpenError`, `UpstreamError`, `ValidationError`, `BulkheadFullError`).
- Resilience pipeline (composition order as rendered): **Idempotency → Bulkhead → Circuit Breaker (`opossum`) → Retry + Backoff + Jitter → Timeout + AbortController → Cache-Aside (read-only)**; **Centralized Config** (`packages/integration-framework/src/config.ts`) feeds all policies (env + **Azure App Configuration** at runtime for production targets).
- Observability: Structured JSON Logger (`traceId`, `dependency`, `attempt`, `outcome`, `latencyMs`) and Trace Propagation (W3C `traceparent`, OTel-compatible).
- Outbound transport: HTTP (`fetch` + `AbortSignal`) and Async Publisher (Service Bus / Event Grid client).
- Anti-Corruption Layer adapters: per legacy/partner (Core Policy, Core Customer, Payments Gateway, KYC, Catalog).
- Stateful supports: Azure Cache for Redis (idempotency store + cache-aside), Azure Key Vault (secrets), Azure App Configuration (per-country thresholds).

### Main interactions/flows

- Domain services invoke **`IntegrationHttpClient`**; each logical outbound call traverses the pipeline: Idempotency → Bulkhead → CB → Retry → Timeout → Cache → HTTP or async publisher.
- Configuration is validated at startup; invalid config fails fast; production thresholds are overridden from App Configuration where deployed.
- Observability is cross-cutting: components emit structured logs and propagate `traceparent`; CB/Retry/Timeout/Bulkhead emit lifecycle events shipped to Application Insights.
- Idempotency persists keys in Redis with TTL (program architecture); duplicate keys short-circuit duplicate side effects during **retries**.
- Typed errors bubble to callers so APIs map failures to HTTP semantics and compensation steps.
- ACL adapters translate between canonical domain DTOs and legacy/partner payloads.

### Resilience/operational considerations

- **Order is deliberate**: idempotency before retry makes retries safe; bulkhead caps concurrency before breaker/retry amplification; **timeout** bounds each attempt; **cache-aside** trims tail latency on hot reads.
- Circuit breaker uses **`opossum`** (mandatory) behind a thin abstraction for testability and future swap.
- **Async messaging** offloads fire-and-forget work and pairs with **Outbox** in Policy/Payments for transactional consistency (not shown inside this container but required at system level).
- Bulkhead is **per dependency** and per instance; sized via App Configuration per tier.
- Logger defaults to **no PII**; redaction rules live in the framework.
- Dashboards surface CB transitions and dependency saturation for game days and error-budget reviews.

### Key design decisions and tradeoffs

- Single **`packages/integration-framework`** artifact for all outbound HTTP: consistent policies and telemetry; stricter adoption contract for teams.
- Shared **Redis** for idempotency/cache reduces duplicate work across replicas; creates a dependency mitigated by timeouts/CBs around Redis access and regional failover playbooks.
- Async publishing via the same SDK surface as HTTP simplifies developer ergonomics; slightly widens the SDK API.
- ACL adapters colocated in the Integration Layer keep legacy quirks out of core domains; concentrates legacy knowledge — mitigated by clear ownership and contract tests.
- **`opossum` coupling** is accepted per assessment standard; wrapped so telemetry and thresholds remain portable.

---

## How These Diagrams Stay In Sync

- L1 changes (new actor, new external system, new country) trigger updates in L1 and Section A.1 narrative.
- L2 changes (new container, region split, datastore change) trigger updates in L2 and Section A.1.2.
- L3 changes inside the Integration Layer (new policy, new adapter) trigger updates in L3 and **`packages/integration-framework`** references in diagram annotations and this file.
- **SLO catalog changes (Section A.1.4)** stay consistent with OTel export paths in L2/L3 (Application Insights as SLI sink).
- Executive overview (`docs/architecture.mmd`) is updated when edge/channel/integration labels change materially.
- Architecture-agent evidence captures every revision with timestamp and rationale (`docs/evidence/architecture-agent-evidence.md`).
