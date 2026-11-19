/* playac-mod: what a release tarball carries.
 *
 *   node --test cli/test/
 *
 * A release cannot hold its own hash: the hash is of the file that would
 * hold it. The 0.2.0 recut once shipped a release list naming 0.2.0 with the
 * hash of the cut before it. So a package carries no release list at all,
 * and a release that names itself is refused. */
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
import { modFiles, writeFiles } from './mod.mjs';

const SOURCE_ONLY = { skip: !CHECKOUT && 'needs the game\'s source checkout' };
/* the release script reads the game's source, so the public copy has none */
const { readReleases, releaseFile, RELEASES_DIR, RELEASES_JSON } = CHECKOUT ? await import('../scripts/release.mjs') : {};
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'playac-mod-rel-'));
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const VERSION = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8')).version;
/* the game's source folders start with this; spelled in parts so this file can go public */
const SOURCE_NAME = ['animal', 'crossing', 'web'].join('-');
const rec = (version, ch) => ({ version, file: releaseFile(version), sha256: ch.repeat(64) });

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
  for (const r of readReleases(RELEASES_JSON).releases) {
    const files = readTarball(fs.readFileSync(path.join(RELEASES_DIR, r.file)));
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
    fs.writeFileSync(path.join(dir, releaseFile(version)), bytes);
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
  fs.writeFileSync(path.join(dir, releaseFile('9.9.9')), wrong);
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

/* The newest frozen tarball as a modder has it: unpacked alone, with no
 * checkout beside it and no network. */
test('the frozen release, unpacked: it runs, and never reads the project around it', SOURCE_ONLY, async () => {
  const { readTarball } = await import('../scripts/tarball.mjs');
  const list = readReleases(RELEASES_JSON).releases;
  const newest = list[list.length - 1];
  const tgz = fs.readFileSync(path.join(RELEASES_DIR, newest.file));
  assert.equal(newest.sha256, sha(tgz));
  const root = tmp();
  for (const [rel, body] of Object.entries(readTarball(tgz))) {
    const to = path.join(root, 'node_modules', 'playac-mod', ...rel.split('/'));
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.writeFileSync(to, body);
  }
  const bin = path.join(root, 'node_modules', 'playac-mod', 'bin', 'playac-mod.mjs');
  const env = { PATH: process.env.PATH, HOME: root };
  let r = spawnSync(process.execPath, [bin, '--version'], { cwd: root, encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, new RegExp(`^playac-mod ${newest.version.replace(/\./g, '\\.')}, build ${newest.build}`));
  writeFiles(path.join(root, 'me.mod'), modFiles('me.mod', 'lines'));

  /* a project that holds a folder named like the game's source changes nothing (the checkout probe is gone) */
  const trap = path.join(root, `${SOURCE_NAME}-wasm`, 'pc', 'web');
  fs.mkdirSync(trap, { recursive: true });
  fs.writeFileSync(path.join(trap, 'mods.js'), 'require("fs").writeFileSync(process.env.TRAP, "ran"); module.exports = {};\n');
  fs.writeFileSync(path.join(trap, 'fflate.umd.min.js'), 'module.exports = {};\n');
  const mark = path.join(root, 'trap-ran');
  r = spawnSync(process.execPath, [bin, 'check', path.join(root, 'me.mod')], { cwd: root, encoding: 'utf8', env: { ...env, TRAP: mark } });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(!fs.existsSync(mark), 'the installed tool ran a mods.js from the project around it');
});

