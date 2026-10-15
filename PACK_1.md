# Pack 1: Glass Mastery

This pack extends Lockstep from 37 to 40 levels. It contains the seven existing Glass Maze levels and three new expeditions. Levels 1 to 37 retain their maps, names, and scoring targets.

Toolbox retains its 66-turn target, with a guided validation route added to keep search time within budget.

| Level | Name | Main challenge | Validated par |
| --- | --- | --- | --- |
| 38 | Refraction | Five chips, thin walls, one-use passages, an unseen barrier, and a clued painted crossbar | 160 turns, exact |
| 39 | Dead Reckoning | Suction boots, ice rails, painted returns, four northern chips before the thief, and a southern coil | 246 turns, exact |
| 40 | Prism Break | Six chips in four wings, a key chain, scarce tools, painted return passages, and a final spider chase | 357 turns, best known route |

The world advances six turns per second. Stars retain their existing time multipliers. Completion has no time limit. Long first attempts are expected while the player learns the map.

## Progress and compatibility

Level 1 is open on a new install. Completing each level unlocks the next. Continue selects the first unfinished level, or Level 40 after the installed campaign is complete.

Existing completion records migrate by level name. A gap in earlier completions temporarily locks later levels, while preserving their clears and times. A future material revision can reset its timed record without erasing the clear. Keep level names stable, and increment the revision only for a changed challenge or par.

The Android application ID and signing key remain the same as Build 20. Install the new APK over the old app to retain its local saves. Do not uninstall first.

## Review this pack

Play Levels 31 to 40 in order. Record the level number and the action that caused any unclear failure, trap, or unexpected shortcut. Check touch controls during the final chase, and check that the next level opens after a clear. Top-star routes reward the painted passages and the capstone's final cracked seam.

Approve Pack 1 after the phone playtest before production begins on Pack 2.

## Validation

The release workflow checks map structure, game rules, progress migration, solver pars, and browser playthroughs. It also checks the selector at mobile and desktop sizes, a 100-level selector fixture, state-key equivalence, solver lower bounds, the capstone's reaction margin, and its ordinary route without hidden passages. Solver searches stop at 90 seconds or one million distinct states. Guided routes are labelled as best known rather than exact.

Validation artifacts contain replay solutions, screenshots, and the measured capstone fairness report. These are available with the release workflow run. Browser simulation does not replace the phone playtest.

## Campaign roadmap

Seven packs cover Levels 31 to 100 in groups of ten: Glass Mastery, Terrain Mastery, Pursuit Mastery, Machine Logic, Scarcity Protocol, Systems Collision, and Final Lockstep. Later packs begin only after approval of the preceding APK.
