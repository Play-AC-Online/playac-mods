# Changelog

What changes for people who make mods. This repository is generated, so each
sync is one commit. The lists below are the places to read what changed.

- **The mod API**, level by level: https://playaconline.com/modding/changelog/. This tree matches
  API level 1.
- **The `playac-mod` tool**, release by release: [`cli/CHANGELOG.md`](cli/CHANGELOG.md).
- **The game**: https://playaconline.com/releases/

## This repository

- The guides, the starter kits, the mod contract and the AI skill are written
  here now, and a pull request to them can be merged. The mod contract is new
  here: the full rule list the game checks every mod against.
- The example mods moved out. Each is its own repository now, laid out like a
  mod repository of yours, and the README lists them.
- Added a licence (MIT), this file, CONTRIBUTING.md, SECURITY.md and issue forms.
- The install line now names one release of the tool and gives its SHA-256.
- `playac-mod` commands are written without `npx`.
- First version: examples, starter kits, the template, the API files, the
  errors list, the AI pack, the setup guides and the tool's source.
