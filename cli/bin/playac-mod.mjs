#!/usr/bin/env node
/* playac-mod - make, check, pack, try and publish Play AC Online mods.
 * Run `playac-mod help` for the commands. */
import fs from 'node:fs';
/* Node 18 warns that buffer.File is experimental the first time publish builds
 * its upload form (FormData with a file name). It is stable from Node 20 and
 * works on 18; the warning only alarms people, so it is dropped. */
{
  const emit = process.emitWarning;
  process.emitWarning = function (w, ...rest) {
    if (/buffer\.File/.test(String(w && w.message ? w.message : w))) return;
    return emit.call(process, w, ...rest);
  };
}
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkFolder, formatReport } from '../lib/check.mjs';
import { KINDS, scaffoldFiles, writeFiles } from '../lib/scaffold.mjs';
import { writeEditorSettings, writeTypes } from '../lib/types.mjs';
import { DEFAULT_PORT, startDevFree } from '../lib/dev.mjs';
import { DEFAULT_API, forgetToken, githubPreflight, importGitHub, listingFor, myVersions, parseGitHubSource, revoke, savedToken,
  setYanked, stateWord, statusLines, upload, withToken } from '../lib/publish.mjs';
import { githubFiles } from '../lib/scaffold.mjs';
import { findRelease, SITE_RELEASES_URL } from '../lib/pin.mjs';
import { spawnSync } from 'node:child_process';
import { mods } from '../lib/contract.mjs';
import { commandHelp, commandText, optionSpec, overview } from '../lib/help.mjs';
import { updateNotice, versionLine } from '../lib/update.mjs';

const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VERSION = JSON.parse(fs.readFileSync(path.join(PKG, 'package.json'), 'utf8')).version;

/* argv -> { _: [positionals], flags: {name: value|true|[values]} }.
 * The command is the first word that is not an option; only the options
 * lib/help.mjs lists for it (and --help, --version) are known. Any other is
 * refused by name, so a typo never swallows the next word as its value. */
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
      if (v === undefined || (v.startsWith('--') && v.length > 2)) throw usage(`--${k} needs a value.${commandHelp(cmd) ? ` Run "playac-mod ${cmd} --help" to see it.` : ''}`);
    } else throw usage(unknownOption(`--${k}`, cmd));
    if (spec.multi.has(k)) (out.flags[k] = out.flags[k] || []).push(v);
    else out.flags[k] = v;
  }
  return out;
}

function unknownOption(opt, cmd) {
  return commandHelp(cmd)
    ? `Unknown option ${opt} for ${cmd}. Run "playac-mod ${cmd} --help" for its options.`
    : `Unknown option ${opt}. Run "playac-mod help" for the commands.`;
}

/* A usage mistake: exit 2, like an unknown command or a bad flag. */
function usage(msg) {
  const e = new Error(msg);
  e.usage = true;
  return e;
}

const dirOf = (a) => path.resolve(a._[0] || '.');

/* check, pack, dev and publish work on a mod's folder: one with mod.json at
 * its top. Anywhere else the game's own answer ("no mod.json at the top of
 * the ZIP") is about a ZIP nobody made, so say what is wrong here instead. */
function notAModFolder(dir, cmd) {
  const rel = path.relative(process.cwd(), dir);
  const shown = !rel ? 'this folder' : rel.startsWith('..') ? dir : rel;
  if (!fs.existsSync(dir)) return `${shown} does not exist. Name a mod's folder${cmd === 'check' ? ' or a mod ZIP' : ''}, or run ${cmd} inside one.`;
  if (!fs.statSync(dir).isDirectory()) return cmd === 'check' ? `${shown} is not a folder or a .zip file.` : `${shown} is not a folder.`;
  if (fs.existsSync(path.join(dir, 'mod.json'))) return '';
  return `${shown === 'this folder' ? 'This folder' : shown} is not a mod. There is no mod.json in it. Run ${cmd} inside a mod's folder, or name the folder: playac-mod ${cmd} <folder>. To start a mod, run: playac-mod new yourname.my-mod`;
}
const isZipFile = (p) => /\.zip$/i.test(p) && fs.existsSync(p) && fs.statSync(p).isFile();

const apiOf = (a) => String(a.flags.api || process.env.PLAYAC_API || DEFAULT_API).replace(/\/$/, '');

async function cmdNew(a) {
  const id = a._[0];
  if (!id) throw usage('Usage: playac-mod new <yourname.mod-name> [--kind lines] [--github]');
  const kind = a.flags.kind || 'lines';
  const dir = path.resolve(a.flags.dir || id);
  const files = scaffoldFiles(id, kind, { name: a.flags.name, author: a.flags.author, ai: !a.flags['no-ai'] });
  if (a.flags.github) {
    /* the workflow runs one release, pinned by its SHA-256 */
    const release = await findRelease(VERSION);
    if (!release) throw new Error(`--github pins the check workflow to a release of playac-mod by its SHA-256, read from ${SITE_RELEASES_URL}. That list could not be read, or does not have playac-mod ${VERSION} or newer yet. Nothing was written. Go online and run the same line again, or leave out --github.`);
    Object.assign(files, githubFiles(release));
  }
  writeFiles(dir, files, { force: !!a.flags.force });
  writeTypes(dir);
  const r = await checkFolder(dir);
  if (!r.ok) throw new Error(`The new mod does not pass check. This is a bug in playac-mod.\n${formatReport(r)}`);
  const rel = path.relative(process.cwd(), dir) || '.';
  console.log(`Made ${rel}, a ${kind} mod with the id ${id}.`);
  console.log(`Next: cd ${rel} && playac-mod dev`);
  console.log('To share it later, run "playac-mod publish --help". It lists what you need first.');
  if (a.flags.github) {
    console.log('For GitHub, run git init, commit and push. Put 1 to 4 screenshots in .playac/screenshots/ and commit them.');
    console.log('Then run: git tag v0.1.0 && git push origin v0.1.0 && playac-mod publish --github <you>/<repo>@v0.1.0');
  }
  return 0;
}

async function cmdCheck(a) {
  const dir = dirOf(a);
  const isZip = /\.zip$/i.test(dir);
  let r;
  try {
    const why = isZipFile(dir) ? '' : notAModFolder(dir, 'check');
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
  const hasLua = Object.keys(r.entries || {}).some((n) => n.toLowerCase().endsWith('.lua'));
  if (hasLua && !r.luaChecked) console.log('NOTE: Lua syntax was not checked (--no-lua). A syntax error stops the script when the game loads it.');
  if (!r.ok) {
    console.error(`FAIL: ${r.problems.length} problem(s). The game would refuse this mod${r.problems.some((p) => /stops (your|this|the) script/.test(p.message)) ? ' or stop its script' : ''}.`);
    return 1;
  }
  const m = r.manifest;
  const nw = r.warnings.length;
  console.log(`ok   ${isZip ? `${path.basename(dir)}: ` : ''}${m.id} ${m.version}, ${m.scope}, ${r.result.files} files, ${(r.result.unpacked / 1024).toFixed(1)} KB` +
    (nw ? `. ${nw} warning${nw === 1 ? '' : 's'} above. The game still installs it.` : ''));
  return 0;
}

async function packed(dir, a, cmd = 'pack') {
  if (/\.zip$/i.test(dir) && fs.existsSync(dir) && fs.statSync(dir).isFile()) throw usage(`${path.basename(dir)} is already a ZIP. pack and publish take the mod's folder. check takes either.`);
  const why = notAModFolder(dir, cmd);
  if (why) throw usage(why);
  const r = await checkFolder(dir, { lua: !a.flags['no-lua'] });
  if (!r.ok && r.guessesOnly) {
    /* Every problem is a guess of the script scan. The game and the
     * site take this mod, and the scan reads patterns, so it can be wrong.
     * Say it loudly and go on. */
    console.error(formatReport(r));
    console.error(`WARNING: check found ${r.problems.length} problem(s) in the script, listed above. They come from reading the script's text, which can be wrong, so the mod was ${cmd === 'publish' ? 'sent' : 'packed'} anyway. If they are right, the game stops the script when it loads. Run the mod before you share it.`);
    return r.result;
  }
  if (!r.ok) {
    console.error(formatReport(r));
    throw new Error('The mod does not pass check, so it was not packed.');
  }
  return r.result;
}

async function cmdPack(a) {
  const dir = dirOf(a);
  const p = await packed(dir, a);
  /* beside the folder, not in it. A ZIP inside the folder is left out
   * by pack, but a ZIP made by hand (Compress, Send to) would hold it, and the
   * game refuses a mod with a .zip in it. */
  const out = path.resolve(a.flags.out || path.join(path.dirname(dir), `${p.manifest.id}-${p.manifest.version}.zip`));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, p.zip);
  if (a.flags.json) {
    console.log(JSON.stringify({ file: out, id: p.manifest.id, version: p.manifest.version, scope: p.manifest.scope,
      sha256: p.sha256, content_sha: p.contentSha, modset_line: p.modsetLine, files: p.files, bytes: p.zip.length }, null, 2));
    return 0;
  }
  console.log(`packed ${path.relative(process.cwd(), out)}  ${(p.zip.length / 1024).toFixed(1)} KB, ${p.files} files`);
  /* One hash, said in words. The ZIP's own SHA-256 and the line a visit
   * compares are for tools: --json has both. */
  console.log(`content hash  ${p.contentSha}`);
  console.log('              It names exactly these files. The mod list and the update check know the version by it.');
  return 0;
}

async function cmdDev(a) {
  const dir = dirOf(a);
  const why = notAModFolder(dir, 'dev');
  if (why) throw usage(why);
  const chosen = a.flags.port !== undefined;
  const port = chosen ? Number(a.flags.port) : DEFAULT_PORT;
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw usage(`--port must be a number from 0 to 65535, not ${JSON.stringify(String(a.flags.port))}.`);
  let dev;
  /* with no --port, a taken 2604 (often a playac-mod dev left running
   * in another window) moves to the next free port, up to 20 tries. */
  try {
    dev = await startDevFree(dir, { port, origins: a.flags.origin || [], lua: !a.flags['no-lua'], log: (s) => console.log(`[dev] ${s}`) }, chosen ? 1 : 20);
  } catch (e) {
    if (e.code === 'EADDRINUSE') throw new Error(`Port ${e.port ?? port} is already in use, maybe by another playac-mod dev. Stop it, or pick another with --port <n> and give the game that address.`);
    if (e.code === 'EACCES') throw new Error(`Port ${e.port ?? port} is not allowed here. Pick another with --port <n>.`);
    throw e;
  }
  const s = dev.state();
  console.log(`serving ${path.relative(process.cwd(), dir) || '.'} (${s.id || 'no id'} ${s.version}) at ${dev.url}`);
  for (const line of devSteps(dev.url, dev.port, chosen)) console.log(line);
  if (!s.ok) console.log(formatReport({ problems: s.problems, warnings: [] }));
  await new Promise((resolve) => {
    const stop = () => { dev.close().then(resolve); };
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
  });
  return 0;
}

/* What `dev` prints after "serving": how to load the folder in the game.
 * it said only "Open the game with ?moddev=1", and the game reads from
 * this computer only after the author presses Connect, so nothing loaded.
 * chosen: the author gave --port, so no port "was taken". */
export function devSteps(url, port, chosen) {
  const usual = port === DEFAULT_PORT;
  const out = [];
  if (!usual && !chosen) out.push(`NOTE: Port ${DEFAULT_PORT} was taken, maybe by another playac-mod dev, so this one is on ${port}.`);
  out.push(
    'To load it in the game:',
    '  1. Open the game with ?moddev=1, for example https://playaconline.com/play/?moddev=1',
    '  2. Go to Settings, Mods, Load a mod you are making.',
    usual
      ? `  3. Press Connect beside "playac-mod dev address". The box already holds ${url}.`
      : `  3. Put ${url} in "playac-mod dev address" and press Connect.`,
    '  4. Press Restart now once. After that, edits show as you save.',
    'Press Connect again after you reload the page. Ctrl+C stops.',
  );
  return out;
}

/* Where a types file came from, in words: the installed package's own copy
 * ("playac-mod 0.1.0"), else a path (setup dry run: a global install printed
 * "from ../../../../../../../../../../private/var/...", ten levels up). */
export function typesFrom(from, cwd = process.cwd()) {
  const inPkg = path.relative(PKG, from);
  if (!inPkg.startsWith('..') && !path.isAbsolute(inPkg)) return `playac-mod ${VERSION}`;
  const rel = path.relative(cwd, from);
  return rel.startsWith('..') ? from : rel;
}

async function cmdTypes(a) {
  const dir = dirOf(a);
  for (const w of writeTypes(dir)) console.log(`wrote ${w.file}  (from ${typesFrom(w.from)})`);
  /* a copied example has no .vscode/, so the types alone gave no completion */
  for (const file of writeEditorSettings(dir)) console.log(`wrote ${file}  (VS Code settings that point at .playac/)`);
  return 0;
}

async function cmdPublish(a) {
  const api = apiOf(a);
  if (a.flags.github) {
    if (a.flags.github === true) throw usage('--github needs <owner>/<repo>@<tag>, for example --github you/tea-house@v1.2.0');
    /* what the folder can show is wrong with the tag, before the sign-in. */
    const src = parseGitHubSource(String(a.flags.github));
    const dir = dirOf(a);
    const vcs = (args) => {
      const r = spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8', timeout: 20000 });
      return r.error ? null : r;
    };
    const pre = githubPreflight(dir, src, vcs);
    for (const n of pre.notes) console.log(`Note: ${n}`);
    if (fs.existsSync(path.join(dir, 'mod.json'))) {
      const r = await checkFolder(dir, { lua: !a.flags['no-lua'] });
      if (!r.ok) {
        console.error(formatReport(r));
        pre.problems.push('This folder does not pass check. A tag with the same files would be refused.');
      }
    }
    if (pre.problems.length) throw new Error(`Nothing was sent.\n  ${pre.problems.join('\n  ')}`);
    const b = await withToken(api, VERSION, (tok) => importGitHub(api, tok, String(a.flags.github)), {}, { noSave: !!a.flags['no-save'] });
    console.log(`Imported ${b.mod_id} ${b.version} from ${b.source || a.flags.github}. It is waiting for review.`);
    return 0;
  }
  const dir = dirOf(a);
  const p = await packed(dir, a, 'publish');
  /* the screenshots and the changelog line, checked before signing in. */
  const listing = listingFor(dir, p.manifest.version, { shots: a.flags.shot || [], changelog: a.flags.changelog || '' });
  const b = await withToken(api, VERSION, (tok) => upload(api, tok, p.zip, listing), {}, { noSave: !!a.flags['no-save'] });
  console.log(`Uploaded ${b.mod_id} ${b.version} with content hash ${p.contentSha}. It is waiting for review.`);
  return 0;
}

/* The folder's mod id, or '' (status --all, or no mod.json). */
function folderModId(dir) {
  try { return String(JSON.parse(fs.readFileSync(path.join(dir, 'mod.json'), 'utf8')).id || ''); } catch { return ''; }
}

async function cmdStatus(a) {
  const api = apiOf(a);
  const dir = dirOf(a);
  const id = a.flags.all ? '' : folderModId(dir);
  if (!id && !a.flags.all) throw usage('Run status in a mod\'s folder (one with mod.json), or use --all.');
  const list = await withToken(api, VERSION, (tok) => myVersions(api, tok), {}, { noSave: !!a.flags['no-save'] });
  for (const l of statusLines(list, id)) console.log(l);
  return 0;
}

async function yankOrList(a, yank) {
  const version = a._[0];
  if (!version) throw usage(`Usage: playac-mod ${yank ? 'yank' : 'unyank'} <version> [folder]${yank ? ' [--reason "<why>"]' : ''}`);
  const api = apiOf(a);
  const dir = path.resolve(a._[1] || '.');
  const id = folderModId(dir);
  if (!id) throw usage(`Run ${yank ? 'yank' : 'unyank'} in the mod's folder (one with mod.json), or name the folder after the version.`);
  const m = await withToken(api, VERSION, async (tok) => {
    const row = (await myVersions(api, tok)).find((v) => v.mod_id === id && v.version === version);
    if (!row) throw new Error(`You have no upload of ${id} ${version}. Run "playac-mod status" to list yours.`);
    return setYanked(api, tok, row.id, yank, a.flags.reason ? String(a.flags.reason) : '');
  }, {}, { noSave: !!a.flags['no-save'] });
  console.log(`${id} ${version}: ${stateWord(m.state || (yank ? 'yanked' : 'listed'))}`);
  return 0;
}

const cmdYank = (a) => yankOrList(a, true);
const cmdUnyank = (a) => yankOrList(a, false);

async function cmdLogout(a) {
  const api = apiOf(a);
  const tok = savedToken(api, 0);
  if (tok) await revoke(api, tok).catch(() => false);
  forgetToken(api);
  console.log('Signed out.');
  return 0;
}

const COMMANDS = { new: cmdNew, check: cmdCheck, pack: cmdPack, dev: cmdDev, types: cmdTypes, publish: cmdPublish,
  status: cmdStatus, yank: cmdYank, unyank: cmdUnyank, logout: cmdLogout };

/* The package's Node floor (package.json engines, ">=18.17"). npm only warns
 * about engines, and on Node 16 new and check seem to work while publish dies
 * on a missing fetch, so the tool says so up front (setup dry run). */
const NODE_MIN = String((JSON.parse(fs.readFileSync(path.join(PKG, 'package.json'), 'utf8')).engines || {}).node || '').replace(/^>=\s*/, '');
export function nodeTooOld(version = process.versions.node, min = NODE_MIN) {
  if (!min) return false;
  const [M, m = 0] = String(version).replace(/^v/, '').split('.').map(Number);
  const [wantM, wantm = 0] = min.split('.').map(Number);
  return M < wantM || (M === wantM && m < wantm);
}

/* The commands that end with the update notice, when there is one (update.mjs). */
const NOTICE_AFTER = new Set(['new', 'check', 'pack', 'types', 'status']);
async function sayUpdate(a) {
  if (a.flags.json) return;
  const n = await updateNotice(VERSION).catch(() => '');
  if (n) console.error(`\n${n}`);
}

export async function main(argv) {
  if (nodeTooOld()) {
    console.error(`playac-mod needs Node.js ${NODE_MIN} or newer, and this is ${process.version}. ` +
      'Install the current LTS (nvm install --lts, or https://nodejs.org), open a new terminal, and try again.');
    return 1;
  }
  let a;
  try { a = parseArgs(argv); } catch (e) { console.error(`playac-mod: ${e.message}`); return 2; }
  const cmd = a._.shift();
  if (cmd === 'help') {
    const topic = a._[0];
    if (!topic) { console.log(overview(VERSION)); return 0; }
    if (!commandHelp(topic)) { console.error(`Unknown command ${topic}. Run "playac-mod help" for the commands.`); return 2; }
    console.log(commandText(topic));
    return 0;
  }
  if (a.flags.help) { console.log(commandHelp(cmd) ? commandText(cmd) : overview(VERSION)); return 0; }
  if (a.flags.version || cmd === 'version') {
    console.log(versionLine(VERSION));
    await sayUpdate(a);
    return 0;
  }
  if (!cmd) { console.error(overview(VERSION)); return 2; }
  const run = COMMANDS[cmd];
  if (!run) { console.error(`Unknown command ${cmd}. Run "playac-mod help" for the commands.`); return 2; }
  if (cmd === 'new' && a.flags.kind && !KINDS.includes(a.flags.kind)) { console.error(`--kind must be one of ${KINDS.join(', ')}.`); return 2; }
  try {
    const code = await run(a);
    if (NOTICE_AFTER.has(cmd)) await sayUpdate(a);
    return code;
  } catch (e) {
    /* Node's fetch says only "fetch failed" when the server cannot be reached. */
    const msg = e.message === 'fetch failed' ? `Could not reach ${apiOf(a)}. Check your connection, or --api.` : e.message;
    console.error(`playac-mod ${cmd}: ${msg}`);
    return e.usage ? 2 : 1;
  }
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; });
}
