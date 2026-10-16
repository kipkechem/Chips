'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const levels = require('../levels.js');
const root = path.join(__dirname, '..');
const out = path.join(root, '.cache', 'qa');

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const server = http.createServer((req, res) => {
    const file = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return res.writeHead(404).end();
    res.setHeader('Content-Type', path.extname(file) === '.js' ? 'application/javascript' : path.extname(file) === '.html' ? 'text/html' : 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/index.html`;
  const browser = await chromium.launch();
  try {
    for (const viewport of [{ width: 844, height: 390 }, { width: 1280, height: 800 }]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(url);
      await page.click('#btn-levels');
      assert(await page.isEnabled('[data-level="1"]'));
      assert(await page.isDisabled('[data-level="2"]'));
      assert(await page.isDisabled('[data-level="40"]'));
      await page.evaluate(() => window.dispatchEvent(new PopStateEvent('popstate', { state: { screen: 'game', idx: 39 } })));
      assert(await page.isHidden('#game'), 'History cannot bypass the lock');
      await page.screenshot({ path: path.join(out, `locked-menu-${viewport.width}.png`) });
      await page.evaluate((names) => {
        for (const name of names) {
          localStorage.removeItem(`lockstep:progress:${name}`);
          localStorage.setItem(`lockstep:best:${name}`, JSON.stringify({ steps: 100 }));
        }
      }, levels.slice(0, 37).map((l) => l.name));
      await page.reload();
      assert((await page.textContent('#continue-sub')).includes('38 Refraction'));
      await page.click('#btn-levels');
      assert(await page.isEnabled('[data-level="38"]'));
      assert(await page.isDisabled('[data-level="39"]'));
      await page.locator('[data-level="38"]').scrollIntoViewIfNeeded();
      await page.locator('[data-level="38"] .preview canvas').waitFor({ state: 'visible' });
      await page.screenshot({ path: path.join(out, `pack1-menu-${viewport.width}.png`) });
      await page.click('[data-level="38"]');
      await page.click('#intro-go');
      await page.keyboard.press('KeyP');
      await page.screenshot({ path: path.join(out, `refraction-game-${viewport.width}.png`) });
      assert.deepStrictEqual(errors, []);
      await context.close();
    }
    const page = await browser.newPage();
    await page.goto(url);
    for (let n = 31; n <= 40; n++) {
      await page.evaluate((n) => {
        const def = window.LOCKSTEP_LEVELS[n - 1], s = window.Lockstep.parseLevel(def);
        const canvas = document.createElement('canvas'); canvas.id = 'qa-map';
        canvas.width = s.w * 32; canvas.height = s.h * 32;
        const ctx = canvas.getContext('2d'); ctx.scale(2, 2);
        window.LockstepArt.drawBoard(ctx, s, { theme: def.world, t: 0, phase: 0 });
        document.body.replaceChildren(canvas);
      }, n);
      await page.locator('#qa-map').screenshot({ path: path.join(out, `level-${n}-map.png`) });
    }
    await page.close();
    const upgrade = await browser.newContext({ viewport: { width: 844, height: 390 } });
    await upgrade.addInitScript((names) => {
      for (const name of names) localStorage.setItem(`lockstep:progress:${name}`,JSON.stringify({revision:1,cleared:true,steps:42}));
    },levels.map((l) => l.name));
    const saved = await upgrade.newPage(); await saved.goto(url);
    assert((await saved.textContent('#continue-sub')).includes('40 Prism Break'));
    const records = await saved.evaluate((names) => names.map((name) => JSON.parse(localStorage.getItem(`lockstep:progress:${name}`))),levels.map((l) => l.name));
    for(let i=0;i<40;i++) { assert.strictEqual(records[i].cleared,true); assert.strictEqual(records[i].steps,i<30?42:null); }
    await saved.click('#btn-levels');
    for(let n=31;n<=40;n++) assert(await saved.isEnabled(`[data-level="${n}"]`));
    assert((await saved.textContent('#levels-view')).includes('Contested keys, reusable crates'));
    await upgrade.close();
    const context = await browser.newContext({ viewport: { width: 844, height: 390 } });
    await context.route('**/levels.js', async (route) => {
      const source = fs.readFileSync(path.join(root, 'levels.js'), 'utf8');
      await route.fulfill({ contentType: 'application/javascript', body: source + '\nfor (let n = 41; n <= 100; n++) window.LOCKSTEP_LEVELS.push({ ...window.LOCKSTEP_LEVELS[0], name: `QA ${n}`, world: "glass", pack: 1 + Math.floor((n - 31) / 10) });' });
    });
    await context.addInitScript((names) => {
      for (const name of names) localStorage.setItem(`lockstep:best:${name}`, JSON.stringify({ steps: 100 }));
    }, [...levels.map((l) => l.name), ...Array.from({ length: 60 }, (_, i) => `QA ${i + 41}`)]);
    const large = await context.newPage();
    await large.goto(url);
    await large.click('#btn-levels');
    assert.strictEqual(await large.locator('[data-level]').count(), 100);
    assert.deepStrictEqual(await large.locator('[data-level]').evaluateAll((cards) => cards.map((c) => Number(c.dataset.level))), Array.from({ length: 100 }, (_, i) => i + 1));
    assert((await large.locator('.preview canvas').count()) < 100, 'Previews must be lazy');
    await large.locator('[data-level="100"]').scrollIntoViewIfNeeded();
    await large.locator('[data-level="100"] .preview canvas').waitFor({ state: 'visible' });
    assert(await large.isEnabled('[data-level="100"]'));
    await context.close();
    console.log('ok UI: mobile, desktop, locks, history, Build 20 and 21 migration, and 100-card lazy previews');
  } finally { await browser.close(); await new Promise((resolve) => server.close(resolve)); }
})().catch((err) => { console.error(err); process.exitCode = 1; });
