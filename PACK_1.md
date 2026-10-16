# Pack 1 revision 2: decisions before distance

This replaces all ten maps in Build 21's Pack 1. Level names, mechanics, controls, scoring multipliers, sequential unlocking, application ID, and signing key remain unchanged. Levels 1 to 30 are unchanged.

Every redesigned level has revision 2. Existing completion credit survives, but the ten obsolete times and their stars reset. New records persist normally. Install the replacement APK over Build 21 without uninstalling.

## Design contracts

The development-only [design contracts](tools/pack1-designs.js) define each budget, dependency graph, deductions, strategies, and consequential mistakes. The [executable proofs](tools/build-pack1-proofs.js) search short legs using the real game state, including inventory, crate positions, irreversible map changes, and enemy phase. No fixture is loaded by the game or copied into the Android bundle.

| Level | Puzzle and irreversible decision | Validated target, turns |
| --- | --- | --- |
| 31 Panes | Three red doors compete for two keys. Breaching the blue room saves the wrong resource. The outer cupboard's pane preserves the key needed at the final red door. | 62 |
| 32 Bobsled | The single crate stops an ice slide at the key branch, then becomes the far-bank bridge. Blasting or bridging early loses a future requirement. | 45 |
| 33 One Way Out | Collapsing bridges separate the red, blue, and yellow dependencies. Two shots establish the first return, the recovered jetpack supplies the second, and the last shot opens the exit. | 106 |
| 34 Ghost Walls | Visible posts and paired notches locate an invisible partition's gap. Jetpacking the archive or jetpacking the final stair gives two complete allocations of the same wall budget. | 87, both plans |
| 35 Roulette | Two suction pickups do not stack. The treasury funds the blue return and spare cupboard, while the spare must remain on the map until after theft. | 72 |
| 36 Toolbox | One plan shoots the crate and takes the red detour. Another turns it into a bridge and uses flame at the enemy gate. The jetpack and shots also exchange jobs at the two resource rooms. | 58, alternative 62 |
| 37 Hall of Glass | Spending red at the hall creates a permanent enemy barrier. Breaching beside it both admits pursuit and wastes the only tool that reaches the treasury chip. | 47 |
| 38 Refraction | Freeze the live drone on its plate for a timed circuit, or retrieve and transport the warehouse crate for an untimed circuit. Both unlock the green return. | 46, alternative 57 |
| 39 Dead Reckoning | The same crate is an ice stop, a plate weight, and a consumed bridge. Recovering it into the service corner before opening the bypass blocks its own rescue shot. | 80 |
| 40 Prism Break | The archive competes with the crate warehouse for red. A gate-and-freeze plan retains the jetpack for the final stair. A key-saving breach funds the crate plan and spends two shots on that stair instead. | 100, alternative 103 |

Targets were assigned after the puzzles and complete strategies worked. These are best known authored routes, not claims of globally optimal pars. The original scoring multipliers still apply. Completion has no time limit.

Intro hints describe rules, available choices, and constraints. Local clues precede irreversible commitments. The ghost partition has an explicitly marked gap, not a mandatory blind search. Safe observation points remain available at the drone mechanisms and behind the hall's coloured gate.

## Acceptance evidence

The release workflow must pass before publishing:

1. All 33 rule tests, seven campaign tests, and structural validation of 40 maps.
2. Solver validation of every installed level, with exact and best-known targets distinguished. The first 30 maps are compared with Build 21 as a separate local regression check.
3. Fourteen complete Pack 1 strategies. Each alternative pair must differ in irreversible tool, crate, or enemy commitments, not just walking order.
4. Eighteen branch checks covering wrong keys, wrong seams, early bridges, wasted shots, early one-use crossings, lost spare boots, unsafe enemy access, lost plate operators, off-plate freeze, and premature crate recovery.
5. A minimum four-turn margin at the mandatory hall chase and both timed drone plans. Delayed replays must still win.
6. Real Chromium playthroughs of 40 canonical routes, four additional strategies, and three delayed routes. The controller's turn count must match the pure rules engine.
7. Mobile and desktop menu/play inspection, sequential and history locks, migrated clear credit, a 100-card lazy-preview fixture, and full-map renders of all ten redesigned levels.
8. Production bundle checks for current sources, offline fonts, and exclusion of development files. The APK signature must match the existing repository key, and a published SHA-256 accompanies the APK.

Branch failures are proved either by exhausting the full checkpoint state search, or by an optimistic reachability relaxation that gives every barrier the full available tool budget independently and ignores enemies, thin edges, and forced movement. If even that relaxed world disconnects a required chip or exit, the real state cannot win. Search timeouts are reported as inconclusive and fail the test; they never count as proof of an unwinnable branch.

Search budget failures during development prompted stronger resource-cut proofs. The premature crate recovery test also discovered an unintended escape through the chip room. That room was isolated and both the winning route and losing checkpoint were rerun after the repair.

Validation artifacts include replay paths, branch results, and screenshots. The release also includes the machine-readable decision report outside the APK. Browser and package tests do not establish physical-phone usability.

## Phone review boundary

Play Levels 31 to 40 on the phone. Check whether the clues make the key competition, resource reuse, and irreversible commitments understandable before acting. Report the level and action for unclear failures or unintended shortcuts. Check touch control timing, new score persistence, and the next-level unlock.

Stop here. Levels 41 to 50 must not begin until this replacement Pack 1 receives phone-playtest approval.
