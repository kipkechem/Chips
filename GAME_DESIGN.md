# Lockstep: game design

A 2D, real-time, grid-based pixel-art puzzle game in the spirit of *Chip's Challenge*. You play a
small robot: collect the chips, use colored keys on colored doors, and reach the flag.
The difficulty comes from **spiders** and from **memory**:

> Spiders never stop coming for you. Anything in their way keeps them boxed in, until
> you pick it up. Then you run for a gate.
>
> Later levels are bigger than the screen. You only ever see a 15 × 9 tile window, so
> you have to remember where the keys, doors and nests are.

The world runs in real time on a grid, like *Chip's Challenge*: it advances 6 turns a
second whether you move or not. Holding a direction runs you one tile per turn (6 tiles a
second), gliding smoothly between tiles. The rules are still exact and grid-based, so
every chase can be planned, and the solver can prove every level is winnable.

## The three skills it trains

| Skill | Where it comes from |
|---|---|
| **Memory** | From level 3 on, the level is larger than the camera window. You plan routes through rooms you saw a minute ago. |
| **Problem solving** | Keys and power-up charges are limited, and crumbling floor is one-way. Order matters: get the key for your escape gate *before* you release the spiders. |
| **Critical thinking** | Every enemy follows fixed, visible rules. Every death can be reasoned about: which way will the spider step, and where will it jam? |

## Controls (landscape)

- **Left: the direction circle.** A circle split diagonally into up, down, left and
  right. Press a quadrant and you step at once; keep holding to run; slide your thumb
  to another quadrant to turn. Resting your thumb in the center stops you.
- **Center: the board.** Swipes on the board also move you.
- **Right: the power-up rack.** Tap a power-up to ready it (it glows), then pick a
  direction on the circle to fire it. Tap again to cancel. The freeze bomb fires at once.
- On a phone held upright, the game asks you to turn it sideways. It also requests full screen
  and a landscape lock, where the browser allows that.
- Keyboard: arrows or WASD (hold to run), 1–4 to ready a power-up, Z undo, R restart, P pause.

## Spiders

1. **Waiting.** A spider sits still, straining toward you, until it sees you along its
   row or column. Walls, doors, gates, crates, chips, keys and power-ups block its view;
   other spiders do not, so a whole queue of spiders spots you at once.
2. **Alert: 0.5 seconds.** When it spots you, a **!** appears and it takes half a
   second (3 turns) to react. That is your head start.
3. **Chasing at 95% of your speed.** It steps toward you along the longer axis first,
   sitting out every 20th turn, so in a straight race you slowly pull away. Spiders
   queued behind another spider keep following it rather than giving up.
4. **Gates are safety.** A door you open becomes a gate. You walk through it; no enemy ever does.
   A chasing spider that runs into a wall, item or gate loses you and waits again.

On screen, a blocked spider strains toward you, so you can always see it trying to reach you.

## Power-ups

Introduced one per level, then combined.

| Power-up | Charges | Effect |
|---|---|---|
| Jetpack | 1 | Smash through one wall next to you and move into the gap. |
| Flamethrower | 3 | Burn every enemy in a line up to 3 tiles. Fire passes over items, gates and fences. |
| Mega blaster | 3 | A shot travels in a straight line: it breaks the first cracked wall or crate, or kills the first enemy it hits. |
| Freeze bomb | 1 | Every enemy freezes for 3 seconds. Frozen enemies are solid blocks: they can't hurt you, but you can't pass them either. |

Supporting tiles: **cracked walls** (blaster or jetpack), **steel** (nothing breaks it),
and **fences** (you pass, enemies don't, fire and shots go through).

## Worlds and their modifiers

Each art direction from the mockups is also a rule change.

| World | Modifier |
|---|---|
| Pixel Arcade | None: the basics. |
| Lost Circuits | **Crumbling floor.** It turns into a hole the moment you step off it. One-way bridges, and spiders can't follow you over the gap. |
| Ice Station | **Ice.** You slide until something stops you: a wall, a rock, a chip or a key. Spiders grip ice fine. |
| Neon Mixtape | **Beat blocks.** Pink and cyan blocks swap every 1.3 seconds (the HUD shows the beat). Anything inside one when it closes is crushed, spiders included. |
| Solar Disco | **Lava** and crates, plus everything else. |

## Levels

| # | World | Name | Introduces | Size |
|---|---|---|---|---|
| 1 | Pixel Arcade | Boot Up | Keys and doors: each chip is locked in its own closet | fits the screen |
| 2 | Pixel Arcade | Spend Wisely | Single-use keys; opening the nearest door first leaves you stuck | fits the screen |
| 3 | Pixel Arcade | Spider Nest | Spiders waiting behind a chip; open your escape gate first | bigger than the screen |
| 4 | Lost Circuits | Jetpack | Jetpack; a crumbling bridge you can only cross once | bigger |
| 5 | Lost Circuits | Crumbling Ruins | Escaping spiders over a collapsing bridge | bigger |
| 6 | Ice Station | Thin Ice | Sliding | bigger |
| 7 | Ice Station | Flamethrower | Spiders fenced around the key: burn them | bigger |
| 8 | Neon Mixtape | Mega Blaster | Three shots, three cracked walls, beat-block timing | bigger |
| 9 | Neon Mixtape | Beat Drop | Leading a spider into a closing beat block | bigger |
| 10 | Solar Disco | Freeze Frame | Freeze bomb; lava and a crate | bigger |
| 11 | Solar Disco | Disco Inferno | All four power-ups in one level | bigger |

## Modes and scoring

- **Explorer** (default): no time limit.
- **Classic**: a time limit of 2 × par.

Undo rewinds to before your last move and costs the clean-run star. Stars: ★ escaped,
★ within 1.5 × par time, ★ no undo.

**Par** is the fastest possible time, counted in turns (6 per second), found by `tools/solve.js` with a
cheapest-first search over every reachable state (standing still costs turns too, and an ice slide
costs one turn per tile). Disco Inferno is too large to search exhaustively, so its par is the best
known route: the shortest path through its items in a fixed order. It is labeled
"best known" in the game.

## Ideas for later

- **Spider variants:** a fast spider that takes two steps per turn; a spider that sees
  diagonally; a mother spider whose death frees the whole nest.
- **Solar Disco's own modifier:** disco arrows (conveyor tiles that push you).
- **More power-ups:** a decoy that spiders chase instead of you; a teleporter pair.
- **Level editor** with the solver built in, so shared levels are guaranteed winnable.
