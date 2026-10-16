'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = path.join(__dirname,'..'), out = path.join(root,'www');
const clean = (s) => s.replace(/\r\n/g,'\n');
for (const file of ['core.js','levels.js','pack1.js','art.js','campaign.js']) {
  assert.strictEqual(clean(fs.readFileSync(path.join(out,file),'utf8')),clean(fs.readFileSync(path.join(root,file),'utf8')));
}
assert.deepStrictEqual(fs.readdirSync(out).sort(),['art.js','campaign.js','core.js','fonts','fonts.css','index.html','levels.js','pack1.js'].sort());
const html = fs.readFileSync(path.join(out,'index.html'),'utf8');
assert(html.indexOf('src="pack1.js"') < html.indexOf('src="levels.js"'));
assert(!html.includes('href="https://fonts.googleapis.com'));
assert(fs.readdirSync(path.join(out,'fonts')).length > 0);
console.log('ok Android web bundle: current production sources, offline fonts, no proof or test files');
