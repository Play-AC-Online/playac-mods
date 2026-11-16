# playac-mod

Make, check, pack, try and publish mods for [Play AC Online](https://playaconline.com).
Needs Node.js 18.17 or newer.

Install it with the line on https://playaconline.com/modding/cli/#install. That
line names one release by its address and gives its SHA-256. Do not install a
package by the bare name `playac-mod` from anywhere else.

```bash
playac-mod new yourname.my-mod --kind lines   # texture | lines | shop | script; --github for a repo
cd yourname.my-mod
playac-mod check     # every rule the game applies, problems per file, Lua syntax too
playac-mod check ../some-mod.zip              # a ZIP, exactly as the Mods tab reads it
playac-mod dev       # serve the folder to the game's developer mode
playac-mod pack      # ../<id>-<version>.zip beside the folder, the same bytes every time
playac-mod publish   # sign in with a code (it lasts an hour), upload for review
playac-mod publish --github you/my-mod@v1.2.0   # or have the site import a tag
playac-mod status    # what happened to each version you uploaded
playac-mod yank 1.2.0 --reason "breaks the shop"   # withdraw a version; unyank lists it again
playac-mod logout
```

`playac-mod help` lists the commands. `playac-mod <command> --help` shows one
command's options. The same reference is at https://playaconline.com/modding/cli/.

`playac-mod --version` prints the version and the build.
[CHANGELOG.md](CHANGELOG.md) lists what each release changed. The tool says
when a newer release is out. Set `PLAYAC_NO_UPDATE_CHECK=1` to switch that off.

## check and pack

`check` and `pack` run the game's own rules, so a mod that passes installs.

`check` also fails a mod whose script the game would stop when it loads:

- a Lua syntax error. The game's Lua 5.4 parser is built in, so you need no Lua install.
- an `on()` for an event that is not in `scripts.events`
- a call to `math.random`. The sandbox has none. Use `rng()`.

`check` warns about things the game accepts but you probably did not mean:

- a texture the mod list would refuse, or one smaller than the texture it replaces
- two files for one texture
- PNGs over the game's pixel limit
- a `cmd.*` call that is not in `permissions`
- a shop good the game leaves out, or sells above your price
- a letter footer longer than 8 characters with no `sender`
- an `"api"` below the newest level
- a file the game would refuse, such as an old ZIP left in the folder

`pack` prints the mod's content hash. The mod list, the update check and
friend visits know the version by that hash.

## What goes in the ZIP

Every `.json .lua .dds .png .txt .md` file goes in, except:

- anything under a name that starts with `.`, such as `.git`, `.github`, `.vscode` and `.playac`
- `node_modules`
- a `CHANGELOG.md` at the top. Its section for the version is sent beside the ZIP as the changelog line.

`README.md` goes in, so write it for players.

## Editor types

`new` and `types` write `.playac/` and `.vscode/settings.json`, so your editor
knows the script API. `.playac/` holds LuaLS annotations and a JSON schema for
every content file.

## dev

`dev` serves on port 2604. When that port is taken it uses the next free one
and prints the address. Put that address in the game's "playac-mod dev address" box.

## publish

`publish` signs in with a code:

1. It prints an address and an 8-letter code.
2. Open the address on the site while signed in. Your account needs two-factor
   sign-in switched on, as for any upload.
3. Check the code and press Approve.

A code from your authenticator app gives you 15 minutes to approve. The
sign-in you approve lasts an hour. It can upload your mods, list your own
versions, and withdraw or list them again. It can do nothing else. `logout`
ends it.

Docs: https://playaconline.com/modding/  Errors: https://playaconline.com/modding/errors/

## Licence

MIT, see [LICENSE](LICENSE). The notices for the files it carries from other
projects are in `vendor/LICENSE`.
