# playac-mod

Check, pack and try mods for [Play AC Online](https://playaconline.com).
Needs Node.js 18.17 or newer.

Install it with the line on https://playaconline.com/modding/cli/#install. That
line names one release by its address and gives its SHA-256.

```bash
playac-mod check              # every rule the game applies, problems per file
playac-mod check ../mod.zip   # a ZIP, as the Mods tab reads it
playac-mod dev                # serve the folder to the game, reload on edits
playac-mod pack               # ../<id>-<version>.zip beside the folder
```

`playac-mod <command> --help` shows a command's options.

Start a mod from an example repository or a starter kit:
https://playaconline.com/modding/. Share it from the website.

## check and pack

Both run the game's own rules, so a mod that passes installs. `check` also
fails a script the game would stop: a Lua syntax error, an `on()` for an event
not in `scripts.events`, or a call to `math.random`. It warns about things the
game accepts that you probably did not mean.

`pack` writes the same bytes every time and prints the content hash. Every
`.json .lua .dds .png .txt .md` file goes in, except names that start with
`.`, `node_modules` and a top-level `CHANGELOG.md`.

## dev

Serves on port 2604, or the next free one. Then, in the game:

1. Open it with `?moddev=1`, for example https://playaconline.com/play/?moddev=1
2. Go to Settings, Mods, Developer, Load a mod you are making.
3. Press Connect beside "playac-mod dev address", then Restart now once.

Edits then show as you save. A change to `mod.json` waits for Restart now.
Press Connect again after you reload the page.

The terminal prints one line for each thing that happens:

```
connected: https://playaconline.com
sent to the game: my.mod 1.0.0. Press Restart now to run it
loaded in the game: my.mod 1.0.0
changed main.lua
reloaded main.lua
disconnected: https://playaconline.com
```

`loaded in the game` and `reloaded` come from the game page, so they say what
the game did, not only what the server sent. `disconnected` comes a few seconds
after the page closes.

## Licence

MIT, see [LICENSE](LICENSE). Notices for the files it carries from other
projects are in `vendor/LICENSE`.
