# My Play AC Online mod

A mod for [Play AC Online](https://playaconline.com), made from the
playac-mod template.

This folder is a whole mod repository. It holds a working mod with lines and
a script, the check workflow, VS Code settings and a `CHANGELOG.md`. To use it,
copy this folder out, make it a Git repository of your own and push it to
GitHub.

`playac-mod new yourname.mod-name --github` writes the same workflow, changelog
and settings around a new mod of the kind you choose.

## First steps

0. Install the `playac-mod` tool: https://playaconline.com/modding/cli/#install
1. Open `mod.json`. Change `"id"` to `yourname.mod-name`, using lowercase
   letters, digits and dashes. Set `"name"`, `"authors"` and `"description"`.
2. Run `playac-mod types` once. It writes `.playac/`, which holds the game's
   script API and the shape of every JSON file for your editor. In VS Code,
   install the recommended Lua extension when it asks.
3. Run `playac-mod dev` and leave it running. Open the game with `?moddev=1`
   on the address, for example `https://playaconline.com/play/?moddev=1`. Go
   to Settings, Mods, Load a mod you are making. Press Connect beside
   "playac-mod dev address", then Restart now once. After that, edits to
   lines, the shop and scripts show as you save. Press Connect again after
   you reload the page.
4. Run `playac-mod check`. It lists every problem the game would find, per file.

## Share it

Every file must be your own work. Never use the game's pictures or text.

Sharing needs three things:

- an account on playaconline.com with two-factor sign-in switched on
- 1 to 4 screenshots, PNG or JPEG, in `.playac/screenshots/`
- a line that says what the version changes, in a `## 1.2.0` section of
  `CHANGELOG.md` or in `.playac/changelog.txt`

The screenshots and the changelog line are not part of the mod, but they are
read from the same tag, so commit them. `.gitignore` leaves out what
`playac-mod types` writes, `.playac/playac.lua` and `.playac/schemas/`. It
also leaves out `dist/` and `node_modules/`.

### From GitHub

1. Raise `"version"` in mod.json and commit.
2. Tag the commit with the same version: `git tag v1.2.0 && git push --tags`
3. Sign in on playaconline.com and open Settings, Mods, Share a mod.
4. Paste `github.com/<you>/<repo>@v1.2.0`.

The site fetches that tag once, builds the mod from it and sends it for
review. Pushing to the tag later changes nothing.

The tool can do steps 3 and 4, and it checks the tag first:
`playac-mod publish --github <you>/<repo>@v1.2.0`

### From your computer

Run `playac-mod publish`. You sign in with a code, and the sign-in lasts an
hour. Or run `playac-mod pack`, which writes the ZIP beside this folder, and
upload the ZIP on the site.

### After you share

`playac-mod status` shows what happened to each version you uploaded.
`playac-mod yank 1.2.0` withdraws a bad version from the mod list.

## What goes in the mod

Every `.json .lua .dds .png .txt .md` file goes in, except:

- any file or folder whose name starts with `.`
- `node_modules`
- `CHANGELOG.md` at the top

So `.github`, `.vscode` and `.playac` never ship, and neither does `LICENSE`.
This README does ship. Players and the reviewer read it, so rewrite it about
your mod.

## The check workflow

The workflow in `.github/workflows/mod.yml` runs one release of playac-mod.
It downloads that release's file and refuses it unless its SHA-256 is the one
written at the top of the workflow. No other package with the same name can
run there. To move to a newer release, copy its version and SHA-256 from
the release list: `releases.json` in the `cli-releases` release of the
playac-mods repository on GitHub. https://playaconline.com/modding/cli/ links
it.

Guide: https://playaconline.com/modding/
