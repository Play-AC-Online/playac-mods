/* types.mjs - `playac-mod types`: editor types and schemas.
 *
 * Writes into <mod>/.playac/:
 *   playac.lua                  LuaLS annotations of the script API
 *   schemas/mod.schema.json     mod.json
 *   schemas/shops.schema.json   shops.json
 *   schemas/messages.schema.json  messages files
 *
 * Source, first that has playac.lua:
 *   1. $PLAYAC_API_DIR
 *   2. the game's source's generated outputs of api/api.json (the API
 *      spine): api/, then api/
 *   3. vendor/api (copied there by the game's build for the npm package)
 *   4. fallback/ in this package (the same files, written by api-gen)
 * Each file falls back on its own.
 *
 * then, for a mod with "depends" or "optional_depends", each dependency's mod.json "exports"
 * (a library's remote functions, one line each) is appended to the copied
 * .playac/playac.lua as remote.call hints: the editor offers the library's
 * function names with their descriptions. A dependency is found in a folder
 * beside this one (any sibling whose mod.json has that id), or in a folder
 * or mod.json listed in $PLAYAC_LIBS (separated like PATH). */
import fs from 'node:fs';
import path from 'node:path';
import { PKG, VENDOR } from './contract.mjs';
import { CHECKOUT } from './checkout.mjs';
import { TYPES_DIR, editorFiles } from './scaffold.mjs';

export const TYPE_FILES = [
  'playac.lua',
  'schemas/mod.schema.json',
  'schemas/shops.schema.json',
  'schemas/messages.schema.json',
  'schemas/mod-items.schema.json',
  'schemas/letters.schema.json',
  'schemas/calendar.schema.json',
  'schemas/talk.schema.json',
  'schemas/translations.schema.json',
];

export function typeSources() {
  const list = [];
  if (process.env.PLAYAC_API_DIR) list.push(path.resolve(process.env.PLAYAC_API_DIR));
  list.push(...(CHECKOUT ? CHECKOUT.api : []), path.join(VENDOR, 'api'));
  list.push(path.join(PKG, 'fallback'));
  return list;
}

/* The source of one file: generated outputs may sit flat or under schemas/. */
export function findTypeFile(rel) {
  for (const dir of typeSources()) {
    for (const cand of [rel, path.basename(rel)]) {
      const abs = path.join(dir, cand);
      if (fs.existsSync(abs)) return abs;
    }
  }
  return null;
}

const EXPORT_NAME = /^[a-z0-9_]{1,32}$/;

function readManifest(file) {
  try {
    const m = JSON.parse(fs.readFileSync(file, 'utf8'));
    return m && typeof m === 'object' && !Array.isArray(m) ? m : null;
  } catch (_) { return null; }
}

/* The exports a library declares, when they follow the rules (the game's own,
 * mods.js exportRules): { name: description } or null. */
export function exportsOf(manifest) {
  const x = manifest && manifest.exports;
  if (!x || typeof x !== 'object' || Array.isArray(x) || Object.keys(x).length > 32) return null;
  for (const [k, d] of Object.entries(x)) {
    if (!EXPORT_NAME.test(k) || typeof d !== 'string' || ![...d].length || [...d].length > 120 || /[\u0000-\u001f\u007f]/.test(d)) return null;
  }
  return x;
}

/* The mod.json of each mod `manifest` names in "depends" or "optional_depends"
 * that can be found: { id: { manifest, from } }. */
export function findLibraries(dir, manifest, env = process.env) {
  /* the mods it only uses when they are there count too: their functions are called the same way */
  const ids = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? Object.keys(o) : []);
  const want = manifest ? [...new Set([...ids(manifest.depends), ...ids(manifest.optional_depends)])] : [];
  const found = {};
  if (!want.length) return found;
  const cands = [];
  for (const p of String(env.PLAYAC_LIBS || '').split(path.delimiter).filter(Boolean)) {
    const abs = path.resolve(p);
    cands.push(abs.endsWith('.json') ? abs : path.join(abs, 'mod.json'));
  }
  const parent = path.dirname(path.resolve(dir));
  let sibs = [];
  try { sibs = fs.readdirSync(parent, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort(); } catch (_) { sibs = []; }
  for (const name of sibs) {
    const abs = path.join(parent, name);
    if (abs !== path.resolve(dir)) cands.push(path.join(abs, 'mod.json'));
  }
  for (const file of cands) {
    const m = readManifest(file);
    if (m && typeof m.id === 'string' && want.includes(m.id) && !found[m.id]) found[m.id] = { manifest: m, from: path.dirname(file) };
  }
  return found;
}

/* LuaLS hints for remote.call, one overload per library with exports: its
 * names (and descriptions) offered for "name". '' when there are none. */
export function exportHints(libs) {
  const out = [];
  for (const id of Object.keys(libs).sort()) {
    const x = exportsOf(libs[id].manifest);
    if (!x || !Object.keys(x).length) continue;
    const alias = 'PlayacExports_' + id.replace(/[^A-Za-z0-9_]/g, '_');
    out.push('', `---@alias ${alias}`);
    for (const k of Object.keys(x).sort()) out.push(`---| "${k}" # ${x[k].trim()}`);
    out.push('', `---Calls a function ${id} offers (its mod.json "exports"). Its errors come back as yours.`);
    for (const k of Object.keys(x).sort()) out.push(`--- - \`${k}\`: ${x[k].trim()}`);
    out.push(`---@param mod "${id}"`, `---@param name ${alias}`, '---@param ... any Copied arguments.', '---@return any', 'function remote.call(mod, name, ...) end');
  }
  if (!out.length) return '';
  return ['', '-- Remote functions of the mods this one depends on, from their mod.json "exports".',
    '-- Written by playac-mod types: run it again after a library changes.', ...out, ''].join('\n');
}

/* The place a generated file goes, made safe to write: dir/<parts>. A mod
 * folder is often someone else's repository, cloned, and `types` is the first
 * thing run in it. .playac is gitignored by our scaffold but a repository
 * can commit it, as a link: .playac/playac.lua -> ~/.ssh/authorized_keys had
 * its target overwritten with the Lua stub. So no folder on the way may be a
 * link (refused: the files would land outside the mod), and a link where the
 * file goes is removed first, never followed. */
function safeTarget(dir, parts) {
  fs.mkdirSync(dir, { recursive: true });
  let at = dir;
  for (const part of parts.slice(0, -1)) {
    at = path.join(at, part);
    const st = fs.lstatSync(at, { throwIfNoEntry: false });
    if (st && st.isSymbolicLink()) throw new Error(`${path.relative(dir, at)} is a link to somewhere else, so the types were not written there. Delete it and run the same line again.`);
    if (st && !st.isDirectory()) throw new Error(`${path.relative(dir, at)} is not a folder. Delete it and run the same line again.`);
    if (!st) fs.mkdirSync(at);
  }
  const to = path.join(at, parts[parts.length - 1]);
  const st = fs.lstatSync(to, { throwIfNoEntry: false });
  if (st && st.isSymbolicLink()) fs.unlinkSync(to);
  else if (st && !st.isFile()) throw new Error(`${path.relative(dir, to)} is not a file. Delete it and run the same line again.`);
  return to;
}

/* The VS Code settings `new` writes, for a folder that has none: a
 * copied example, or a mod made by hand. A file that is there is the
 * author's and is never written over. .gitignore is left alone. Returns the
 * paths written. */
export function writeEditorSettings(dir) {
  const out = [];
  for (const [rel, body] of Object.entries(editorFiles())) {
    if (!rel.startsWith('.vscode/')) continue;
    if (fs.lstatSync(path.join(dir, ...rel.split('/')), { throwIfNoEntry: false })) continue;
    fs.writeFileSync(safeTarget(dir, rel.split('/')), body);
    out.push(rel);
  }
  return out;
}

/* Write the types into dir/.playac. Returns [{file, from}]. */
export function writeTypes(dir) {
  const out = [];
  for (const rel of TYPE_FILES) {
    const from = findTypeFile(rel);
    if (!from) throw new Error(`no source for ${rel}`);
    const to = safeTarget(dir, [TYPES_DIR, ...rel.split('/')]);
    /* written whole, never copied over: copyFileSync follows a link at "to" */
    fs.writeFileSync(to, fs.readFileSync(from), { flag: 'w' });
    out.push({ file: path.posix.join(TYPES_DIR, rel), from });
  }
  /* the dependencies' exports, after the API's own types */
  const manifest = readManifest(path.join(dir, 'mod.json'));
  const libs = findLibraries(dir, manifest);
  const hints = exportHints(libs);
  if (hints) {
    fs.appendFileSync(path.join(dir, TYPES_DIR, 'playac.lua'), hints);
    for (const id of Object.keys(libs).sort()) {
      if (exportsOf(libs[id].manifest)) out.push({ file: path.posix.join(TYPES_DIR, 'playac.lua') + ` (remote.call hints for ${id})`, from: libs[id].from });
    }
  }
  return out;
}
