# Play AC Online mods

Examples, starter kits, the mod API and the `playac-mod` tool for
[Play AC Online](https://playaconline.com). The docs at https://playaconline.com/modding/ are the full guide.

**The docs site and the tool's download go live with the game's next release. Until then the links to playaconline.com/modding/ and the install line below do not work yet.**

This repository is generated from the game's sources on every release. It
matches mod API level 1.

| Folder | What it is |
|---|---|
| [`examples/`](examples/) | Working example mods, one idea each. |
| [`examples-media/`](examples-media/) | Screenshots and videos of the examples in the game. |
| [`templates/`](templates/) | Starter kits. Copy one and edit it. |
| [`template/`](template/) | A whole mod repository for GitHub, with a check workflow. Copy the folder out to use it. `playac-mod new <id> --github` writes the same files. |
| [`api/`](api/) | The API spec, JSON schemas and Lua types. |
| [`errors/`](errors/) | Every error a mod can get, with the fix. |
| [`ai/`](ai/) | Instructions for AI coding assistants. |
| [`setup/`](setup/) | Setup guides, from a clean computer. |
| [`cli/`](cli/) | The source of the `playac-mod` tool, with its [changelog](cli/CHANGELOG.md). |
| [`tools/`](tools/) | The program that draws the examples' textures, and a ZIP checker. |
| [`MAKING-A-MOD.md`](MAKING-A-MOD.md) | The file formats and the script API on one page, for reading offline. |

## Quick start

You need Node.js 18.17 or newer, and the game running in your browser. The
game runs from your own disc file: https://playaconline.com/your-disc/

```bash
npm install -g https://playaconline.com/modding/downloads/playac-mod-0.2.0.tgz
git clone https://github.com/christophermarek/playac-mods.git
cd playac-mods/examples/example.tea-house
playac-mod check
playac-mod pack

# start your own, outside the examples
cd ~
playac-mod new yourname.my-mod --kind lines
```

That line installs release 0.2.0 from the game's site. Its SHA-256 is
`4ec34948e2037789db1b7bc3a8ed492c45bc2c6707cb7bd338326b6d74f7ccb5`, and [the setup guide](setup/node-and-cli.md#4-install-playac-mod)
shows how to check it. Install the tool only from that address. A package
named `playac-mod` on the npm registry is not the game's.

To try a mod, open the game and go to **Settings, Mods, Install from a file**.
To see edits live, run `playac-mod dev` and open the game with `?moddev=1`.
`playac-mod help` lists the commands.

## Setup guides

New to this? Start with the [setup guides](setup/):
[the game](setup/game.md), [Node.js and playac-mod](setup/node-and-cli.md),
[your editor](setup/editor.md), [textures](setup/textures.md),
[an AI assistant](setup/ai-assistant.md), [Git and GitHub](setup/git-github.md),
[publishing](setup/publishing.md) and [troubleshooting](setup/troubleshooting.md).

## Links

- Start: [textures](https://playaconline.com/modding/start/artist/), [lines and letters](https://playaconline.com/modding/start/writer/), [scripts](https://playaconline.com/modding/start/scripter/), [command line](https://playaconline.com/modding/start/power-user/)
- [Reference](https://playaconline.com/modding/reference/), [the playac-mod tool](https://playaconline.com/modding/cli/), [errors](https://playaconline.com/modding/errors/), [testing](https://playaconline.com/modding/testing/), [publishing](https://playaconline.com/modding/publishing/)
- [FAQ](https://playaconline.com/modding/faq/), [changelog](https://playaconline.com/modding/changelog/), [mod rules](https://playaconline.com/wiki/mod-rules/), [playing with mods](https://playaconline.com/wiki/mods/)

## Help and problems

- A question about making a mod: ask on the game's Discord, https://discord.gg/7CrPXyX97m.
- A wrong fact, a broken example or a bug in the tool: [open an issue](https://github.com/christophermarek/playac-mods/issues/new/choose) here.
- A bug in the game: the feedback button on https://playaconline.com.
- A way for a mod to do what it must not: report it privately, see [SECURITY.md](SECURITY.md).

This repository is generated, so we cannot merge pull requests. Open one anyway
if it shows the fix best. We make the change in the game's sources and it
arrives here with the next release. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE). It covers everything in this repository that we wrote: the
examples, the starter kits, the template, the tool, the API files and the
guides.

**A mod you make from a kit, an example or the template is yours.** Share it
under any terms you like, with no credit or notice needed for what you
started from.

The tool carries three files from other projects, under their own notices in
[`cli/vendor/LICENSE`](cli/vendor/LICENSE). The pictures and videos in
`examples-media/` show the game running and are here to illustrate the
examples. The licence does not cover the game they show.
