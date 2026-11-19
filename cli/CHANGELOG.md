# playac-mod changelog

Every release of the tool, newest first. `playac-mod --version` prints the
version and the build you have.

A version is MAJOR.MINOR.PATCH. The middle number goes up when the rules, the
API level or a command changes. The last number goes up for fixes. A release
never changes after it is listed.

## 0.2.0

- Removed `new`, `types`, `publish`, `status`, `yank`, `unyank` and `logout`,
  and the sign-in they used. Start a mod from an example repository or a
  starter kit. Share it from the website, by upload or "Import from GitHub".
  The editor types are `api/playac.lua` in the public mods repository.
- The help and the messages are shorter. The tool no longer checks for a
  newer release.
- The tool's releases are files of GitHub releases of the playac-mods
  repository.
- `check` refuses `content.translations`, and a `content.messages` that
  names a folder. Translations were dropped before release: every text shows
  as written, and `messages` names one file.
- `check` reads `optional_depends`.
- `check` reads a setting's `scope`. It warns when a script reads a client
  setting and also sends a letter, gives an item or takes an item or Bells,
  which the game refuses in the same event.
- `check` refuses a setting's label or description with a character a reader cannot see: a control character (a description
  may break lines), a zero width or text-direction character, or a blank
  filler. The game and the site refuse it too.
- `check` refuses a `.lua` or `.json` file with a carriage return that no
  line feed follows, as the game and the site do (`file-lone-cr`). Save with
  LF or CRLF line endings.
- `check` refuses an unknown key in a calendar day's `date`, as the site
  does. Only `month`, `day`, `week` and `weekday` are read there.
- `check` knows the `timer_fired` event and the `take_item` and `take_bells`
  permissions. It warns when a script calls `timer.after` and `timer_fired`
  is not in `scripts.events`, because the game refuses every such call.
- `dev` prints the steps that load the folder in the game: open the game with
  `?moddev=1`, go to Settings, Mods, press Connect, then Restart now once.
  Before, it left out Connect, and nothing loaded.
- `check` says an unknown `cmd.` name stops the script for the session.
  Before, it said only the handler stopped.
- `check` reads a script's line ends and string escapes the way Lua does.
  A carriage return on its own ends a comment, so the code after it is read.
  `on("d\97y_started")` is read as `day_started`. Before, the first hid
  code from `check` and the second failed a script that works.
- `check` no longer calls `math.random or rng` a problem. Reading the name
  stops nothing. Only a call does.
- `check` leaves a field named `on` alone when there are spaces around the
  dot, and says nothing about `on` in a script that defines its own.
- `check` no longer stops with one line about an ArrayBuffer when
  `scripts.main` is `toString` or another name every object has. It lists
  the problems.
- `playac-mod <command> --help` shows that command's options, one per line.
  `playac-mod help` lists the commands.
- An option the command does not have is refused by name. Before, the next
  word was taken as its value.
- `check` refuses a `renames` entry whose old id is not this mod's own, as the
  game and the site do. A rename moves your own old item ids only.
- `check` refuses a JSON file that is not UTF-8 text, as the game and the
  site do. Before, it was a warning.
- `--version` prints the build as well as the version.
- `pack` prints one hash, the content hash. The ZIP's own SHA-256 is in
  `pack --json`.
- The tool reads the game's rules only from its own folder. It no longer
  looks in the folders above it.
- The package carries its licence and this changelog.
