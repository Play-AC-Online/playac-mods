/* playac-mod: what four newcomers tripped on.
 *
 *   node --test cli/test/
 *
 * Lua syntax checked with no luac, an on() the game refuses is an error,
 * check takes a ZIP, pack writes beside the folder, CHANGELOG.md stays out,
 * dev moves off a taken port, a Finder ZIP of a repo. */
import test from 'node:test';
import './gen-checkout.mjs'; /* builds the generated files these tests read, in a checkout */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { fflate, mods } from '../lib/contract.mjs';
import { checkEntries, checkFolder, handZipRefuses } from '../lib/check.mjs';
import { leftOutReason } from '../lib/files.mjs';
import { luaSyntaxError } from '../lib/luasyntax.mjs';
import { modFiles, writeFiles } from './mod.mjs';
import { startDevFree } from '../lib/dev.mjs';
import { main } from '../bin/playac-mod.mjs';
import { CHECKOUT } from '../lib/checkout.mjs';

const enc = (s) => new TextEncoder().encode(s);
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'playac-onb-'));
const quiet = async (fn) => {
  const { log, error } = console;
  const out = [];
  console.log = (...a) => out.push(a.join(' '));
  console.error = (...a) => out.push(a.join(' '));
  try { return { code: await fn(), out: out.join('\n') }; } finally { console.log = log; console.error = error; }
};
const base = { schema: 1, api: 1, id: 'test.mod', name: 'Test Mod', version: '1.0.0', authors: ['Tester'], scope: 'client', assets_original: true };

test('Lua syntax is checked by the game\'s own parser, no luac needed', async () => {
  assert.equal(await luaSyntaxError('main.lua', 'local x <const> = 1\nreturn x'), '', 'Lua 5.4 syntax parses');
  assert.match(await luaSyntaxError('main.lua', 'on("villager_talked", function(e)\n  if e then\nend)'), /^main\.lua:3: .*near/);
  const saved = process.env.PATH;
  process.env.PATH = '';
  try {
    const c = await checkEntries({
      'mod.json': enc(JSON.stringify({ ...base, scripts: { main: 'main.lua', events: ['villager_talked'] } })),
      'main.lua': enc('on("villager_talked", function(e) return end end)'),
    });
    assert.equal(c.ok, false);
    assert.equal(c.luaChecked, true);
    const p = c.problems.find((x) => x.file === 'main.lua');
    assert.match(p.message, /main\.lua:1: .* \(a Lua syntax error, so the game stops this script when it loads\)/);
  } finally { process.env.PATH = saved; }
});

test('on() for an event not in scripts.events is a problem, not a warning: the game stops the script', async () => {
  const c = await checkEntries({
    'mod.json': enc(JSON.stringify({ ...base, scripts: { main: 'main.lua', events: ['villager_talked'] } })),
    'main.lua': enc('on("villager_talked", function(e) end)\non("day_started", function(e) end)\n'),
  });
  assert.equal(c.ok, false);
  assert.ok(c.problems.some((p) => p.file === 'main.lua' && /line 2: on\("day_started"\) .* not in "scripts.events".*none of it runs/.test(p.message)), JSON.stringify(c.problems));
  assert.ok(!c.warnings.some((w) => /day_started/.test(w.message)));
  /* an unknown event too */
  const d = await checkEntries({
    'mod.json': enc(JSON.stringify({ ...base, scripts: { main: 'main.lua', events: ['villager_talked'] } })),
    'main.lua': enc('on("villager_talked", function(e) end)\non("fish_cought", function() end)\n'),
  });
  assert.ok(d.problems.some((p) => /names no event the game has/.test(p.message)));
});

test('check takes a ZIP, as the Mods tab reads it; a hand-made ZIP with dist/ in it is refused', async () => {
  const dir = path.join(tmp(), 'bean.zipcheck');
  writeFiles(dir, modFiles('bean.zipcheck', 'lines'));
  let r = await quiet(() => main(['pack', dir]));
  assert.equal(r.code, 0, r.out);
  const zip = path.join(path.dirname(dir), 'bean.zipcheck-0.1.0.zip');
  assert.ok(fs.existsSync(zip), 'pack writes beside the folder, not in it');
  assert.ok(!fs.existsSync(path.join(dir, 'dist')));
  r = await quiet(() => main(['check', zip]));
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /ok {3}bean\.zipcheck 0\.1\.0/);
  /* the old trap: a ZIP inside the folder, then Compress on the folder */
  fs.mkdirSync(path.join(dir, 'dist'));
  fs.copyFileSync(zip, path.join(dir, 'dist', 'old.zip'));
  r = await quiet(() => main(['check', dir]));
  assert.equal(r.code, 0);
  assert.match(r.out, /holds dist\/old\.zip, which `pack` leaves out\. A ZIP you make by hand/);
  const files = {};
  for (const n of ['mod.json', 'main.lua', 'messages/en.json', 'dist/old.zip']) files[`bean.zipcheck/${n}`] = new Uint8Array(fs.readFileSync(path.join(dir, n)));
  const hand = path.join(tmp(), 'hand.zip');
  fs.writeFileSync(hand, fflate.zipSync(files));
  r = await quiet(() => main(['check', hand]));
  assert.equal(r.code, 1);
  assert.match(r.out, /"dist\/old\.zip": only .* files can be in a mod/);
  /* pack refuses a ZIP */
  assert.equal((await quiet(() => main(['pack', zip]))).code, 2);
  assert.equal(handZipRefuses('textures/.DS_Store'), false);
  assert.equal(handZipRefuses('LICENSE'), true);
  assert.equal(handZipRefuses('.playac/playac.lua'), false);
});

test('CHANGELOG.md at the top stays out of the mod, so editing it keeps the content hash', async () => {
  assert.ok(leftOutReason('CHANGELOG.md'));
  assert.equal(leftOutReason('docs/CHANGELOG.md'), '');
  const dir = tmp();
  writeFiles(dir, modFiles('bean.log', 'lines'));
  const a = await checkFolder(dir, { lua: false });
  fs.writeFileSync(path.join(dir, 'CHANGELOG.md'), '## 0.1.0\n- first\n');
  const b = await checkFolder(dir, { lua: false });
  assert.equal(a.result.contentSha, b.result.contentSha);
  assert.ok(!Object.keys(b.entries).includes('CHANGELOG.md'));
});

test('dev moves to the next free port when the default is taken', async () => {
  const dir = tmp();
  writeFiles(dir, modFiles('bean.port', 'lines'));
  const busy = net.createServer();
  await new Promise((res) => busy.listen(0, '127.0.0.1', res));
  const p = busy.address().port;
  let dev;
  try {
    try {
      dev = await startDevFree(dir, { port: p, lua: false, log: () => {} }, 20);
    } catch (e) {
      if (e.code === 'EADDRINUSE') return; /* the next ports are busy here too: nothing to learn */
      throw e;
    }
    assert.ok(dev.port > p && dev.port < p + 20, `${dev.port} after ${p}`);
    await assert.rejects(startDevFree(dir, { port: p, lua: false, log: () => {} }, 1), (e) => e.code === 'EADDRINUSE' && e.port === p);
  } finally {
    busy.close();
    if (dev) await dev.close();
  }
});

/* Finder's Compress (or Explorer's Send to) of a mod repo carries
 * .gitignore, .vscode/, .github/ and the rest. The game drops every hidden
 * name, so that ZIP installs and `check` says so. */
test('a Finder ZIP of a mod repo, hidden files and all, is a mod the game takes', async () => {
  const dir = path.join(tmp(), 'bean.finder');
  writeFiles(dir, {
    ...modFiles('bean.finder', 'lines'),
    '.gitignore': 'dist/\n',
    '.vscode/settings.json': '{}',
    '.github/workflows/mod.yml': 'name: check\n',
    '.claude/settings.json': '{}',
    '.DS_Store': 'x',
  });
  const files = {};
  const all = (abs, rel) => {
    for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) all(path.join(abs, e.name), r);
      else files[`bean.finder/${r}`] = new Uint8Array(fs.readFileSync(path.join(abs, e.name)));
    }
  };
  all(dir, '');
  files['__MACOSX/bean.finder/._mod.json'] = enc('x');
  const hand = path.join(tmp(), 'bean.finder.zip');
  fs.writeFileSync(hand, fflate.zipSync(files));
  const r = await quiet(() => main(['check', hand]));
  assert.equal(r.code, 0, r.out);
  const read = mods.readMod(new Uint8Array(fs.readFileSync(hand)), fflate);
  assert.deepEqual(Object.keys(read.entries).filter((p) => p.split('/').some((s) => s.startsWith('.'))), []);
  /* and a folder check does not warn about them */
  const c = await checkFolder(dir);
  assert.ok(!c.warnings.some((w) => /\.gitignore|\.vscode|\.github|\.claude/.test(String(w.message ?? w))), JSON.stringify(c.warnings));
});

test('mods.js agrees: the hand-made ZIP rule is the game\'s', () => {
  /* handZipRefuses says the game refuses these when they are in a ZIP */
  const m = JSON.stringify({ ...base, content: { messages: 'm.json' } });
  for (const extra of ['dist/a.zip', 'LICENSE', '.gitignore', '.playac/playac.lua', 'CHANGELOG.md',
    '.github/workflows/mod.yml', '.vscode/settings.json', '.claude/settings.json', 'docs/.notes', 'Thumbs.db']) {
    const n = mods.normalizeEntries({ 'mod.json': enc(m), 'm.json': enc('{}'), [extra]: enc('x') });
    assert.equal(n.problems.length > 0, handZipRefuses(extra), extra);
  }
});

test('the bundled Lua parser was built from the Lua the game runs', { skip: !CHECKOUT && 'needs the game\'s source checkout' }, () => {
  const ver = fs.readFileSync(CHECKOUT.luaVersion, 'utf8').trim();
  const head = fs.readFileSync(new URL('../lib/luasyntax.wasm.mjs', import.meta.url), 'utf8').slice(0, 300);
  assert.ok(head.includes(`lua-version: ${ver}\n`), 'rebuild: bash scripts/build-luasyntax.sh in the CLI folder');
});
