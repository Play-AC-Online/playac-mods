/* check: the newcomer's mistakes the fresh-eyes round found check passing.
 *
 *   node --test cli/test/check.test.mjs
 *
 * THE RULE these hold: check's verdict (ok) is readMod's. Everything new here
 * that the game page does not refuse is a WARNING that says what happens. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { fflate, mods } from '../lib/contract.mjs';
import { checkEntries, jsonFault, lineCol } from '../lib/check.mjs';
import { readDds } from '../lib/dds.mjs';
import { scanScript, stripLua } from '../lib/scriptscan.mjs';
import { itemTable, shopItemWarnings } from '../lib/items.mjs';
import { dds } from '../lib/scaffold.mjs';
import { exportHints, findLibraries } from '../lib/types.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const enc = (s) => (typeof s === 'string' ? new TextEncoder().encode(s) : s);
const js = (v) => enc(JSON.stringify(v));
const base = { schema: 1, api: 1, id: 'test.mod', name: 'Test Mod', version: '1.0.0', authors: ['Tester'], scope: 'client', assets_original: true };
const gameOk = (entries) => { try { mods.readMod(fflate.zipSync(entries), fflate); return true; } catch { return false; } };
/* check, and the rule: its verdict is readMod's */
async function check(entries, opts = {}) {
  const r = await checkEntries(entries, { lua: false, ...opts });
  assert.equal(r.installs, gameOk(entries), `check ${r.installs ? 'passed' : 'refused'} what readMod ${r.installs ? 'refuses' : 'takes'}: ${JSON.stringify(r.problems)}`);
  return r;
}
const warned = (r, file, re) => r.warnings.some((w) => w.file === file && re.test(w.message));
const said = (r, file, re) => r.problems.some((p) => p.file === file && re.test(p.message));

/* ── DDS headers (dds.mjs = the registry's parseDDS/decodeDDS) ── */

const rgba = (w, h) => new Uint8Array(dds(w, h, new Uint8Array(w * h * 4)));
/* A header with the given fields (offsets as in DDS_HEADER), then n data bytes. */
function hdr({ w = 32, h = 32, flags = 0x1007, mips = 0, pf = 0x41, cc = '', bpp = 32, dxgi = 0 } = {}, n = 0) {
  const dx10 = cc === 'DX10';
  const b = Buffer.alloc(128 + (dx10 ? 20 : 0) + n);
  b.write('DDS ', 0, 'ascii');
  b.writeUInt32LE(124, 4);
  b.writeUInt32LE(flags, 8);
  b.writeUInt32LE(h, 12);
  b.writeUInt32LE(w, 16);
  b.writeUInt32LE(mips, 28);
  b.writeUInt32LE(32, 76);
  b.writeUInt32LE(cc ? 0x4 : pf, 80);
  if (cc) b.write(cc, 84, 'ascii');
  b.writeUInt32LE(bpp, 88);
  if (dx10) b.writeUInt32LE(dxgi, 128);
  return new Uint8Array(b);
}

test('dds: what the upload server accepts, and its refusals in its words', () => {
  assert.deepEqual(readDds(rgba(64, 32)), { w: 64, h: 32, format: 'RGBA', levels: 1, error: '' });
  assert.equal(readDds(hdr({ cc: 'DXT1' }, 8 * 8 * 8)).error, '');
  assert.equal(readDds(hdr({ cc: 'DXT5', w: 6, h: 6 }, 2 * 2 * 16)).error, '', 'a side not a multiple of 4 rounds up to whole blocks');
  for (const [dxgi, block] of [[98, 16], [71, 8], [77, 16]]) assert.equal(readDds(hdr({ cc: 'DX10', dxgi }, 8 * 8 * block)).error, '', `DXGI ${dxgi}`);
  for (const dxgi of [28, 87]) assert.equal(readDds(hdr({ cc: 'DX10', dxgi }, 32 * 32 * 4)).error, '', `DXGI ${dxgi}`);

  const cases = [
    [new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]), /^is not a DDS file\.$/],
    [enc('DDS '), /^is cut short\.$/],
    [new Uint8Array(200), /^is not a DDS file\.$/],
    [hdr({ w: 0 }), /^is 0x32\. A texture is 1 to 16384 pixels a side\.$/],
    [hdr({ w: 16385 }), /^is 16385x32\. A texture is 1 to 16384 pixels a side\.$/],
    [hdr({ cc: 'DX10', dxgi: 2 }, 100), /^is a DDS format the game can't load \(DXGI format 2\)\. Save it as BC7, DXT1, DXT5 or uncompressed 32-bit RGBA\.$/],
    [hdr({ cc: 'DXT3' }, 100), /^is a DDS format the game can't load \(DXT3\)\./],
    [hdr({ bpp: 24 }, 32 * 32 * 3), /^is an uncompressed DDS of 24 bits a pixel\. The game loads 32-bit RGBA, BC7, DXT1 or DXT5\.$/],
    [hdr({}, 100), /^is cut short: a 32x32 RGBA image needs 4224 bytes, the file has 228\.$/],
    [hdr({ flags: 0x21007, mips: 6 }, 32 * 32 * 4 + 1365), /^stores 6 mip levels\. Save it with one level \(no mipmaps\): the game reads only the first\.$/],
    [hdr({ flags: 0x1007, mips: 6 }, 32 * 32 * 4 + 8), /^has 8 bytes after its image\. Save it with one level/],
    [hdr({ flags: 0x21007, mips: 1 }, 32 * 32 * 4 + 8), /^has 8 bytes after its image/],
  ];
  for (const [bytes, re] of cases) assert.match(readDds(bytes).error, re);
});

const texMod = (files) => ({ 'mod.json': js({ ...base, content: { textures: 'textures' } }), ...Object.fromEntries(Object.entries(files).map(([k, v]) => [`textures/${k}`, v])) });
const T = (w, h, n, ext = 'dds') => `tex1_${w}x${h}_${n.toString(16).padStart(16, '0')}_$_8.${ext}`;
const pngHeader = (w, h) => {
  const b = new Uint8Array(33);
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
  new DataView(b.buffer).setUint32(16, w);
  new DataView(b.buffer).setUint32(20, h);
  b[24] = 8;
  b[25] = 6;
  return b;
};

test('check warns on a DDS the mod list refuses, and still passes the mod (the game page does not read textures)', async () => {
  const r = await check(texMod({
    [T(32, 32, 1)]: rgba(64, 64),
    [T(32, 32, 2)]: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
    [T(32, 32, 3)]: hdr({ flags: 0x21007, mips: 6 }, 32 * 32 * 4 + 1365),
  }));
  assert.equal(r.ok, true);
  assert.ok(!r.warnings.some((w) => w.file.endsWith(T(32, 32, 1))), 'a good DDS twice the size: no warning');
  const w2 = r.warnings.find((w) => w.file.endsWith(T(32, 32, 2))).message;
  assert.equal(w2, 'is not a DDS file. The game cannot draw it, and the mod list refuses it when you upload it.');
  const w3 = r.warnings.find((w) => w.file.endsWith(T(32, 32, 3))).message;
  assert.match(w3, /^stores 6 mip levels\. .*The game still draws it, but the mod list refuses it when you upload it\.$/);
  assert.match(mods.errorCode(w3), /texture-mipmaps/);
});

test('check warns on a picture smaller than, or another shape from, the original (DDS and PNG)', async () => {
  const r = await check(texMod({
    [T(64, 64, 1)]: rgba(32, 32),
    [T(32, 32, 2)]: rgba(64, 32),
    [T(64, 32, 3, 'png')]: pngHeader(32, 16),
    [T(32, 32, 4, 'png')]: pngHeader(128, 128),
  }));
  assert.equal(r.ok, true);
  assert.ok(warned(r, `textures/${T(64, 64, 1)}`, /^is 32x32, smaller than the original 64x64\. The game stretches it over the original's place, so it looks blurrier/));
  assert.ok(!warned(r, `textures/${T(64, 64, 1)}`, /shape/), 'same shape');
  assert.ok(warned(r, `textures/${T(32, 32, 2)}`, /^is 64x32, not the shape of the original 32x32\. The game stretches it to the original's shape, so it looks squashed\.$/));
  assert.ok(!warned(r, `textures/${T(32, 32, 2)}`, /smaller/), 'not smaller: 64 >= 32 and 32 >= 32');
  assert.ok(warned(r, `textures/${T(64, 32, 3, 'png')}`, /^is 32x16, smaller than the original 64x32/));
  assert.ok(!r.warnings.some((w) => w.file.endsWith(T(32, 32, 4, 'png'))), 'a bigger PNG of the same shape is fine');
});

test('check warns when a .png and a .dds are the same texture (any case)', async () => {
  const dup = T(32, 32, 0xabc);
  const r = await check(texMod({ [dup]: rgba(32, 32), [dup.replace('.dds', '.PNG').replace('abc', 'ABC')]: pngHeader(32, 32), [T(32, 32, 5)]: rgba(32, 32) }));
  assert.equal(r.ok, true);
  const w = r.warnings.filter((x) => /are the same texture/.test(x.message));
  assert.equal(w.length, 1, JSON.stringify(r.warnings));
  assert.match(w[0].message, /\.PNG and textures\/.*\.dds are the same texture: the game uses only one of them\. You cannot choose which, so the other is never drawn\.$/);
});

/* ── scripts (scriptscan.mjs) ── */

const ctx = { listed: ['villager_talked'], permissions: ['show_line'], events: mods.EVENTS, commands: mods.PERMISSIONS };

test('stripLua blanks comments and strings, keeps lines, and remembers string values', () => {
  const src = 'a = "x--y" -- on("villager_talked")\n--[==[ cmd.ask{} ]==] b = [[\nlong]] c = \'q\\\'s\'';
  const { code, strings } = stripLua(src);
  assert.equal(code.length, src.length);
  assert.equal(code.split('\n').length, src.split('\n').length);
  assert.ok(!/on\(|cmd|x--y/.test(code), code);
  assert.deepEqual([...strings.values()], ['x--y', 'long', "q's"]);
});

test('the script scan: on() against scripts.events and the events, cmd.* against permissions, math.random', () => {
  const src = [
    'on("villager_talked", function(e) end)',  /* 1 fine */
    "on('day_started', function(e) end)",      /* 2 not in scripts.events */
    'on("dawn", function() end)',              /* 3 no such event */
    'cmd.show_line("hi")',                     /* 4 fine */
    'cmd.ask{ text = "?" }',                   /* 5 no permission */
    'cmd.ask{ text = "again" }',               /* 6 said once */
    'cmd.teleport("x")',                       /* 7 no such command */
    '-- on("hour_changed", f) cmd.give_item(1) math.random()', /* 8 a comment */
    'local s = "on(\'item_sold\', f) cmd.teleport(1) math.random(3)"', /* 9 a string */
    'x.on("hour_changed", f) obj:on("data_migrated", f)', /* 10 not the global on */
    'local c = cmd.send_letter',               /* 11 not a call */
    'local n = math.random(6)',                /* 12 not in the sandbox */
    'math.randomseed(7) local m = math.random()', /* 13 randomseed too; random said once */
    'local r = my.math.random(2)',             /* 14 not the global math */
  ].join('\n');
  const w = scanScript(src, ctx);
  assert.deepEqual(w.map((x) => x.line), [2, 3, 5, 7, 12, 13], JSON.stringify(w, null, 1));
  assert.equal(w[0].message, 'line 2: on("day_started") is used, but "day_started" is not in "scripts.events" in mod.json. The game stops your script when it loads and none of it runs. Its error is: on(): \'day_started\' is not in this mod\'s "scripts.events" list in mod.json. Add "day_started" to "scripts.events".');
  assert.match(w[1].message, /^line 3: on\("dawn"\) names no event the game has\. The game stops your script when it loads and none of it runs\. Its error is: on\(\): unknown event 'dawn'\. The events are villager_talked, day_started, /);
  /* an on() the engine refuses kills the script, so check lists it as a
   * problem; math.random raises where it is called, which stops it too */
  assert.deepEqual(w.map((x) => !!x.error), [true, true, false, false, true, true]);
  assert.equal(w[2].message, 'line 5: cmd.ask: "ask" is not in "permissions" in mod.json, so the game refuses every call. Each call returns nil, the reason and the code command-permission. It logs: cmd.ask refused: ask is not in this mod\'s "permissions" in mod.json');
  assert.match(w[3].message, /^line 7: cmd\.teleport is not a command, so calling it raises an error and the script stops for the session\. The commands are send_letter, give_item, show_line, ask, take_item, take_bells\.$/);
  assert.equal(w[4].message, 'line 12: math.random is not available: use rng() (seeded, so a reload cannot reroll). The game stops your script where it calls math.random.');
  assert.match(w[5].message, /^line 13: math\.randomseed is not available: use rng\(\)/);
  /* timer.after with no timer_fired in scripts.events is refused by the game every time */
  const t1 = scanScript('on("day_started", function(e) timer.after(5, "tea") end)', { ...ctx, listed: ['day_started'] });
  assert.equal(t1.length, 1);
  assert.match(t1[0].message, /^line 1: timer\.after is used, but "timer_fired" is not in "scripts\.events" in mod\.json, so the game refuses every call\. Each call returns nil, the reason and the code timer-args\./);
  assert.deepEqual(scanScript('on("timer_fired", function(e) end)\non("day_started", function(e) timer.after(5, "tea") end)', { ...ctx, listed: ['day_started', 'timer_fired'] }), []);
  assert.deepEqual(scanScript('local my = { timer = {} }\nmy.timer.after(1)', { ...ctx, listed: [] }), []);
  /* the engine's own words, so the catalogue entry links */
  assert.equal(mods.errorCode(w[0].message), 'script-on-event');
  assert.equal(mods.errorCode(w[2].message), 'command-permission');
  assert.equal(mods.errorCode(w[4].message), 'script-sandbox');

  /* the names the API had before its first release are not events or commands */
  for (const old of ['talk', 'day_start', 'item_picked', 'enter_scene', 'migrate', 'hour_change', 'shop_buy', 'command_result', 'answer']) {
    const r = scanScript(`on("${old}", function(e) end)`, ctx);
    assert.ok(r.length === 1 && r[0].error && /names no event the game has/.test(r[0].message), old);
  }
  assert.match(scanScript('cmd.set_flag{ key = "a", value = 1 }', ctx)[0].message, /^line 1: cmd\.set_flag is not a command/);
  /* a command needs only its permission: there is one api level */
  assert.deepEqual(scanScript('cmd.show_line "hi"', ctx), []);
});

test('the script scan: a handler takes one table', () => {
  const two = scanScript('on("villager_talked", function(villager, extra) return nil end)', ctx);
  assert.equal(two.length, 1);
  assert.ok(!two[0].error, 'a warning: the script still runs');
  assert.equal(two[0].message, 'line 1: the on("villager_talked") handler takes (villager, extra), but every handler gets one table. Write function(e) and read its fields, like e.villager.');
  for (const fine of ['on("villager_talked", function(e) end)', 'on("villager_talked", function() end)', 'on("villager_talked", handler)', 'on("villager_talked", function(e, ...) end)']) {
    assert.deepEqual(scanScript(fine, ctx), [], fine);
  }
});

test('check runs the script scan on scripts.main: the mod installs, but a dead script fails check', async () => {
  const man = { ...base, scripts: { main: 'main.lua', events: ['villager_talked'] } };
  const r = await check({ 'mod.json': js(man), 'main.lua': enc('on("villager_talked", function(e) end)\non("day_started", function(e) end)\ncmd.ask{}\nlocal n = math.random(3)') });
  assert.equal(r.installs, true);
  assert.equal(r.ok, false, 'the game stops this script at load');
  assert.ok(said(r, 'main.lua', /^line 2: on\("day_started"\) is used, but "day_started" is not in "scripts.events"/), JSON.stringify(r.problems));
  assert.ok(said(r, 'main.lua', /^line 4: math\.random is not available: use rng\(\)/), JSON.stringify(r.problems));
  assert.ok(warned(r, 'main.lua', /^line 3: cmd\.ask: "ask" is not in "permissions"/));
});

/* ── all stages in one run, JSON positions ── */

test('jsonFault finds where parseJsonStrict fails, and lineCol says where that is', () => {
  const at = (t) => { const f = jsonFault(t); return f && { ...lineCol(t, f.at), what: f.what }; };
  assert.deepEqual(at('{\n  "a": 1\n  "b": 2\n}'), { line: 3, col: 3, what: 'expected "," or "}", found "\\""' });
  assert.deepEqual(at('{"a": 1, "a": 2}'), { line: 1, col: 10, what: 'duplicate key "a"' });
  assert.deepEqual(at('{"a": [1, 2,]}'), { line: 1, col: 13, what: 'a comma before "]" is not allowed' });
  assert.deepEqual(at('{"a": 1,}'), { line: 1, col: 9, what: 'expected a key in double quotes, found "}" (a comma before "}" is not allowed)' });
  assert.deepEqual(at("{'a': 1}"), { line: 1, col: 2, what: 'expected a key in double quotes, found "\'"' });
  assert.deepEqual(at('﻿{}').what, 'the file starts with a byte order mark (BOM): save it as UTF-8 without BOM');
  assert.equal(jsonFault('{"a": [1, {"b": null}]}'), null);
  /* every text parseJsonStrict refuses, jsonFault places */
  for (const t of ['', '{', '[1 2]', '{"a" 1}', '"\\x"', '"a\nb"', '01', '1 2', 'nul', '{"a":"\\u0000"}', '-', '[' .repeat(40) + ']'.repeat(40)]) {
    let refused = false;
    try { mods.parseJsonStrict(t); } catch { refused = true; }
    assert.ok(refused, JSON.stringify(t));
    assert.ok(jsonFault(t), `no position for ${JSON.stringify(t)}`);
  }
});

test('a JSON syntax error carries its line and column, and is listed once', async () => {
  const r = await check({
    'mod.json': js({ ...base, content: { messages: 'messages/en.json' } }),
    'messages/en.json': enc('{\n  "a": "one",\n  "b": "two"\n  "c": "three"\n}'),
    'notes.json': enc('{"x": 1, "x": 2}'),
  });
  assert.equal(r.ok, false);
  assert.deepEqual(r.problems.map((p) => p.message), [
    'messages/en.json: line 4, column 3: this is not valid JSON (expected "," or "}", found "\\"")',
    'notes.json: line 1, column 10: duplicate key "x"',
  ]);
  assert.equal(mods.errorCode(r.problems[0].message), 'json-invalid');
  assert.equal(mods.errorCode(r.problems[1].message), 'json-duplicate-key');
});

test('check lists the manifest\'s problems AND every content file\'s, where readMod stops at the manifest', async () => {
  const man = {
    ...base, version: '1.0', scope: 'world',
    content: { shops: 'shops.json', messages: 'lines/', letters: 'letters.json', calendar: 'calendar.json', talk: 'talk.json', items: 'items.json' },
  };
  const entries = {
    'mod.json': js(man),
    'shops.json': js({ shops: [{ target: 'flower', stock: [] }] }),
    'lines/en.json': js({ 'Bad Key': 'x' }),
    'lines/de.json': js({ ok: '' }),
    'letters.json': js({ letters: [] }),
    'calendar.json': js({ days: [{ id: 'e', date: { month: 13, day: 1 }, talk: ['hi'] }] }),
    'talk.json': js({ pools: [{ personality: 'grumpy', lines: ['hi'] }] }),
    'items.json': js({ items: [{ id: 'x', name: 'X', base: '0x1001' }] }),
  };
  let game = '';
  try { mods.readMod(fflate.zipSync(entries), fflate); } catch (e) { game = e.message; }
  assert.match(game, /"version"/);
  assert.doesNotMatch(game, /shops:|letters:|calendar:|talk:|items:|messages/, 'readMod stops at the manifest');
  const r = await check(entries);
  assert.ok(said(r, 'mod.json', /"version"/));
  assert.ok(said(r, 'shops.json', /"stock" must list 1 to 6/), JSON.stringify(r.problems, null, 1));
  assert.ok(said(r, 'lines/en.json', /^messages\/en: key "Bad Key"/));
  assert.ok(said(r, 'lines/de.json', /^messages\/de: "ok" must be text/));
  assert.ok(said(r, 'letters.json', /^letters: "letters" must be a list/));
  assert.ok(said(r, 'calendar.json', /^calendar: day 1 "date"/));
  assert.ok(said(r, 'talk.json', /^talk: pool 1 "personality"/));
  assert.ok(said(r, 'items.json', /facing south/));
});

test('a content file with any name is parsed, with a position, like readMod\'s doc()', async () => {
  const r = await check({ 'mod.json': js({ ...base, content: { messages: 'lines.txt' } }), 'lines.txt': enc('{"a": }') });
  assert.deepEqual(r.problems.map((p) => [p.file, p.message]), [['lines.txt', 'lines.txt: line 1, column 7: this is not valid JSON (expected a value, found "}")']]);
});

test('the translation rule and the unknown-key rule, as readMod has them', async () => {
  const tr = await check({ 'mod.json': js({ ...base, content: { messages: 'm/' } }), 'm/en.json': js({ a: 'x' }), 'm/fr.json': js({ b: 'y' }) });
  assert.deepEqual(tr.problems.map((p) => [p.file, p.message]), [['m/fr.json', 'messages/fr: "b" is not in en.json (a translation holds only keys en.json has)']]);
  /* an unknown key, in mod.json and in a content file's entry, with the key it is close to and the catalogue's code */
  const typo = await check({ 'mod.json': js({ ...base, scope: 'world', permisions: ['ask'], content: { shops: 'shops.json' } }), 'shops.json': js({ shops: [{ target: 'nook', stock: [{ item: '0x1000' }], mod: 'add' }] }) }, { items: null });
  assert.deepEqual(typo.problems.map((p) => [p.file, p.message, mods.errorCode(p.message)]), [
    ['mod.json', 'mod.json: unknown key "permisions" (did you mean "permissions"?)', 'unknown-key'],
    ['shops.json', 'shops: shop 1: unknown key "mod" (did you mean "mode"?)', 'unknown-key'],
  ]);
  /* one api level: a mod.json without "api", or with the next level, is refused */
  const { api: _none, ...noApi } = base;
  assert.ok(said(await check({ 'mod.json': js(noApi) }), 'mod.json', /^"api" must be a whole number/));
  assert.ok(said(await check({ 'mod.json': js({ ...base, api: 2 }) }), 'mod.json', /^needs a newer game/));
});

/* check runs the game's own content rules (mods.js contentProblems,
 * isJunk, EXTS), never a copy. Each rule text below lives in mods.js only; a
 * copy back in the CLI's lib/ fails this. */
test('no copies of the game\'s rules in the CLI: their words live in mods.js only', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const lib = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'lib');
  const src = fs.readdirSync(lib).filter((f) => f.endsWith('.mjs') && !f.startsWith('luasyntax.wasm'))
    .map((f) => fs.readFileSync(path.join(lib, f), 'utf8')).join('\n');
  for (const words of ['is not in en.json', 'unknown key "', 'did you mean', 'which is not in ', "=== '__MACOSX'", "['.json', '.lua'"]) {
    assert.ok(!src.includes(words), `lib/ holds a copy of a mods.js rule: ${words}`);
  }
  for (const k of ['contentProblems', 'messageFiles', 'isJunk', 'EXTS']) assert.ok(mods[k], `mods.js exports ${k}`);
});

/* ── shop goods against items.json ── */

const NEW = itemTable({ items: [
  { id: '0x2800', kind: 'item', name: 'apple', price: 400, buyback: 100, floor: { flower: 500, nook: 100 }, stockable: { flower: true, nook: true } },
  { id: '0x1000', kind: 'furniture', name: 'wardrobe', price: 4000, buyback: 1000, floor: { flower: 1000, nook: 1000 }, stockable: { flower: false, nook: true }, refusal: { flower: 'has no shop shelf model' } },
  { id: '0x2900', kind: 'item', name: 'sapling', price: 60, buyback: 15, floor: { flower: 15, nook: 15 }, stockable: { flower: true, nook: false } },
] });
const OLD = itemTable({ items: [
  { id: '0x2800', kind: 'item', name: 'food apple', price: 400, buyback: 100, stockable: true },
  { id: '0x1000', kind: 'furniture', name: 'spooky wardrobe', price: 41240, buyback: 10310, stockable: false, refusal: 'has no shop shelf model' },
] });

test('shop goods: unknown ids, goods a shop cannot stock, prices under the floor (both items.json shapes)', () => {
  const shops = { shops: [
    { target: 'flower', stock: [{ item: '0x2800', price: 300 }, { item: '0x1002' }, { item: '0x7777' }, { item: 'test.mod:own' }, { item: '0x2900', price: 20 }] },
    { target: 'nook', stock: [{ item: '0x2800', price: 300 }, { item: '0x1003', price: 999 }, { item: '0x2900' }] },
  ] };
  assert.deepEqual(shopItemWarnings(shops, NEW), [
    'shops: shop 1 stock 1 "price" 300 is under the floor for 0x2800 (apple) at the flower shop. The game sells it for 500.',
    'shops: shop 1 stock 2 "item" 0x1002 (wardrobe) has no shop shelf model, so the game leaves it out of the flower shop',
    'shops: shop 1 stock 3 "item" 0x7777 is not an item or furniture the game has, so the game leaves it out of the flower shop',
    'shops: shop 2 stock 2 "price" 999 is under the floor for 0x1003 (wardrobe) at Nook\'s shop. The game sells it for 1000.',
    'shops: shop 2 stock 3 "item" 0x2900 (sapling) cannot be sold at Nook\'s shop, so the game leaves it out of Nook\'s shop',
  ]);
  assert.deepEqual(shopItemWarnings({ shops: [{ target: 'flower', stock: [{ item: '0x2800', price: 50 }, { item: '0x1000' }] }] }, OLD), [
    'shops: shop 1 stock 1 "price" 50 is under the floor for 0x2800 (food apple) at the flower shop. The game sells it for 100.',
    'shops: shop 1 stock 2 "item" 0x1000 (spooky wardrobe) has no shop shelf model, so the game leaves it out of the flower shop',
  ]);
  assert.deepEqual(shopItemWarnings(shops, null), [], 'no items.json: the check is skipped');
});

test('check warns on shop goods and passes the mod; without items.json it says nothing', async () => {
  const entries = { 'mod.json': js({ ...base, scope: 'world', content: { shops: 'shops.json' } }), 'shops.json': js({ shops: [{ target: 'flower', stock: [{ item: '0x2800', price: 300 }, { item: '0x7777' }] }] }) };
  const r = await check(entries, { items: NEW });
  assert.equal(r.ok, true);
  assert.equal(r.warnings.filter((w) => w.file === 'shops.json').length, 2, JSON.stringify(r.warnings));
  const none = await check(entries, { items: null });
  assert.deepEqual(none.warnings.filter((w) => w.file === 'shops.json'), []);
  /* the repo's own items.json, when there is one: 0x7777 is no item */
  const real = await check(entries);
  if (real.warnings.some((w) => w.file === 'shops.json')) assert.ok(warned(real, 'shops.json', /0x7777 is not an item or furniture the game has/));
});

/* the page, the registry and the engine each read a bad byte another
 * way, so all three refuse the file now, and so does check, once, in its own words. */
test('a JSON file with bytes that are not UTF-8 is refused, as in readMod, and says so', async () => {
  const bad = new Uint8Array([0x7b, 0x22, 0x61, 0x22, 0x3a, 0x22, 0xff, 0x22, 0x7d]);
  for (const files of [
    { 'mod.json': js({ ...base, content: { messages: 'm.json' } }), 'm.json': bad },
    { 'mod.json': js({ ...base, content: { messages: 'm.txt' } }), 'm.txt': bad },
    { 'mod.json': js(base), 'notes.json': bad },
  ]) {
    const name = Object.keys(files)[1];
    const r = await check(files);
    assert.equal(r.ok, false);
    const mine = r.problems.filter((p) => p.file === name);
    assert.equal(mine.length, 1, JSON.stringify(r.problems));
    assert.match(mine[0].message, /this file is not UTF-8 text\. The game and the site refuse it\. Save it as UTF-8\.$/);
  }
});

/* (file-lone-cr): Lua ends a -- comment at a lone CR and a review's diff
 * does not, so code can hide as a comment. check refuses it as readMod and the
 * mod list do, in the same words; CRLF and a CR in a .txt pass. */
test('a .lua or .json file with a lone carriage return is refused, once, in the site\'s words', async () => {
  const lua = { ...base, scripts: { main: 'main.lua', events: ['villager_talked'] } };
  for (const [files, name] of [
    [{ 'mod.json': js(lua), 'main.lua': enc("-- tidy the list\ron('villager_talked', function() return 'ran' end)\n") }, 'main.lua'],
    [{ 'mod.json': js({ ...base, content: { messages: 'm.json' } }), 'm.json': enc('{"a":"b",\r"c":"d"}') }, 'm.json'],
  ]) {
    const r = await check(files);
    assert.equal(r.ok, false, name);
    assert.equal(gameOk(files), false, 'readMod refuses it too');
    const mine = r.problems.filter((p) => p.file === name || p.message.includes(name));
    assert.equal(mine.length, 1, JSON.stringify(r.problems));
    assert.match(mine[0].message, /has a carriage return with no line feed after it\. Save it with LF or CRLF line endings/);
  }
  const fine = { 'mod.json': js(lua), 'main.lua': enc("-- a comment\r\non('villager_talked', function() return 'ran' end)\r\n"), 'notes.txt': enc('old\rMac') };
  const r = await check(fine);
  assert.equal(r.ok, true, JSON.stringify(r.problems));
});

/* a setting's label and description take no character a reader cannot
 * see (control, format, text-direction, blank filler), in check as in the game
 * and the mod list; a line break stays fine in a description. */
test('a setting label or description with a hidden character is refused, as readMod refuses it', async () => {
  const mk = (st, tr) => ({
    'mod.json': js({ ...base, content: tr ? { translations: 'translations/' } : undefined, settings: [{ name: 'greet', type: 'bool', default: true, label: 'Say hello', ...st }] }),
    ...(tr ? { 'translations/de.json': js(tr) } : {}),
  });
  for (const [files, re] of [
    [mk({ label: 'Say\u200bhello' }), /"label" must be 1 to 60 characters on one line, with no invisible, text-direction or control character/],
    [mk({ label: 'Say \u202ehello' }), /"label" must be 1 to 60 characters on one line, with no invisible, text-direction or control character/],
    [mk({ description: 'A hello\u200e here.' }), /"description" must be text of at most 200 characters, with no invisible, text-direction or control character but a line break/],
    [mk({ description: 'A hello here.' }, { 'settings/greet/label': 'Hal\u2060lo' }), /"settings\/greet\/label" must be 1 to 60 characters on one line, with no invisible/],
  ]) {
    const r = await check(files);
    assert.equal(r.ok, false, JSON.stringify(files['mod.json'].length));
    assert.equal(gameOk(files), false, 'readMod refuses it too');
    assert.ok(r.problems.some((p) => re.test(p.message)), JSON.stringify(r.problems));
  }
  const r = await check(mk({ label: 'Café ☕', description: 'A hello.\nÜber alles.' }));
  assert.equal(r.ok, true, JSON.stringify(r.problems));
});


test('a letter footer over 8 characters with no sender warns: the mailbox list shows 8', async () => {
  const letter = (extra) => ({ id: 'night', header: 'Dear {player},', body: 'Happy Lantern Night!', footer: 'The Lantern Keepers', ...extra });
  const mk = (L) => ({ 'mod.json': js({ ...base, content: { letters: 'letters.json' } }), 'letters.json': js({ letters: [L] }) });
  const r = await check(mk(letter({})));
  assert.equal(r.ok, true, JSON.stringify(r.problems));
  assert.ok(warned(r, 'letters.json', /reads "The Lant" there\. .*Add "sender"/), JSON.stringify(r.warnings));
  const named = await check(mk(letter({ sender: 'Lanterns' })));
  assert.equal(named.ok, true, JSON.stringify(named.problems));
  assert.deepEqual(named.warnings.filter((w) => w.file === 'letters.json'), [], 'a sender: no warning');
  const short = await check(mk(letter({ footer: 'Tom Nook' })));
  assert.deepEqual(short.warnings.filter((w) => w.file === 'letters.json'), [], 'an 8-character footer fits the list');
  const long = await check(mk(letter({ sender: 'Lanterns!' })));
  assert.equal(long.ok, false);
  assert.ok(said(long, 'letters.json', /"sender" must be 1 to 8 plain characters/), JSON.stringify(long.problems));
});

/* ── translations of the data files, optional dependencies, a setting's scope ── */

test('check reads a translations folder: the game\'s rules, by file, and its files are not "unused"', async () => {
  const mod = (de) => ({
    'mod.json': js({ ...base, content: { letters: 'letters.json', translations: 'translations/' } }),
    'letters.json': js({ letters: [{ id: 'hello', header: 'Dear {player},', body: 'Hi.', footer: 'A friend' }] }),
    'translations/de.json': js(de),
  });
  let r = await check(mod({ 'mod/name': 'Testmod', 'letters/hello/body': 'Hallo.' }));
  assert.equal(r.ok, true, JSON.stringify(r.problems));
  assert.ok(!r.warnings.some((w) => w.file === 'translations/de.json'), 'a file of the translations folder is read by the game: no "nothing points at it"');
  r = await check(mod({ 'letters/helo/body': 'Hallo.' }));
  assert.ok(said(r, 'translations/de.json', /"letters\/helo\/body" names no text in this mod/), JSON.stringify(r.problems));
  r = await check(mod({ 'letters/hello/body': 'Grüße!' }));
  assert.ok(said(r, 'translations/de.json', /must be 1 to 192 plain characters.*"ü" at character 3/), JSON.stringify(r.problems));
  r = await check({ ...mod({}), 'translations/en.json': js({}) });
  assert.ok(said(r, 'mod.json', /translations\/en\.json is not one of de\.json es\.json fr\.json it\.json/), JSON.stringify(r.problems));
});

test('check reads optional_depends by the game\'s rules', async () => {
  let r = await check({ 'mod.json': js({ ...base, optional_depends: { 'bean.lib': '>=1.0.0' } }) });
  assert.equal(r.ok, true, JSON.stringify(r.problems));
  r = await check({ 'mod.json': js({ ...base, depends: { 'bean.lib': '*' }, optional_depends: { 'bean.lib': '*' } }) });
  assert.ok(said(r, 'mod.json', /is in both "depends" and "optional_depends"/), JSON.stringify(r.problems));
  r = await check({ 'mod.json': js({ ...base, optional_depends: { 'bean.lib': '^1.0.0' } }) });
  assert.ok(said(r, 'mod.json', /"optional_depends": the range for bean\.lib must be/), JSON.stringify(r.problems));
});

test('the script scan: a client setting read in a script that also sends or gives is warned about', async () => {
  const ctx = { listed: ['villager_talked'], permissions: ['give_item', 'show_line'], events: mods.EVENTS, commands: mods.PERMISSIONS, clientSettings: ['hello'] };
  const src = 'on("villager_talked", function(e)\n  if settings.get("hello") then cmd.show_line("Hi") end\n  cmd.give_item(0x2800)\nend)\n';
  const w = scanScript(src, ctx);
  assert.equal(w.length, 1, JSON.stringify(w));
  assert.equal(w[0].line, 2);
  assert.match(w[0].message, /settings\.get\("hello"\) reads a client setting, and this script also calls cmd\.give_item/);
  assert.match(w[0].message, /command-client-setting/);
  assert.ok(!w[0].error, 'a warning: the scan cannot tell which event a line runs in');
  /* a world setting, a script with no town command, a commented call, no client settings: nothing */
  assert.deepEqual(scanScript(src.replace('"hello"', '"price"'), ctx), []);
  assert.deepEqual(scanScript(src.replace('cmd.give_item(0x2800)', ''), ctx), []);
  assert.deepEqual(scanScript('local h = settings.get("hello")\n-- cmd.give_item(0x2800)\n', ctx), []);
  assert.deepEqual(scanScript(src, { ...ctx, clientSettings: [] }), []);
  /* a take changes what the player has: the same warning (the engine's guard covers it too) */
  const take = scanScript('local h = settings.get("hello")\ncmd.take_bells{ amount = 10 }\n', { ...ctx, permissions: ['take_bells'] });
  assert.equal(take.length, 1, JSON.stringify(take));
  assert.match(take[0].message, /also calls cmd\.take_bells/);
  /* through check, from mod.json's own scope */
  const r = await check({
    'mod.json': js({ ...base, scripts: { main: 'main.lua', events: ['villager_talked'] }, permissions: ['give_item', 'show_line'],
      settings: [{ name: 'hello', type: 'bool', label: 'Say hello', default: true, scope: 'client' }] }),
    'main.lua': enc(src),
  });
  assert.equal(r.ok, true, JSON.stringify(r.problems));
  assert.ok(warned(r, 'main.lua', /reads a client setting/), JSON.stringify(r.warnings));
  const bad = await check({ 'mod.json': js({ ...base, settings: [{ name: 'hello', type: 'bool', label: 'Say hello', default: true, scope: 'player' }] }) });
  assert.ok(said(bad, 'mod.json', /"scope" must be "world" or "client"/), JSON.stringify(bad.problems));
});

test('types offers the functions of a mod named in optional_depends, as for depends', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'playac-opt-'));
  try {
    fs.mkdirSync(path.join(dir, 'app'));
    fs.mkdirSync(path.join(dir, 'weather'));
    fs.writeFileSync(path.join(dir, 'weather', 'mod.json'), JSON.stringify({ ...base, id: 'bean.weather', exports: { today: 'The weather today.' } }));
    const libs = findLibraries(path.join(dir, 'app'), { ...base, optional_depends: { 'bean.weather': '*' } }, {});
    assert.deepEqual(Object.keys(libs), ['bean.weather']);
    assert.match(exportHints(libs), /---@param mod "bean\.weather"/);
    assert.deepEqual(findLibraries(path.join(dir, 'app'), { ...base }, {}), {});
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
