# Plan

Create a 12-week Scrum plan from the assessment specs.

Objective:
1. Build a complete Scrum plan for 12 weeks using 6 sprints (2 weeks each).
2. Cover all assessment sections (A/B/C/D) with traceable backlog items.
3. Produce epics, user stories, tasks, and estimates.
4. Persist outputs to planning files.

Mandatory inputs:
- `docs/assessment-input.md`
- `specs/A-architecture.spec.md`
- `specs/B-integration-framework.spec.md`
- `specs/C-demo-service.spec.md`
- `specs/D-tdr.spec.md`

Mandatory output files:
- `docs/plan-scrum.md`
- `docs/backlog.md`

Backlog format requirements:
- Epics with IDs (`E-01`, `E-02`, ...)
- User stories with IDs (`US-001`, `US-002`, ...)
- Story format: `As a <role>, I want <capability>, so that <outcome>`
- Story Points per story (Fibonacci)
- Technical tasks per story with task IDs (`T-001`, `T-002`, ...)
- Hour estimates per task
- Acceptance criteria per story
- Dependencies and risks tags

Sprint plan requirements:
- Sprints: `Sprint 1` to `Sprint 6` (2 weeks each)
- Sprint goal
- Stories committed
- Total story points per sprint
- Key tasks and milestones
- Exit criteria / Definition of Done

Mandatory evidence:
- Append one new entry to `docs/evidence/planning-agent-evidence.md` with:
- UTC timestamp
- Inputs used
- Planning assumptions (capacity, velocity)
- Sprint distribution summary
- Epic/story/task totals
- Estimation summary
- Risks/dependency changes

Expected output in chat:
- `Files written`
- `Plan summary` (S1..S6)
- `Total estimate` (story points + hours)
- `Top risks`
