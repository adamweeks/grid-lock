# CLAUDE.md — Default Project Configuration

# Adam Weeks | Webex DevRel / Side Projects

-----

## Workflow Orchestration

### 1. Plan Mode (Use With Judgment)

- Enter plan mode for architectural decisions, ambiguous scope, or tasks with significant unknowns
- Use plan mode when starting a new feature — not for every multi-step task
- If something goes sideways mid-task, STOP and re-plan before continuing
- Write a brief spec upfront when the goal is unclear — don't assume and build wrong

### 2. Self-Improvement Loop

- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write a rule for yourself that prevents the same mistake from recurring
- Review `tasks/lessons.md` at the start of each session for the relevant project
- This is how we get better across sessions — take it seriously

### 3. Verification Before Done

- Never mark a task complete without proving it works
- Run tests, check logs, or demonstrate the behavior in-context
- Ask yourself: "Would a senior engineer approve this PR?"
- If the answer is no, keep going

### 4. Autonomous Bug Fixing

- When given a bug report: investigate and fix it — don't ask for hand-holding
- Point at logs, errors, and failing tests — then resolve them
- Zero unnecessary context-switching required from the user
- Fix failing tests without being told exactly how

### 5. Subagent Strategy (When Applicable)

- Use subagents for parallel research or exploration tasks to keep the main context clean
- One focused task per subagent — no multi-tasking subagents
- Don't default to subagents for simple tasks; use them when complexity or parallelism justifies it

-----

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items before starting
1. **Verify Plan**: Check in with user before beginning implementation on significant changes
1. **Track Progress**: Mark items complete as you go — keep `todo.md` current
1. **Explain Changes**: Provide a high-level summary at each meaningful step
1. **Document Results**: Add a review/summary section to `tasks/todo.md` when done
1. **Capture Lessons**: Update `tasks/lessons.md` after any correction or course change

-----

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Minimal code impact.
- **No Laziness**: Find root causes. No temporary patches. Senior developer standards.
- **Minimal Impact**: Only touch what's necessary. Avoid introducing side effects or bugs.
- **Be Decisive**: Implement cleanly. Don't second-guess straightforward solutions.
- **Ask Once**: If something is ambiguous, ask before building — not halfway through.

-----

## Project-Specific Context

> Replace or extend this section per project. Examples below.

### Lockout (Webex Embedded App — Codenames Clone)

- React + MUI Grid2 (`size` prop, not `xs/md`)
- PropTypes required in all components
- Roles: `game_host` boolean + `is_team_lead` boolean (not an enum)
- Teams: `team1`/`team2` in backend; `Bluewave`/`Redshift` display only in frontend
- Lobby state lives in `LobbyContext` via React Context API — no `useLobby` hook
- `useLobbyContext` lives in a separate file for HMR compatibility
- Backend field is `participant.ready` (not `is_ready`)
- Test files grouped by scenario

### General React/Node Projects

- Prefer functional components with hooks
- Co-locate state as close to usage as possible
- No premature abstraction — build it simple first

-----

## File Structure Conventions

```
tasks/
  todo.md        ← active task plan with checkboxes
  lessons.md     ← running log of corrections and learned patterns
```

-----

*Last updated: March 2026*
