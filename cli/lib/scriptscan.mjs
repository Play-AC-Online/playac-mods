/* scriptscan.mjs - a best-effort read of a mod's main script against mod.json.
 *
 * The game page does not run Lua, so nothing here refuses a mod at install:
 * these say what the engine does when the script runs (the game engine api_on,
 * the game engine pc_mod_fx_queue). An on() the engine refuses raises an error,
 * which stops the whole script at load, and so does math.random or
 * math.randomseed where it is called (the sandbox has neither: rng() is the
 * seeded one), so those come back with `error: true` and check lists them as
 * problems; the rest are warnings. Only literal calls are seen:
 * on("event", ...), cmd.<name>(...) and math.random(...). Comments and strings
 * are skipped, so an example in a comment is not a call. */

/* Lua source with comments and string literals blanked (newlines kept, so
 * offsets and line numbers still match), and each string literal's value by
 * its start offset. */
export function stripLua(src) {
  const out = src.split('');
  const strings = new Map();
  const blank = (from, to) => { for (let k = from; k < to; k++) if (out[k] !== '\n') out[k] = ' '; };
  const longOpen = (at) => {
    /* "[", any "=", "[": returns the level, or -1 */
    if (src[at] !== '[') return -1;
    let k = at + 1;
    while (src[k] === '=') k++;
    return src[k] === '[' ? k - at - 1 : -1;
  };
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '-' && src[i + 1] === '-') {
      const lv = longOpen(i + 2);
      let end;
      if (lv >= 0) {
        const close = ']' + '='.repeat(lv) + ']';
        const j = src.indexOf(close, i + 4 + lv);
        end = j < 0 ? n : j + close.length;
      } else {
        const j = src.indexOf('\n', i);
        end = j < 0 ? n : j;
      }
      blank(i, end);
      i = end;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      let val = '';
      while (j < n && src[j] !== c && src[j] !== '\n') {
        if (src[j] === '\\' && j + 1 < n) { val += src[j + 1]; j += 2; continue; }
        val += src[j++];
      }
      const end = Math.min(j + 1, n);
      strings.set(i, val);
      blank(i, end);
      i = end;
      continue;
    }
    if (c === '[') {
      const lv = longOpen(i);
      if (lv >= 0) {
        const close = ']' + '='.repeat(lv) + ']';
        const start = i + 2 + lv;
        const j = src.indexOf(close, start);
        const end = j < 0 ? n : j + close.length;
        strings.set(i, src.slice(start, j < 0 ? n : j).replace(/^\n/, ''));
        blank(i, end);
        i = end;
        continue;
      }
    }
    i++;
  }
  return { code: out.join(''), strings };
}

/* The first offset from i that is not white space in the real source (a
 * blanked string is spaces in the stripped code, so skip in src). */
function skipSpace(src, i) {
  while (i < src.length && /\s/.test(src[i])) i++;
  return i;
}

function lineAt(src, offset) {
  let line = 1;
  for (let k = 0; k < offset; k++) if (src.charCodeAt(k) === 10) line++;
  return line;
}

/* src: the script's text. ctx: { listed: [mod.json scripts.events],
 * permissions: [], events: [every event the game has], commands: [every
 * command] }. Returns [{ line, message, error? }], one per name, at its first
 * use. */
export function scanScript(src, ctx) {
  const { code, strings } = stripLua(src);
  const warnings = [];
  const said = new Set();
  const once = (key, offset, message, error = false) => {
    if (said.has(key)) return;
    said.add(key);
    warnings.push({ line: lineAt(src, offset), message, ...(error ? { error: true } : {}) });
  };
  const listed = ctx.listed || [];
  const perms = ctx.permissions || [];

  /* on("event", ...): a global call, not x.on or x:on */
  const ON_RE = /(^|[^\w.:])on\s*\(/g;
  for (let m; (m = ON_RE.exec(code));) {
    const at = skipSpace(src, m.index + m[0].length);
    if (!strings.has(at)) continue;
    const ev = strings.get(at);
    const callAt = m.index + m[1].length;
    if (!ctx.events.includes(ev)) {
      once(`on:${ev}`, callAt, `line ${lineAt(src, callAt)}: on(${JSON.stringify(ev)}) names no event the game has. The game stops your script when it loads and none of it runs. Its error is: on(): unknown event '${ev}'. The events are ${ctx.events.join(', ')}.`, true);
    } else if (!listed.includes(ev)) {
      once(`on:${ev}`, callAt, `line ${lineAt(src, callAt)}: on(${JSON.stringify(ev)}) is used, but "${ev}" is not in "scripts.events" in mod.json. The game stops your script when it loads and none of it runs. Its error is: on(): '${ev}' is not in this mod's "scripts.events" list in mod.json. Add "${ev}" to "scripts.events".`, true);
    }
    /* Every handler gets ONE table. A handler written with two or more
     * parameters reads nil for the rest: say so (a warning, the script runs). */
    const comma = code.indexOf(',', at);
    const fn = comma < 0 ? null : /^\s*function\s*\(([^)]*)\)/.exec(code.slice(comma + 1));
    if (fn && fn[1].split(',').filter((p) => p.trim() && p.trim() !== '...').length > 1) {
      once(`arity:${ev}`, callAt, `line ${lineAt(src, callAt)}: the on(${JSON.stringify(ev)}) handler takes (${fn[1].trim()}), but every handler gets one table. Write function(e) and read its fields, like e.villager.`);
    }
  }

  /* math.random / math.randomseed: not in the sandbox. Each raises where it
   * is called, which stops the script (the game engine). rng() is the seeded one. */
  const RANDOM_RE = /(^|[^\w.:])math\s*\.\s*(random|randomseed)\b/g;
  for (let m; (m = RANDOM_RE.exec(code));) {
    const at = m.index + m[1].length;
    once(`math:${m[2]}`, at, `line ${lineAt(src, at)}: math.${m[2]} is not available: use rng() (seeded, so a reload cannot reroll). The game stops your script where it calls math.${m[2]}.`, true);
  }

  /* cmd.<name>( / cmd.<name>{ / cmd.<name>"..." */
  const CMD_RE = /(^|[^\w.:])cmd\s*\.\s*([A-Za-z_]\w*)/g;
  for (let m; (m = CMD_RE.exec(code));) {
    const next = skipSpace(src, m.index + m[0].length);
    if (code[next] !== '(' && code[next] !== '{' && !strings.has(next)) continue;
    const name = m[2];
    const at = m.index + m[1].length;
    const where = `line ${lineAt(src, at)}: cmd.${name}`;
    /* the game engine queue(): nil, why, the code, and the log line "<event>: cmd.<name> refused: <why>" */
    const refused = `Each call returns nil, the reason and the code command-permission. It logs: cmd.${name} refused: ${name} is not in this mod's "permissions" in mod.json`;
    if (!ctx.commands.includes(name)) {
      once(`cmd:${name}`, at, `${where} is not a command, so calling it stops that handler with an error. The commands are ${ctx.commands.join(', ')}.`);
    } else if (!perms.includes(name)) {
      once(`cmd:${name}`, at, `${where}: "${name}" is not in "permissions" in mod.json, so the game refuses every call. ${refused}`);
    }
  }
  return warnings.sort((a, b) => a.line - b.line);
}
