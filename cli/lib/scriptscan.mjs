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
 * are skipped, so an example in a comment is not a call.
 *
 * It is a pattern read, not a parser, so it can be wrong. Nothing depends on
 * it: the engine enforces events and permissions when the script runs. So a
 * guess from here never stops `pack`: check.mjs marks
 * each problem that came from this file with `scan: true`. */

/* The value of one backslash escape in a short string, as Lua 5.4 reads it
 * (llex.c read_string): at is the offset of the backslash. Returns the text
 * it stands for and the offset after it. The scan used to drop the backslash
 * and keep the next character, so on("d\97y_started") read as "d97y_started"
 * and check called a working script broken. */
function luaEscape(src, at) {
  const c = src[at + 1];
  const simple = { n: '\n', t: '\t', r: '\r', a: '\x07', b: '\b', f: '\f', v: '\v', '\\': '\\', '"': '"', "'": "'" };
  if (c in simple) return [simple[c], at + 2];
  if (c === '\n' || c === '\r') {
    /* a backslash before a line end is that line end; \r\n and \n\r are one */
    const two = (src[at + 2] === '\n' || src[at + 2] === '\r') && src[at + 2] !== c;
    return ['\n', at + (two ? 3 : 2)];
  }
  if (c === 'x') {
    const h = /^[0-9a-fA-F]{2}/.exec(src.slice(at + 2, at + 4));
    return h ? [String.fromCharCode(parseInt(h[0], 16)), at + 4] : ['', at + 2];
  }
  if (c === 'z') {
    let k = at + 2;
    while (k < src.length && /\s/.test(src[k])) k++;
    return ['', k];
  }
  if (c === 'u' && src[at + 2] === '{') {
    const h = /^[0-9a-fA-F]+\}/.exec(src.slice(at + 3, at + 12));
    if (h) {
      const cp = parseInt(h[0], 16);
      return [cp <= 0x10ffff ? String.fromCodePoint(cp) : '', at + 3 + h[0].length];
    }
    return ['', at + 2];
  }
  const d = /^[0-9]{1,3}/.exec(src.slice(at + 1, at + 4));
  if (d) return [String.fromCharCode(parseInt(d[0], 10) & 255), at + 1 + d[0].length];
  return [c === undefined ? '' : c, at + 2];
}

/* Lua ends a line at \n or at \r (llex.c currIsNewline). */
const isLineEnd = (ch) => ch === '\n' || ch === '\r';

/* Lua source with comments and string literals blanked (line ends kept, so
 * offsets and line numbers still match), and each string literal's value by
 * its start offset. */
export function stripLua(src) {
  const out = src.split('');
  const strings = new Map();
  const blank = (from, to) => { for (let k = from; k < to; k++) if (!isLineEnd(out[k])) out[k] = ' '; };
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
        /* A line comment ends where Lua ends the line: at \n OR at \r alone
         *. Reading on to the \n hid the code after a lone \r from
         * this scan, as it hid it from the reviewer. */
        let j = i;
        while (j < n && !isLineEnd(src[j])) j++;
        end = j;
      }
      blank(i, end);
      i = end;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      let val = '';
      while (j < n && src[j] !== c && !isLineEnd(src[j])) {
        if (src[j] === '\\' && j + 1 < n) {
          const [text, next] = luaEscape(src, j);
          val += text;
          j = next;
          continue;
        }
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

/* The line of an offset, counted as Lua counts lines: \n, \r, \r\n and \n\r
 * are each one line end (llex.c inclinenumber). */
function lineAt(src, offset) {
  let line = 1;
  for (let k = 0; k < offset; k++) {
    const c = src[k];
    if (!isLineEnd(c)) continue;
    line++;
    if (k + 1 < offset && isLineEnd(src[k + 1]) && src[k + 1] !== c) k++;
  }
  return line;
}

/* Is the name at this offset a field or a method, as in M.on, M . on or
 * M:on? The patterns below refuse a "." or ":" right before the name. Lua
 * allows white space there, so look back over it. */
function isMember(code, at) {
  let k = at - 1;
  while (k >= 0 && /\s/.test(code[k])) k--;
  if (k < 0) return false;
  if (code[k] === ':') return code[k - 1] !== ':'; /* "::" ends a label */
  return code[k] === '.' && code[k - 1] !== '.'; /* ".." joins two values */
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

  /* on("event", ...): a global call, not x.on or x:on. A script that makes
   * its own on (local on = ..., function on(...)) is not calling the game's,
   * so nothing is said about its calls. */
  const ownOn = /(^|[^\w.:])(local\s+(function\s+)?on\b|function\s+on\s*\()/.test(code);
  const ON_RE = /(^|[^\w.:])on\s*\(/g;
  for (let m; !ownOn && (m = ON_RE.exec(code));) {
    if (isMember(code, m.index + m[1].length)) continue;
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
   * is CALLED, which stops the script (the game engine). rng() is the seeded one.
   * Reading the name gives nil and stops nothing, so `math.random or rng` is
   * left alone: only a call is a problem. */
  const RANDOM_RE = /(^|[^\w.:])math\s*\.\s*(random|randomseed)\b/g;
  for (let m; (m = RANDOM_RE.exec(code));) {
    if (isMember(code, m.index + m[1].length)) continue;
    const next = skipSpace(src, m.index + m[0].length);
    if (code[next] !== '(' && code[next] !== '{' && !strings.has(next)) continue;
    const at = m.index + m[1].length;
    once(`math:${m[2]}`, at, `line ${lineAt(src, at)}: math.${m[2]} is not available: use rng() (seeded, so a reload cannot reroll). The game stops your script where it calls math.${m[2]}.`, true);
  }

  /* cmd.<name>( / cmd.<name>{ / cmd.<name>"..." */
  const CMD_RE = /(^|[^\w.:])cmd\s*\.\s*([A-Za-z_]\w*)/g;
  for (let m; (m = CMD_RE.exec(code));) {
    if (isMember(code, m.index + m[1].length)) continue;
    const next = skipSpace(src, m.index + m[0].length);
    if (code[next] !== '(' && code[next] !== '{' && !strings.has(next)) continue;
    const name = m[2];
    const at = m.index + m[1].length;
    const where = `line ${lineAt(src, at)}: cmd.${name}`;
    /* the game engine queue(): nil, why, the code, and the log line "<event>: cmd.<name> refused: <why>" */
    const refused = `Each call returns nil, the reason and the code command-permission. It logs: cmd.${name} refused: ${name} is not in this mod's "permissions" in mod.json`;
    if (!ctx.commands.includes(name)) {
      once(`cmd:${name}`, at, `${where} is not a command, so calling it raises an error and the script stops for the session. The commands are ${ctx.commands.join(', ')}.`);
    } else if (!perms.includes(name)) {
      once(`cmd:${name}`, at, `${where}: "${name}" is not in "permissions" in mod.json, so the game refuses every call. ${refused}`);
    }
  }

  /* timer.after(: the engine refuses it for a script with no
   * timer_fired handler (the game engine api_timer_after), and on() needs the
   * event listed, so a script that sets timers must list timer_fired. */
  const TIMER_RE = /(^|[^\w.:])timer\s*\.\s*after\s*\(/g;
  for (let m; (m = TIMER_RE.exec(code));) {
    if (isMember(code, m.index + m[1].length)) continue;
    const at = m.index + m[1].length;
    if (ctx.events.includes('timer_fired') && !listed.includes('timer_fired')) {
      once('timer:after', at, `line ${lineAt(src, at)}: timer.after is used, but "timer_fired" is not in "scripts.events" in mod.json, so the game refuses every call. Each call returns nil, the reason and the code timer-args. Add "timer_fired" to "scripts.events" and on("timer_fired", ...) to the script.`);
    }
  }

  /* a client setting may decide only what its own player sees. In an
   * event that read one, the game refuses a command that changes the town
   * (the game engine queue_cmd, code command-client-setting). The scan cannot
   * tell which event a line runs in, so it warns when the script reads a
   * client setting AND calls such a command anywhere. */
  const client = ctx.clientSettings || [];
  if (client.length) {
    const TOWN = ['send_letter', 'give_item', 'take_item', 'take_bells'];
    let town = null;
    const TOWN_RE = /(^|[^\w.:])cmd\s*\.\s*(send_letter|give_item|take_item|take_bells)\b/g;
    for (let m; !town && (m = TOWN_RE.exec(code));) if (TOWN.includes(m[2]) && perms.includes(m[2])) town = m[2];
    const GET_RE = /(^|[^\w.:])settings\s*\.\s*get\s*\(/g;
    for (let m; town && (m = GET_RE.exec(code));) {
      const at = skipSpace(src, m.index + m[0].length);
      if (!strings.has(at) || !client.includes(strings.get(at))) continue;
      const name = strings.get(at);
      const callAt = m.index + m[1].length;
      once(`client:${name}`, callAt, `line ${lineAt(src, callAt)}: settings.get(${JSON.stringify(name)}) reads a client setting, and this script also calls cmd.${town}. In an event that read a client setting the game refuses cmd.send_letter, cmd.give_item, cmd.take_item and cmd.take_bells with the code command-client-setting, because a client setting may decide only what its own player sees. Read it in another event than the one that sends, gives or takes, or take "scope": "client" off the setting.`);
    }
  }
  return warnings.sort((a, b) => a.line - b.line);
}
