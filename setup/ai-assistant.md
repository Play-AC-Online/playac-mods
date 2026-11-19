# An AI assistant

An AI assistant does not know this game's mod rules on its own. It will invent
functions that do not exist. The **AI pack** gives it the whole mod API, every
error with its fix, the working examples and the items a shop can stock. What
it writes then installs the first time.

The pack works with any assistant: Claude Code, GitHub Copilot, Codex, Cursor,
Aider, Zed or a chat in the browser. More is at
https://playaconline.com/modding/ai/.

## 1. Get the pack

Pick one:

- **Download it:** `playac-mod-ai.zip` is a file of the newest "Starter kits
  and AI pack" release of this repository: https://github.com/Play-AC-Online/playac-mods/releases.
  https://playaconline.com/modding/ai/ links it too.
- **From this repository:** the `ai/` folder holds the same files.
  `ai/pack.json` lists where each one goes in a mod folder.

What is in the ZIP:

```
playac-mod-ai/
  .claude/skills/playac-mod/SKILL.md      Claude Code
  .claude/skills/playac-mod/reference/    api.md, errors.md, examples.md, items.md
  AGENTS.md                               Codex, Cursor, Aider, Zed and others
  .github/copilot-instructions.md         GitHub Copilot
  README.txt
```

## 2. Put it where your assistant looks

The files go in your **mod folder**, the one with `mod.json` in it. They do
not go inside a `playac-mod-ai` folder. On macOS and Linux, folders starting
with a dot are hidden in Finder and file managers, so a terminal is the easy
way.

**macOS, Linux:**

```bash
cd path/to/your-mod
unzip ~/Downloads/playac-mod-ai.zip
mv playac-mod-ai/.claude playac-mod-ai/.github playac-mod-ai/AGENTS.md .
rm -r playac-mod-ai
```

**Windows (PowerShell):**

```powershell
cd path\to\your-mod
Expand-Archive $HOME\Downloads\playac-mod-ai.zip -DestinationPath .
Move-Item playac-mod-ai\.claude, playac-mod-ai\.github, playac-mod-ai\AGENTS.md .
Remove-Item -Recurse playac-mod-ai
```

`mv` may say `Directory not empty` for `.claude` or `.github`. `Move-Item` may
say the item already exists. Your mod then has the pack already. Delete the
old folders first to update them.

**Check it worked:** your mod folder now has `mod.json`, `.claude/`,
`.github/` and `AGENTS.md` side by side. List them with `ls -a` on macOS and
Linux, or `dir -Force` on Windows.

You can keep only what your assistant reads:

| Assistant | Reads |
|---|---|
| Claude Code | `.claude/skills/playac-mod/` (loads by itself when you talk about the mod) |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Codex, Cursor, Aider, Zed and others | `AGENTS.md` |

`.claude/` and `.github/` are hidden folders, so they are never packed into
your mod's ZIP. `AGENTS.md` is a `.md` file, so `playac-mod pack` puts it in
the ZIP. That is harmless. To leave it out, keep it one folder up instead.

To use the pack with Claude Code in every project, copy
`.claude/skills/playac-mod` into `~/.claude/skills/playac-mod`.

## 3. A chat in the browser (ChatGPT, Claude.ai, others)

There are no files to place. Do one of these, then ask:

- Upload `SKILL.md` and the four `reference/` files to the chat. Upload them
  to a project instead if you want every chat to have them.
- Give the chat https://playaconline.com/llms-full.txt. It is all of the
  modding docs as one text file.

## 4. Ask, then test

Ask for what you want. For example: "Make a mod that restocks the flower shop
with fruit and opens it at night."

Then test what it wrote, the same as anything else:

```bash
playac-mod check
```

Or install the ZIP in the game with **Settings, Mods, Install from a file**.
When something is refused, paste the whole message to the assistant. Each
message has a code, and the pack has the fix for every code.

**Check it worked:** ask the assistant "Which events can a mod script listen
to?". It should list the game's real events, such as `villager_talked` and
`day_started`. It should also say that each must be in `scripts.events` in
`mod.json`. An assistant that invents events has not read the pack.

## Good to know

- You are the author. The rules apply to what an assistant makes for you. Share
  only original work, with no art or text from any game.
- The pack changes when the mod API does. Get it again after a game update.
  Download it again.
