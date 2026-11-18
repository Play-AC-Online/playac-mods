# Play AC Online mods

Starter kits, the mod API and the `playac-mod` tool for
[Play AC Online](https://playaconline.com). The docs at https://playaconline.com/modding/ are the full guide.

**The docs site and the tool's download go live with the game's next release. Until then the links to playaconline.com/modding/ and the install line below do not work yet.**

The guides, the starter kits, the mod contract and the AI skill are written
here. The rest is generated from the game's sources on every release. It
matches mod API level 1.

| Folder | What it is |
|---|---|
| [`templates/`](templates/) | Starter kits. Copy one and edit it. |
| [`template/`](template/) | A whole mod repository for GitHub, with a check workflow. Copy the folder out to use it. It holds a working mod, a check workflow, a changelog and editor settings. `playac-mod new <id> --github` writes the same workflow, changelog and settings around a new mod of the kind you choose. |
| [`api/`](api/) | The API spec, JSON schemas and Lua types. |
| [`errors/`](errors/) | Every error a mod can get, with the fix. |
| [`ai/`](ai/) | Instructions for AI coding assistants. |
| [`setup/`](setup/) | Setup guides, from a clean computer. |
| [`cli/`](cli/) | The source of the `playac-mod` tool, with its [changelog](cli/CHANGELOG.md). |
| [`tools/`](tools/) | The program that draws the texture kit's pictures, and a ZIP checker. |
| [`MAKING-A-MOD.md`](MAKING-A-MOD.md) | The file formats and the script API on one page, for reading offline. |
| [`CONTRACT.md`](CONTRACT.md) | The full rule list every part of the game checks a mod against. |

## Examples

Each example is a working mod in its own repository, laid out the way your
own mod repository will be: the mod at the top, a README with pictures and a
film of it in the game, a changelog and a tag per version. Clone one to read
it, or fork it to start from it.

| Example | Kind | Repository |
|---|---|---|
| [Clover Meadow](https://github.com/Play-AC-Online/playac-example-clover-meadow) | Textures | [`playac-example-clover-meadow`](https://github.com/Play-AC-Online/playac-example-clover-meadow) |
| [Chatty Villagers](https://github.com/Play-AC-Online/playac-example-chatty-villagers) | Villager lines, data only | [`playac-example-chatty-villagers`](https://github.com/Play-AC-Online/playac-example-chatty-villagers) |
| [Tea House](https://github.com/Play-AC-Online/playac-example-tea-house) | Shop, hours, translations | [`playac-example-tea-house`](https://github.com/Play-AC-Online/playac-example-tea-house) |
| [Cosy Corner](https://github.com/Play-AC-Online/playac-example-cosy-corner) | New furniture | [`playac-example-cosy-corner`](https://github.com/Play-AC-Online/playac-example-cosy-corner) |
| [Harvest Fair](https://github.com/Play-AC-Online/playac-example-harvest-festival) | Calendar days and letters | [`playac-example-harvest-festival`](https://github.com/Play-AC-Online/playac-example-harvest-festival) |
| [Daily Gift](https://github.com/Play-AC-Online/playac-example-daily-gift) | Script, commands, timer | [`playac-example-daily-gift`](https://github.com/Play-AC-Online/playac-example-daily-gift) |

## Quick start

You need Node.js 18.17 or newer, and the game running in your browser. The
game runs from your own disc file: https://playaconline.com/your-disc/

```bash
npm install -g https://playaconline.com/modding/downloads/playac-mod-0.2.0.tgz
git clone https://github.com/Play-AC-Online/playac-example-tea-house.git
cd playac-example-tea-house
playac-mod check
playac-mod pack

# start your own, outside the example
cd ~
playac-mod new yourname.my-mod --kind lines
```

That line installs release 0.2.0 from the game's site. Its SHA-256 is
`a4b0144e7cdc71232e0591a49ccc275741dbc5b0ec56bea6deccacff3bb8f60f`, and [the setup guide](setup/node-and-cli.md#4-install-playac-mod)
shows how to check it. Install the tool only from that address. A package
named `playac-mod` on the npm registry is not the game's.

To try a mod, open the game and go to **Settings, Mods, Install from a file**.
To see edits live, run `playac-mod dev` and leave it running. Open the game
with `?moddev=1`. Go to Settings, Mods, Load a mod you are making. Press
**Connect** beside "playac-mod dev address", then **Restart now** once. After
that, edits show as you save. [The game](setup/game.md#4-load-a-mod-you-are-making)
has each step.
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
- A wrong fact, a broken example or a bug in the tool: [open an issue](https://github.com/Play-AC-Online/playac-mods/issues/new/choose) here.
- A bug in the game: the feedback button on https://playaconline.com.
- A way for a mod to do what it must not: report it privately, see [SECURITY.md](SECURITY.md).

A pull request to a guide, a starter kit, the contract or the AI skill can be
merged here. The other folders are generated, so a pull request there is read
as a suggestion. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE). It covers everything in this repository that we wrote: the
starter kits, the template, the tool, the API files and the guides. Each
example repository carries the same licence for its own files.

**A mod you make from a kit, an example or the template is yours.** Share it
under any terms you like, with no credit or notice needed for what you
started from.

The tool carries three files from other projects, under their own notices in
[`cli/vendor/LICENSE`](cli/vendor/LICENSE).
