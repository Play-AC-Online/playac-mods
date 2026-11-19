// @ts-nocheck: plain JS the frontend imports (svelte-check reads .mjs it imports)
/* help.mjs - every command, its arguments and its options, as data.
 *
 * ONE list feeds the help text, the option parser (an option not listed for
 * the command is refused by name) and the command page on the docs site.
 * No Node imports, so a web page can import it.
 *
 * An option is [flag, what]. "--port <number>" takes a value, "--json" does
 * not. A flag ending in "..." may be given more than once. */

export const DOCS_URL = 'https://playaconline.com/modding/';
export const CLI_DOCS_URL = 'https://playaconline.com/modding/cli/';
export const ERRORS_URL = 'https://playaconline.com/modding/errors/';

export const GLOBAL_OPTIONS = [
  ['--help', 'Show the command\'s options. Short: -h.'],
  ['--version', 'Print the version. Short: -v.'],
];

const NO_LUA = ['--no-lua', 'Skip the Lua syntax check.'];
const JSON_OUT = ['--json', 'Print the result as JSON.'];
const FOLDER = ['[folder]', 'The mod\'s folder. Default: the current folder.'];

export const COMMANDS = [
  {
    name: 'check',
    usage: 'playac-mod check [folder | file.zip] [options]',
    summary: 'List every problem the game would find.',
    about: ['Applies the game\'s rules and lists problems per file. Lua syntax is checked by the game\'s own parser.'],
    args: [['[folder | file.zip]', 'A mod\'s folder or a mod ZIP. Default: the current folder.']],
    options: [['--verbose', 'Also list the files pack leaves out.'], JSON_OUT, NO_LUA],
    examples: ['playac-mod check', 'playac-mod check ../yourname.my-mod-1.0.0.zip'],
  },
  {
    name: 'pack',
    usage: 'playac-mod pack [folder] [options]',
    summary: 'Write the mod\'s ZIP.',
    about: ['Checks the mod, then writes <id>-<version>.zip beside the folder. The same files always give the same ZIP.'],
    args: [FOLDER],
    options: [['--out <file.zip>', 'Write the ZIP here instead.'], JSON_OUT, NO_LUA],
    examples: ['playac-mod pack'],
  },
  {
    name: 'dev',
    usage: 'playac-mod dev [folder] [options]',
    summary: 'Serve the folder to the game and reload on edits.',
    about: [
      'Open the game with ?moddev=1, go to Settings, Mods, Load a mod you are making, press Connect, then Restart now once.',
      'Listens on this computer only. Ctrl+C stops it.',
    ],
    args: [FOLDER],
    options: [
      ['--port <number>', 'Port to listen on. Default: 2604, or the next free one.'],
      ['--origin <url>...', 'Also allow a game page at this address.'],
      NO_LUA,
    ],
    examples: ['playac-mod dev'],
  },
];

export const EXIT_CODES = [
  ['0', 'It worked.'],
  ['1', 'The mod has problems.'],
  ['2', 'The command line was wrong.'],
];

export const commandHelp = (name) => COMMANDS.find((c) => c.name === name) || null;

const flagName = (flag) => flag.replace(/^--/, '').split(/[ .]/)[0];
const takesValue = (flag) => flag.includes('<');
const isMulti = (flag) => flag.includes('...');

/* What the parser needs for one command: { bool, value, multi } sets of names. */
export function optionSpec(name) {
  const spec = { bool: new Set(), value: new Set(), multi: new Set() };
  const cmd = commandHelp(name);
  for (const [flag] of [...GLOBAL_OPTIONS, ...(cmd ? cmd.options : [])]) {
    const n = flagName(flag);
    (takesValue(flag) ? spec.value : spec.bool).add(n);
    if (isMulti(flag)) spec.multi.add(n);
  }
  return spec;
}

function rows(pairs, indent = '  ') {
  const w = Math.max(...pairs.map(([a]) => a.length));
  return pairs.map(([a, b]) => `${indent}${a.padEnd(w)}  ${b}`).join('\n');
}

/* `playac-mod help`: one line per command. */
export function overview(version) {
  return `playac-mod ${version}

${rows([...COMMANDS.map((c) => [c.usage.replace(/^playac-mod /, '').replace(/ \[options\]$/, ''), c.summary]),
    ['help [command]', 'Show a command\'s options.'],
    ['version', 'Print the version.']])}

Docs: ${CLI_DOCS_URL}
`;
}

/* `playac-mod <command> --help`. */
export function commandText(name) {
  const c = commandHelp(name);
  if (!c) return null;
  const parts = [`Usage: ${c.usage}`, c.about.join('\n')];
  if (c.args.length) parts.push(`Arguments:\n${rows(c.args)}`);
  parts.push(`Options:\n${rows([...c.options, ...GLOBAL_OPTIONS])}`);
  if (c.examples.length) parts.push(`Examples:\n${c.examples.map((e) => `  ${e}`).join('\n')}`);
  return `${parts.join('\n\n')}\n`;
}
