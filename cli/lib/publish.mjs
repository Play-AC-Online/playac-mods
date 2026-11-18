/* publish.mjs - `playac-mod publish`: sign in with a device code, then upload.
 *
 * The sign-in is RFC 8628 shaped (backend the game's server):
 *   POST /api/mods/cli/device {client}       -> {device_code, user_code,
 *        verification_uri, verification_uri_complete, expires_in, interval}
 *   the player opens verification_uri (the site's /cli/ page), signed in, and
 *   approves user_code
 *   POST /api/mods/cli/token {device_code}   -> 200 {access_token, token_type,
 *        expires_in, scope: "mods:publish"} or 400 {error: authorization_pending
 *        | slow_down | expired_token | access_denied}
 * The token can only upload mods (POST /api/mods and /api/mods/import) and
 * read and yank the author's own versions (GET /api/mods/mine, POST
 * /api/mods/{id}/yank and /unyank: `status`, `yank`, `unyank`). It
 * lasts an hour, and is revoked by `playac-mod logout` or from the /cli/ page.
 *
 * The token is kept in <config>/playac-mod/credentials.json (mode 0600) per API
 * host until it expires, so a second publish within the hour needs no code.
 *
 * A saved token the server answers 401 to (revoked on the /cli/ page, or by an
 * account ban) is forgotten and the sign-in runs once more; before,
 * every publish reused the dead token until it expired.
 *
 * Which account approved the code: the server names it in the token answer as
 * `account_name` (the approving account's display name, left out when
 * unknown), and publish prints "Signed in as <name>" before anything is
 * uploaded. A field that is there but empty or not text is refused (the player
 * cannot see whose account they are about to publish under); a server that
 * leaves it out (an older one, or a name it does not know) still works. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const DEFAULT_API = 'https://api.playaconline.com';
export const CLIENT = 'playac-mod';

export function configDir() {
  if (process.env.PLAYAC_CONFIG_DIR) return process.env.PLAYAC_CONFIG_DIR;
  if (process.platform === 'win32' && process.env.APPDATA) return path.join(process.env.APPDATA, 'playac-mod');
  const base = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  return path.join(base, 'playac-mod');
}

function credFile() { return path.join(configDir(), 'credentials.json'); }

function readCreds() {
  try { return JSON.parse(fs.readFileSync(credFile(), 'utf8')) || {}; } catch { return {}; }
}

function writeCreds(all) {
  fs.mkdirSync(configDir(), { recursive: true, mode: 0o700 });
  fs.writeFileSync(credFile(), JSON.stringify(all, null, 2), { mode: 0o600 });
}

export function savedToken(api, now = Date.now()) {
  const c = savedSignIn(api, now);
  return c ? c.token : null;
}

/* The saved sign-in for api: { token, account } (account '' when the server
 * did not name it), or null. */
export function savedSignIn(api, now = Date.now()) {
  const c = readCreds()[api];
  if (!c || typeof c.token !== 'string') return null;
  /* A minute's margin: an upload of a big ZIP must not start on a dying token. */
  if (!(c.expires_at > now + 60_000)) return null;
  return { token: c.token, account: typeof c.account === 'string' ? c.account : '' };
}

export function saveToken(api, token, expiresIn, now = Date.now(), account = '') {
  const all = readCreds();
  all[api] = { token, expires_at: now + expiresIn * 1000 };
  if (account) all[api].account = account;
  writeCreds(all);
}

/* The approving account's name from a token answer: a string, or '' when the
 * server sends none (an older server), or null when it sends the field but no
 * usable name. */
export function accountOf(body) {
  for (const k of ['account_name', 'account', 'approved_by']) {
    if (!body || !Object.prototype.hasOwnProperty.call(body, k)) continue;
    let v = body[k];
    if (v && typeof v === 'object') v = v.display_name ?? v.name ?? v.username;
    return typeof v === 'string' && v.trim() ? v.trim().slice(0, 80) : null;
  }
  return '';
}

export function forgetToken(api) {
  const all = readCreds();
  delete all[api];
  writeCreds(all);
}

async function jsonOf(r) {
  try { return await r.json(); } catch { return {}; }
}

function said(body, status) {
  return body.detail || body.message || body.error_description || body.error || body.code || `HTTP ${status}`;
}

/* The device-code sign-in. io: { fetch, sleep, print, now }. Returns
 * { token, expiresIn }. */
export async function signIn(api, version, io) {
  const { fetch: f = fetch, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), print = console.log, now = Date.now } = io || {};
  const start = await f(`${api}/api/mods/cli/device`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client: `${CLIENT}/${version}` }),
  });
  const s = await jsonOf(start);
  if (!start.ok) throw new Error(`The sign-in did not start. The site said: ${said(s, start.status)}`);
  print('');
  print(`  Open ${s.verification_uri} and enter the code ${s.user_code}`);
  print(`  (or open ${s.verification_uri_complete})`);
  print('  Sign in there if you are not, check the code, and press Approve.');
  print('');
  let interval = Math.max(1, Number(s.interval) || 5) * 1000;
  const until = now() + (Number(s.expires_in) || 600) * 1000;
  while (now() < until) {
    await sleep(interval);
    const r = await f(`${api}/api/mods/cli/token`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_code: s.device_code }),
    });
    const b = await jsonOf(r);
    if (r.ok && b.access_token) {
      const account = accountOf(b);
      if (account === null) throw new Error('The sign-in did not say which account approved it, so nothing was uploaded. Run publish again.');
      const t = { token: b.access_token, expiresIn: Number(b.expires_in) || 3600 };
      if (account) {
        t.account = account;
        print(`  Signed in as ${account}.`);
      }
      return t;
    }
    if (b.error === 'authorization_pending') continue;
    if (b.error === 'slow_down') { interval += 5000; continue; }
    if (b.error === 'access_denied') throw new Error('The sign-in was denied on the site.');
    if (b.error === 'expired_token') break;
    throw new Error(`The sign-in failed. The site said: ${said(b, r.status)}`);
  }
  throw new Error('The code expired before it was approved. Run publish again.');
}

/* A token for api: the saved one, or a new sign-in (saved unless noSave). */
export async function token(api, version, io = {}, { noSave = false } = {}) {
  return (await signedIn(api, version, io, { noSave })).token;
}

/* { token, saved }: the saved sign-in (its account said again), or a new one. */
async function signedIn(api, version, io = {}, { noSave = false, fresh = false } = {}) {
  const print = io.print || console.log;
  const saved = fresh ? null : savedSignIn(api);
  if (saved) {
    if (saved.account) print(`Signed in as ${saved.account}, from the saved sign-in. Run "playac-mod logout" to switch accounts.`);
    return { token: saved.token, saved: true };
  }
  const t = await signIn(api, version, io);
  if (!noSave) saveToken(api, t.token, t.expiresIn, Date.now(), t.account || '');
  return { token: t.token, saved: false };
}

/* Run fn(token). A 401 forgets the saved token; when the token was a saved
 * one (revoked since), sign in again ONCE and run fn again. */
export async function withToken(api, version, fn, io = {}, { noSave = false } = {}) {
  const first = await signedIn(api, version, io, { noSave });
  try {
    return await fn(first.token);
  } catch (e) {
    if (e.status !== 401) throw e;
    forgetToken(api);
    if (!first.saved) throw e;
    (io.print || console.log)('The saved sign-in has ended. Sign in again.');
    const again = await signedIn(api, version, io, { noSave, fresh: true });
    try {
      return await fn(again.token);
    } catch (e2) {
      if (e2.status === 401) forgetToken(api);
      throw e2;
    }
  }
}

/* The upload refusal, said plainly. The routes answer {error, detail}. */
export function uploadRefusal(status, body) {
  const code = body.error || body.code;
  if (code === 'publisher_terms') return 'Confirm your age and accept the mod rules once on the site, under Settings, Mods, Share a mod. Then publish again.';
  if (code === 'version_exists') return 'This version is already uploaded. Raise "version" in mod.json.';
  if (code === 'not_owner') return 'Another player already uploaded a mod with this id. Pick a different "id".';
  if (code === 'screenshot_required') return `Add a screenshot with --shot <file.png>, or put PNG or JPEG files in ${SHOT_DIR}. For --github, commit them to the repo.`;
  if (code === 'changelog_required') return 'Say what this version changes with --changelog "<line>", or add a section for this version to CHANGELOG.md.';
  return said(body, status);
}

/* ── the storefront listing ──
 * Every upload carries 1..4 screenshots (PNG or JPEG, at most 2 MiB each) and
 * a changelog line, as the site's form does. They are never packed into the
 * mod. Defaults, the same files the GitHub import reads:
 *   screenshots  <folder>/.playac/screenshots/*.png|jpg|jpeg, in name order
 *   changelog    this version's section of <folder>/CHANGELOG.md, else
 *                <folder>/.playac/changelog.txt
 * --shot <file> (repeatable) and --changelog "<line>" override them. */
export const SHOT_DIR = path.join('.playac', 'screenshots');
export const MAX_SHOTS = 4;
export const MAX_SHOT_BYTES = 2 << 20;
export const MAX_CHANGELOG = 300;
/* Backend mods.MinScreenshotSide / MaxScreenshotSide: a screenshot's sides as
 * uploaded (checked here before the sign-in, not by the registry after). */
export const MIN_SHOT_SIDE = 200;
export const MAX_SHOT_SIDE = 4096;
/* Backend mods.MaxScreenshotPixels: at most a 4K screen of pixels, whatever
 * the sides (a 4096x4096 picture is refused). */
export const MAX_SHOT_PIXELS = 3840 * 2160;
/* Backend mods.MaxProgressiveShotPixels: a progressive JPEG costs the server
 * about five times a standard one to read, so it is held to 1920x1080. */
export const MAX_PROGRESSIVE_SHOT_PIXELS = 1920 * 1080;

/* A PNG's or JPEG's size from its header, or null. */
export function imageSize(b, type) {
  if (type === 'image/png') {
    if (b.length < 24) return null;
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  }
  /* JPEG: walk the markers to the first start-of-frame (C0..CF but C4 C8 CC). */
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    const m = b[i + 1];
    if (m === 0xff) { i++; continue; }
    if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
    const len = b.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
    i += 2 + len;
  }
  return null;
}

/* A version's entry in a CHANGELOG.md: backend mods.ChangelogSection. */
export function changelogSection(md, version) {
  if (!version) return '';
  const out = [];
  let inside = false;
  for (const raw of String(md).replace(/\r\n/g, '\n').split('\n')) {
    const l = raw.trim();
    if (l.startsWith('#')) {
      if (inside) break;
      inside = l.replace(/^#+/, '').split(/[ \t[\]()]+/).some((w) => w && w.replace(/^v/, '') === version);
      continue;
    }
    if (!inside) continue;
    const t = l.replace(/^[-*+]+/, '').trim();
    if (t && out.length <= 4) out.push(t);
  }
  let s = out.join('\n');
  const cps = Array.from(s);
  if (cps.length > MAX_CHANGELOG) s = cps.slice(0, MAX_CHANGELOG - 3).join('').trim() + '...';
  return s;
}

/* A JPEG without the segments a decoder only skips: APP1 to APP13 and APP15
 * (EXIF, XMP, ICC, Photoshop) and comments, up to the first scan. APP0 (JFIF)
 * and APP14 (Adobe) stay. Only a file whose segments follow one another with
 * nothing between them is rewritten; anything else comes back as it was.
 * THE SERVER'S OWN FUNCTION, line for line (backend mods
 * jpegWithoutMetadata, storefront.go): both run the shared cases in
 * the contract's jpeg-progressive-cases.json. */
export function jpegWithoutMetadata(raw) {
  if (raw.length < 4 || raw[0] !== 0xff || raw[1] !== 0xd8) return raw;
  const out = [raw.subarray(0, 2)];
  for (let i = 2; ;) {
    if (i + 4 > raw.length || raw[i] !== 0xff) return raw;
    const m = raw[i + 1];
    const n = (raw[i + 2] << 8) | raw[i + 3];
    if (m < 0xc0 || m === 0xff || (m >= 0xd0 && m <= 0xd9) || n < 2 || i + 2 + n > raw.length) return raw;
    if (m === 0xda) { out.push(raw.subarray(i)); return Buffer.concat(out); }
    if (!(m >= 0xe1 && m <= 0xed) && m !== 0xef && m !== 0xfe) out.push(raw.subarray(i, i + 2 + n));
    i += 2 + n;
  }
}

const SOF2 = Buffer.from([0xff, 0xc2]);

/* What else the registry refuses a screenshot for: 'deep' for a PNG with 16
 * bit samples (IHDR bit depth), 'progressive' for a JPEG a decoder could
 * take for a progressive one, else ''.
 *
 * The server's rule for a JPEG (jpegMayBeProgressive): the bytes FF C2
 * occur anywhere in what is left once the metadata is dropped. It errs one
 * way only: a file without FF C2 has no progressive frame header at all.
 * This used to walk the markers and answer "not progressive" at the first
 * byte it could not follow, so one junk byte after the start passed here
 * and was refused by the site, after the sign-in. */
export function imageKind(b, type) {
  if (type === 'image/png') return b.length > 24 && b[24] === 16 ? 'deep' : '';
  return Buffer.from(jpegWithoutMetadata(b)).includes(SOF2) ? 'progressive' : '';
}

/* Why the registry would refuse a screenshot of this size and kind, or ''.
 * The same rules as the backend's decodeShot, said before the sign-in. */
export function shotProblem(size, kind) {
  if (!size) return '';
  if (Math.min(size.w, size.h) < MIN_SHOT_SIDE || Math.max(size.w, size.h) > MAX_SHOT_SIDE) {
    return `is ${size.w}x${size.h}. A screenshot's sides must be ${MIN_SHOT_SIDE} to ${MAX_SHOT_SIDE} pixels. Take it at the game's own size.`;
  }
  if (size.w * size.h > MAX_SHOT_PIXELS) {
    return `is ${size.w}x${size.h}. A screenshot is at most a 4K screen of pixels (3840 by 2160). Make it smaller.`;
  }
  if (kind === 'deep') return 'is a 16 bit PNG. Save it as an ordinary 8 bit PNG or a JPEG.';
  if (kind === 'progressive' && size.w * size.h > MAX_PROGRESSIVE_SHOT_PIXELS) {
    return `is a progressive JPEG of ${size.w}x${size.h}. One larger than 1920 by 1080 is refused. Save it as a standard (baseline) JPEG or a PNG, or make it smaller.`;
  }
  return '';
}

/* A PNG starts with its 8-byte signature and an IHDR; a JPEG with FF D8 FF. */
export function shotBytesOk(b, type) {
  if (type === 'image/png') return b.length > 33 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v);
  if (type === 'image/jpeg') return b.length > 4 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  return false;
}

const shotType = (p) => (/\.png$/i.test(p) ? 'image/png' : /\.jpe?g$/i.test(p) ? 'image/jpeg' : '');

/* The listing for folder: { shots: [{ name, type, bytes }], changelog }.
 * Throws a plain error when either is missing or a screenshot is unusable. */
export function listingFor(folder, version, { shots = [], changelog = '' } = {}) {
  let files = shots.map((s) => path.resolve(s));
  if (!files.length) {
    const dir = path.join(folder, SHOT_DIR);
    let names = [];
    try { names = fs.readdirSync(dir).filter((n) => shotType(n)).sort(); } catch { names = []; }
    files = names.slice(0, MAX_SHOTS).map((n) => path.join(dir, n));
  }
  if (!files.length) {
    throw new Error(`A shared version needs 1 to ${MAX_SHOTS} screenshots of the mod in the game, and there are none yet. Put PNG or JPEG files in ${SHOT_DIR}${path.sep}, or name one with --shot <file.png>. Nothing was sent. "playac-mod publish --help" lists everything sharing needs.`);
  }
  if (files.length > MAX_SHOTS) throw new Error(`Send at most ${MAX_SHOTS} screenshots.`);
  const out = files.map((f) => {
    const type = shotType(f);
    if (!type) throw new Error(`${f} is not a PNG or a JPEG.`);
    const bytes = fs.readFileSync(f);
    if (bytes.length > MAX_SHOT_BYTES) throw new Error(`${f} is larger than 2 MB.`);
    /* the bytes, not the name: an empty or renamed file is refused here, not
     * after the sign-in by the registry */
    if (!shotBytesOk(bytes, type)) throw new Error(`${f} is not a ${type === 'image/png' ? 'PNG' : 'JPEG'} picture. It is empty, cut short or another kind of file.`);
    const problem = shotProblem(imageSize(bytes, type), imageKind(bytes, type));
    if (problem) throw new Error(`${f} ${problem}`);
    return { name: path.basename(f), type, bytes };
  });
  let line = String(changelog || '').trim();
  if (!line) {
    try { line = changelogSection(fs.readFileSync(path.join(folder, 'CHANGELOG.md'), 'utf8'), version); } catch { line = ''; }
  }
  if (!line) {
    try { line = fs.readFileSync(path.join(folder, '.playac', 'changelog.txt'), 'utf8').trim(); } catch { line = ''; }
  }
  if (!line) {
    throw new Error(`Say what this version changes. Use --changelog "<one line>", a "## ${version}" section in CHANGELOG.md, or .playac/changelog.txt.`);
  }
  if (Array.from(line).length > MAX_CHANGELOG) throw new Error(`Keep the changelog line under ${MAX_CHANGELOG} characters.`);
  return { shots: out, changelog: line };
}

/* The upload form: the zip, the screenshots, the changelog line. */
export function uploadForm(zip, listing) {
  const form = new FormData();
  form.append('zip', new Blob([zip], { type: 'application/zip' }), 'mod.zip');
  for (const s of listing.shots) form.append('screenshot', new Blob([s.bytes], { type: s.type }), s.name);
  form.append('changelog', listing.changelog);
  return form;
}

/* Upload zip with the token, with its listing (listingFor). Returns the
 * server's {id, mod_id, version, status}. fetch sets the multipart boundary. */
export async function upload(api, tok, zip, listing, io = {}) {
  const f = io.fetch || fetch;
  const r = await f(`${api}/api/mods`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok}` },
    body: uploadForm(zip, listing),
  });
  const b = await jsonOf(r);
  if (!r.ok) {
    const e = new Error(`The upload was refused. ${uploadRefusal(r.status, b)}`);
    e.status = r.status;
    throw e;
  }
  return b;
}

/* Ask the registry to import github.com/<owner>/<repo>@<tag>. */
export async function importGitHub(api, tok, source, io = {}) {
  const f = io.fetch || fetch;
  const r = await f(`${api}/api/mods/import`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ source }),
  });
  const b = await jsonOf(r);
  if (!r.ok) {
    const e = new Error(`The import was refused. ${uploadRefusal(r.status, b)}`);
    e.status = r.status;
    throw e;
  }
  return b;
}

export async function revoke(api, tok, io = {}) {
  const f = io.fetch || fetch;
  const r = await f(`${api}/api/mods/cli/revoke`, { method: 'POST', headers: { Authorization: `Bearer ${tok}` } });
  return r.ok;
}

/* ── the author's versions: `status`, `yank`, `unyank` ── */

/* Every version the signed-in account uploaded: GET /api/mods/mine. */
export async function myVersions(api, tok, io = {}) {
  const f = io.fetch || fetch;
  const r = await f(`${api}/api/mods/mine`, { headers: { Authorization: `Bearer ${tok}` } });
  const b = await jsonOf(r);
  if (!r.ok) {
    const e = new Error(`The site did not list your mods. It said: ${said(b, r.status)}`);
    e.status = r.status;
    throw e;
  }
  return Array.isArray(b.mods) ? b.mods : [];
}

/* Yank (yank = true) or list again one version, by its row id. */
export async function setYanked(api, tok, rowId, yank, reason = '', io = {}) {
  const f = io.fetch || fetch;
  const r = await f(`${api}/api/mods/${encodeURIComponent(rowId)}/${yank ? 'yank' : 'unyank'}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
    body: yank && reason ? JSON.stringify({ reason }) : '',
  });
  const b = await jsonOf(r);
  if (!r.ok) {
    const e = new Error(`The site did not ${yank ? 'withdraw that version' : 'list that version again'}. It said: ${said(b, r.status)}`);
    e.status = r.status;
    throw e;
  }
  return b.mod || {};
}

/* A version's state in the words the site uses for it. The API's own names
 * (pending, listed, superseded, yanked, rejected, removed, and the review
 * statuses approved and taken_down) stay in --json and in the requests. */
const STATE_WORDS = {
  pending: 'Waiting for review', listed: 'Listed', approved: 'Listed', superseded: 'Older version',
  yanked: 'Withdrawn', rejected: 'Refused', removed: 'Removed', taken_down: 'Removed',
};
export const stateWord = (state) => STATE_WORDS[state] || String(state);

/* The lines `status` prints: one per version, as the registry lists them. */
export function statusLines(list, modId = '') {
  const rows = list.filter((m) => !modId || m.mod_id === modId);
  if (!rows.length) return [modId ? `You have no uploads of ${modId} yet.` : 'You have no uploads yet.'];
  const out = [];
  for (const m of rows) {
    const state = stateWord(m.state || m.status || '?');
    let line = `${m.mod_id} ${m.version}  ${state}`;
    if (m.source && m.source.repo) line += `  (from github.com/${m.source.repo}@${m.source.tag})`;
    out.push(line);
    const why = [m.reason_title, m.reject_reason].filter(Boolean).join(': ');
    if (why) out.push(`    ${why}`);
  }
  return out;
}

/* ── `publish --github` preflight ──
 * The registry fetches the tag once and refuses what is wrong with it after
 * the sign-in; these are the mistakes the folder can show first. Mirrors
 * backend ghimport.ParseSource. */
const GH_OWNER = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const GH_REPO = /^[A-Za-z0-9._-]{1,100}$/;
const GH_TAG = /^v?((?:0|[1-9][0-9]{0,8})\.(?:0|[1-9][0-9]{0,8})\.(?:0|[1-9][0-9]{0,8}))$/;

export function parseGitHubSource(s) {
  const t = String(s || '').trim();
  const m = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/@\s]+)\/([^/@\s]+?)(?:\.git)?\/?@([^\s]+)$/.exec(t) ||
    /^([^/@\s]+)\/([^/@\s]+?)(?:\.git)?@([^\s]+)$/.exec(t);
  if (!m) throw new Error('Write it as <owner>/<repo>@<tag>, for example you/tea-house@v1.2.0');
  const [, owner, repo, tag] = m;
  if (!GH_OWNER.test(owner) || !GH_REPO.test(repo) || repo === '.' || repo === '..') throw new Error(`${owner}/${repo} is not a GitHub owner and repository name.`);
  const v = GH_TAG.exec(tag);
  if (!v) throw new Error(`The tag must be the mod's version, like v1.2.0 or 1.2.0, not ${tag}.`);
  return { owner, repo, tag, version: v[1] };
}

/* Problems with publishing src from the folder dir, before signing in:
 * mod.json's version against the tag, the listing the import reads from the
 * repo, and (when git is there) whether the tag exists and was pushed.
 * vcs(args) runs git in dir and returns { status, stdout } (null when git
 * is missing). Returns { problems: [], notes: [] }. */
export function githubPreflight(dir, src, vcs) {
  const problems = [];
  const notes = [];
  let version = '';
  try { version = JSON.parse(fs.readFileSync(path.join(dir, 'mod.json'), 'utf8')).version; } catch { version = ''; }
  if (!version) {
    notes.push('There is no mod.json here, so only the tag was checked. Run this in the mod\'s folder to check more.');
    return { problems, notes };
  }
  if (version !== src.version) problems.push(`The tag ${src.tag} says ${src.version}, but mod.json says "version": "${version}". The import refuses a tag that does not match.`);
  try { listingFor(dir, src.version); } catch (e) { problems.push(`${e.message} The import reads the screenshots and the changelog line from the repo at the tag, so commit them before tagging.`); }
  const inside = vcs(['rev-parse', '--is-inside-work-tree']);
  if (!inside || inside.status !== 0) {
    notes.push('This folder is not a Git repository, so the tag itself was not checked.');
    return { problems, notes };
  }
  const local = vcs(['tag', '--list', src.tag]);
  if (!String(local.stdout || '').trim()) {
    problems.push(`There is no tag ${src.tag} here. Commit, then run: git tag ${src.tag} && git push origin ${src.tag}`);
    return { problems, notes };
  }
  const dirty = vcs(['status', '--porcelain', '--untracked-files=no']);
  if (String(dirty.stdout || '').trim()) notes.push(`You have uncommitted changes. The import builds ${src.tag} as committed, not this folder.`);
  const remote = vcs(['ls-remote', '--tags', 'origin', `refs/tags/${src.tag}`]);
  if (remote.status === 0 && !String(remote.stdout || '').trim()) problems.push(`The tag ${src.tag} is not on GitHub yet. Run: git push origin ${src.tag}`);
  else if (remote.status !== 0) notes.push('Could not ask the remote "origin" whether the tag was pushed.');
  return { problems, notes };
}
