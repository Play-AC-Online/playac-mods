# playac-mod changelog

Every release of the tool, newest first. `playac-mod --version` prints the
version and the build you have.

A version is MAJOR.MINOR.PATCH. The middle number goes up when the rules, the
API level or a command changes. The last number goes up for fixes. A release
never changes after it is listed.

## 0.2.0

- `check` reads a `content.translations` folder: each key must name a text
  the mod has, and each text follows the rule of the text it replaces. `types`
  writes `translations.schema.json`, and a new mod's editor settings map it to
  every file in `translations/`.
- `check` reads `optional_depends`, and `types` offers the functions of a mod
  named there as it does for `depends`.
- `check` reads a setting's `scope`. It warns when a script reads a client
  setting and also sends a letter, gives an item or takes an item or Bells,
  which the game refuses in the same event.
- `check` refuses a setting's label or description, or their translation,
  with a character a reader cannot see: a control character (a description
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
- `dev` sends a change when a file in the `content.translations` folder is
  saved, so the game reads the translations again. Before, it sent nothing,
  and the old text stayed until a restart.
- `dev` prints the steps that load the folder in the game: open the game with
  `?moddev=1`, go to Settings, Mods, press Connect, then Restart now once.
  Before, it left out Connect, and nothing loaded. With `--port`, it no longer
  says port 2604 was taken.
- `types` also writes the VS Code settings in `.vscode/` when the folder has
  none, so a copied example gets completion. Settings that are there stay.
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
- `pack` and `publish` go ahead when every problem `check` found came from
  reading the script's text. They print the problems and a warning. `check`
  still fails. A problem the game itself has still stops both.
- `check` no longer stops with one line about an ArrayBuffer when
  `scripts.main` is `toString` or another name every object has. It lists
  the problems.
- `new --github` needs the release list on playaconline.com to pin the
  check workflow. When it cannot read the list it stops and writes nothing.
  Run the same line again online, or leave out `--github`.
- `publish` holds a large JPEG screenshot to the site's exact rule. Over
  1920 by 1080 it is refused when it could be read as a progressive JPEG.
  Before, a few such files passed here and were refused by the site.
- `types` no longer writes through a link. If `.playac` or a folder in it
  is a link to somewhere else, `types` stops and names it. A link where a
  types file goes is replaced by the real file.
- The tool reads the game's rules only from its own folder. It no longer
  looks in the folders above it.
- `playac-mod <command> --help` shows that command's options, one per line.
  `playac-mod help` lists the commands.
- An option the command does not have is refused by name. Before, the next
  word was taken as its value.
- `check`, `pack`, `dev` and `publish` say so when the folder is not a mod.
- `publish` checks more of a screenshot before it signs you in: at most a 4K
  screen of pixels (3840 by 2160), no 16 bit PNG, and no progressive JPEG
  larger than 1920 by 1080. The site refuses those, so now the tool says so
  first.
- `check` refuses a `renames` entry whose old id is not this mod's own, as the
  game and the site do. A rename moves your own old item ids only.
- `check` refuses a JSON file that is not UTF-8 text, as the game and the
  site do. Before, it was a warning.
- `--version` prints the build as well as the version.
- The tool says when a newer release is out. It reads the release list at
  most once a day and sends nothing about you or your mod. Set
  `PLAYAC_NO_UPDATE_CHECK=1` to switch this off.
- `publish` says what sharing needs when there is no screenshot yet, and the
  README of a new mod lists it before the command.
- `pack` prints one hash, the content hash, and says what it is for. The
  ZIP's own SHA-256 is in `pack --json`.
- The package carries its licence and this changelog.

## 0.1.0

- The first release: `new`, `check`, `pack`, `dev`, `types`, `publish`,
  `status`, `yank`, `unyank` and `logout`.
