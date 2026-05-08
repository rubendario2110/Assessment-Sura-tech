# Architecture

Build or refine the multi-country target architecture using DDD, C4, and Azure-first technical decisions.

Objective:

1. Validate that Section A in `docs/assessment.md` is aligned with architecture diagrams.
2. Apply DDD explicitly:
- Define Bounded Contexts
- Define a high-level Context Map (relationships and integration style)
- Identify core domain vs supporting domains
3. Produce C4 diagrams in Mermaid:
- `docs/c4-system-context.mmd`
- `docs/c4-container.mmd`
- `docs/c4-component-integration-layer.mmd`
4. Produce diagram explanations for each generated diagram in:
- `docs/c4-diagram-explanations.md`
5. Every explanation section must include:
- Purpose
- Scope and audience
- Key elements/components
- Main interactions/flows
- Resilience/operational considerations
- Key design decisions and tradeoffs
6. Use Azure managed services where possible (Front Door, APIM, AKS/Container Apps, Service Bus/Event Grid, Azure SQL/Cosmos DB, Redis, Entra ID, Key Vault, Azure Monitor/App Insights).
7. Optionally keep/update `docs/architecture.mmd` as an executive overview.
8. Ensure explicit inclusion of:
- timeouts
- retries with backoff + jitter
- circuit breaker
- idempotency
- bulkheads
- async messaging
- caching
9. Verify that the 12-week roadmap covers Reliability, Integration Modernization, and Observability/Operations.

Expected output:
- Architecture improvements
- DDD framing updates in Section A
- Mermaid C4 files created/updated
- Diagram explanation file created/updated
- Risks, tradeoffs, and mitigations
