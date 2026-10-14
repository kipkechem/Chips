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

**A fair head start.** Every nest sits at least 5 tiles from the thing it guards. After you
grab it you have at least a second to react, on top of the half-second alert, before the
escape is lost. `node tools/reaction.js` measures this for every spider level.

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
| Tide Works | **Elements.** Water and fire, the boots that get you through them, and a thief who takes them. |
| Conveyor Yard | **Terrain.** Force floors, teleports, bombs, gravel, dirt, hidden and fake walls. |
| Machine Room | **Machines.** Buttons that flip toggle walls, open traps, fire clone machines and turn tanks. |
| The Zoo | **Monsters.** Each one moves by its own fixed rule. |

## The Chip's Challenge rule set

Worlds 6 to 9 rebuild the rules of *Chip's Challenge* from scratch, with original levels,
names and art (game rules can be reused; levels, names, art and sounds can't). Each level
introduces one element on its own; the last level of each world combines them.

**Boots** are kept until a thief takes them, and are shown top right in the HUD.

| Boots | Lets you |
|---|---|
| Flippers | Swim through water (otherwise you drown). |
| Fire boots | Walk through fire (otherwise you burn). |
| Ice skates | Walk on ice like floor, instead of sliding. |
| Suction boots | Walk on force floors without being carried. |

**Terrain**

| Tile | Rule |
|---|---|
| Force floor | Carries you one tile per turn in its direction, even if you stand still. |
| Teleport | Sends you to the next pad (reading order) that you can step out of, moving the same way. |
| Bomb | Kills you, or any monster. A crate pushed onto it destroys both. |
| Gravel | You walk on it; monsters can't. |
| Dirt | Monsters can't cross it; it clears to floor when you walk on it. A crate pushed into water becomes dirt. |
| Hidden wall | Looks like floor until you bump it. |
| Fake wall | Looks like wall, but gives way when you walk into it. |
| Thief | Takes every pair of boots you carry. |
| Green key | Never used up: it opens every green door. |

**Machines and buttons**

| Button | Effect |
|---|---|
| Green | Flips every toggle wall, open to closed and closed to open. A wall can't close on someone. |
| Brown | Opens every trap while something stands on it: you, a crate or a monster. |
| Red | Each clone machine makes a copy of its monster, heading its way. |
| Blue | Every tank turns around. |

A **trap** holds whatever walks in until the brown button is held down.

**Monsters.** None of them can cross gravel, dirt, force floors, teleports or items,
and gates stop them all. "Speed" is relative to you.

| Monster | Speed | Rule |
|---|---|---|
| Drone | 1/2 | Back and forth along a line. |
| Bug | 1/2 | Keeps a wall on its left. |
| Paramecium | 1/2 | Keeps a wall on its right. |
| Fireball | 1/2 | Straight on, turns right when blocked; walks through fire. |
| Glider | 1/2 | Straight on, turns left when blocked; swims through water. |
| Tank | 1/2 | Straight on only; stops when blocked; the blue button turns it around. |
| Teeth | 1/4 | Chases you. |
| Blob | 1/4 | Wanders at random (the same way every try). |
| Walker | 1/2 | Straight on; picks a random turn when blocked. |
| Mimic | 1 | Copies every move you try, even into a wall: bump a wall to move it while you stay put. |


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
| 12 | Tide Works | Deep End | Water and flippers | bigger |
| 13 | Tide Works | Firewalk | Fire and fire boots; a crate fills water with dirt | fits |
| 14 | Tide Works | Cold Feet | Ice skates | fits |
| 15 | Tide Works | Pickpocket | The thief and the green key | bigger |
| 16 | Conveyor Yard | Conveyor | Force floors and suction boots | bigger |
| 17 | Conveyor Yard | Beam Me Up | Teleports | bigger |
| 18 | Conveyor Yard | Minefield | Bombs, gravel, dirt and teeth | fits |
| 19 | Conveyor Yard | Smoke and Mirrors | Hidden and fake walls | fits |
| 20 | Machine Room | Switchback | Toggle walls and the green button | fits |
| 21 | Machine Room | Snare | A trap, a crate and the brown button | fits |
| 22 | Machine Room | Copy Machine | A clone machine and the red button | fits |
| 23 | Machine Room | Tank Trap | A tank and the blue button | fits |
| 24 | The Zoo | Bug Hunt | Bugs and paramecia | bigger |
| 25 | The Zoo | Hot and Cold | Fireballs and gliders | bigger |
| 26 | The Zoo | Feeding Time | Teeth and a blob | fits |
| 27 | The Zoo | Wanderers | Walkers; gravel islands to wait on | fits |
| 28 | The Zoo | Grand Zoo | Everything at once | bigger |
| 29 | The Zoo | Shadow Play | The mimic: bump walls to steer it onto a button and off a bomb | bigger |

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

## Revenue

*Planned, not built: this comes after the full game is finished.*

**One free app with a one-time unlock**, not a separate paid app. A single store listing
keeps all the ratings in one place, and people can try the game before paying. Paid-up-front
apps get far fewer installs.

| | Free | Full game (one purchase, about $2.99) |
|---|---|---|
| Levels | 1 to 5 (Pixel Arcade and Lost Circuits, about 15 minutes) | All 27, and every future world |
| Ads | Short ads between levels, plus optional "watch for a hint" ads | None (the optional hint becomes free) |

The free levels end on a high: by level 5 the player has escaped spiders, used the jetpack and
crossed a crumbling bridge. Level 6 (ice) is where the paywall sits. It shows the four worlds
still to come, with a screenshot of each.

### Where the ads go

The game is real time and you die a lot while learning, so the ad rules protect the flow:

| Place | Ad | Rule |
|---|---|---|
| After clearing a level, on **Next level** | Short interstitial (5 to 15 s, skippable) | At most one every 3 minutes, and never after the first two levels of a session. |
| Fail or retry | **None** | Ads on retry are the fastest way to lose a puzzle player. |
| During play or pause | **None** | An ad in the middle of a chase kills the run. |
| Menu or game screen | **No banners** | The landscape screen has no room: the joystick and power-up rack would be covered. |
| Pause menu: **Show me the way** | Rewarded (opt-in) | Watch an ad and a ghost robot walks the next 10 moves of the solver's route. The solver already proves every level, so the hints are always right. |
| Results screen, after a fail | Rewarded (opt-in) | Same hint offer, shown only after 3 fails on a level. |

Paying removes every interstitial and makes **Show me the way** free (limited to 3 per level,
so it stays a hint, not autoplay).

### What it needs

- **Google Play.** The unlock needs Play Billing, which only works for apps installed from the Play
  Store. The GitHub APK stays as a test build. Play needs a developer account ($25, one-time) and a
  signed release build (AAB) instead of the current debug APK.
- **Ads:** an AdMob account and the `@capacitor-community/admob` plugin.
  **Purchase:** a billing plugin (RevenueCat's Capacitor plugin is the simplest). It also handles
  "restore purchase" on a new phone.
- **Rules:** a privacy policy page, the consent form AdMob provides (required in the EU and UK), the
  "Contains ads" label, and the Play data-safety form. If the game is marketed to children
  (it trains memory and problem solving), Google's Families rules apply: only certified ad
  networks, and no personalized ads. Decide the target age before turning ads on.
- **In the code:**
  - A `full` flag, saved locally and confirmed with Play on launch.
  - Levels after 5 locked until the game is unlocked.
  - A paywall screen.
  - One `showAd()` hook called from **Next level**, which does nothing on the web version.

## Ideas for later

- **Spider variants:** a fast spider that takes two steps per turn; a spider that sees
  diagonally; a mother spider whose death frees the whole nest.
- **More power-ups:** a decoy that spiders chase instead of you; a teleporter pair.
- **Level editor** with the solver built in, so shared levels are guaranteed winnable.
