# Chip's Challenge: Research Notes

Reference notes on the original *Chip's Challenge* (1989): rules, tiles, power-ups,
monsters, level design, and what makes it fun and hard. The goal is to have one
place to check while we design and build this project.

> Facts marked **(MS)** apply to the Microsoft Windows version and **(Lynx)** to the
> Atari Lynx original. Where the two differ, both are given.

---

## 1. Background

| | |
|---|---|
| Released | 1989, launch title for the **Atari Lynx** |
| Developer / publisher | Epyx / Atari Corporation |
| Designer | **Chuck Sommerville** (built an Apple II prototype first; the team wrote the game in about 10 weeks) |
| Level designers | Sommerville about 1/3, Bill Darrah about 1/3, other Epyx staff the rest |
| Ports | Atari ST, Amiga, C64, ZX Spectrum, MS-DOS (mostly by Images Software, UK) |
| Best-known version | Windows 3.1 port (Tony Krueger, Microsoft), shipped in *Microsoft Entertainment Pack 4* (1992) and *Best of Microsoft Entertainment Pack* (1995) |
| Level count | 148 (Lynx: 144 main + 4 secret); 149 in the Microsoft version |
| Sequels and successors | *Chip's Challenge 2* (written 1999, held up by rights disputes, released on Steam 28 May 2015 together with a Steam re-release of CC1); *Chuck's Challenge* (iOS, 2012); *Chuck's Challenge 3D* (2014) |
| Fan engines | **Tile World** (open source, emulates both MS and Lynx rules), **Lexy's Labyrinth** (browser-based, open source) |

**Story.** Nerdy high-schooler Chip McCallahan meets Melinda the Mental Marvel in the
science lab. To join her exclusive **Bit Busters Club** he has to get through her
"Clubhouse", a series of increasingly devious puzzle rooms.

---

## 2. Core loop and rules

1. Each level is a **32 × 32** tile map seen through a small **9 × 9** window that
   scrolls with Chip. Most of the map is out of view at any time.
2. Collect enough **computer chips** (shown as "chips left") to open the **chip socket**.
3. Walk through the socket and reach the **exit** (the blue swirling portal).
4. Most levels have a **time limit** in seconds. Some are untimed.
5. Chip dies in **one hit**: monsters, water, fire, bombs, or running out of time.
   The level restarts from the beginning. There are no checkpoints and no lives counter.
6. Many levels show a one-line **hint** when Chip stands on a hint tile (`?`).
7. Every level has a **four-letter password** so you can jump straight back to it.
   The PC versions also save progress, and after several failures the game offers to
   let you **skip** the level.

**Death messages (MS)** are part of the game's personality, for example
short "Ooops!" messages telling you exactly what killed Chip (water, fire, a creature, a bomb, the clock).

### Movement and timing

- Movement is **tile-to-tile in four directions** (Lynx also accepts diagonals in some
  engines, but movement is still orthogonal).
- The game runs on a clock of **20 ticks per second**. Chip and most monsters take
  **4 ticks per tile** (5 tiles per second). Teeth and blobs move at **half speed**.
  Sliding on ice and force floors is **faster** than walking.
- The world keeps moving while you stand still. This turns static puzzles into timing
  puzzles: you are not playing a turn-based roguelike.
- **(MS)** Movement snaps from tile to tile with no animation between tiles.
  **(Lynx)** Everything animates smoothly between tiles.

---

## 3. Floors and terrain

| Tile | Behavior |
|---|---|
| **Floor** | Normal walkable space. |
| **Wall** | Blocks everything. |
| **Thin wall** | Blocks one edge of a tile only (you can stand on the tile, but not cross that edge). |
| **Water** | Kills Chip unless he has **flippers**. Pushing a **block** into water fills it and turns it into **dirt**. Most monsters drown; gliders swim. |
| **Fire** | Kills Chip unless he has **fire boots**. Fireballs are immune. Behavior with other monsters depends on the ruleset (see section 9). |
| **Ice** | Anything entering slides in a straight line until it leaves the ice. Chip cannot steer while sliding. Needs **ice skates** to walk normally. |
| **Ice corner** | Ice with two walled sides; deflects a sliding object 90°. |
| **Force floor** (N/S/E/W) | Conveyor belt: pushes anything on it in its arrow direction. **Suction boots** cancel it. **(MS)** Chip can sometimes step off sideways ("force floor override"). |
| **Random force floor** | Pushes in a random direction **(MS)**, or cycles clockwise through directions each time it is used **(Lynx)**. |
| **Dirt** | Chip can walk on it and clears it to floor. Monsters and blocks cannot enter. |
| **Gravel** | Chip and blocks can enter. Monsters cannot. Useful as safe ground. |
| **Bomb** | Destroys whatever enters it, then disappears. A pushed block sets it off and is destroyed too. |
| **Teleport** | Chip (or a monster/block) entering is sent to the **previous teleport in reading order** (wrapping around), exiting in the same direction. If that exit is blocked, it tries the next one. |
| **Popup wall** (recessed wall) | Walkable once; becomes a solid wall after Chip passes. Great for one-way routes and soft-lock traps. |
| **Blue wall (real)** | Looks like a blue block; solid. Becomes a normal wall when bumped. |
| **Blue wall (fake)** | Looks identical; vanishes when Chip bumps it. Players must probe to find which is which. |
| **Invisible wall** | Solid but drawn as floor, always. |
| **Appearing wall** | Invisible until Chip bumps it, then shown as a wall. |
| **Toggle wall / toggle floor** | Swap between wall and floor whenever a **green button** is pressed. |
| **Thief** | Steals **all of Chip's boots** when he steps on it (keys are kept in CC1). |
| **Hint** (`?`) | Shows the level's hint while Chip stands on it. |
| **Chip socket** | Solid until all required chips are collected. |
| **Exit** | Reaching it completes the level. |

---

## 4. Keys and doors

Keys open the door of the same color. Chip can carry multiple keys of each color.

| Key | Consumed on use? | Notes |
|---|---|---|
| **Red** | Yes | Only Chip can pick it up. |
| **Blue** | Yes | Monsters can pick it up in some rulesets, so it can be "stolen" by a wandering bug. |
| **Yellow** | Yes | |
| **Green** | **No** | One green key opens every green door in the level. |

Doors behave like walls for monsters. The consumed-key rule creates resource puzzles:
opening the wrong door first can leave you short of a key later.

---

## 5. Power-ups (boots)

Chip's "power-ups" are four pairs of boots. Each grants immunity to one hazard. They
last until the end of the level or until a **thief** takes them all.

| Boots | Protects against | Typical use |
|---|---|---|
| **Flippers** | Water | Swim across lakes and moats |
| **Fire boots** | Fire | Walk through fire |
| **Ice skates** | Ice | Walk on ice without sliding, turn freely |
| **Suction boots** | Force floors | Walk on conveyors in any direction |

**Computer chips** are the other collectible. They are the level's objective rather
than a power-up. There are no weapons, health, extra lives, or temporary buffs: the
game is about **using terrain**, not fighting.

---

## 6. Buttons and machines

| Button | Effect |
|---|---|
| **Green** | Toggles every toggle wall and toggle floor in the level. |
| **Blue** | Reverses the direction of **every tank** in the level. |
| **Red** | Fires the linked **clone machine**: it creates a copy of the monster or block sitting on it, which leaves in its facing direction. |
| **Brown** | Opens the linked **bear trap** while held down, releasing anything stuck in it. |

**Wiring.** **(MS)** The level designer explicitly links brown buttons to traps and red
buttons to clone machines. **(Lynx)** A button connects automatically to the next trap
or clone machine in reading order (wrapping around).

**Bear trap.** Anything that enters (Chip, monster, or block) is stuck until the
linked brown button is pressed, often by pushing a block onto it or luring a monster
over it.

**Clone machine.** Holds one monster or block that cannot move. Each red-button press
spawns a copy. Used for monster factories, infinite block supplies, and dangerous
timing puzzles.

---

## 7. Blocks

- **Movable dirt blocks** are pushed one tile when Chip walks into them. Chip cannot
  pull them, and a block cannot be pushed into a wall or another block.
- A block pushed into **water** becomes **dirt** (builds a bridge).
- A block pushed into a **bomb** destroys both.
- Blocks slide across ice and ride force floors.
- Blocks stop monsters and can hold down buttons.
- Pushing a block into a corner usually means it is stuck forever, which is the
  classic Sokoban-style soft lock.

---

## 8. Monsters

Every monster is lethal on contact. All of them are **deterministic** except blobs and
walkers. In the table, "priority" is the order of directions a monster tries each time
it moves; it takes the first one that is open.

| Monster | Movement rule (priority) | Speed | Special |
|---|---|---|---|
| **Bug** | Hugs the **left** wall: left, forward, right, back | Normal | Avoids fire |
| **Paramecium** | Hugs the **right** wall: right, forward, left, back | Normal | |
| **Fireball** | forward, right, left, back | Normal | Immune to fire |
| **Glider** | forward, left, right, back | Normal | Can cross water |
| **Pink ball** | forward; if blocked, reverse | Normal | Bounces back and forth |
| **Tank** | forward only; stops when blocked | Normal | Every **blue button** press turns all tanks around |
| **Walker** | forward; when blocked, picks a **random** new direction | Normal | Avoids fire |
| **Blob** | A **random** direction every move | **Half** | |
| **Teeth** | **Chases Chip**: moves along the axis with the larger distance, else the other axis | **Half** | The only monster that targets Chip |

General monster rules:

- Monsters cannot enter **dirt, gravel, doors, the exit, or the socket**.
- **(MS)** Items (keys, boots, chips) block most monsters.
- Monsters are killed by **bombs** and drown in **water** (except gliders).
- Monsters slide on ice and are pushed by force floors exactly like Chip.
- **(MS)** Only monsters listed in the level's "monster list" move; others just sit
  there, still lethal.

Because monster paths are predictable, levels with bugs, paramecia, fireballs, and
gliders become **pattern-reading puzzles**: once you see the loop they follow, you can
time a dash through it.

---

## 9. Two rulesets: MS vs Lynx

The Windows port was reverse-engineered from the DOS version and differs from the
Lynx original in many small ways. The community keeps both alive through Tile World.

| Topic | Lynx | MS |
|---|---|---|
| Animation | Smooth between tiles | Snaps tile to tile |
| Tile stacking | Only Chip, monsters, and blocks can sit on top of other tiles | Two full layers, so designers can stack almost anything |
| Fire | Most monsters avoid fire | Only bugs and walkers avoid it; others walk in and die |
| Button wiring | Automatic, next trap/cloner in reading order | Explicit links set by the designer |
| Random force floor | Cycles clockwise | Random |
| Glitches | Fewer | Several famous bugs that level designers and speedrunners exploit |

A level designed for one ruleset can be easier, harder, or **impossible** under the
other. Most community levels target MS.

---

## 10. Levels and progression

### Structure

- **Lessons first.** The opening levels ("LESSON 1" onward) each introduce one or two
  elements on their own (chips and socket, keys and doors, water and boots, blocks,
  monsters, ice, force floors) before later levels combine them.
- **Then a broad mix** of level types:
  - **Block pushing** (Sokoban-like)
  - **Mazes** and exploration, often with hidden or invisible walls
  - **Monster dodging and timing**: reading loops and dashing through gaps
  - **Sliding puzzles** on ice and force floors
  - **Machines**: buttons, clone machines, traps, and tank lines
  - **Resource puzzles**: limited keys and boots, thieves
  - **Speed / time-pressure** levels with tight limits
- The **difficulty curve rises but is uneven**: a brutal level can be followed by a
  breather. Reviewers mention this as part of the charm: you want to see what comes next.

### Notable levels (MS numbering where known)

| Level | Why it's remembered |
|---|---|
| **Castle Moat** | Looks like a standard block puzzle, but has a hidden shortcut for players who don't take it at face value. |
| **Blobnet** | Notoriously hard maze full of randomly moving blobs; luck and patience. |
| **Cellblocked**, **Thief Street**, **Lemmings**, **Icedeath**, **Doublemaze**, **Pain** | Commonly cited by players as memorable or difficult. |
| **H2O before 273K**, **Tunnel Clearance**, **Keep Trying** | Famous among score-chasers for very tight timing. |
| **144 Fireflies** (password GVXQ) | Final regular level of the MS set. |
| **145 "Thanks to..."** | Credits level, no real play. |
| **146 Cake Walk** (JHEN), **147 Force Field** (COZA), **148 Mind Block** (RGSK), **149 Special** (DIGW) | Secret levels reachable only by password. The Cake Walk password is hinted at inside level 34, "Cypher". |
| Password **TONY** (MS) | Leads to a level crediting the Microsoft test team and developers. |

### Scoring (MS)

- **Level bonus** = 500 × level number, reduced by 20% (rounded down) for every failed
  attempt. Sources disagree on the exact minimum.
- **Time bonus** = 10 × seconds left on the clock (untimed levels give 0).
- The total score is the sum of each level's best score. This created a whole
  competitive scene around "bold" (best possible) times. Tile World and the Steam (CC2)
  engine do not apply the per-attempt penalty.

---

## 11. What makes it fun

1. **Small rule set, huge combinations.** About 40 tile types with simple, consistent
   rules combine into very different puzzles. Learning a rule once pays off for the
   rest of the game.
2. **Teaching through play.** Lesson levels introduce each element in isolation, and
   later levels remix them. Hint tiles explain without a manual.
3. **Genre variety.** Sokoban, maze, action, timing, and logic puzzles live in the same
   game, so it rarely gets stale.
4. **Deterministic monsters.** Most enemies follow fixed rules, so every "unfair" death
   teaches you a pattern. Mastery feels earned.
5. **Real-time pressure on top of puzzles.** The world moves while you think, which
   adds tension that pure turn-based puzzlers lack.
6. **Discovery.** The 9 × 9 window hides most of the map, so exploring a level is part
   of the puzzle. Hidden walls, secret shortcuts (Castle Moat), and secret levels
   reward curiosity.
7. **Fair escape hatches.** Passwords and the skip option mean being stuck on one level
   never ends the game.
8. **Personality.** Punny level names, cheeky death messages, and the silly
   nerd-joins-the-club story keep the tone light.
9. **Replay value.** Time bonuses and level scores invite optimization; a huge fan
   community has made thousands of custom levels (the CCLP community packs and more).

---

## 12. What makes it difficult

1. **One-hit deaths and no checkpoints.** A mistake late in a long level means starting
   over from the beginning.
2. **Irreversible actions (soft locks).** Blocks pushed into corners, keys used on the
   wrong door, popup walls closing behind you, and thieves taking boots can make a
   level unwinnable without obviously killing you. The player has to notice and restart.
3. **Time limits.** Tight timers force both a correct plan and quick execution.
4. **Hidden information.** The small viewport, invisible and appearing walls, and fake
   vs. real blue walls force trial and error and memorization.
5. **Precise timing.** Dodging monster loops, catching gaps between tanks, and moving
   on and off force floors require frame-level accuracy at the hardest levels.
6. **Randomness.** Blobs and walkers can make a level easy on one attempt and
   impossible on the next (Blobnet).
7. **Loss of control.** Ice and force floors take steering away; one wrong entry point
   can slide Chip into fire or water.
8. **Uneven difficulty curve.** A very hard level can appear early.
9. **Rule quirks.** Some levels depend on ruleset-specific behavior or engine glitches
   that are hard to discover by experiment.

---

## 13. Takeaways for this project

- **Engine.** Use a fixed-tick simulation (20 ticks/s, 4 ticks per move, half speed for
  slow monsters, faster sliding). Keep it fully deterministic, with a seeded RNG for
  blobs and walkers, so solutions can be replayed and verified.
- **Map model.** 32 × 32 grid, 9 × 9 viewport. Pick one ruleset deliberately. The Lynx
  style (one terrain layer plus actors and items on top) is simpler and avoids the MS
  two-layer edge cases.
- **Monster AI** is just a per-type direction priority list (section 8), which makes it
  cheap to implement and easy to test.
- **Onboarding.** Copy the "one new element per lesson level" approach, and show hint
  tiles in the early levels.
- **Reduce frustration without removing challenge.** Consider an undo or rewind,
  a "restart" key, a soft-lock detector, a password or level-select screen, and a skip
  after repeated failures. These are the modern fixes for the original's harshest
  points.
- **Legal.** The original levels, graphics, music, names, and the "Chip's Challenge"
  trademark are owned by others. Use original levels and art (or community levels whose
  licenses allow reuse) and an original name if this is ever distributed.

---

## Sources

- [Chip's Challenge, Wikipedia](https://en.wikipedia.org/wiki/Chip%27s_Challenge)
- [Chip's Challenge for Atari Lynx, Bit Busters Club wiki](https://wiki.bitbusters.club/Chip's_Challenge_for_Atari_Lynx)
- [Chuck Sommerville, Bit Busters Club wiki](https://wiki.bitbusters.club/Chuck_Sommerville)
- [Re(?)Considered: Chip's Challenge, Retronauts](https://retronauts.com/article/960/reconsidered-chips-challenge)
- [Twenty Years of Chip and Chuck, GamesBeat](https://gamesbeat.com/twenty-years-of-chip-and-chuck/)
- [MS ruleset, Bit Busters Club wiki](https://wiki.bitbusters.club/MS)
- [Lynx mode notes, CCLP3](https://bitbusters.club/cclp3/Lynx/general.html)
- [Tile World, Chip's Challenge Wiki](https://chipschallenge.fandom.com/wiki/Tile_World?oldid=6465)
- [Tile World file formats, Brian Raiter](https://www.muppetlabs.com/~breadbox/software/tworld/tworldff.html)
- [Low Score Challenge (scoring rules), Bit Busters Club wiki](https://wiki.bitbusters.club/Low_Score_Challenge)
- [Scores FAQ, Bit Busters Club](https://scores.bitbusters.club/faq)
- [Chip's Challenge passwords and secret levels, Arcade History](https://www.arcade-history.com/game/58808/)
- [Thanks to... (level 145), Bit Busters Club wiki](https://wiki.bitbusters.club/Thanks_to...)
- [Lexy's Labyrinth source, `js/tiletypes.js`](https://github.com/eevee/lexys-labyrinth/blob/master/js/tiletypes.js) (monster direction priorities, speeds, teeth pursuit, key rules)
