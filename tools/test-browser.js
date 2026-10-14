#!/usr/bin/env node
// Plays every level in a real (headless) browser, pressing the solver's winning keys one
// turn at a time on a controlled clock, and checks each level is cleared with no page errors.
// Needs Playwright with Chromium (npm i -g playwright). Run: node tools/test-browser.js [levelNumber...]
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const L = require('../core.js');
const LEVELS = require('../levels.js');
const { solve, waypoints } = require('./solve.js');

let playwright;
try {
  playwright = require('playwright');
} catch {
  playwright = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
}

const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
const KEY = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
const POWER_KEY = { j: 'Digit1', f: 'Digit2', m: 'Digit3', z: 'Digit4' };

function serve() {
  const server = http.createServer((req, res) => {
    const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
    if (!file.startsWith(ROOT) || !fs.existsSync(file)) return res.writeHead(404).end();
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(0, () => ok(server)));
}

const parse = (a) => {
  if (a === 'wait') return null;
  if (!a.includes(':')) return a;
  const [use, dir] = a.split(':');
  return dir === '-' ? { use } : { use, dir };
};

async function play(page, idx) {
  const def = LEVELS[idx];
  const r = def.route ? waypoints(def, def.route) : solve(def);
  await page.click(`#menu .level >> nth=${idx}`);
  await page.clock.runFor(300);
  await page.click('#intro-go');
  let s = L.parseLevel({ ...def, battery: 0 });
  for (const label of r.path) {
    const a = parse(label);
    s = L.act(s, a).state;
    if (a && typeof a === 'object') {
      await page.keyboard.press(POWER_KEY[a.use]);
      if (a.dir) await page.keyboard.press(KEY[a.dir]);
    } else if (a) await page.keyboard.press(KEY[a]);
    // Let the clock run until the game has played as many turns as the solver did.
    for (let g = 0; g < 200; g++) {
      if (+(await page.getAttribute('#hud-moves', 'data-steps')) >= s.steps) break;
      await page.clock.runFor(8);
    }
  }
  await page.clock.runFor(1500);
  const done = await page.isVisible('#res-menu');
  const result = done ? await page.textContent('#res-eyebrow') : 'not finished';
  if (done) await page.click('#res-menu');
  else {
    await page.keyboard.press('KeyP');
    await page.clock.runFor(200);
    await page.click('#pause-menu');
  }
  await page.clock.runFor(300);
  return result;
}

(async () => {
  const server = await serve();
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.clock.install();
  await page.goto(`http://localhost:${server.address().port}/index.html`);
  await page.clock.pauseAt(Date.now() + 1000);
  await page.clock.runFor(800);
  await page.click('#btn-levels');
  await page.clock.runFor(300);

  const only = process.argv.slice(2).map((n) => Number(n) - 1);
  const which = only.length ? only : LEVELS.map((_, i) => i);
  let failed = 0;
  for (const idx of which) {
    const result = await play(page, idx);
    const ok = /cleared/.test(result);
    if (!ok) failed++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${String(idx + 1).padStart(2)}. ${LEVELS[idx].name.padEnd(18)} ${result}`);
  }
  if (errors.length) console.log('page errors:', errors);
  await browser.close();
  server.close();
  process.exit(failed || errors.length ? 1 : 0);
})();
