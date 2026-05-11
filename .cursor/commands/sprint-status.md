# Sprint Status

Generate and persist the current sprint status.

Mandatory routing:
- Delegate this command to `planning-agent`.
- If `planning-agent` cannot be invoked, stop and report `routing-blocked`.
- At the beginning of execution, explicitly state: `runner=planning-agent`.

Objective:
1. Identify the active sprint.
2. Compute completion for stories and tasks in that sprint.
3. Report done vs pending vs blocked scope.
4. Persist a status snapshot for team visibility.

Inputs:
- `docs/plan-scrum.md`
- `docs/backlog.md`
- `docs/evidence/planning-agent-evidence.md`
- `docs/evidence/implementation-agent-evidence.md`
- `docs/evidence/review-agent-evidence.md` (if present)

How to detect active sprint:
1. Prefer explicit marker in `docs/plan-scrum.md` if available (e.g., "Active Sprint: Sprint N").
2. Otherwise infer from implementation evidence by finding the latest referenced sprint/story IDs.
3. If still ambiguous, default to the first sprint with incomplete committed stories and state the assumption.

Status calculation rules:
- Extract sprint-committed story IDs from `docs/plan-scrum.md`.
- Use evidence logs to classify each story as:
  - `Done`
  - `In Progress`
  - `Blocked`
  - `Not Started`
- Compute:
  - Story completion %
  - Task completion % (when task IDs are available)
  - Remaining scope

Mandatory output file:
- `docs/sprint-status.md`

Mandatory evidence:
- Append one new execution entry to `docs/evidence/planning-agent-evidence.md`.
- Include active sprint detection method, completion snapshot, blockers, and next actions.

Mandatory output structure in `docs/sprint-status.md`:
- Snapshot timestamp (UTC)
- Active sprint
- Sprint goal
- Committed scope
- Completed scope
- In-progress scope
- Blocked scope
- Remaining scope
- Completion metrics (% stories, % tasks)
- Top risks
- Recommended next actions

Expected output in chat:
- `Active sprint`
- `Completion summary`
- `Blocked items`
- `Next actions`
- `File updated: docs/sprint-status.md`
- `Evidence file updated: docs/evidence/planning-agent-evidence.md`
