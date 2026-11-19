/* update.mjs - which build this is, and whether a newer release is out.
 *
 * VERSIONS. package.json "version" names a release: MAJOR.MINOR.PATCH, with
 * MINOR raised when the rules, the API level or a command changes and PATCH
 * for fixes. A release is frozen: its file never changes after it is listed.
 * The package also carries a BUILD id (vendor/build.json, written when the
 * package is made): the first 12 hex digits of a SHA-256 over every other
 * file in it. Two packages with the same version and the same build are the
 * same files. A copy built from source can be ahead of the last release
 * under the same version number; its build id is what tells them apart.
 *
 * THE NOTICE. At most once a day the tool reads the public repository's
 * release list on GitHub (one
 * small JSON file, nothing about you or your mod is sent) and says when a
 * newer release is out, or when this copy is not the released build of its
 * version. Never in CI, never with --json, never when the output is not a
 * terminal, and never with PLAYAC_NO_UPDATE_CHECK set. A failed read says
 * nothing. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mods } from './contract.mjs';
import { onNpm, RELEASES_URL, releaseUrl } from './pin.mjs';
import { configDir } from './publish.mjs';

const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CHANGELOG_URL = 'https://playaconline.com/modding/cli/#changelog';
const DAY = 24 * 3600 * 1000;
const RETRY = 3600 * 1000;

/* This package's build id, or '' when it runs from source (no vendor/build.json). */
export function buildId(pkgDir = PKG) {
  try {
    const b = JSON.parse(fs.readFileSync(path.join(pkgDir, 'vendor', 'build.json'), 'utf8')).build;
    return /^[0-9a-f]{12}$/.test(b) ? b : '';
  } catch { return ''; }
}

/* What `playac-mod --version` prints. */
export function versionLine(version, build = buildId()) {
  const levels = mods.API_MIN === mods.API_MAX ? `API level ${mods.API_MAX}` : `API levels ${mods.API_MIN} to ${mods.API_MAX}`;
  return `playac-mod ${version}, ${build ? `build ${build}` : 'run from source'} (${levels})`;
}

export const newerThan = (a, b) => {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0);
  return false;
};

/* How to install one release: the line, then its SHA-256 to compare. */
export function installLines(release, npm = onNpm()) {
  return npm
    ? [`npm install -g playac-mod@${release.version}`]
    : [`npm install -g ${releaseUrl(release.version)}`, `SHA-256 of that file: ${release.sha256}`];
}

/* The notice for this version and build against a release list, or ''. */
export function noticeFor(list, version, build, npm = onNpm()) {
  const ok = (list?.releases || []).filter((r) => r && typeof r.version === 'string' && /^\d+\.\d+\.\d+$/.test(r.version) && /^[0-9a-f]{64}$/.test(r.sha256 || ''));
  if (!ok.length) return '';
  const newest = ok.reduce((a, b) => (newerThan(b.version, a.version) ? b : a));
  if (newerThan(newest.version, version)) {
    const how = installLines(newest, npm);
    return [`A newer playac-mod is out: ${newest.version}. You have ${version}.`, `Update with: ${how[0]}`, ...how.slice(1), `What changed: ${CHANGELOG_URL}`].join('\n');
  }
  const mine = ok.find((r) => r.version === version);
  if (mine && build && /^[0-9a-f]{12}$/.test(mine.build || '') && mine.build !== build) {
    const how = installLines(mine, npm);
    return [`This copy is build ${build}, which is not the ${version} release (build ${mine.build}).`, `Install the release with: ${how[0]}`, ...how.slice(1)].join('\n');
  }
  return '';
}

/* The notice to print after a command, or ''. Reads the list at most once a
 * day (once an hour after a failed read), from a cache in the config folder. */
export async function updateNotice(version, { env = process.env, tty = !!process.stderr.isTTY, fetchFn = globalThis.fetch, now = Date.now(), build = buildId(), dir = configDir() } = {}) {
  if (!tty || env.CI || env.PLAYAC_NO_UPDATE_CHECK || !fetchFn) return '';
  const file = path.join(dir, 'update-check.json');
  let cache = null;
  try { cache = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { cache = null; }
  if (!cache || typeof cache.checked !== 'number' || now < cache.checked || now - cache.checked > (cache.list ? DAY : RETRY)) {
    let list = null;
    try {
      const r = await fetchFn(RELEASES_URL, { signal: AbortSignal.timeout(1500) });
      if (r.ok) list = await r.json();
    } catch { list = null; }
    cache = { checked: now, list: list && Array.isArray(list.releases) ? { releases: list.releases } : null };
    try {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
      fs.writeFileSync(file, JSON.stringify(cache));
    } catch { /* a read-only home: read the list again next time */ }
  }
  return cache.list ? noticeFor(cache.list, version, build) : '';
}
