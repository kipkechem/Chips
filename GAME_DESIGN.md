# Lockstep: game design

A 2D, turn-based puzzle game in the spirit of *Chip's Challenge*: colored keys,
colored doors, things to collect, things that kill you. The twist that makes it
about **memory** and **critical thinking** rather than reflexes:

> You study each level in full light. When you start moving, the lights go out
> and you can only see the tiles right next to you.

Everything else in the design serves that one idea.

## The three skills it trains

| Skill | Where it comes from |
|---|---|
| **Memory** | The study phase. You must hold the map in your head: where the lava is, which door is which color, where the cores are. |
| **Problem solving** | Keys are single-use and crates can be wasted, so the order you do things in matters. Some levels have a tempting wrong order that leaves you stuck. |
| **Critical thinking** | Enemies are deterministic and move only when you move. Nothing is random, and nothing needs fast fingers, so every death can be reasoned about and avoided. |

## Core loop

1. **Study.** The whole map is lit. Untimed on Easy and Normal, 10 seconds on Hard.
2. **Lights out.** You see a small radius around yourself. Each move, wait, or
   bump into a wall costs one turn of battery. Bumping costs a turn on purpose,
   so you cannot feel your way around for free.
3. **Peek** (limited). Relights the whole map for 1.6 seconds. Flares on the map
   give you more.
4. **Escape.** Collect every core, then reach the exit. On death or victory the
   map lights up so you can compare it with what you remembered.

## Pieces

| Tile | Rule | What it tests |
|---|---|---|
| Keys and doors (red, green, blue, yellow) | A key opens one door of its color and is used up. Each color also has a shape (circle, diamond, square, triangle) for color-blind players. | Planning order; remembering which door is where. |
| Core | Collect all to open the exit. | Route planning. |
| Lava | Instant death. | Pure memory: it is invisible until you are next to it. |
| Crate | Pushable. Pushed into lava, it sinks and leaves floor. | Sokoban-style thinking; you can waste a crate. |
| Flare | +1 peek. | Risk/reward detours. |

## Enemies

All enemies move once after each of your turns, in a fixed order, by fixed rules.
They can only walk on bare floor, so walls, doors, items, crates, lava and the exit
all block them. A key lying on the floor is also a wall to an enemy until you pick it up.

| Enemy | Rule | Puzzle it creates |
|---|---|---|
| **Patroller** | Walks straight; reverses when blocked. | Timing. Count its cycle while you study, then slip past using alcoves. |
| **Hunter** | Steps toward you, trying the longer axis first. Gets stuck behind walls. | Luring. Park it behind a wall, then walk around it. |
| **Mimic** | Copies your move each turn (if it can). | Spatial reasoning. Use walls to change your relative position. |

## Difficulty

Difficulty never changes the level layout. It changes how hard the memory test is:

| Lever | Easy | Normal | Hard |
|---|---|---|---|
| Light radius | 2 | 1 | 1 |
| Seen tiles stay visible (dimmed) | yes | no | no |
| Study time | untimed | untimed | 10 s |
| Peeks | 3 | 2 | 1 |
| Enemies visible in the dark | yes | yes | no |
| Undo | yes | no | no |
| Battery | 2 × par | 1.5 × par | 1.25 × par |

**Par** is the true minimum number of turns, computed by `tools/solve.js`, which
does a breadth-first search over every reachable game state. That makes the
battery limit fair: every level is proven solvable within it.

## Scoring

Three stars per level, each for a different skill:

- ★ Escaped.
- ★ Within 120% of par (efficient planning).
- ★ No peeks used (memory).

## Levels in the prototype

| # | Name | Teaches |
|---|---|---|
| 1 | First Light | Darkness, keys and doors. |
| 2 | Spend Wisely | Single-use keys. Opening the nearest door first leaves you stuck. |
| 3 | Heat | Lava and crates. |
| 4 | Clockwork | Patroller timing. |
| 5 | Hunter | Luring the hunter. |
| 6 | Echo | The mimic. |
| 7 | Vault | Everything together. |

## Ideas for later

- **More enemies:** a *Watcher* that only moves while you are in its line of sight;
  a *Thief* that steals a key if it touches you instead of killing you; a *Swapper*
  that changes door colors every N turns (a pure working-memory test).
- **Memory-specific tiles:** switches that toggle walls you can no longer see;
  "false floor" that looks like floor in the study phase but is lava.
- **Sound as information:** each enemy type makes a different footstep, louder
  when closer, so you can track them in the dark.
- **Level editor** with the solver built in, so every shared level is guaranteed
  beatable and gets a par automatically.
- **Daily puzzle** with a shared seed and a par leaderboard.
