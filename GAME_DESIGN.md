# Lockstep: game design

A 2D, turn-based, pixel-art puzzle game in the spirit of *Chip's Challenge*: colored
keys, colored doors, chips to collect and a flag to reach. The difficulty comes from
**spiders**:

> Spiders sleep behind the things you need. Once one sees you, it chases you
> until a wall or a gate stops it. Take the chip, then run for the gate.

Nothing moves unless you do, so every chase can be planned in advance.

## The three skills it trains

| Skill | Where it comes from |
|---|---|
| **Problem solving** | Keys are single-use and crates can be wasted, so the order matters. Get the key for your escape gate *before* you wake the spider. |
| **Critical thinking** | Spiders, drones and mimics follow fixed, visible rules. Every death can be reasoned about: which way will the spider step, and where will it jam? |
| **Memory** | Lights Out mode: study the level in full light, then play it seeing only the tiles next to you. |

## Core loop

1. **Read the level.** Find the chips, the keys, the doors, and where each spider can see.
2. **Plan the escape.** Pick the gate you will run to and make sure you hold its key.
3. **Wake and run.** Take the chip. The spider gets one turn to wake up, then follows you.
   Break its line through a gate or around a corner it can't follow.
4. **Reach the flag** once every chip is collected.

## Pieces

| Tile | Rule | What it tests |
|---|---|---|
| Keys and doors | A key opens one door of its color and is used up. Doors carry a symbol (red ▲, blue ◆, yellow ●, green ■) for color-blind players. | Planning order. |
| Gate | An opened door. You can pass; enemies can't cross it or see through it. | Choosing your escape. |
| Chip | Collect all to unlock the flag. Spiders often sleep behind one. | Route planning; when to wake a spider. |
| Flag | The exit. | – |
| Lava | Instant death. | Routing; memory in Lights Out. |
| Crate | Pushable. Pushed into lava, it sinks and leaves floor. | Sokoban-style thinking; you can waste a crate. |

## Enemies

All enemies move once after each of your turns, in a fixed order, by fixed rules.
They only walk on bare floor, so walls, doors, **gates**, items, crates, lava and the
exit all block them. A chip or key lying on the floor is a wall to an enemy until you
pick it up.

### Spiders (the main source of difficulty)

Spiders work like the ghosts in Pac-Man, with one twist: they don't hunt you until they see you.

1. **Asleep.** A spider sees along its row and column. Its view is blocked by anything
   that isn't bare floor, including the chip or key it sleeps behind.
2. **Alert.** When it sees you, it shows a **!** and spends that turn waking up. That one turn is your head start.
3. **Chasing.** Every turn it steps toward you, along the longer axis first. It keeps
   following even when it can no longer see you.
4. **Stuck.** When a wall, gate or item blocks both of its possible steps, it gives up and falls
   asleep where it stands. If it sees you again, it wakes again.

**Gates are the escape.** A door you have opened stays in the level as a gate. You can
walk through it, but no enemy can cross it or see past it. So the typical spider
puzzle goes: work out your escape route, get the key for that gate *first*, then
take the chip and run.

Two ways to hide a spider, both in the levels:

- **Behind a collectible** (The Nest, Spider Run): the chip or key is the wall. Picking it up opens the spider's line of sight.
- **In a hidden room** (Hidden Room): the spider sleeps behind a locked door, and opening the door lets it out.

Spiders are also beatable by thinking, not just running: since they only step toward
you, you can lead one around a pillar until it jams against a wall.

### Supporting enemies

| Enemy | Rule | Puzzle it creates |
|---|---|---|
| **Patrol drone** | Flies straight; reverses when blocked. | Timing. Count its cycle and slip past using alcoves. |
| **Mimic** | Copies your move each turn (if it can). | Spatial reasoning. Use walls to change your relative position. |

## Modes

The level layouts never change. The mode decides how much help you get:

| | Explorer | Classic | Lights Out |
|---|---|---|---|
| Map | fully lit | fully lit | study it, then you see 1 tile around you |
| Move limit | none | 1.5 × par | 1.5 × par |
| Undo | yes | yes (costs the clean-run star) | no |
| Peeks at the full map | – | – | 2 |

**Par** is the true minimum number of moves, computed by `tools/solve.js`, which
does a breadth-first search over every reachable game state (spider sleep and wake
states included). Every level is proven solvable within its limit.

## Scoring

Three stars per level:

- ★ Escaped.
- ★ Within 120% of par (efficient planning).
- ★ Clean run: no undo and no peeks.

## Art direction

Pixel art at 16 × 16 per tile, scaled up without smoothing. The player is a small robot.
Each key color has its own door symbol: red triangle, blue diamond, yellow circle, green square.
The HUD sits on the right, as in the mockups. Five worlds, each with its own tiles and
spider color:

| World | Look |
|---|---|
| Pixel Arcade | Bright blue blocks, circuit-trace floors |
| Lost Circuits | Mossy sandstone ruins |
| Ice Station | Frosted blocks with icicles, purple spiders |
| Neon Mixtape | Magenta blocks with a glossy stripe |
| Solar Disco | Orange checker blocks, teal spiders |

You can also choose one art style for every level.

## Levels in the prototype

| # | World | Name | Teaches |
|---|---|---|---|
| 1 | Pixel Arcade | Boot Up | Keys, doors, chips, the flag. |
| 2 | Pixel Arcade | Spend Wisely | Single-use keys. Opening the nearest door first leaves you stuck. |
| 3 | Lost Circuits | The Nest | A spider behind a chip. Grab it and outrun the spider around a corner. |
| 4 | Lost Circuits | Heat | Lava and crates. |
| 5 | Ice Station | Hidden Room | A spider behind a door. Lure it round a pillar, grab the chip and key, escape through a gate. |
| 6 | Ice Station | Clockwork | Patrol drone timing. |
| 7 | Neon Mixtape | Echo | The mimic. |
| 8 | Neon Mixtape | Vault | Crates, lava, a patrol and two locked doors. |
| 9 | Solar Disco | Spider Run | Two nests, three gates, and the order you visit them in. |

## Ideas for later

- **Spider variants:** a spider that sees diagonally; a fast spider that takes two
  steps for every one of yours; a mother spider that wakes the whole nest.
- **One-way gates** that let enemies through in one direction only.
- **Memory-specific tiles:** switches that toggle walls you can no longer see;
  "false floor" that looks like floor in the study phase but is lava.
- **Sound as information:** each enemy type makes a different footstep, louder
  when closer, so you can track them in the dark.
- **Level editor** with the solver built in, so every shared level is guaranteed
  beatable and gets a par automatically.
- **Daily puzzle** with a shared seed and a par leaderboard.
