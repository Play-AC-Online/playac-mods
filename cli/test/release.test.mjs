/* playac-mod: what a release tarball carries, and what `new --github` pins.
 *
 *   node --test cli/test/
 *
 * A release cannot hold its own hash: the hash is of the file that would
 * hold it. The 0.2.0 recut once shipped a release list naming 0.2.0 with the
 * hash of the cut before it, and `new --github` offline wrote that dead hash
 * into the workflow, whose hash step then failed on every run. So a package
 * carries no release list at all, a release that names itself is refused, and
 * the pin comes from the public repository's release list or not at all. */
import test from 'node:test';
import './gen-checkout.mjs'; /* builds the generated files these tests read, in a checkout */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CHECKOUT } from '../lib/checkout.mjs';
import * as pin from '../lib/pin.mjs';
import { writeTypes, TYPE_FILES } from '../lib/types.mjs';
import { scaffoldFiles, writeFiles } from '../lib/scaffold.mjs';

const SOURCE_ONLY = { skip: !CHECKOUT && 'needs the game\'s source checkout' };
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'playac-mod-rel-'));
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const VERSION = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8')).version;
/* the game's source folders start with this; spelled in parts so this file can go public */
const SOURCE_NAME = ['animal', 'crossing', 'web'].join('-');
const rec = (version, ch) => ({ version, file: pin.releaseFile(version), sha256: ch.repeat(64) });

test('the pin is never a release older than the tool, and never comes from inside the package', async () => {
  const site = (list) => async () => ({ ok: true, json: async () => list });
  const from = (fetchFn, version = '0.2.0') => pin.findRelease(version, { fetchFn, env: {}, local: null });
  /* the list names this version: that record */
  assert.equal((await from(site({ releases: [rec('0.1.0', 'a'), rec('0.2.0', 'b')] }))).sha256, 'b'.repeat(64));
  /* the list names only a newer one: the newer check accepts what this tool scaffolds */
  assert.equal((await from(site({ releases: [rec('0.1.0', 'a'), rec('0.3.0', 'c')] }))).version, '0.3.0');
  /* this release is not published yet: an older check can refuse a newer scaffold, so no pin */
  assert.equal(await from(site({ releases: [rec('0.1.0', 'a')] })), null);
  /* offline, a proxy, a 404: no pin. Nothing in the package stands in. */
  assert.equal(await from(async () => { throw new TypeError('fetch failed'); }), null);
  assert.equal(await from(async () => ({ ok: false, json: async () => ({}) })), null);
  assert.equal(await from(null), null);
  assert.doesNotMatch(fs.readFileSync(fileURLToPath(new URL('../lib/pin.mjs', import.meta.url)), 'utf8'), /['"]releases\.json['"]\)\s*,\s*version|VENDOR, 'releases\.json'/, 'pin.mjs reads no list from vendor/');
});

test('a package carries no release list, no path into the game\'s source and no private address', SOURCE_ONLY, async () => {
  const { packageFiles } = await import('../scripts/tarball.mjs');
  const files = packageFiles();
  assert.equal(files['vendor/releases.json'], undefined, 'no release list in the package');
  /* the same null checkout the public repository carries: no probe of the folders above an install */
  const checkout = files['lib/checkout.mjs'].toString();
  assert.match(checkout, /^export const CHECKOUT = null;$/m);
  assert.doesNotMatch(checkout, /existsSync|import /, 'the packaged checkout.mjs looks at nothing');
  const pkg = JSON.parse(files['package.json'].toString());
  /* the owner is the example pin's (scripts/examples/.test.mjs holds it) */
  assert.match(pkg.repository.url, /^git\+https:\/\/github\.com\/[A-Za-z0-9-]+\/playac-mods\.git$/);
  assert.equal(pkg.repository.directory, 'cli');
  assert.equal(pkg.bin['playac-mod'], 'bin/playac-mod.mjs');
  for (const [rel, body] of Object.entries(files)) {
    if (!/\.(mjs|js|json|md|yml|lua|txt)$/.test(rel) && !/LICENSE$/.test(rel)) continue;
    const text = body.toString('utf8');
    assert.doesNotMatch(text, new RegExp(SOURCE_NAME, 'i'), `${rel} names the private repository`);
    assert.doesNotMatch(text, /(^|[\s(\[,;:'"`])#\d{3,5}\b(?![0-9a-fA-F])/m, `${rel} carries an issue number`);
  }
});

test('release --check reads inside every frozen tarball: none names itself, none names a wrong hash', SOURCE_ONLY, async () => {
  const { checkReleases, record } = await import('../scripts/release.mjs');
  const { packTarball, readTarball } = await import('../scripts/tarball.mjs');
  assert.deepEqual(checkReleases(), []);
  for (const r of pin.readReleases(pin.RELEASES_JSON).releases) {
    const files = readTarball(fs.readFileSync(path.join(pin.RELEASES_DIR, r.file)));
    const inner = files['vendor/releases.json'];
    if (!inner) continue;
    assert.ok(!JSON.parse(inner.toString()).releases.some((x) => x.version === r.version), `${r.file} lists its own version`);
  }
  /* the tar reader is the writer's inverse */
  const made = { 'package.json': Buffer.from('{"name":"playac-mod","version":"9.9.9"}'), 'bin/playac-mod.mjs': Buffer.from('x'), [`vendor/${'d/'.repeat(60)}long.json`]: Buffer.from('{}') };
  assert.deepEqual(Object.fromEntries(Object.entries(readTarball(packTarball(made))).map(([k, v]) => [k, v.toString()])), Object.fromEntries(Object.entries(made).map(([k, v]) => [k, v.toString()])));

  /* a tarball that lists itself is refused, whatever hash it gives */
  const dir = tmp();
  const write = (version, files) => {
    const bytes = packTarball({ 'package.json': Buffer.from(JSON.stringify({ name: 'playac-mod', version })), ...files });
    fs.writeFileSync(path.join(dir, pin.releaseFile(version)), bytes);
    return record(version, bytes);
  };
  const selfList = Buffer.from(JSON.stringify({ releases: [rec('0.1.0', 'a'), rec('9.9.9', 'f')] }));
  let r = write('9.9.9', { 'vendor/releases.json': selfList });
  fs.writeFileSync(path.join(dir, 'releases.json'), JSON.stringify({ releases: [r] }));
  assert.match(checkReleases(dir).join('\n'), /9\.9\.9: .*lists its own version/);
  /* an older record with a hash that is not the committed one is refused too */
  const old = write('0.1.0', {});
  r = write('9.9.9', { 'vendor/releases.json': Buffer.from(JSON.stringify({ releases: [rec('0.1.0', 'a')] })) });
  fs.writeFileSync(path.join(dir, 'releases.json'), JSON.stringify({ releases: [old, r] }));
  assert.match(checkReleases(dir).join('\n'), /9\.9\.9: .*0\.1\.0 with a hash that is not the one in releases\.json/);
  /* and its package.json must say the version it is filed under */
  const wrong = packTarball({ 'package.json': Buffer.from(JSON.stringify({ name: 'playac-mod', version: '1.0.0' })) });
  fs.writeFileSync(path.join(dir, pin.releaseFile('9.9.9')), wrong);
  fs.writeFileSync(path.join(dir, 'releases.json'), JSON.stringify({ releases: [old, record('9.9.9', wrong)] }));
  assert.match(checkReleases(dir).join('\n'), /9\.9\.9: .*package\.json says 1\.0\.0/);
});

test('a recut never embeds a hash for itself, whatever the list on disk says', SOURCE_ONLY, async () => {
  const { release, checkReleases } = await import('../scripts/release.mjs');
  const { readTarball } = await import('../scripts/tarball.mjs');
  const dir = tmp();
  /* the list on disk names this version with the hash of an earlier cut */
  fs.writeFileSync(path.join(dir, 'releases.json'), JSON.stringify({ releases: [{ ...rec(VERSION, 'e'), integrity: 'sha512-old', build: '0'.repeat(12) }] }));
  const out = release({ dir, replace: true });
  const bytes = fs.readFileSync(path.join(dir, out.file));
  assert.equal(out.sha256, sha(bytes));
  const files = readTarball(bytes);
  for (const [rel, body] of Object.entries(files)) {
    assert.ok(!body.includes('e'.repeat(64)), `${rel} carries the old hash`);
    assert.ok(!body.includes(out.sha256), `${rel} carries its own hash`);
  }
  assert.equal(files['vendor/releases.json'], undefined);
  assert.deepEqual(checkReleases(dir), []);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, 'releases.json'), 'utf8')).releases.map((r) => [r.version, r.sha256]), [[VERSION, out.sha256]]);
});

/* The whole path, in the newest frozen tarball as a modder has it: unpacked
 * alone, with no checkout beside it and no network. */
test('the frozen release, unpacked: new --github pins its real hash from the published list, and refuses offline', SOURCE_ONLY, async () => {
  const { readTarball } = await import('../scripts/tarball.mjs');
  const list = pin.readReleases(pin.RELEASES_JSON).releases;
  const newest = list[list.length - 1];
  const tgz = fs.readFileSync(path.join(pin.RELEASES_DIR, newest.file));
  const root = tmp();
  for (const [rel, body] of Object.entries(readTarball(tgz))) {
    const to = path.join(root, 'node_modules', 'playac-mod', ...rel.split('/'));
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.writeFileSync(to, body);
  }
  const bin = path.join(root, 'node_modules', 'playac-mod', 'bin', 'playac-mod.mjs');
  const offline = path.join(root, 'offline.mjs');
  fs.writeFileSync(offline, 'globalThis.fetch = async () => { throw new TypeError("fetch failed"); };\n');
  const online = path.join(root, 'online.mjs');
  fs.writeFileSync(online, `globalThis.fetch = async () => ({ ok: true, json: async () => (${JSON.stringify({ releases: list })}) });\n`);
  const run = (preload, name, env = {}) => spawnSync(process.execPath, ['--import', preload, bin, 'new', name, '--github', '--no-ai'], {
    cwd: root, encoding: 'utf8', env: { PATH: process.env.PATH, HOME: root, PLAYAC_NO_UPDATE_CHECK: '1', ...env },
  });

  /* offline: a plain refusal, and nothing written */
  let r = run(offline, 'me.offline');
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr, /pins the check workflow to a release of playac-mod by its SHA-256/);
  assert.match(r.stderr, /Go online and run the same line again, or leave out --github/);
  assert.ok(!fs.existsSync(path.join(root, 'me.offline')), 'a refused new writes nothing');

  /* the published list: the pin is the hash of the very file this was unpacked from */
  r = run(online, 'me.online');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const yml = fs.readFileSync(path.join(root, 'me.online', '.github', 'workflows', 'mod.yml'), 'utf8');
  assert.match(yml, new RegExp(`PLAYAC_MOD_VERSION: '${newest.version.replace(/\./g, '\\.')}'`));
  assert.match(yml, new RegExp(`PLAYAC_MOD_SHA256: '${sha(tgz)}'`));
  assert.equal(newest.sha256, sha(tgz));

  /* a project that holds a folder named like the game's source changes nothing (the checkout probe is gone) */
  const trap = path.join(root, `${SOURCE_NAME}-wasm`, 'pc', 'web');
  fs.mkdirSync(trap, { recursive: true });
  fs.writeFileSync(path.join(trap, 'mods.js'), 'require("fs").writeFileSync(process.env.TRAP, "ran"); module.exports = {};\n');
  fs.writeFileSync(path.join(trap, 'fflate.umd.min.js'), 'module.exports = {};\n');
  const mark = path.join(root, 'trap-ran');
  r = spawnSync(process.execPath, [bin, 'check', path.join(root, 'me.online')], { cwd: root, encoding: 'utf8', env: { PATH: process.env.PATH, HOME: root, PLAYAC_NO_UPDATE_CHECK: '1', TRAP: mark } });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(!fs.existsSync(mark), 'the installed tool ran a mods.js from the project around it');
});

test('types never writes through a symlink in the mod folder', { skip: process.platform === 'win32' && 'symlinks need rights on Windows' }, () => {
  const outside = tmp();
  const victim = path.join(outside, 'authorized_keys');
  const link = (dir, at, to) => { fs.mkdirSync(path.dirname(path.join(dir, at)), { recursive: true }); fs.symlinkSync(to, path.join(dir, at)); };
  const fresh = () => {
    fs.writeFileSync(victim, 'KEEP');
    const dir = path.join(tmp(), 'bean.linked');
    writeFiles(dir, scaffoldFiles('bean.linked', 'script'));
    return dir;
  };
  /* a file target */
  let dir = fresh();
  link(dir, '.playac/playac.lua', victim);
  writeTypes(dir);
  assert.equal(fs.readFileSync(victim, 'utf8'), 'KEEP', 'the link\'s target is untouched');
  assert.ok(fs.lstatSync(path.join(dir, '.playac/playac.lua')).isFile(), 'the link was replaced by a real file');
  assert.match(fs.readFileSync(path.join(dir, '.playac/playac.lua'), 'utf8'), /playac/);
  /* the .playac folder itself, and the schemas folder inside it */
  for (const at of ['.playac', '.playac/schemas']) {
    dir = fresh();
    const target = path.join(outside, `dir-${at.replace(/\W/g, '')}`);
    fs.mkdirSync(target, { recursive: true });
    link(dir, at, target);
    assert.throws(() => writeTypes(dir), /is a link/, at);
    assert.deepEqual(fs.readdirSync(target), [], `${at}: nothing was written through the link`);
  }
  /* a dependency's hints are appended to the real file only */
  dir = fresh();
  writeTypes(dir);
  for (const f of TYPE_FILES) assert.ok(fs.lstatSync(path.join(dir, '.playac', f)).isFile(), f);
});
