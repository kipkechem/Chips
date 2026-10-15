#!/usr/bin/env node
// Plays every level in a real (headless) browser, pressing the solver's winning keys one
// turn at a time on a controlled clock, and checks each level is cleared with no page errors.
// Needs Playwright with Chromium (npm i -g playwright). Run: node tools/test-browser.js [levelNumber...]
'use strict';
const http = require('http');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const L = require('../core.js');
const LEVELS = require('../levels.js');
const { solution } = require('./solve.js');
const { selectLevels } = require('./validate-levels.js');

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
  const r = solution(idx);
  if (await page.isHidden('#levels-view')) await page.click('#btn-levels');
  await page.click(`[data-level="${idx + 1}"]`);
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
    for (let g = 0; g < 1000; g++) {
      if (+(await page.getAttribute('#hud-moves', 'data-steps')) >= s.steps) break;
      await page.clock.runFor(8);
    }
  }
  await page.clock.runFor(1500);
  const done = await page.isVisible('#res-menu');
  const result = done ? await page.textContent('#res-eyebrow') : 'not finished';
  if (done && /cleared/.test(result)) assert.strictEqual(Number(await page.getAttribute('#hud-moves', 'data-steps')), r.par, `${def.name}: browser replay diverged from the rules engine`);
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
  try {
  const page = await browser.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const which = selectLevels(process.argv.slice(2), LEVELS.length);
  if (which[0] > 0) {
    await page.addInitScript((names) => {
      for (const name of names) localStorage.setItem(`lockstep:best:${name}`, JSON.stringify({ steps: 9999 }));
    }, LEVELS.slice(0, which[0]).map((d) => d.name));
  }
  await page.clock.install();
  await page.goto(`http://localhost:${server.address().port}/index.html`);
  await page.clock.pauseAt(Date.now() + 1000);
  await page.clock.runFor(800);
  await page.click('#btn-levels');
  await page.clock.runFor(300);

  let failed = 0;
  for (const idx of which) {
    const result = await play(page, idx);
    const ok = /cleared/.test(result);
    if (!ok) failed++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${String(idx + 1).padStart(2)}. ${LEVELS[idx].name.padEnd(18)} ${result}`);
    if (!ok) { await page.screenshot({ path: path.join(ROOT, '.cache', `failure-${idx + 1}.png`) }); break; }
  }
  if (errors.length) console.log('page errors:', errors);
  process.exitCode = failed || errors.length ? 1 : 0;
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((err) => { console.error(err); process.exitCode = 1; });
