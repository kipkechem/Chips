# Lockstep: game design

A 2D, turn-based, pixel-art puzzle game in the spirit of *Chip's Challenge*. You play a
small robot: collect the chips, use colored keys on colored doors, and reach the flag.
The difficulty comes from **spiders** and from **memory**:

> Spiders never stop coming for you. Anything in their way keeps them boxed in, until
> you pick it up. Then you run for a gate.
>
> Later levels are bigger than the screen. You only ever see a 15 × 9 tile window, so
> you have to remember where the keys, doors and nests are.

Nothing moves unless you do, so every chase can be planned.

## The three skills it trains

| Skill | Where it comes from |
|---|---|
| **Memory** | From level 3 on, the level is larger than the camera window. You plan routes through rooms you saw a minute ago. |
| **Problem solving** | Keys and power-up charges are limited, and crumbling floor is one-way. Order matters: get the key for your escape gate *before* you release the spiders. |
| **Critical thinking** | Every enemy follows fixed, visible rules. Every death can be reasoned about: which way will the spider step, and where will it jam? |

## Controls (landscape)

- **Left: the direction circle.** A circle split diagonally into up, down, left and
  right. Press and slide your thumb between quadrants; holding repeats the move.
  Tapping the center waits a turn. Sliding through the center never waits by accident.
- **Center: the board.** Swipes on the board also move you.
- **Right: the power-up rack.** Tap a power-up to ready it (it glows), then pick a
  direction on the circle to fire it. Tap again to cancel. The freeze bomb fires at once.
- On a phone held upright, the game asks you to turn it sideways. It also requests full screen
  and a landscape lock, where the browser allows that.
- Keyboard: arrows or WASD, Space to wait, 1–4 to ready a power-up, Z undo, R restart, P pause.

## Spiders

1. **Always hunting.** Every turn a spider steps toward you, along the longer axis first.
2. **Blocked by anything.** Spiders only walk on bare floor. Walls, doors, gates, fences,
   crates, lava, chips, keys and power-ups all stop them, so a spider is easy to box in.
3. **One turn to get going.** When a spider's way opens up (you took the chip it was
   pressed against), it spends one turn getting moving. That one turn is your head
   start. Without it, a spider right behind a chip would catch you the instant you took it.
4. **Gates are safety.** A door you open becomes a gate. You walk through it; no enemy ever does.

On screen, a blocked spider strains toward you, so you can always see it trying to reach you.

## Power-ups

Introduced one per level, then combined.

| Power-up | Charges | Effect |
|---|---|---|
| Jetpack | 1 | Smash through one wall next to you and move into the gap. |
| Flamethrower | 3 | Burn every enemy in a line up to 3 tiles. Fire passes over items, gates and fences. |
| Mega blaster | 3 | A shot travels in a straight line: it breaks the first cracked wall or crate, or kills the first enemy it hits. |
| Freeze bomb | 1 | Every enemy freezes for 6 moves. Frozen enemies are solid blocks: they can't hurt you, but you can't pass them either. |

Supporting tiles: **cracked walls** (blaster or jetpack), **steel** (nothing breaks it),
and **fences** (you pass, enemies don't, fire and shots go through).

## Worlds and their modifiers

Each art direction from the mockups is also a rule change.

| World | Modifier |
|---|---|
| Pixel Arcade | None: the basics. |
| Lost Circuits | **Crumbling floor.** It turns into a hole the moment you step off it. One-way bridges, and spiders can't follow you over the gap. |
| Ice Station | **Ice.** You slide until something stops you: a wall, a rock, a chip or a key. Spiders grip ice fine. |
| Neon Mixtape | **Beat blocks.** Pink and cyan blocks swap every 4 moves (the HUD shows the beat). Anything inside one when it closes is crushed, spiders included. |
| Solar Disco | **Lava** and crates, plus everything else. |

## Levels

| # | World | Name | Introduces | Size |
|---|---|---|---|---|
| 1 | Pixel Arcade | Boot Up | Keys and doors: each chip is locked in its own closet | fits the screen |
| 2 | Pixel Arcade | Spend Wisely | Single-use keys; opening the nearest door first leaves you stuck | fits the screen |
| 3 | Pixel Arcade | Spider Nest | Spiders boxed in behind a chip; the gate escape | bigger than the screen |
| 4 | Lost Circuits | Jetpack | Jetpack; a crumbling bridge you can only cross once | bigger |
| 5 | Lost Circuits | Crumbling Ruins | Escaping spiders over a collapsing bridge | bigger |
| 6 | Ice Station | Thin Ice | Sliding | bigger |
| 7 | Ice Station | Flamethrower | Spiders fenced around the key: burn them | bigger |
| 8 | Neon Mixtape | Mega Blaster | Three shots, three cracked walls, beat-block timing | bigger |
| 9 | Neon Mixtape | Beat Drop | Leading a spider into a closing beat block | bigger |
| 10 | Solar Disco | Freeze Frame | Freeze bomb; lava and a crate | bigger |
| 11 | Solar Disco | Disco Inferno | All four power-ups in one level | bigger |

## Modes and scoring

- **Explorer**: no move limit.
- **Classic**: moves capped at 1.5 × par.

Undo is always available, but it costs the clean-run star. Stars: ★ escaped,
★ within 120% of par, ★ no undo.

**Par** is the true minimum number of moves, found by `tools/solve.js` with a
cheapest-first search over every reachable state (an ice slide costs one move per
tile). Disco Inferno is too large to search exhaustively, so its par is the best
known route: the shortest path through its items in a fixed order. It is labeled
"best known" in the game.

## Ideas for later

- **Spider variants:** a fast spider that takes two steps per turn; a spider that sees
  diagonally; a mother spider whose death frees the whole nest.
- **Solar Disco's own modifier:** disco arrows (conveyor tiles that push you).
- **More power-ups:** a decoy that spiders chase instead of you; a teleporter pair.
- **Level editor** with the solver built in, so shared levels are guaranteed winnable.
