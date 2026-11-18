/* Review 7: the script scan reads Lua the way Lua does, a guess from it
 * never stops pack, and check never crashes on a manifest value.
 *
 *   node --test cli/test/review7.test.mjs
 */
import test from 'node:test';
import './gen-checkout.mjs'; /* builds the generated files these tests read, in a checkout */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { mods } from '../lib/contract.mjs';
import { checkEntries } from '../lib/check.mjs';
import { scanScript, stripLua } from '../lib/scriptscan.mjs';
import { main } from '../bin/playac-mod.mjs';

const enc = (s) => new TextEncoder().encode(s);
const js = (v) => enc(JSON.stringify(v));
const base = { schema: 1, api: 1, id: 'test.mod', name: 'Test Mod', version: '1.0.0', authors: ['Tester'], scope: 'client', assets_original: true };
const ctx = { listed: ['day_started'], permissions: [], events: mods.EVENTS, commands: mods.PERMISSIONS };
const quiet = async (fn) => {
  const { log, error } = console;
  const out = [];
  console.log = (...a) => out.push(a.join(' '));
  console.error = (...a) => out.push(a.join(' '));
  try { return { code: await fn(), out: out.join('\n') }; } finally { console.log = log; console.error = error; }
};

test('a carriage return on its own ends a comment, as it does for Lua', () => {
  /* Lua runs the on() call. The scan read the whole line as a comment. */
  const src = '-- tidy the list\ron("scene_entered", function(e) end)\n';
  const w = scanScript(src, ctx);
  assert.equal(w.length, 1);
  assert.equal(w[0].error, true);
  assert.match(w[0].message, /^line 2: on\("scene_entered"\) is used, but "scene_entered" is not in "scripts.events"/);
  /* the stripped code keeps the line end, so offsets and lines still match */
  assert.equal(stripLua('-- a\rb()').code, '    \rb()');
  /* a string ends at a lone carriage return too (an unfinished string in Lua) */
  assert.equal(stripLua('x = "a\ron("scene_entered")').strings.get(4), 'a');
  /* \r\n and \n\r are one line each */
  assert.match(scanScript('-- a\r\n-- b\n\ron("scene_entered", f)', ctx)[0].message, /^line 3: /);
});

test('string escapes are read as Lua reads them', () => {
  /* "d\97y_started" is "day_started". The scan read "d97y_started" and failed check. */
  assert.deepEqual(scanScript('on("d\\97y_started", function(e) end)', ctx), []);
  assert.deepEqual(scanScript('on("d\\x61y_started", function(e) end)', ctx), []);
  assert.deepEqual(scanScript('on("d\\u{61}y_started", function(e) end)', ctx), []);
  assert.deepEqual(scanScript('on("day\\z\n   _started", function(e) end)', ctx), []);
  const s = stripLua('a = "x\\ty\\\\z\\"q\\065\\10"');
  assert.equal(s.strings.get(4), 'x\ty\\z"qA\n');
  /* an escaped name that is NOT listed is still found, by its real name */
  assert.match(scanScript('on("s\\99ene_entered", function(e) end)', ctx)[0].message, /on\("scene_entered"\) is used, but "scene_entered" is not in/);
});

test('reading math.random is not calling it', () => {
  assert.deepEqual(scanScript('local rand = math.random or rng\nlocal n = rand(6)', ctx), []);
  assert.deepEqual(scanScript('if math.randomseed then log("old") end', ctx), []);
  /* a call still is a problem, in each of Lua's three call forms */
  for (const call of ['math.random(6)', 'math . random (6)', 'math.random{}', 'math.randomseed "x"']) {
    const w = scanScript(`local n = ${call}`, ctx);
    assert.equal(w.length, 1, call);
    assert.equal(w[0].error, true, call);
  }
});

test('a field named on, with spaces around the dot, is not the global on', () => {
  assert.deepEqual(scanScript('local M = {}\nM . on("nothing")\nM\n  :on("nothing")\nM.cmd . give_item(1)\nM . math.random(2)\nM . timer.after(1)', ctx), []);
  /* a script with its own on is not calling the game's */
  assert.deepEqual(scanScript('local function on(name) end\non("nothing")', ctx), []);
  assert.deepEqual(scanScript('local on = print\non("nothing")', ctx), []);
  /* ".." joins two values, and "::" ends a label: what follows is not a field */
  assert.equal(scanScript('local s = "a" .. on("nothing", f)', ctx).length, 1);
  assert.equal(scanScript('::top:: on("nothing", f)', ctx).length, 1);
});

test('check does not crash when scripts.main names a property every object has', async () => {
  for (const name of ['toString', 'constructor', '__proto__', 'hasOwnProperty']) {
    const man = { ...base, scripts: { main: name, events: ['day_started'] } };
    const r = await checkEntries({ 'mod.json': js(man) }, { lua: false });
    assert.equal(r.ok, false, name);
    assert.ok(r.problems.length > 0, name);
    assert.ok(r.problems.every((p) => typeof p.message === 'string' && !/ArrayBuffer/.test(p.message)), `${name}: ${JSON.stringify(r.problems)}`);
  }
});

test('a guess of the scan fails check, and does not stop pack', async () => {
  const man = { ...base, scripts: { main: 'main.lua', events: ['day_started'] } };
  const guess = { 'mod.json': js(man), 'main.lua': enc('on("day_started", function(e) end)\non("scene_entered", function(e) end)\n') };
  const r = await checkEntries(guess, { lua: false });
  assert.equal(r.ok, false);
  assert.equal(r.guessesOnly, true);
  assert.ok(r.problems.every((p) => p.scan && p.script));
  assert.ok(r.result && r.result.zip, 'the packed mod is there for pack and publish');

  /* a problem the game itself has is not a guess: nothing is packed */
  const real = await checkEntries({ ...guess, 'mod.json': js({ ...man, version: 'one' }) }, { lua: false });
  assert.equal(real.guessesOnly, false);
  assert.equal(real.result, null);
  /* a Lua syntax error is the game's own parser speaking, not a guess */
  const syntax = await checkEntries({ 'mod.json': js(man), 'main.lua': enc('on("day_started", function(e) end\n') });
  assert.equal(syntax.ok, false);
  assert.equal(syntax.guessesOnly, false);
  assert.equal(syntax.result, null);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'playac-mod-r7-'));
  const mod = path.join(dir, 'guess');
  fs.mkdirSync(mod);
  for (const [name, bytes] of Object.entries(guess)) fs.writeFileSync(path.join(mod, name), bytes);
  const checked = await quiet(() => main(['check', mod, '--no-lua']));
  assert.equal(checked.code, 1, 'check still fails');
  const out = path.join(dir, 'out.zip');
  const packed = await quiet(() => main(['pack', mod, '--no-lua', '--out', out]));
  assert.equal(packed.code, 0, packed.out);
  assert.match(packed.out, /WARNING: check found 1 problem\(s\) in the script/);
  assert.match(packed.out, /packed anyway/);
  assert.ok(fs.existsSync(out), 'the ZIP was written');
  assert.equal(mods.readMod(new Uint8Array(fs.readFileSync(out)), (await import('../lib/contract.mjs')).fflate).manifest.id, 'test.mod');
});
