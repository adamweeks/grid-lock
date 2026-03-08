# CLAUDE.md — Grid-Lock Project Configuration

# Adam Weeks | Webex DevRel / Side Projects

---

## What this project is

Grid-Lock is a 4×4 rotational word puzzle game built with **Vite 5 + TypeScript 5 + Tailwind CSS 3 + Vitest**. Two game modes:

- **Classic** — manually select tiles to spell 3–4 letter words; locked tiles score points; goal is to lock all 16 tiles.
- **Blitz** — 60-second timed mode; the engine auto-detects a word; tap it to commit, earn time bonuses and build combos.

---

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
- Run `npm run test -- --run && npm run build` — both must be green before done
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

---

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items before starting
1. **Verify Plan**: Check in with user before beginning implementation on significant changes
1. **Track Progress**: Mark items complete as you go — keep `todo.md` current
1. **Explain Changes**: Provide a high-level summary at each meaningful step
1. **Document Results**: Add a review/summary section to `tasks/todo.md` when done
1. **Capture Lessons**: Update `tasks/lessons.md` after any correction or course change

```
tasks/
  todo.md        ← active task plan with checkboxes
  lessons.md     ← running log of corrections and learned patterns
```

---

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Minimal code impact.
- **No Laziness**: Find root causes. No temporary patches. Senior developer standards.
- **Minimal Impact**: Only touch what's necessary. Avoid introducing side effects or bugs.
- **Be Decisive**: Implement cleanly. Don't second-guess straightforward solutions.
- **Ask Once**: If something is ambiguous, ask before building — not halfway through.

---

## Module structure

```
src/
├── types/          Cell.ts, WordMatch.ts, GameMode.ts   — shared interfaces only
├── data/           wordList.ts                           — WORDS (Scrabble 3/4-letter), INITIAL_LETTERS, LETTER_POOL
├── logic/          GridEngine.ts, WordDetector.ts, Scoring.ts  — pure functions, no DOM
├── modes/          IGameMode.ts, ClassicMode.ts, BlitzMode.ts  — state machines
├── ui/             BoardRenderer.ts, AnimationPlayer.ts, UIController.ts  — DOM only
├── app/            GameController.ts                     — wires modes to UI
├── tests/          smoke.test.ts, modes.test.ts
└── main.ts         event wiring only (~45 lines)
```

**Dependency rule — strictly enforced, no cycles:**
```
types ← data ← logic ← modes ← app ← main
                               ↑
                              ui
```
Nothing in `logic/` or `modes/` ever imports from `ui/`. Nothing in `ui/` mutates game state.

---

## SOLID principles — how they apply here

### S — Single Responsibility
Each class/module has one reason to change:
- `GridEngine` rotates and mutates grids — does not touch the DOM.
- `BoardRenderer` reads grid state and writes tile DOM — does not mutate state.
- `UIController` owns all element references — no game logic.
- `ClassicMode` / `BlitzMode` own their state machines — no DOM calls (they use callbacks).

When adding a feature: ask "which single module is responsible for this?" before touching anything else.

### O — Open/Closed
`IGameMode` is the extension point. Adding a new game mode means:
1. Create `src/modes/ZenMode.ts` implementing `IGameMode`.
2. Add `startZen()` to `GameController`.
3. Add one button in `index.html` and one listener in `main.ts`.

**Zero changes to existing files.** Do not add `if (mode === 'zen')` branches anywhere.

### L — Liskov Substitution
`GameController` only calls methods on `IGameMode` — it never checks `instanceof`. Any `IGameMode` implementation must be substitutable without changing the controller. Keep `getStat2Value()`, `getSelection()`, etc. consistent in semantics.

### I — Interface Segregation
Mode-specific UI callbacks are split into `ClassicCallbacks` and `BlitzCallbacks`. Modes declare only what they need — Classic never receives timer or combo callbacks.

### D — Dependency Inversion
Modes never import `UIController`, `BoardRenderer`, or `AnimationPlayer`. Instead, `GameController` constructs the callback objects that bridge modes to the UI layer. `main.ts` resolves all concrete instances and injects them.

---

## Running the project

```bash
npm run dev       # Vite dev server — http://localhost:5173
npm run test      # Vitest in watch mode
npm run test -- --run   # single-pass test run
npm run build     # tsc type check + Vite production build
```

---

## Testing

- **Test files live in** `src/tests/`.
- **No DOM in unit tests.** Mock all UI callbacks with `vi.fn()`.
- **Use `vi.useFakeTimers()`** in `beforeEach` for any test touching `BlitzMode` timers; restore with `vi.useRealTimers()` in `afterEach`.
- **Pure logic tests** (GridEngine, WordDetector, Scoring) need no mocking — call the functions directly.
- **Mode tests** provide a full `ClassicCallbacks` / `BlitzCallbacks` mock object. Test the public interface (`getScore()`, `getSelection()`, `getStat2Value()`), not private state.
- Always run `npm run test -- --run` before committing.
- The build (`npm run build`) runs `tsc` first — a passing build means zero TypeScript errors under `strict: true`.
- **E2E tests live in** `e2e/` and run with `npm run test:e2e`. Always run E2E tests locally before committing.
- **`e2e/E2E_TESTS.md` must be kept in sync** — update it whenever a Playwright test is added, removed, or renamed.

**Target: all tests green, build passes, JS bundle < 50 kB gzip.**

---

## Commit messages

Follow **Conventional Commits** (`type(scope): description`):

| Type | When to use |
|------|-------------|
| `feat` | new user-visible feature |
| `fix` | bug fix |
| `refactor` | code restructure with no behaviour change |
| `test` | adding or updating tests only |
| `chore` | tooling, deps, config (no src change) |
| `docs` | documentation only |

**Scope** is the module or area changed: `wordlist`, `classic`, `blitz`, `ui`, `scoring`, `tests`, `build`, etc.

**Examples:**
```
feat(blitz): add overtime sudden-death round after timer expires
fix(classic): prevent re-selecting a tile mid-commit
refactor(board): replace getElementById loops with data-* attribute map
test(classic): add coverage for all-tiles-locked end state
chore(deps): upgrade vitest to 2.2
```

Rules:
- **All commit messages must follow Conventional Commits format** (`type(scope): description`).
- Description is lowercase, imperative mood, no trailing period.
- Body (optional) explains *why*, not *what*.
- Always include `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>` when Claude authors the commit.
- Keep commits atomic — one logical change per commit.

---

## Git branching strategy

```
main            — always releasable; direct commits only for trivial fixes
  └── feat/<name>      — new features
  └── fix/<name>       — bug fixes
  └── refactor/<name>  — structural changes
  └── chore/<name>     — tooling / dependency updates
```

**Workflow:**

1. Branch from `main`:
   ```bash
   git checkout -b feat/zen-mode
   ```
2. Make commits on the branch (atomic, conventional messages).
3. Run `npm run test -- --run && npm run build` before opening a PR — both must be green.
4. Open a PR targeting `main`. PR title mirrors the commit convention (`feat(zen): add Zen mode`).
5. Squash-merge into `main` when approved, keeping the conventional commit message.
6. Delete the branch after merge.

**Branch naming examples:**
```
feat/overtime-round
fix/blitz-timer-race
refactor/cascade-animation
chore/upgrade-vite-6
```

Never commit directly to `main` for anything beyond a one-line documentation fix.

**Before beginning any task:** create the appropriate feature branch first, then start work. Do not write code on `main` and move it to a branch later.

---

## Word list

`src/data/wordList.ts` exports `WORDS` — a `Set<string>` of all valid 3- and 4-letter Scrabble words (TWL, ~4,875 words, all lowercase). Sourced from [benjamincrom/scrabble](https://github.com/benjamincrom/scrabble).

To regenerate (e.g. after a dictionary update):
```bash
curl -s "https://raw.githubusercontent.com/benjamincrom/scrabble/refs/heads/master/scrabble/dictionary.json" \
| node -e "
const c=[]; process.stdin.on('data',d=>c.push(d));
process.stdin.on('end',()=>{
  const w=JSON.parse(c.join('')).filter(w=>w.length===3||w.length===4).map(w=>w.toLowerCase());
  const rows=[]; for(let i=0;i<w.length;i+=10) rows.push('  '+w.slice(i,i+10).map(w=>JSON.stringify(w)).join(','));
  process.stdout.write('export const WORDS = new Set([\n'+rows.join(',\n')+'\n]);\n');
});" > /tmp/words.txt
# then append INITIAL_LETTERS and LETTER_POOL from the existing file
```

---

## Key architectural decisions

- **No UI framework.** The DOM is simple — the problem was entangled concerns, not reactive rendering complexity. React/Svelte would be overkill.
- **Immutable grid operations.** `pivotGrid`, `clearPulsing`, `lockCells`, `cascadeColumn` return new grids; they never mutate the input.
- **Promise-based animation.** `AnimationPlayer.exitTiles()` returns `Promise<void>`; `BlitzMode.onCommit()` is `async`. This replaces the original callback-nested approach and eliminates the redundant animation bug.
- **Animation class preservation.** `BoardRenderer.render()` saves and restores `tile-spinning`, `tile-exiting`, `tile-entering` before resetting `className` — prevents in-flight animations from being clobbered by state updates.
- **Node 18 compatibility.** Vite 5 + Tailwind 3 (PostCSS) are used instead of Vite 7 / Tailwind 4, which require Node ≥ 20.

---

*Last updated: March 2026*
