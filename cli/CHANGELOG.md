# playac-mod changelog

Every release of the tool, newest first. `playac-mod --version` prints the
version and the build you have.

A version is MAJOR.MINOR.PATCH. The middle number goes up when the rules, the
API level or a command changes. The last number goes up for fixes. A release
never changes after it is listed.

## 0.2.0

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
