# Play AC Online mods

Examples, starter kits, the mod API and the `playac-mod` tool for
[Play AC Online](https://playaconline.com). The docs are at https://playaconline.com/modding/.

This repository is generated from the game's sources on every release. It
matches mod api levels 1 to 2.

| Folder | What it is |
|---|---|
| [`examples/`](examples/) | Working example mods, one idea each. |
| [`examples-media/`](examples-media/) | Pictures and films of the examples in the game. |
| [`templates/`](templates/) | Starter kits to copy. |
| [`template/`](template/) | A mod repository for GitHub, with a check workflow. |
| [`api/`](api/) | The API spec, JSON schemas and Lua types. |
| [`errors/`](errors/) | Every error a mod can get, with the fix. |
| [`ai/`](ai/) | Instructions for AI coding assistants. |
| [`setup/`](setup/) | Setup guides, from a clean computer. |
| [`cli/`](cli/) | The source of the `playac-mod` tool. |
| [`tools/`](tools/) | Scripts to check a mod ZIP and make test textures. |
| [`MAKING-A-MOD.md`](MAKING-A-MOD.md) | The modder guide on one page. |

## Quick start

You need Node.js 18.17 or newer.

```bash
npm install -g https://playaconline.com/modding/downloads/playac-mod.tgz
git clone https://github.com/christophermarek/playac-mods.git
cd playac-mods/examples/example.tea-house
playac-mod check
playac-mod pack
playac-mod new yourname.my-mod --kind lines
```

The tool is not on npm yet. Install it only with the line above.

To try a mod, open the game and go to **Settings, Mods, Install from a file**.
To see edits live, run `playac-mod dev` and open the game with `?moddev=1`.

## Setup guides

New to this? Start with the [setup guides](setup/):
[the game](setup/game.md), [Node.js and playac-mod](setup/node-and-cli.md),
[your editor](setup/editor.md), [textures](setup/textures.md),
[an AI assistant](setup/ai-assistant.md), [Git and GitHub](setup/git-github.md),
[publishing](setup/publishing.md) and [troubleshooting](setup/troubleshooting.md).

## Links

- Start: [textures](https://playaconline.com/modding/start/artist/), [lines and letters](https://playaconline.com/modding/start/writer/), [scripts](https://playaconline.com/modding/start/scripter/), [command line](https://playaconline.com/modding/start/power-user/)
- [Reference](https://playaconline.com/modding/reference/), [errors](https://playaconline.com/modding/errors/), [testing](https://playaconline.com/modding/testing/), [publishing](https://playaconline.com/modding/publishing/)
- [FAQ](https://playaconline.com/modding/faq/), [changelog](https://playaconline.com/modding/changelog/), [mod rules](https://playaconline.com/wiki/mod-rules/)

## Problems

Report a wrong fact or a broken example as an issue here. Report a game bug
with the feedback button on https://playaconline.com. Pull requests are read as suggestions:
changes are made in the game's sources and arrive with the next sync.

## License

Not decided yet. Ask before reusing these files outside your own mods.
