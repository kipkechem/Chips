// Development-only design contracts, written before route search and par assignment.
'use strict';
module.exports = {
  31: {
    style: 'tight', budget: 'r2, b1, j1; R3, B1; two optional ordinary seams',
    dependencies: ['initial red -> blue treasury -> blue door -> second red -> final red door', 'jetpack -> outer red cupboard chip'],
    deductions: ['The blue seam saves the wrong colour.', 'Opening the outer red cupboard spends the key needed at the final door.'],
    strategies: ['Breach the outer cupboard, preserve both red keys for the treasury and exit room.'],
    mistakes: ['Spend a red key on the outer cupboard.', 'Breach the blue-room pane.'],
  },
  32: {
    style: 'tight', budget: 'one crate, b1, m3; no skates or flippers',
    dependencies: ['crate -> stop west of shaft -> blue key and branch chip', 'same crate -> ice transfer -> consumed water bridge -> blue exit'],
    deductions: ['Sliding cannot push the stop.', 'The branch cannot be entered by walking against a slide.'],
    strategies: ['Stage the crate on ice, visit the branch, then send the stop to the far bank.'],
    mistakes: ['Blast the crate.', 'Send the crate to water before visiting the branch.'],
  },
  33: {
    style: 'tight', budget: 'r1, b2, y1, m3, j1; return panes cost two each, final cracked pane costs one',
    dependencies: ['red -> first blue -> m2 return -> blue cupboard -> jetpack and second blue', 'second bridge -> blue -> yellow -> jetpack return -> yellow gate -> last shot'],
    deductions: ['The second plain return needs the jetpack that is still behind the first blue door.', 'A collapsed bridge cannot be repaired.'],
    strategies: ['Establish the first return and fetch the cupboard before the second crossing.'],
    mistakes: ['Cross the first bridge without the blaster.', 'Cross the second bridge before fetching the jetpack.', 'Waste a blaster charge.'],
  },
  34: {
    style: 'alternatives', budget: 'b1, r1, g1, j1, m3; ordinary archive and final panes plus one cracked annex',
    dependencies: ['archive breach -> red', 'blue east door -> green -> return gate', 'partition gap -> annex chip', 'red -> final stair'],
    deductions: ['The posted invisible partition has one marked gap.', 'Spending blue in the archive prevents east access.'],
    strategies: ['Jetpack archive, one shot annex, two shots final.', 'Two shots archive, one shot annex, jetpack final.'],
    mistakes: ['Spend blue in the archive.', 'Use two shots on unrelated panes.'],
  },
  35: {
    style: 'tight', budget: 'two boolean suction pickups, r2, b1; thief between opposed conveyors and return door',
    dependencies: ['initial red -> treasury -> blue return key and second red', 'first boots -> thief crossing', 'blue return -> reserved red -> untouched spare -> opposed belts'],
    deductions: ['Two pickups do not mean two inventory pairs.', 'The return must avoid the thief.'],
    strategies: ['Leave the spare on the map, open the blue return after theft, and retrieve it.'],
    mistakes: ['Open the spare cupboard before the treasury.', 'Collect both pairs before theft.'],
  },
  36: {
    style: 'alternatives', budget: 'j1, m3, f3, r1, b1, one crate and spider',
    dependencies: ['north pane -> blue', 'west pane -> red detour', 'crate -> water bridge OR shot -> red detour', 'blue gate -> protected firing position'],
    deductions: ['A bridge makes the red detour optional.', 'Flame and shot can both clear the nest, but neither replaces a missing breach.'],
    strategies: ['Jetpack north; shoot west, crate and spider; use red detour.', 'Shoot north twice; jetpack west; push bridge; use flame at gate.'],
    mistakes: ['Destroy the crate after spending red elsewhere.', 'Spend the last wall shot on the spider in the wrong allocation.'],
  },
  37: {
    style: 'tight', budget: 'r2, b1, j1; no weapon or freeze',
    dependencies: ['initial red -> safe hall threshold -> blue and chip', 'blue -> red replacement', 'jetpack -> sealed treasury chip', 'replacement red -> exit'],
    deductions: ['The neighbouring breach does not stop pursuit.', 'The jetpack is also the only access to the sealed chip.'],
    strategies: ['Use the hall gate, retreat through it, then finish the treasury and exit.'],
    mistakes: ['Breach beside the hall gate.', 'Spend the first red at the exit.'],
  },
  38: {
    style: 'alternatives', budget: 'z1, m3, b1, one crate, one living drone',
    dependencies: ['drone on plate + freeze -> timed traps -> green -> permanent return', 'blue vault breach -> crate warehouse -> transported plate weight -> untimed traps'],
    deductions: ['Killing the drone removes the timed plan, not the crate plan.', 'Freezing away from the plate is not equivalent to holding it.'],
    strategies: ['Leave the crate, freeze the drone on the plate, unlock the green return.', 'Leave freeze unused, transport the crate onto the plate, unlock the return.'],
    mistakes: ['Kill the drone after destroying the only crate.', 'Freeze off the plate and enter a trap.'],
  },
  39: {
    style: 'tight', budget: 'one crate, b1, m3 accessible only after weighting the plate; sealed chip costs two, bypass one',
    dependencies: ['crate ice stop -> branch blue key', 'same crate slides to plate -> trap -> blaster -> sealed chip', 'permanent cracked bypass -> recover crate -> water bridge'],
    deductions: ['Recovering into the east service corner blocks the shot needed to open the bypass.', 'The trap route closes when the plate is empty.'],
    strategies: ['Use the crate as a stop, then weight, open both breaches, then consume it as a bridge.'],
    mistakes: ['Consume the crate early.', 'Recover into the service corner before opening the bypass.'],
  },
  40: {
    style: 'alternatives', budget: 'r2, b2, y1, g1, j1, m3, z1, one crate and drone',
    dependencies: ['red gate OR archive breach -> blue -> southern treasury -> replacement red and blue', 'living drone OR preserved red for crate -> plate -> eastern blue -> green and yellow', 'green return -> red final stair -> ordinary pane -> chip -> yellow -> cracked pane -> exit'],
    deductions: ['A key saved at the archive can fund the crate plan before east access.', 'The timed plan preserves the jetpack for the final stair; the crate plan needs the blaster there.'],
    strategies: ['Open archive red; freeze drone; jetpack final stair; shoot final cracked pane.', 'Jetpack archive; red warehouse; transport crate; two shots final stair and one cracked pane; keep drone alive.'],
    mistakes: ['Kill the drone and destroy the crate.', 'Spend final shots while the jetpack has already been used at the archive.'],
  },
};
