#!/usr/bin/env node
/* playac-mod - check, pack and try Play AC Online mods.
 * Run `playac-mod help` for the commands. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkFolder, formatReport } from '../lib/check.mjs';
import { DEFAULT_PORT, startDevFree } from '../lib/dev.mjs';
import { mods } from '../lib/contract.mjs';
import { commandHelp, commandText, optionSpec, overview } from '../lib/help.mjs';

const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PKG_JSON = JSON.parse(fs.readFileSync(path.join(PKG, 'package.json'), 'utf8'));
const VERSION = PKG_JSON.version;

/* argv -> { _: [positionals], flags: {name: value|true|[values]} }.
 * Only the options lib/help.mjs lists for the command (and --help,
 * --version) are known. Any other is refused by name, so a typo never
 * swallows the next word as its value. */
export function parseArgs(argv) {
  const out = { _: [], flags: {} };
  const cmd = argv.find((x) => !x.startsWith('-'));
  const spec = optionSpec(cmd);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h') { out.flags.help = true; continue; }
    if (a === '-v') { out.flags.version = true; continue; }
    if (!a.startsWith('--')) {
      if (a.startsWith('-') && a.length > 1 && !/^-\d/.test(a)) throw usage(unknownOption(a, cmd));
      out._.push(a);
      continue;
    }
    const [k, eq] = a.slice(2).split(/=(.*)/s);
    let v = eq;
    if (spec.bool.has(k)) v = v === undefined ? true : v;
    else if (spec.value.has(k)) {
      if (v === undefined) v = argv[++i];
      if (v === undefined || (v.startsWith('--') && v.length > 2)) throw usage(`--${k} needs a value.`);
    } else throw usage(unknownOption(`--${k}`, cmd));
    if (spec.multi.has(k)) (out.flags[k] = out.flags[k] || []).push(v);
    else out.flags[k] = v;
  }
  return out;
}

const unknownOption = (opt, cmd) => (commandHelp(cmd) ? `Unknown option ${opt} for ${cmd}.` : `Unknown option ${opt}.`);

/* A usage mistake: exit 2. */
function usage(msg) {
  const e = new Error(msg);
  e.usage = true;
  return e;
}

const dirOf = (a) => path.resolve(a._[0] || '.');
const shown = (p) => {
  const rel = path.relative(process.cwd(), p);
  return !rel ? '.' : rel.startsWith('..') ? p : rel;
};

/* '' for a folder with mod.json at its top, else what is wrong. */
function notAModFolder(dir) {
  if (!fs.existsSync(dir)) return `${shown(dir)} does not exist.`;
  if (!fs.statSync(dir).isDirectory()) return `${shown(dir)} is not a folder.`;
  return fs.existsSync(path.join(dir, 'mod.json')) ? '' : `${shown(dir)} has no mod.json.`;
}
const isZipFile = (p) => /\.zip$/i.test(p) && fs.existsSync(p) && fs.statSync(p).isFile();

async function cmdCheck(a) {
  const dir = dirOf(a);
  let r;
  try {
    const why = isZipFile(dir) ? '' : notAModFolder(dir);
    if (why) throw usage(why);
    r = await checkFolder(dir, { lua: !a.flags['no-lua'] });
  } catch (e) {
    /* --json promises JSON on stdout, even for a folder that is not there */
    if (!a.flags.json) throw e;
    console.log(JSON.stringify({ ok: false, problems: [{ file: '', message: e.message }], warnings: [], left_out: [], content_sha: null }, null, 2));
    return 1;
  }
  if (a.flags.json) {
    console.log(JSON.stringify({ ok: r.ok, problems: r.problems, warnings: r.warnings, left_out: r.leftOut,
      content_sha: r.result ? r.result.contentSha : null }, null, 2));
    return r.ok ? 0 : 1;
  }
  const report = formatReport(r, { verbose: !!a.flags.verbose });
  if (report) console.log(report);
  if (!r.ok) {
    console.error(`FAIL: ${r.problems.length} problem(s).`);
    return 1;
  }
  const m = r.manifest;
  const nw = r.warnings.length;
  console.log(`ok   ${m.id} ${m.version}, ${r.result.files} files${nw ? `, ${nw} warning(s)` : ''}`);
  return 0;
}

async function cmdPack(a) {
  const dir = dirOf(a);
  if (isZipFile(dir)) throw usage(`${path.basename(dir)} is already a ZIP.`);
  const why = notAModFolder(dir);
  if (why) throw usage(why);
  const r = await checkFolder(dir, { lua: !a.flags['no-lua'] });
  if (!r.ok) {
    console.error(formatReport(r));
    /* Every problem is a guess of the script scan: the game and the
     * site take the mod, and the scan can be wrong, so pack goes on. */
    if (!r.guessesOnly) throw new Error('not packed: the mod fails check.');
    console.error('WARNING: packed anyway. These come from reading the script\'s text and may be wrong.');
  }
  const p = r.result;
  /* beside the folder, never in it: the game refuses a mod with a .zip in it */
  const out = path.resolve(a.flags.out || path.join(path.dirname(dir), `${p.manifest.id}-${p.manifest.version}.zip`));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, p.zip);
  if (a.flags.json) {
    console.log(JSON.stringify({ file: out, id: p.manifest.id, version: p.manifest.version, scope: p.manifest.scope,
      sha256: p.sha256, content_sha: p.contentSha, modset_line: p.modsetLine, files: p.files, bytes: p.zip.length }, null, 2));
    return 0;
  }
  console.log(`packed ${shown(out)}, ${p.files} files, ${(p.zip.length / 1024).toFixed(1)} KB`);
  console.log(`content hash ${p.contentSha}`);
  return 0;
}

async function cmdDev(a) {
  const dir = dirOf(a);
  const why = notAModFolder(dir);
  if (why) throw usage(why);
  const chosen = a.flags.port !== undefined;
  const port = chosen ? Number(a.flags.port) : DEFAULT_PORT;
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw usage('--port must be a number from 0 to 65535.');
  let dev;
  /* with no --port, a taken 2604 moves to the next free port, up to 20 tries */
  try {
    dev = await startDevFree(dir, { port, origins: a.flags.origin || [], lua: !a.flags['no-lua'], log: (s) => console.log(s) }, chosen ? 1 : 20);
  } catch (e) {
    if (e.code === 'EADDRINUSE' || e.code === 'EACCES') throw new Error(`port ${e.port ?? port} is not free. Pick another with --port.`);
    throw e;
  }
  const s = dev.state();
  console.log(`serving ${s.id || 'no id'} ${s.version} at ${dev.url}`);
  for (const line of devSteps(dev.url, dev.port)) console.log(line);
  if (!s.ok) console.log(formatReport({ problems: s.problems, warnings: [] }));
  await new Promise((resolve) => {
    const stop = () => { dev.close().then(resolve); };
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
  });
  return 0;
}

/* What `dev` prints after "serving": how to load the folder in the game.
 * the game reads from this computer only after Connect is pressed.
 * The words are the Mods tab's own: its Developer section, the row "Load a
 * mod you are making" (DevModPanel.svelte). Then one line per event. */
export function devSteps(url, port) {
  return [
    'In the game: open it with ?moddev=1, go to Settings, Mods, Developer, Load a mod you are making,',
    port === DEFAULT_PORT
      ? 'press Connect, then Restart now once. Ctrl+C stops.'
      : `put ${url} in "playac-mod dev address", press Connect, then Restart now once. Ctrl+C stops.`,
  ];
}

/* This package's build id (vendor/build.json, written when the package is
 * made), or '' when it runs from source. */
export function buildId(pkgDir = PKG) {
  try {
    const b = JSON.parse(fs.readFileSync(path.join(pkgDir, 'vendor', 'build.json'), 'utf8')).build;
    return /^[0-9a-f]{12}$/.test(b) ? b : '';
  } catch { return ''; }
}

export function versionLine(version = VERSION, build = buildId()) {
  const levels = mods.API_MIN === mods.API_MAX ? `API level ${mods.API_MAX}` : `API levels ${mods.API_MIN} to ${mods.API_MAX}`;
  return `playac-mod ${version}, ${build ? `build ${build}` : 'from source'}, ${levels}`;
}

const COMMANDS = { check: cmdCheck, pack: cmdPack, dev: cmdDev };

/* npm only warns about package.json engines, so the tool refuses an older Node itself. */
const NODE_MIN = String((PKG_JSON.engines || {}).node || '').replace(/^>=\s*/, '');
export function nodeTooOld(version = process.versions.node, min = NODE_MIN) {
  if (!min) return false;
  const [M, m = 0] = String(version).replace(/^v/, '').split('.').map(Number);
  const [wantM, wantm = 0] = min.split('.').map(Number);
  return M < wantM || (M === wantM && m < wantm);
}

export async function main(argv) {
  if (nodeTooOld()) {
    console.error(`playac-mod needs Node.js ${NODE_MIN} or newer, not ${process.version}.`);
    return 1;
  }
  let a;
  try { a = parseArgs(argv); } catch (e) { console.error(`playac-mod: ${e.message}`); return 2; }
  const cmd = a._.shift();
  if (cmd === 'help') {
    const topic = a._[0];
    if (!topic) { console.log(overview(VERSION)); return 0; }
    if (!commandHelp(topic)) { console.error(`Unknown command ${topic}.`); return 2; }
    console.log(commandText(topic));
    return 0;
  }
  if (a.flags.help) { console.log(commandHelp(cmd) ? commandText(cmd) : overview(VERSION)); return 0; }
  if (a.flags.version || cmd === 'version') { console.log(versionLine()); return 0; }
  if (!cmd) { console.error(overview(VERSION)); return 2; }
  const run = COMMANDS[cmd];
  if (!run) { console.error(`Unknown command ${cmd}. Run "playac-mod help".`); return 2; }
  try {
    return await run(a);
  } catch (e) {
    console.error(`playac-mod ${cmd}: ${e.message}`);
    return e.usage ? 2 : 1;
  }
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; });
}
