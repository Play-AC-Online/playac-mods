// @ts-nocheck: plain JS the frontend imports (svelte-check reads .mjs it imports)
/* help.mjs - every command, its arguments and its options, as data.
 *
 * ONE list feeds three readers, so they cannot disagree: `playac-mod help` and
 * `playac-mod <command> --help` (formatted below), the option parser (an option
 * that is not listed here for the command is refused by name), and the
 * command reference page on the docs site, which renders this list.
 *
 * Pure data and string functions: no Node imports, so a web page can import it.
 *
 * An option is [flag, what]. "--kind <kind>" takes a value, "--force" does not.
 * A flag ending in "..." may be given more than once. */

export const DOCS_URL = 'https://playaconline.com/modding/';
export const CLI_DOCS_URL = 'https://playaconline.com/modding/cli/';
export const ERRORS_URL = 'https://playaconline.com/modding/errors/';

/* Options every command takes. */
export const GLOBAL_OPTIONS = [
  ['--help', 'Show this command\'s options. Short form: -h.'],
  ['--version', 'Print the tool\'s version. Short form: -v.'],
];

const NO_LUA = ['--no-lua', 'Skip the Lua syntax check.'];
const API = ['--api <url>', 'Use another address for the site\'s API. For testing the tool itself.'];
const NO_SAVE = ['--no-save', 'Keep the sign-in for this run only. Nothing is written to disk.'];

export const COMMANDS = [
  {
    name: 'new',
    usage: 'playac-mod new <id> [options]',
    summary: 'Make a new mod folder.',
    about: [
      'Writes a mod that installs and does something as it is, so you start from a working mod.',
      'The folder also gets editor settings, the game\'s script types and instructions for AI assistants.',
    ],
    args: [['<id>', 'The mod\'s id, like yourname.mod-name. Lowercase letters, digits and dashes, with one dot.']],
    options: [
      ['--kind <kind>', 'What the mod starts as: texture, lines, shop or script. Default: lines.'],
      ['--dir <folder>', 'Where to make it. Default: a folder named after the id.'],
      ['--name <name>', 'The name players see. Default: made from the id.'],
      ['--author <name>', 'Your name as the author. Default: the first part of the id.'],
      ['--github', 'Add what a GitHub repository needs: a check workflow and CHANGELOG.md. Needs to be online: it reads the playac-mod release the workflow pins from playaconline.com, and writes nothing when it cannot.'],
      ['--no-ai', 'Leave out the instructions for AI assistants.'],
      ['--force', 'Write over files that are already there.'],
    ],
    examples: ['playac-mod new yourname.my-mod', 'playac-mod new yourname.fresh-grass --kind texture --github'],
  },
  {
    name: 'check',
    usage: 'playac-mod check [folder | file.zip] [options]',
    summary: 'List every problem the game would find.',
    about: [
      'Applies every rule the game applies and lists the problems per file.',
      'Lua syntax is checked by the game\'s own parser, which is built into the tool.',
      'A .zip is checked the way the game reads it.',
    ],
    args: [['[folder | file.zip]', 'A mod\'s folder or a mod ZIP. Default: the current folder.']],
    options: [
      ['--verbose', 'Also list the files that pack leaves out, and why.'],
      ['--json', 'Print the result as JSON.'],
      NO_LUA,
    ],
    examples: ['playac-mod check', 'playac-mod check ../yourname.my-mod-1.0.0.zip'],
  },
  {
    name: 'pack',
    usage: 'playac-mod pack [folder] [options]',
    summary: 'Write the mod\'s ZIP.',
    about: [
      'Checks the mod, then writes <id>-<version>.zip beside the folder, never inside it.',
      'The same files always give the same ZIP. It also prints the content hash, which names exactly these files.',
    ],
    args: [['[folder]', 'The mod\'s folder. Default: the current folder.']],
    options: [
      ['--out <file.zip>', 'Write the ZIP here instead.'],
      ['--json', 'Print the result as JSON.'],
      NO_LUA,
    ],
    examples: ['playac-mod pack'],
  },
  {
    name: 'dev',
    usage: 'playac-mod dev [folder] [options]',
    summary: 'Serve the folder to the game and reload on edits.',
    about: [
      'Leave it running. Open the game with ?moddev=1 on the address, then go to Settings, Mods, Load a mod you are making.',
      'Press Connect beside "playac-mod dev address", then Restart now once. After that, edits show as you save.',
      'The game reads from this computer only after you press Connect. Press it again after you reload the page.',
      'It listens on this computer only. Ctrl+C stops it.',
    ],
    args: [['[folder]', 'The mod\'s folder. Default: the current folder.']],
    options: [
      ['--port <number>', 'The port to listen on. Default: 2604, or the next free one.'],
      ['--origin <url>...', 'Also allow a game page at this address. Only needed for a copy of the game on another address.'],
      NO_LUA,
    ],
    examples: ['playac-mod dev'],
  },
  {
    name: 'types',
    usage: 'playac-mod types [folder]',
    summary: 'Refresh the editor types in .playac/.',
    about: [
      'Writes the game\'s script types and the JSON schemas your editor reads. Run it again after you update the tool.',
      'It also writes the VS Code settings in .vscode/ when the folder has none. Settings that are there are left as they are.',
    ],
    args: [['[folder]', 'The mod\'s folder. Default: the current folder.']],
    options: [],
    examples: ['playac-mod types'],
  },
  {
    name: 'publish',
    usage: 'playac-mod publish [folder] [options]',
    summary: 'Upload a version for review.',
    about: [
      'Before you run it you need three things.',
      '  1. An account on playaconline.com with two-factor sign-in switched on. Set it up on your Profile page.',
      '  2. One to four screenshots of the mod in the game, PNG or JPEG, in .playac/screenshots/.',
      '  3. One line that says what this version changes. Put it in a "## <version>" section of CHANGELOG.md, or in .playac/changelog.txt.',
      'It then asks you to approve a code in your browser. The sign-in lasts an hour.',
    ],
    args: [['[folder]', 'The mod\'s folder. Default: the current folder.']],
    options: [
      ['--shot <file>...', 'A screenshot to send, instead of the ones in .playac/screenshots/. Up to four.'],
      ['--changelog <line>', 'What this version changes, instead of CHANGELOG.md.'],
      ['--github <owner>/<repo>@<tag>', 'Have the site fetch this tag from GitHub instead of uploading the folder. The tag is checked first.'],
      NO_LUA,
      NO_SAVE,
      API,
    ],
    examples: ['playac-mod publish', 'playac-mod publish --github you/my-mod@v1.0.0'],
  },
  {
    name: 'status',
    usage: 'playac-mod status [folder] [options]',
    summary: 'Show your uploaded versions and their state.',
    about: ['Lists every version of this mod you uploaded, with what happened to it.'],
    args: [['[folder]', 'The mod\'s folder. Default: the current folder.']],
    options: [['--all', 'Every mod of yours, not only this one.'], NO_SAVE, API],
    examples: ['playac-mod status', 'playac-mod status --all'],
  },
  {
    name: 'yank',
    usage: 'playac-mod yank <version> [folder] [options]',
    summary: 'Withdraw a listed version from the mod list.',
    about: ['Withdraws one listed version of this mod. Players who have it are told.'],
    args: [['<version>', 'The version to withdraw, like 1.2.0.'], ['[folder]', 'The mod\'s folder. Default: the current folder.']],
    options: [['--reason <why>', 'A line shown on the mod\'s page in the mod list.'], NO_SAVE, API],
    examples: ['playac-mod yank 1.2.0 --reason "The shop sold nothing"'],
  },
  {
    name: 'unyank',
    usage: 'playac-mod unyank <version> [folder] [options]',
    summary: 'List a withdrawn version again.',
    about: ['Lists a version again after you withdrew it with yank.'],
    args: [['<version>', 'The version to list again.'], ['[folder]', 'The mod\'s folder. Default: the current folder.']],
    options: [NO_SAVE, API],
    examples: ['playac-mod unyank 1.2.0'],
  },
  {
    name: 'logout',
    usage: 'playac-mod logout [options]',
    summary: 'Forget the saved sign-in.',
    about: ['Ends the saved sign-in on the site and deletes it from this computer.'],
    args: [],
    options: [API],
    examples: ['playac-mod logout'],
  },
];

export const EXIT_CODES = [
  ['0', 'It worked.'],
  ['1', 'It ran and failed. The mod has problems, or the site refused the request.'],
  ['2', 'The command line was wrong. A command or option is unknown, or a value is missing.'],
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
  return `playac-mod ${version}: make mods for Play AC Online

Usage: playac-mod <command> [options]

${rows([...COMMANDS.map((c) => [c.usage.replace(/^playac-mod /, '').replace(/ \[options\]$/, ''), c.summary]),
    ['help [command]', 'Show this text, or one command\'s options.'],
    ['version', 'Print the tool\'s version.']])}

Run "playac-mod <command> --help" for a command's options.
The folder defaults to the current one.

Docs:    ${CLI_DOCS_URL}
Errors:  ${ERRORS_URL}
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
  parts.push(`Docs: ${CLI_DOCS_URL}#${c.name}`);
  return `${parts.join('\n\n')}\n`;
}
