# E2E Test Suite — Grid-Lock

Playwright tests live in `e2e/`. Run with `npm run test:e2e`.

**Update this file whenever tests are added, removed, or renamed.**

---

## `daily.spec.ts` — Daily Classic Puzzle mode

Each test clears `localStorage` before running so daily completion state is clean.

### Mode select screen

| Test | What it verifies |
|------|-----------------|
| daily puzzle card is visible on mode-select screen | `#btn-daily` is visible |
| daily puzzle card shows puzzle number badge | `#daily-puzzle-number` text matches `#\d+` |
| daily puzzle card shows default status (not completed) initially | `#daily-status` does not contain "Completed" |

### Navigation

| Test | What it verifies |
|------|-----------------|
| daily button transitions to game screen | `#screen-game` visible; `#screen-select` hidden |
| game subtitle shows daily puzzle number | `#game-subtitle` text matches `Daily Puzzle #\d+` |
| back button from daily returns to mode-select | `#screen-select` visible; `#screen-game` hidden |
| game subtitle is hidden after returning and starting Blitz | `#game-subtitle` hidden when Blitz is started |

### Daily puzzle uses Classic UI

| Test | What it verifies |
|------|-----------------|
| daily mode shows Locked label (uses classic UI) | `#stat2-label` = "Locked" |
| daily mode shows spin counter | `#stat3-box` visible; `#spin-display` = "0" |
| daily mode hides combo-bar | `#combo-bar` hidden |
| daily mode hides hint button | `#btn-hint` hidden |
| daily mode renders 16 tiles | all `#tile-r-c` elements visible |
| daily puzzle is deterministic — same letters on reload | letter grid identical across page reloads |

### Reset

| Test | What it verifies |
|------|-----------------|
| reset restarts the same daily puzzle (same letters) | letter grid identical before and after reset |

### Game-over screen

| Test | What it verifies |
|------|-----------------|
| share button is hidden on non-daily game-over (classic) | `#go-share` hidden when classic game over is shown |

---

## `navigation.spec.ts` — Screen routing and mode-select UI

| Test | What it verifies |
|------|-----------------|
| shows mode-select screen on load | `#screen-select` visible; `#screen-game` and `#screen-gameover` hidden |
| Daily Puzzle button transitions to game screen | clicking `#btn-daily` hides select, shows game |
| Blitz button transitions to game screen | clicking `#btn-blitz` hides select, shows game |
| Back button returns to mode-select screen | `#btn-back` from game screen returns to select |
| Reset button keeps game screen visible | `#reset-btn` does not navigate away |
| Daily mode shows Locked label | `#stat2-label` text is "Locked" |
| Blitz mode shows Time label | `#stat2-label` text is "Time" |
| Daily mode hides combo-bar | `#combo-bar` is hidden in Daily |
| Blitz mode shows combo-bar | `#combo-bar` is visible in Blitz |
| Daily mode hides hint button | `#btn-hint` is hidden in Daily |
| Blitz mode shows hint button | `#btn-hint` is visible in Blitz |

---

## `blitz.spec.ts` — Blitz mode game logic

Uses `page.clock.install()` before `page.goto()` to control `setInterval` ticks.

### Initial state

| Test | What it verifies |
|------|-----------------|
| timer shows 1:00 at game start | `#stat2-value` = "1:00" |
| combo bar is visible | `#combo-bar` visible |
| spin counter box is hidden in Blitz mode | `#stat3-box` is hidden |
| hint button is visible | `#btn-hint` visible |
| hint button is never disabled regardless of word availability | `#btn-hint` not disabled (availability not exposed via button state) |
| score starts at 0 | `#score-display` = "0" |
| combo badge starts at x1 | `#combo-badge` = "x1" |
| board renders all 16 tiles | all `#tile-r-c` elements visible |

### Timer countdown

| Test | What it verifies |
|------|-----------------|
| timer decrements to 0:59 after 1 second | `clock.runFor(1_000)` → "0:59" |
| timer shows 0:10 after 50 seconds | `clock.runFor(50_000)` → "0:10" |
| stat2-value gains timer-urgent class at 10 seconds remaining | `timer-urgent` class added at ≤10s |
| game-over screen appears when timer reaches zero | `#screen-gameover` visible after 60s |

### Game-over screen

| Test | What it verifies |
|------|-----------------|
| game-over shows 0 score when no words committed | `#go-score` = "0" |
| game-over shows 0 words found when no words committed | `#go-words` = "0" |
| game-over shows x1 best combo when no words committed | `#go-combo` = "x1" |
| game screen is hidden when game-over is shown | `#screen-gameover` visible |
| Play Again restarts blitz with fresh timer | timer resets to 1:00, score to 0 |
| Back to Modes button returns to mode-select screen | `#screen-select` visible; gameover hidden |

### Hint button

| Test | What it verifies |
|------|-----------------|
| hint button deducts 5 seconds from timer when available | clicking hint costs 5s if a word was detected on the random board; skipped if no word |

### Reset

| Test | What it verifies |
|------|-----------------|
| reset restores timer to 1:00 and score to 0 | after 10s elapsed, reset brings timer and score back |
| reset restores combo badge to x1 | `#combo-badge` = "x1" after reset |

### Back button while playing

| Test | What it verifies |
|------|-----------------|
| back button returns to mode-select while timer is running | navigation works mid-game |
