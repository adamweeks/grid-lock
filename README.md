# Grid-Lock

A mobile-first rotational word puzzle game. Spin letter tiles using pivot buttons to form words, then lock them in for points.

**[Play it →](https://adamweeks.github.io/grid-lock/)**

## How to Play

A 4×4 grid of letters sits at the center. Nine **pivot buttons** (purple dots) sit at the intersections between tiles. Tapping a pivot rotates the surrounding 2×2 block of tiles clockwise.

When a valid 3- or 4-letter word appears in any row or column, those tiles **glow yellow**. Tap a glowing tile to commit the word and lock those tiles in.

## Game Modes

### 🪨 Classic
Lock in words to turn tiles to stone. Fill all 16 tiles to win. No time pressure — pure strategy.

- 3-letter word = **100 pts**
- 4-letter Quad = **500 pts**

### ⚡ Blitz
60-second timed score attack. Commit words before the clock hits zero — each word buys more time. Chain fast commits to build a combo multiplier (up to 4×). Committed tiles cascade out and new letters fill in, so the board never locks up.

- Combos: 1× → 2× → 3× → **4× max**
- 3-letter word adds **+8 seconds**
- 4-letter Quad adds **+15 seconds**

## Built With

- Vanilla JS — no framework
- [Tailwind CSS](https://tailwindcss.com/) via CDN
- Single `index.html` file
