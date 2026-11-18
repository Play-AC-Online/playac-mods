# Git and GitHub (optional)

You never need Git to make or share a mod. It is worth it in three cases:

- You want a history of every change.
- You work on a mod with someone else.
- You want to share each version from a tagged release on GitHub, with no ZIP
  to upload.

This guide covers installing Git, keeping a mod in a GitHub repository and
sharing a version from a tag. Some parts use the `playac-mod` tool
([Node.js and playac-mod](node-and-cli.md)).

## 1. Install Git

- **macOS**: in a terminal, run `git --version`. If Git is missing, macOS
  offers to install the "command line developer tools". Accept and wait. You
  can also run `xcode-select --install` or `brew install git`.
- **Windows**: download it from https://git-scm.com/downloads/win and run it
  with the defaults. Or run `winget install Git.Git`. Then open a **new**
  terminal.
- **Linux**: run `sudo apt install git` (Debian, Ubuntu) or
  `sudo dnf install git` (Fedora).

Tell Git your name and email once:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

They go in every commit you make and are public on GitHub. GitHub can give you
a private no-reply address under Settings, Emails.

**Check it worked:** `git --version` prints a version, and
`git config --global user.name` prints your name.

## 2. A GitHub account and a way to push

1. Make an account at https://github.com/signup.
2. Install GitHub's own tool, `gh`, from https://cli.github.com. It is the
   easiest way to sign in from the terminal. On macOS run `brew install gh`.
   On Windows run `winget install GitHub.cli`. On Linux follow that page.
3. Run `gh auth login` and answer its questions: GitHub.com, HTTPS, log in
   with a browser.

**Check it worked:** `gh auth status` says you are logged in.

You can do without `gh`. Git for Windows and macOS's Git ask you to sign in
with a browser the first time you push. On Linux, use `gh` or an SSH key:
https://docs.github.com/en/authentication.

## 3. A mod in a repository

Make the mod with the GitHub files included:

```bash
playac-mod new yourname.tea-house --kind shop --github
cd yourname.tea-house
```

`--github` adds two things:

- `.github/workflows/mod.yml`, a check that runs on every push
- a `CHANGELOG.md`

`--github` needs to be online. The workflow runs one release of
`playac-mod`, pinned by its SHA-256. The tool reads that release from the
list on playaconline.com. When it cannot read the list, it stops and writes
nothing. Run the same line again online, or leave out `--github` and add the
files later.

The `.gitignore` every new mod gets leaves out the generated editor types,
`.playac/playac.lua` and `.playac/schemas/`. It also leaves out `dist/` and
`node_modules/`. Everything else is committed.

Put the mod on GitHub. The repository must be **public** for the site to
import from it.

```bash
git init -b main         # older Git: git init, then git branch -M main after the commit
git add .
git commit -m "First version"
gh repo create tea-house --public --source . --push
```

Without `gh`, make an empty public repository on github.com. Then run
`git remote add origin https://github.com/<you>/tea-house.git` and
`git push -u origin main`.

**Check it worked:** `git status` says `nothing to commit, working tree
clean`, and the repository page on GitHub shows `mod.json`.

**About the workflow.**

- It runs one release of playac-mod, named at the top of the file as
  `PLAYAC_MOD_VERSION`.
- It downloads that release's file. It refuses the file unless its SHA-256
  matches `PLAYAC_MOD_SHA256`. Then it runs `playac-mod check`.
- It never looks the tool up on npm by name, so no other package called
  playac-mod can run in your repository.
- To move to a newer release, copy the three lines from a fresh
  `playac-mod new yourname.pin --github`. Or copy the version and SHA-256 from
  https://playaconline.com/modding/downloads/playac-mod-releases.json.

### Or start from an example

This repository (`playac-mods`) holds every example mod and starter kit.

1. Copy one folder out of `examples/` or `templates/` into a repository of
   your own.
2. Change the `id` in `mod.json` to `yourname.something`.
3. Run `playac-mod types` in it for the editor files. It writes `.playac/`,
   and the VS Code settings in `.vscode/` when the folder has none.
4. Carry on from the commit step above.

## 4. Share a version from a tag

The site can import a tagged version from GitHub. It reads two things at that
tag:

- **The mod.** Every file the game would read, the same as `playac-mod pack`.
- **The listing.** 1 to 4 screenshots in `.playac/screenshots/`, and the
  changelog line.
  - Screenshots are PNG or JPEG, at least 200 pixels a side and up to 2 MB
    each.
  - The changelog line comes from this version's section of `CHANGELOG.md`,
    under a heading like `## 0.1.0`. Without one it comes from
    `.playac/changelog.txt`.

The steps:

1. Take screenshots of your mod in the game and put them in
   `.playac/screenshots/`.
2. Write the version's section in `CHANGELOG.md`.
3. Make sure `"version"` in `mod.json` is the version you are sharing.
4. Commit, tag with the same version and push the tag:

   ```bash
   git add .
   git commit -m "0.1.0"
   git tag v0.1.0
   git push
   git push origin v0.1.0
   ```

5. Send it for review in one of two ways:
   - In the game: open **Settings, Mods, Share a mod** and paste
     `github.com/<you>/tea-house@v0.1.0`.
   - In the terminal: run
     `playac-mod publish --github <you>/tea-house@v0.1.0`. It first checks
     that the tag matches `mod.json`, that the screenshots and changelog are
     there, and that the tag was pushed. Then it signs you in
     ([Publishing](publishing.md)).

**Check it worked:** the version shows under **Mods you shared** as **Waiting
for review**. `playac-mod status` lists it too.

The site fetches the tag once. Moving or re-pushing the tag later changes
nothing. A fix is always a new, higher version with a new tag.

## Good to know

- Hidden files and folders never go in the mod. Those are `.git/`, `.github/`,
  `.playac/` and `.vscode/`. `CHANGELOG.md` does not go in either.
- Your `README.md` does go in the mod. Players and the reviewer read it, so
  write it about your mod.
- An account needs two-factor sign-in to import, the same as any upload
  ([Publishing](publishing.md)).
- More on sharing: https://playaconline.com/modding/publishing/
