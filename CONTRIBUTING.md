# Contributing

Thank you for wanting to make this better.

## How this repository works

Some files are written here, and the rest are generated.

- **Written here:** `MAKING-A-MOD.md`, `CONTRACT.md`, the setup guides in
  `setup/`, the starter kits in `templates/` and the AI skill
  `ai/playac-mod/SKILL.md`. A pull request to these can be merged. The part of
  the skill between its "generated facts" markers is the exception: it is
  written from the API spec.
- **Generated:** everything else (`api/`, `errors/`, `cli/`,
  `tools/`, the rest of `ai/` and the top-level files). Each sync replaces
  them, so a change to them has to be made in the game's sources. It then
  arrives with the next sync.

## What helps most

- **An issue.** Say what is wrong and where: a fact that is not true, an
  example that does not work, a step in a setup guide that fails, a bug in
  the tool. [Open one](https://github.com/Play-AC-Online/playac-mods/issues/new/choose).
- **A pull request.** To a file written here, it is reviewed and merged like
  in any repository. To a generated file, it is a suggestion: it shows exactly
  what you mean, and that is useful. We read it, make the change in the game's
  sources and close the pull request with a note.

For a bug in the tool, include what you typed, what it printed and the output
of `playac-mod --version`.

## What does not belong here

- A bug in the game itself: use the feedback button on https://playaconline.com.
- A way for a mod to do what it must not: see [SECURITY.md](SECURITY.md).
- A report about someone's shared mod: use **Report** on the mod's page in the game.
- Your own mod: share it from the game, see https://playaconline.com/modding/publishing/.

## Licence

By sending a suggestion you agree it may be used under the repository's
[MIT licence](LICENSE).
