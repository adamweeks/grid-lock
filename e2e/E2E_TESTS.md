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
| game subtitle is hidden after returning and starting classic | `#game-subtitle` hidden in classic mode |

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
| Classic button transitions to game screen | clicking `#btn-classic` hides select, shows game |
| Blitz button transitions to game screen | clicking `#btn-blitz` hides select, shows game |
| Back button returns to mode-select screen | `#btn-back` from game screen returns to select |
| Reset button keeps game screen visible | `#reset-btn` does not navigate away |
| Classic mode shows Locked label | `#stat2-label` text is "Locked" |
| Blitz mode shows Time label | `#stat2-label` text is "Time" |
| Classic mode hides combo-bar | `#combo-bar` is hidden in Classic |
| Blitz mode shows combo-bar | `#combo-bar` is visible in Blitz |
| Classic mode hides hint button | `#btn-hint` is hidden in Classic |
| Blitz mode shows hint button | `#btn-hint` is visible in Blitz |

---

## `classic.spec.ts` — Classic mode game logic

Initial grid (deterministic): Row 0 = `S T A R`, Row 3 = `S L A P`.

### Initial state

| Test | What it verifies |
|------|-----------------|
| board renders all 16 tiles | all `#tile-r-c` elements visible |
| score starts at 0 | `#score-display` = "0" |
| locked count starts at 0 / 16 | `#stat2-value` = "0 / 16" |
| word display shows placeholder before any selection | `#word-display` contains "tap tiles to select" |
| submit button is disabled before selection | `#btn-submit-word` is disabled |
| tile 0-0 shows letter S | `#tile-0-0` text = "S" |
| tile 3-3 shows letter P | `#tile-3-3` text = "P" |

### Tile selection

| Test | What it verifies |
|------|-----------------|
| clicking a tile updates word-display | `#word-display` shows the selected letter |
| selecting 3 tiles enables submit button | `#btn-submit-word` becomes enabled after 3 tiles |
| clear button (✕) is hidden before any selection | `#btn-clear-selection` hidden at start |
| clear button (✕) appears after a tile is selected | `#btn-clear-selection` visible once a tile is tapped |
| clear button empties selection and hides itself | clicking ✕ resets word display, disables submit, hides ✕ |
| re-tapping a selected tile truncates selection back to it | re-tapping T removes T and all tiles after it |

### Word submission — STAR (500 pts)

| Test | What it verifies |
|------|-----------------|
| submitting STAR scores 500 pts | `#score-display` = "500" |
| submitting STAR locks 4 tiles (stat2 becomes 4 / 16) | `#stat2-value` = "4 / 16" |
| STAR tiles get tile-locked class after commit | `#tile-0-*` elements have `tile-locked` class |
| word display shows score notification after STAR commit | `#word-display` contains "+500 pts" immediately after commit |
| message banner is NOT shown for valid word score | `#message-banner` remains hidden after a valid commit |
| word display resets to placeholder after score notification expires | `#word-display` reverts to "tap tiles to select" after ~2s |

### Word submission — STAR then SLAP

| Test | What it verifies |
|------|-----------------|
| STAR then SLAP: score becomes 1,000 and 8 tiles locked | `#score-display` = "1,000"; `#stat2-value` = "8 / 16" |

### Invalid word

| Test | What it verifies |
|------|-----------------|
| submitting an invalid word shows error message in word display | `#word-display` contains "not a valid word" (red text); `#message-banner` hidden |
| invalid word does not change score | `#score-display` stays "0" |
| invalid word submission clears selection after error dismisses | `#word-display` resets to placeholder after ~1.5s; submit disabled |

### Spin counter

| Test | What it verifies |
|------|-----------------|
| spin counter box is visible in Classic mode | `#stat3-box` is visible |
| spin counter starts at 0 | `#spin-display` = "0" |
| spin counter increments to 1 after one pivot | clicking one pivot button → `#spin-display` = "1" |
| spin counter increments correctly after multiple pivots | 3 pivots → `#spin-display` = "3" |
| committing a word does not change spin counter | submitting STAR → `#spin-display` still "0" |
| spin counter resets to 0 after reset | 2 pivots then reset → `#spin-display` = "0" |

### Pivot buttons

| Test | What it verifies |
|------|-----------------|
| 9 pivot buttons are rendered | `button.pivot-btn` count = 9 |
| pivot (0,0) rotates top-left quadrant | tile-0-0 gets old tile-1-0's letter after clockwise rotation |

### Reset

| Test | What it verifies |
|------|-----------------|
| reset after STAR: score back to 0 and tiles unlocked | `#score-display` = "0"; `#tile-0-0` loses `tile-locked` |

### Classic game-over screen

| Test | What it verifies |
|------|-----------------|
| game-over overlay shows "Puzzle Complete!" title after all 16 tiles locked | `#go-title` text = "Puzzle Complete!" |
| game-over shows correct final score | `#go-score` reflects total pts earned |
| game-over shows words found count | `#go-words` reflects number of words committed |
| game-over shows spins used count | `#go-stat3-label` = "Spins Used"; `#go-combo` shows spin count |
| Play Again from Classic game-over restarts Classic (not Blitz) | timer label absent; stat2-label = "Locked" |
| Back to Modes from Classic game-over returns to mode-select | `#screen-select` visible; gameover hidden |

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
