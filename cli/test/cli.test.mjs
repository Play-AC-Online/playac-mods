/* playac-mod: check, pack and the pack rule.
 *
 *   node --test cli/test/
 *
 * The point of every test here: the CLI and the game agree. check runs the
 * game's mods.js; these tests prove it lists what readMod refuses, accepts what
 * readMod accepts (every case in the contract's test cases), that pack is
 * byte-for-byte deterministic, and that its content hash is mods.js's. */
import test from 'node:test';
import './gen-checkout.mjs'; /* builds the generated files these tests read, in a checkout */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { fflate, mods, EXTS } from '../lib/contract.mjs';
import { CHECKOUT } from '../lib/checkout.mjs';
import { checkEntries, checkFolder, TEXTURE_NAME_RE } from '../lib/check.mjs';
import { leftOutReason, readFolder } from '../lib/files.mjs';
import { pack, zipEntries } from '../lib/pack.mjs';
import { KINDS, modFiles, writeFiles, GRASS_TEXTURE, dds } from './mod.mjs';
import { commandText } from '../lib/help.mjs';
import { devSteps, main, nodeTooOld, parseArgs, versionLine } from '../bin/playac-mod.mjs';

/* A test that reads the game's source checkout (the contract cases, the examples,
 * the build scripts) is skipped in a copy that has none. */
const SOURCE_ONLY = { skip: !CHECKOUT && 'needs the game\'s source checkout' };
const BIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../bin/playac-mod.mjs');
const enc = (s) => (typeof s === 'string' ? new TextEncoder().encode(s) : s);
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'playac-mod-'));
const quiet = async (fn) => {
  const { log, error } = console;
  const out = [];
  console.log = (...a) => out.push(a.join(' '));
  console.error = (...a) => out.push(a.join(' '));
  try { return { code: await fn(), out: out.join('\n') }; } finally { console.log = log; console.error = error; }
};
const base = { schema: 1, api: 1, id: 'test.mod', name: 'Test Mod', version: '1.0.0', authors: ['Tester'], scope: 'client', assets_original: true };

test('every test mod passes check and the game\'s own readMod', async () => {
  for (const kind of KINDS) {
    const dir = tmp();
    writeFiles(dir, modFiles(`bean.${kind}-mod`, kind));
    const r = await checkFolder(dir, { lua: false });
    assert.deepEqual(r.problems, [], kind);
    const mod = mods.readMod(r.result.zip, fflate);
    assert.equal(mod.manifest.id, `bean.${kind}-mod`);
  }
  assert.match(GRASS_TEXTURE, TEXTURE_NAME_RE);
});

test('check agrees with readMod on every case in the contract\'s cases.json', SOURCE_ONLY, async () => {
  const cases = JSON.parse(fs.readFileSync(path.join(CHECKOUT.contract, 'cases.json'), 'utf8'));
  const failures = [];
  for (const c of cases) {
    const entries = Object.fromEntries(Object.entries(c.files).map(([k, v]) => [k, enc(v)]));
    let gameOk = true;
    try { mods.readMod(fflate.zipSync(entries), fflate); } catch { gameOk = false; }
    const r = await checkEntries(entries, { lua: false });
    if (r.installs !== gameOk) failures.push(`${c.name}: check ${r.installs ? 'passed' : 'refused'}, readMod ${gameOk ? 'passed' : 'refused'}`);
    if (!r.ok && !c.ok && !r.problems.some((p) => p.message.includes(c.error))) {
      failures.push(`${c.name}: no problem says "${c.error}" (${r.problems.map((p) => p.message).join(' | ')})`);
    }
  }
  assert.deepEqual(failures, []);
});

test('check lists every problem against its file, past readMod\'s four', async () => {
  const entries = {
    'mod.json': enc(JSON.stringify({ ...base, scope: 'client', content: { shops: 'shops.json', messages: 'messages/en.json' }, game: 'GAFE' })),
    'shops.json': enc(JSON.stringify({ shops: { nook: { goods: [{ item: 2048 }] } } })),
    'messages/en.json': enc(JSON.stringify({ 'Bad Key': 'x', ok: '' })),
    'notes.json': enc('{"a":1,"a":2}'),
    'tool.exe': enc('MZ'),
  };
  const r = await checkEntries(entries, { lua: false });
  assert.equal(r.ok, false);
  const files = new Set(r.problems.map((p) => p.file));
  for (const f of ['mod.json', 'shops.json', 'messages/en.json', 'tool.exe']) assert.ok(files.has(f), `a problem against ${f}: ${JSON.stringify(r.problems)}`);
  assert.ok(r.problems.length > 4, 'more than readMod\'s first four');
  assert.ok(r.problems.some((p) => /"game" is not built yet/.test(p.message)));
  assert.ok(r.problems.some((p) => /"scope" must be "world"/.test(p.message)));
});

test('check reads an items file and a shop that stocks its items', async () => {
  const man = { ...base, scope: 'world', content: { items: 'items.json', shops: 'shops.json' }, renames: { 'test.mod:x': 'test.mod:toy-chest' } };
  const items = { items: [{ id: 'toy-chest', name: 'Toy Chest', base: '0x1008', price: 1800 }] };
  const shops = (item) => ({ shops: { flower: { own_goods: false, goods: [{ item }, { item: '0x2800' }] } } });
  const good = await checkEntries({ 'mod.json': enc(JSON.stringify(man)), 'items.json': enc(JSON.stringify(items)), 'shops.json': enc(JSON.stringify(shops('test.mod:toy-chest'))) }, { lua: false });
  assert.deepEqual(good.problems, []);
  const bad = await checkEntries({
    'mod.json': enc(JSON.stringify({ ...man, renames: { 'test.mod:x': 'test.mod:nope' } })),
    'items.json': enc(JSON.stringify({ items: [{ id: 'toy-chest', name: 'Toy Chest', base: '0x1009' }] })),
    'shops.json': enc(JSON.stringify(shops('test.mod:gone'))),
  }, { lua: false });
  const where = (f, re) => bad.problems.some((p) => p.file === f && re.test(p.message));
  assert.ok(where('items.json', /facing south/), JSON.stringify(bad.problems));
  assert.ok(where('shops.json', /not an item in this mod/), JSON.stringify(bad.problems));
  assert.ok(where('mod.json', /test\.mod:nope, which is not in items\.json/), JSON.stringify(bad.problems));
});

test('check warns on a texture the loader would never match and a .png the game leaves out', async () => {
  const entries = {
    'mod.json': enc(JSON.stringify({ ...base, content: { textures: 'textures' } })),
    [`textures/${GRASS_TEXTURE}`]: new Uint8Array(dds(32, 32, new Uint8Array(32 * 32 * 4))),
    'textures/grass.dds': enc('DDS '),
    'textures/tex1_32x32_626709d910129694_8.png': enc('png'),
  };
  const r = await checkEntries(entries, { lua: false });
  assert.equal(r.ok, true, JSON.stringify(r.problems));
  assert.deepEqual(r.warnings.map((w) => w.file).sort(), ['textures/grass.dds', 'textures/tex1_32x32_626709d910129694_8.png']);
  assert.match(r.warnings.find((w) => w.file.endsWith('.png')).message, /not a PNG the game reads/);
});

/* A PNG header: signature + IHDR (w, h, 8-bit RGBA). The rest of the file does
 * not matter to check, which, like the engine's scan, reads the header only. */
const pngHeader = (w, h) => {
  const b = new Uint8Array(33);
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
  new DataView(b.buffer).setUint32(16, w);
  new DataView(b.buffer).setUint32(20, h);
  b[24] = 8;
  b[25] = 6;
  return b;
};

test('check takes PNG textures by the engine\'s rules', async () => {
  const tex = (n) => `textures/tex1_32x32_${n.toString(16).padStart(16, '0')}_$_8.png`;
  const fine = await checkEntries({
    'mod.json': enc(JSON.stringify({ ...base, content: { textures: 'textures' } })),
    [tex(1)]: pngHeader(128, 128),
    [tex(2).replace('.png', '.PNG')]: pngHeader(2048, 2048),
  }, { lua: false });
  assert.equal(fine.ok, true, JSON.stringify(fine.problems));
  assert.deepEqual(fine.warnings, [], 'a good PNG texture, either case, is a texture like a DDS');

  const big = await checkEntries({
    'mod.json': enc(JSON.stringify({ ...base, content: { textures: 'textures' } })),
    [tex(3)]: pngHeader(2049, 16),
  }, { lua: false });
  assert.match(big.warnings[0].message, /2049x16\. A PNG texture is at most 2048x2048/);

  const many = { 'mod.json': enc(JSON.stringify({ ...base, content: { textures: 'textures' } })) };
  for (let i = 0; i < 2; i++) many[tex(10 + i)] = pngHeader(2048, 2048); /* 32 MiB */
  const phone = await checkEntries(many, { lua: false });
  assert.match(phone.warnings[0].message, /On a phone the game loads at most 24 MB/);
  for (let i = 2; i < 7; i++) many[tex(10 + i)] = pngHeader(2048, 2048); /* 112 MiB */
  const over = await checkEntries(many, { lua: false });
  assert.match(over.warnings[0].message, /at most 96 MB of PNG pixels across all mods/);
  assert.equal(over.ok, true, 'the game still installs it: warnings, not problems');
});

test('pack is deterministic: same bytes twice, in any time zone, in any file order', async () => {
  const dir = tmp();
  writeFiles(dir, modFiles('bean.det', 'shop'));
  const a = await pack(readFolder(dir).entries);
  const shuffled = Object.fromEntries(Object.entries(readFolder(dir).entries).reverse());
  const b = await pack(shuffled);
  assert.equal(Buffer.compare(Buffer.from(a.zip), Buffer.from(b.zip)), 0);
  const shas = new Set();
  for (const tz of ['UTC', 'America/Los_Angeles', 'Asia/Tokyo', 'Pacific/Kiritimati']) {
    const r = spawnSync(process.execPath, [BIN, 'pack', dir, '--json', '--out', path.join(dir, `out-${tz.replace('/', '-')}.zip`), '--no-lua'],
      { env: { ...process.env, TZ: tz }, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    shas.add(JSON.parse(r.stdout).sha256);
  }
  assert.deepEqual([...shas], [a.sha256], 'one ZIP in every time zone');
  /* mod.json first, then byte order; every entry dated 1980-01-01. */
  const names = [];
  const dv = Buffer.from(a.zip);
  for (let at = 0; dv.readUInt32LE(at) === 0x04034b50;) {
    const nl = dv.readUInt16LE(at + 26), el = dv.readUInt16LE(at + 28), cs = dv.readUInt32LE(at + 18);
    assert.equal(dv.readUInt16LE(at + 12), (0 << 9) | (1 << 5) | 1, 'DOS date 1980-01-01');
    assert.equal(dv.readUInt16LE(at + 10), 0, 'DOS time 00:00');
    names.push(dv.toString('latin1', at + 30, at + 30 + nl));
    at += 30 + nl + el + cs;
  }
  assert.deepEqual(names, ['mod.json', 'README.md', 'shops.json']);
});

test('the content hash is mods.js contentSha of the same files, however they were zipped', SOURCE_ONLY, async () => {
  /* the test mods of a shop and of a script with settings and a dependency */
  for (const ex of ['fixture.shop', 'fixture.gossip']) {
    const dir = path.join(CHECKOUT.fixtures, ex);
    const r = await checkFolder(dir, { lua: false });
    assert.equal(r.ok, true, `${ex}: ${JSON.stringify(r.problems)}`);
    /* Another ZIP of the same files: under a top folder, other order, other
     * level, other dates, with junk the loader drops. */
    const other = {};
    for (const [k, v] of Object.entries(readFolder(dir).entries).reverse()) other[`${ex}/${k}`] = [v, { level: 1, mtime: new Date(2020, 5, 5) }];
    other['__MACOSX/._mod.json'] = enc('junk');
    const mod = mods.readMod(fflate.zipSync(other), fflate);
    assert.equal(r.result.contentSha, await mods.contentSha(mod.entries), ex);
    assert.equal(r.result.modsetLine, `${mod.manifest.id}@${mod.manifest.version}#${r.result.contentSha}`);
  }
});

test('pinned: the content hash the Go import\'s BuildZip gives the same files (packrule_test.go)', async () => {
  const m = '{"schema":1,"api":1,"id":"pin.mod","name":"Pin","version":"1.2.0","authors":["a"],"scope":"client","content":{"messages":"messages/en.json"},"assets_original":true}';
  const r = await pack({ 'mod.json': enc(m), 'messages/en.json': enc('{"hi":"Hello"}'), 'README.md': enc('# Pin\n') });
  assert.equal(r.contentSha, 'ae9cc890f3af2f3f4e33804382edb0171c09fe64eb4ccb93e1411c103f0b64e2');
});

test('pack rule: the contract\'s pack-cases.json (the Go import runs the same file)', SOURCE_ONLY, () => {
  const cases = JSON.parse(fs.readFileSync(path.join(CHECKOUT.contract, 'pack-cases.json'), 'utf8'));
  assert.ok(cases.length >= 10);
  for (const c of cases) assert.equal(leftOutReason(c.path) === '', c.packed, `${c.path}: ${c.why || ''}`);
});

test('the pack rule\'s file types are exactly the ones mods.js accepts', () => {
  const refusal = (() => {
    try { mods.readMod(zipEntries({ 'mod.json': enc(JSON.stringify(base)), 'x.exe': enc('') }), fflate); } catch (e) { return e.message; }
    return '';
  })();
  const listed = /only (.*?) files can be in a mod/.exec(refusal);
  assert.ok(listed, refusal);
  assert.deepEqual(listed[1].split(' '), EXTS);
});

test('the CLI: check exits 1 with per-file errors, pack writes <id>-<version>.zip beside the folder', async () => {
  const dir = path.join(tmp(), 'bean.cli');
  writeFiles(dir, modFiles('bean.cli', 'lines'));
  let r = await quiet(() => main(['check', dir, '--no-lua']));
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /ok {3}bean\.cli 0\.1\.0/);
  fs.writeFileSync(path.join(dir, 'messages/en.json'), '{"line1": ""}');
  r = await quiet(() => main(['check', dir, '--no-lua']));
  assert.equal(r.code, 1);
  assert.match(r.out, /error messages\/en\.json\n {4}messages: "line1" must be text of 1 to 400 bytes/);
  fs.writeFileSync(path.join(dir, 'messages/en.json'), '{"line1": "hi", "line2": "a", "line3": "b"}');
  r = await quiet(() => main(['pack', dir]));
  assert.equal(r.code, 0, r.out);
  const zip = path.join(path.dirname(dir), 'bean.cli-0.1.0.zip');
  assert.ok(fs.existsSync(zip), r.out);
  /* The packed ZIP passes the repo's own check-zip, the tool docs point at. */
  if (CHECKOUT) {
    const cz = spawnSync(process.execPath, [CHECKOUT.checkZip, zip], { encoding: 'utf8' });
    assert.equal(cz.status, 0, cz.stderr);
  }
  /* --out still puts it anywhere; a ZIP inside the folder stays out of the next pack */
  r = await quiet(() => main(['pack', dir, '--out', path.join(dir, 'dist', 'x.zip')]));
  assert.equal(r.code, 0, r.out);
  r = await quiet(() => main(['check', dir, '--verbose']));
  assert.match(r.out, /skip {2}dist\/x\.zip: not a mod file type/);
});

test('the CLI: help and bad usage', async () => {
  assert.equal((await quiet(() => main(['frobnicate']))).code, 2);
  assert.equal((await quiet(() => main(['help']))).code, 0);
  assert.deepEqual(parseArgs(['dev', '--origin', 'a', '--origin=b', '--port', '0']).flags, { origin: ['a', 'b'], port: '0' });
});

test('a Lua syntax error is a problem, with or without a luac installed', async () => {
  const entries = {
    'mod.json': enc(JSON.stringify({ ...base, scripts: { main: 'main.lua', events: ['villager_talked'] } })),
    'main.lua': enc('on("villager_talked", function(e) return end end)'),
  };
  const c = await checkEntries(entries);
  assert.equal(c.ok, false);
  assert.equal(c.installs, true, 'the game installs it; the script is what stops');
  assert.ok(c.problems.some((p) => p.file === 'main.lua' && p.script));
});

test('check links each problem to its errors catalogue entry', async () => {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'mod.json'), JSON.stringify({ ...base, scope: 'client', content: { shops: 'shops.json' } }));
  fs.writeFileSync(path.join(dir, 'shops.json'), JSON.stringify({ shops: { flower: { own_goods: false, goods: [{ item: '0x2800' }] } } }));
  const { code, out } = await quiet(() => main(['check', dir]));
  assert.equal(code, 1);
  assert.match(out, /see https:\/\/playaconline\.com\/modding\/errors\/#shops-need-world/);
});

/* a packed file nothing in mod.json reads is a warning, a tool's file
 * by its name; the pack rule (shared with the GitHub import) is unchanged. */
test('check warns on packed files the game never reads, naming tool files', async () => {
  const entries = {
    'mod.json': enc(JSON.stringify({ ...base, content: { messages: 'lang/en.json', textures: 'textures/' } })),
    'lang/en.json': enc('{"hi":"Hello"}'),
    'textures/tex1_32x32_0123456789abcdef_14.dds': dds(32, 32, new Uint8Array(32 * 32 * 4)),
    'package.json': enc('{"name":"x"}'),
    'package-lock.json': enc('{}'),
    'old/backup.json': enc('{}'),
    'art/cover.png': enc('x'),
    'README.md': enc('# hi'),
  };
  const r = await checkEntries(entries, { lua: false, items: null });
  assert.equal(r.ok, true, JSON.stringify(r.problems));
  const by = (f) => r.warnings.filter((w) => w.file === f).map((w) => w.message).join(' ');
  assert.match(by('package.json'), /a tool's file \(package\.json\)/);
  assert.match(by('package-lock.json'), /a tool's file/);
  assert.match(by('old/backup.json'), /nothing in mod\.json points at it/);
  assert.match(by('art/cover.png'), /nothing in mod\.json points at it/);
  for (const f of ['mod.json', 'lang/en.json', 'README.md', 'textures/tex1_32x32_0123456789abcdef_14.dds']) {
    assert.ok(!r.warnings.some((w) => w.file === f && /points at it|tool's file/.test(w.message)), f);
  }
  assert.ok(r.result.files >= 8, 'still packed: the pack rule is unchanged');
});

/* an item's own "textures" folder is read by the game, so its
 * files are not unused. The After Hours example's layout: content.items, and
 * the Ghost Lantern's pictures in items/ghost-lantern/, named nowhere in mod.json. */
test('check does not call an item\'s own textures unused', async () => {
  const pic = (h) => `items/ghost-lantern/tex1_16x32_${h}_$_8.dds`;
  const entries = {
    'mod.json': enc(JSON.stringify({ ...base, scope: 'world', content: { items: 'items.json' } })),
    'items.json': enc(JSON.stringify({ items: [{ id: 'ghost-lantern', name: 'Ghost Lantern', base: '0x122C', price: 2600, textures: 'items/ghost-lantern/' }] })),
    [pic('0d673c8f9b3a70fb')]: dds(16, 32, new Uint8Array(16 * 32 * 4)),
    [pic('39b3254f69f1b89d')]: dds(16, 32, new Uint8Array(16 * 32 * 4)),
    'items/old-lantern/tex1_16x32_4f8aaa9bcfcdaf16_$_8.dds': dds(16, 32, new Uint8Array(16 * 32 * 4)),
  };
  const r = await checkEntries(entries, { lua: false, items: null });
  assert.equal(r.ok, true, JSON.stringify(r.problems));
  const unused = (f) => r.warnings.some((w) => w.file === f && /nothing in mod\.json points at it/.test(w.message));
  for (const f of [pic('0d673c8f9b3a70fb'), pic('39b3254f69f1b89d'), 'items.json']) assert.ok(!unused(f), f);
  assert.ok(unused('items/old-lantern/tex1_16x32_4f8aaa9bcfcdaf16_$_8.dds'), 'a folder no item names is still unused');
});

/* the CLI's edges. */
test('the CLI: usage mistakes exit 2, -h and -v, --json always JSON, --port checked', async () => {
  let r = await quiet(() => main(['-h']));
  assert.equal(r.code, 0);
  for (const c of ['check', 'pack', 'dev', 'help', 'version']) assert.match(r.out, new RegExp(`^  ${c}\\b`, 'm'), `help lists ${c}`);
  for (const c of ['new', 'types', 'publish', 'status', 'yank', 'unyank', 'logout']) {
    assert.doesNotMatch(r.out, new RegExp(`^  ${c}\\b`, 'm'), `help does not list ${c}`);
    assert.equal((await quiet(() => main([c]))).code, 2, `${c} is not a command`);
  }
  r = await quiet(() => main(['-v']));
  assert.equal(r.code, 0);
  assert.match(r.out, /^playac-mod \d+\.\d+\.\d+, (build [0-9a-f]{12}|from source), API levels? \d/);
  r = await quiet(() => main(['check', path.join(tmp(), 'nope'), '--json']));
  assert.equal(r.code, 1);
  const j = JSON.parse(r.out);
  assert.equal(j.ok, false);
  assert.match(j.problems[0].message, /does not exist/);
  const dir = tmp();
  writeFiles(dir, modFiles('bean.port-mod', 'lines'));
  r = await quiet(() => main(['dev', dir, '--port', 'abc']));
  assert.equal(r.code, 2);
  assert.match(r.out, /--port must be a number from 0 to 65535/);
  /* a port already taken says so, with what to do */
  const net = await import('node:net');
  const busy = net.createServer();
  await new Promise((res) => busy.listen(0, '127.0.0.1', res));
  try {
    r = await quiet(() => main(['dev', dir, '--port', String(busy.address().port)]));
    assert.equal(r.code, 1);
    assert.match(r.out, /is not free.*--port/);
  } finally { busy.close(); }
});

test('releases are frozen: every listed file is there with its hash; a changed byte is refused', SOURCE_ONLY, async () => {
  const { checkReleases, record, readReleases, RELEASES_DIR, RELEASES_JSON } = await import('../scripts/release.mjs');
  assert.deepEqual(checkReleases(), []);
  const dir = tmp();
  const list = readReleases(RELEASES_JSON);
  const r = list.releases[list.releases.length - 1];
  const bytes = fs.readFileSync(path.join(RELEASES_DIR, r.file));
  const { build, ...hashes } = r;
  assert.deepEqual(record(r.version, bytes), hashes, 'the record is the file\'s own hashes');
  if (build !== undefined) assert.match(build, /^[0-9a-f]{12}$/);
  fs.writeFileSync(path.join(dir, 'releases.json'), JSON.stringify({ releases: [r] }));
  const bad = Buffer.from(bytes);
  bad[bad.length - 1] ^= 1;
  fs.writeFileSync(path.join(dir, r.file), bad);
  assert.match(checkReleases(dir).join('\n'), /does not match its hash/);
  /* what the release is: npm installs it (package/ prefix, the bin, no dependencies) */
  const tar = zlib.gunzipSync(bytes);
  const names = [];
  for (let at = 0; at + 512 <= tar.length;) {
    const name = tar.subarray(at, at + 100).toString('utf8').replace(/\0.*$/s, '');
    if (!name) break;
    const prefix = tar.subarray(at + 345, at + 500).toString('utf8').replace(/\0.*$/s, '');
    const size = parseInt(tar.subarray(at + 124, at + 136).toString('ascii'), 8);
    names.push(prefix ? `${prefix}/${name}` : name);
    if (name === 'package/package.json' && !prefix) assert.ok(!JSON.parse(tar.subarray(at + 512, at + 512 + size).toString('utf8')).dependencies, 'no dependencies: nothing else is fetched');
    at += 512 + Math.ceil(size / 512) * 512;
  }
  for (const f of ['package/package.json', 'package/bin/playac-mod.mjs', 'package/vendor/mods.js', 'package/vendor/api/items.json']) assert.ok(names.includes(f), f);
  for (const f of ['package/lib/publish.mjs', 'package/lib/scaffold.mjs', 'package/lib/types.mjs']) assert.ok(!names.includes(f), `${f} is gone`);
});

/* Setup dry run: npm only warns about engines, so the tool names the Node
 * floor itself; and `types` from a global install printed a path ten ".."s deep. */
test('a Node.js older than package.json engines is refused with the fix', () => {
  const floor = JSON.parse(fs.readFileSync(path.join(path.dirname(BIN), '..', 'package.json'), 'utf8')).engines.node;
  assert.equal(floor, '>=18.17');
  for (const v of ['16.20.1', 'v18.16.9', '17.9.0', '0.12.0']) assert.equal(nodeTooOld(v, '18.17'), true, v);
  for (const v of ['18.17.0', 'v18.20.5', '20.4.0', '26.13.1']) assert.equal(nodeTooOld(v, '18.17'), false, v);
  assert.equal(nodeTooOld(process.versions.node), false, 'the Node running the tests is supported');
});

/* a stranger's first hour with the tool. Each of these was wrong:
 * every --help printed the same 40 lines, an unknown option answered "needs a
 * value", and check outside a mod spoke of a ZIP nobody made. */
test('help: one screen per command, from the same list the parser and the docs read', async () => {
  const { COMMANDS: LIST, optionSpec } = await import('../lib/help.mjs');
  const top = (await quiet(() => main(['help']))).out;
  for (const c of LIST) {
    const viaFlag = await quiet(() => main([c.name, '--help']));
    const viaHelp = await quiet(() => main(['help', c.name]));
    assert.equal(viaFlag.code, 0);
    assert.equal(viaFlag.out, viaHelp.out, `${c.name}: --help and help <command> agree`);
    assert.notEqual(viaFlag.out, top, `${c.name} --help is not the overview`);
    assert.match(viaFlag.out, new RegExp(`^Usage: playac-mod ${c.name}\\b`), c.name);
    for (const [flag] of c.options) assert.ok(viaFlag.out.includes(flag), `${c.name} --help names ${flag}`);
    /* its own options only */
    const foreign = LIST.flatMap((o) => o.options.map(([f]) => f.split(' ')[0])).filter((f) => !optionSpec(c.name).bool.has(f.slice(2)) && !optionSpec(c.name).value.has(f.slice(2)));
    for (const f of foreign) assert.ok(!new RegExp(`^  ${f}\\b`, 'm').test(viaFlag.out), `${c.name} --help does not list ${f}`);
    assert.ok(!/\u2014/.test(viaFlag.out));
  }
  assert.equal((await quiet(() => main(['help', 'frobnicate']))).code, 2);
  /* every option the code reads is one the list names: a flag used in bin/ and missing from help.mjs would be refused */
  const bin = fs.readFileSync(fileURLToPath(new URL('../bin/playac-mod.mjs', import.meta.url)), 'utf8');
  const read = new Set([...bin.matchAll(/a\.flags(?:\.([a-z]+)\b|\['([a-z-]+)'\])/g)].map((m) => m[1] || m[2]));
  const known = new Set(LIST.flatMap((c) => [...optionSpec(c.name).bool, ...optionSpec(c.name).value]));
  for (const f of read) assert.ok(known.has(f), `--${f} is read by the CLI but not in help.mjs`);
});

test('an unknown option is refused by name, a missing value is said, exit 2', async () => {
  let r = await quiet(() => main(['check', '--bogus']));
  assert.equal(r.code, 2);
  assert.match(r.out, /Unknown option --bogus for check\./);
  assert.doesNotMatch(r.out, /needs a value/);
  r = await quiet(() => main(['check', '--kind', 'lines']));
  assert.equal(r.code, 2, 'an option of another command is unknown here');
  assert.match(r.out, /Unknown option --kind for check/);
  r = await quiet(() => main(['pack', '--out']));
  assert.equal(r.code, 2);
  assert.match(r.out, /--out needs a value/);
  r = await quiet(() => main(['check', '-x']));
  assert.equal(r.code, 2);
  assert.match(r.out, /Unknown option -x/);
});

test('check, pack and dev outside a mod folder say so, with no word of a ZIP', async () => {
  const empty = tmp();
  for (const cmd of ['check', 'pack', 'dev']) {
    const r = await quiet(() => main([cmd, empty]));
    assert.equal(r.code, 2, cmd);
    assert.match(r.out, /has no mod\.json/, cmd);
    assert.doesNotMatch(r.out, /ZIP/, cmd);
  }
  const r = await quiet(() => main(['check', empty, '--json']));
  assert.equal(JSON.parse(r.out).ok, false, '--json still answers JSON');
});

test('the version line: the version, the build and the API level', () => {
  assert.match(versionLine('1.2.3', 'abcdef012345'), /^playac-mod 1\.2\.3, build abcdef012345, API levels? /);
  assert.match(versionLine('1.2.3', ''), /from source/);
});

test('the package: its build id names its files, and it carries its licence, notices and changelog', SOURCE_ONLY, async () => {
  const { packageFiles, buildOf, BUILD_SKIP } = await import('../scripts/tarball.mjs');
  const files = packageFiles();
  const { version, build } = JSON.parse(files['vendor/build.json'].toString());
  assert.equal(version, JSON.parse(files['package.json'].toString()).version);
  assert.equal(build, buildOf(files));
  assert.ok(BUILD_SKIP.has('vendor/releases.json'), 'cutting a release does not change the build');
  const changed = { ...files, 'lib/help.mjs': Buffer.from('x') };
  assert.notEqual(buildOf(changed), build, 'a changed file is another build');
  assert.match(files.LICENSE.toString(), /^MIT License\n\nCopyright \(c\) \d{4} Play AC Online\n/);
  const notices = files['vendor/LICENSE'].toString();
  for (const name of ['vendor/mods.js', 'vendor/fflate.umd.min.js', 'Arjun Barrett', 'lib/luasyntax.wasm.mjs', 'Lua.org, PUC-Rio']) assert.ok(notices.includes(name), `the notices name ${name}`);
  assert.doesNotMatch(notices, /decomp|FlyingMeta|FixNES/i, 'only what the package carries');
  for (const f of Object.keys(files).filter((f) => f.startsWith('vendor/') && /\.(js|mjs)$/.test(f))) {
    assert.ok(/^vendor\/(mods\.js|fflate\.umd\.min\.js)$/.test(f), `${f} is vendored: add its notice to THIRD-PARTY-NOTICES.txt`);
  }
  /* the changelog has a section for this version, and the game's rules arrive without our notes */
  assert.match(files['CHANGELOG.md'].toString(), new RegExp(`^## ${version.replace(/\./g, '\\.')}$`, 'm'));
  const modsJs = files['vendor/mods.js'].toString();
  assert.doesNotMatch(modsJs.slice(modsJs.indexOf('*/') + 2), /\/\*|^\s*\/\//m, 'vendor/mods.js carries no comments');
});

/* the docs install ONE release by its address. So that release must be
 * the tool as it is now: a rule the game gained after the last release would
 * be missing from every modder's check. This fails until a release is cut. */
test('the install line is current: the newest release is this checkout\'s tool, and facts.ts names it', SOURCE_ONLY, async () => {
  const { packageFiles, buildOf } = await import('../scripts/tarball.mjs');
  const { readReleases, RELEASES_JSON } = await import('../scripts/release.mjs');
  const list = readReleases(RELEASES_JSON).releases;
  const newest = list[list.length - 1];
  const version = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8')).version;
  /* the steps, with the commands, are in MAINTAINERS.md under "Releases" */
  const HOW = 'the tool or the game\'s mod rules changed since the last release: cut a new one. Raise "version" in package.json, add a "## <version>" section to CHANGELOG.md, run the release script and rebuild the docs. If the site never served that version, keep the number and run the release script with --replace. MAINTAINERS.md has the commands.';
  assert.equal(newest.version, version, HOW);
  assert.equal(newest.build, buildOf(packageFiles()), HOW);
  const facts = fs.readFileSync(CHECKOUT.facts, 'utf8');
  assert.equal((/export const CLI_RELEASE = '([^']+)'/.exec(facts) || [])[1], newest.version, 'facts.ts CLI_RELEASE is the newest release (release.mjs writes it)');
  assert.equal((/export const CLI_RELEASE_SHA256 = '([^']+)'/.exec(facts) || [])[1], newest.sha256, 'facts.ts CLI_RELEASE_SHA256 is its hash');
});

test('pack says one hash; the others are in --json', async () => {
  const dir = path.join(tmp(), 'bean.world');
  writeFiles(dir, modFiles('bean.world', 'shop'));
  const r = await quiet(() => main(['pack', dir, '--no-lua']));
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /^content hash [0-9a-f]{64}$/m);
  assert.doesNotMatch(r.out, /modset|zip sha256/, 'the two hashes only tools need are in --json');
  const j = JSON.parse((await quiet(() => main(['pack', dir, '--no-lua', '--json']))).out);
  assert.ok(j.sha256 && j.modset_line && j.content_sha);
});

/* the game reads from the dev server only after the author presses
 * Connect in the dev panel, so each place that tells the loop names Connect
 * and the one restart. */
test('dev: what it prints, its help and the README name Connect and the restart', () => {
  const told = (text, what) => {
    assert.match(text, /\?moddev=1/, `${what}: the address`);
    assert.match(text, /Settings, Mods, Load a mod you are making/, `${what}: where`);
    assert.match(text, /Connect/, `${what}: Connect`);
    assert.match(text, /Restart now once/, `${what}: the restart`);
  };
  const usual = devSteps('http://127.0.0.1:2604', 2604).join('\n');
  told(usual, 'dev on the usual port');
  assert.doesNotMatch(usual, /127\.0\.0\.1:2604/, 'the box already holds the usual address');
  const moved = devSteps('http://127.0.0.1:2605', 2605).join('\n');
  told(moved, 'dev on another port');
  assert.match(moved, /put http:\/\/127\.0\.0\.1:2605 in "playac-mod dev address"/);
  told(commandText('dev'), 'dev --help');
  const pkg = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  told(fs.readFileSync(path.join(pkg, 'README.md'), 'utf8'), 'the tool README');
});

