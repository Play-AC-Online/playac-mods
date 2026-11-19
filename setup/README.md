# Setting up to make mods

These guides take you from a computer with nothing installed to a mod running
in the game. Each guide stands on its own. Read the ones your kind of mod
needs. Every step says how to check it worked, for macOS, Windows and Linux.

The full modding docs are at https://playaconline.com/modding/. These guides
only cover getting your computer ready.

## What you need for each kind of mod

| You want to make | You need | Guides |
|---|---|---|
| **Textures**: your own pictures for grass, paths, trees and clothes | A browser and a paint program. No command line. | [The game](game.md), [Texture tools](textures.md) |
| **Words**: villager lines, letters, calendar days, a shop's name and stock | A browser and a text editor. No command line. | [The game](game.md), [Editor](editor.md) |
| **Scripts**: small Lua programs that react to the game | A browser and a text editor. The `playac-mod` tool helps. | [The game](game.md), [Node.js and playac-mod](node-and-cli.md), [Editor](editor.md) |
| **All of it, from a terminal**: libraries, versions, GitHub releases | Everything. | All of them |

Three more guides are for anyone:

- [An AI assistant](ai-assistant.md) and [Git and GitHub](git-github.md) are
  optional.
- [Publishing](publishing.md) is for when your mod is ready to share.
- [Troubleshooting](troubleshooting.md) is for when something goes wrong.

## The guides

1. [The game](game.md). A browser that runs it, your town, developer mode and
   the Mod log. **Everyone starts here.**
2. [Node.js and the playac-mod tool](node-and-cli.md). Install Node.js and
   `playac-mod`. Make, check and pack your first mod.
3. [Editor](editor.md). Set up VS Code, or any editor, to check your JSON
   files as you type. Add the Lua extension that knows the game's script API.
4. [Texture tools](textures.md). Find a texture's name, paint over it and save
   it as PNG or DDS.
5. [AI assistant](ai-assistant.md). Give any assistant the mod rules, so it
   writes mods that install the first time.
6. [Git and GitHub](git-github.md) (optional). Keep your mod in a repository
   and share releases from a tag.
7. [Publishing](publishing.md). An account, two-factor sign-in and sending
   your mod for review.
8. [Troubleshooting](troubleshooting.md). The most common problems, and the
   error codes.

## The shortest path to a working mod (no installs)

To see a mod work before you set anything up:

1. Open the newest "Starter kits and AI pack" release of this repository,
   https://github.com/Play-AC-Online/playac-mods/releases, and download the
   **Villager lines kit**, `playac-lines-kit.zip`.
2. Load your town on https://playaconline.com/play/ (see [The game](game.md)).
3. Open **Settings, Mods, Install from a file, Choose a file** and pick the kit's
   ZIP.
4. Press **Restart now**.
5. Talk to a villager. They say one of the kit's lines first.

That is a mod.

## What you may share

Mods you share must be your own work. They may hold no pictures, text, names
or sounds from Nintendo or any other game, film, show or brand. You can make
anything you like for yourself. The rules are at
https://playaconline.com/modding/rules/.
