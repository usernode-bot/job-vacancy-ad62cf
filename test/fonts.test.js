'use strict';
// Web fonts are self-hosted from npm packages: every /fonts/... file the page
// links must exist in the package server.js mounts at that path, and every
// woff2 those stylesheets reference must exist too.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const MOUNTS = {
  'plus-jakarta-sans': '@fontsource-variable/plus-jakarta-sans',
  'playfair-display': '@fontsource-variable/playfair-display',
};
const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
const links = [...html.matchAll(/href="\/fonts\/([^/"]+)\/([^"]+)"/g)].map(m => ({ mount: m[1], file: m[2] }));
const pkgDir = name => path.dirname(require.resolve(name + '/package.json'));

test('page links the body font and the display font (upright and italic)', () => {
  const css = links.filter(l => l.file.endsWith('.css')).map(l => l.mount + '/' + l.file).sort();
  assert.deepEqual(css, ['playfair-display/wght-italic.css', 'playfair-display/wght.css', 'plus-jakarta-sans/index.css']);
});

test('every linked font file, and every woff2 its CSS uses, is in the package', () => {
  for (const { mount, file } of links) {
    assert.ok(MOUNTS[mount], 'unknown font mount ' + mount);
    const dir = pkgDir(MOUNTS[mount]);
    const p = path.join(dir, file);
    assert.ok(fs.existsSync(p), p + ' missing');
    if (!file.endsWith('.css')) continue;
    const urls = [...fs.readFileSync(p, 'utf8').matchAll(/url\(\.\/([^)]+)\)/g)].map(m => m[1]);
    assert.ok(urls.some(u => u.includes('latin-wght')), file + ' has no latin face');
    for (const u of urls) assert.ok(fs.existsSync(path.join(dir, u)), u + ' missing');
  }
});

test('Tailwind theme names the self-hosted families', () => {
  const cfg = require('../tailwind.config.js');
  assert.equal(cfg.theme.extend.fontFamily.sans[0], '"Plus Jakarta Sans Variable"');
  assert.equal(cfg.theme.extend.fontFamily.display[0], '"Playfair Display Variable"');
});
