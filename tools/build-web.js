#!/usr/bin/env node
// Copies the game into www/ for the Android app, and bundles the Google Fonts it uses
// so the app works offline. If the fonts can't be fetched, the online link is kept.
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'www');
const UA = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';

async function main() {
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(path.join(out, 'fonts'), { recursive: true });
  for (const f of ['core.js', 'levels.js', 'pack1.js', 'art.js', 'campaign.js']) fs.copyFileSync(path.join(root, f), path.join(out, f));

  let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const link = html.match(/<link rel="stylesheet" href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)">/);
  if (link) {
    try {
      let css = await (await fetch(link[1], { headers: { 'User-Agent': UA } })).text();
      const urls = [...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1]))];
      if (!urls.length) throw new Error('no font files in the stylesheet');
      for (const [i, url] of urls.entries()) {
        const name = `f${i}${path.extname(new URL(url).pathname) || '.woff2'}`;
        const bytes = Buffer.from(await (await fetch(url, { headers: { 'User-Agent': UA } })).arrayBuffer());
        fs.writeFileSync(path.join(out, 'fonts', name), bytes);
        css = css.split(url).join(`fonts/${name}`);
      }
      fs.writeFileSync(path.join(out, 'fonts.css'), css);
      html = html
        .replace(link[0], '<link rel="stylesheet" href="fonts.css">')
        .replace(/<link rel="preconnect"[^>]*>\r?\n?/g, '');
      console.log(`Bundled ${urls.length} font files.`);
    } catch (err) {
      console.warn(`Could not bundle fonts (${err.message}); keeping the Google Fonts link.`);
    }
  }
  // Show the build number on the home screen, so you can tell which build is installed.
  if (process.env.BUILD_NUMBER) html = html.replace('<span id="build"></span>', `<span id="build">Build ${process.env.BUILD_NUMBER}</span>`);
  fs.writeFileSync(path.join(out, 'index.html'), html);
  console.log('Wrote www/');
}

main();
