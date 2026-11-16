---
name: playac-mod
description: Make, test, fix and publish mods for Play AC Online (playaconline.com), the browser town life game. Covers texture mods (tex1_*.dds or .png), villager lines (messages/*.json, talk pools), shops (shops.json, the flower shop and Nook's), new furniture (items.json), letters and calendar days, Lua 5.4 scripts (main.lua with on("villager_talked"...)) and their commands (cmd.send_letter, cmd.give_item...), mod.json, settings, dependencies, the Mods tab, the playac-mod CLI, sharing a mod for review, and every error message with its fix. Use whenever the user wants to make or change a Play AC Online mod, pastes an error from the Mods tab or the mod list, asks what a mod can do, or edits mod.json, shops.json, a messages file or a mod script. Triggers on "Play AC mod", "playaconline mod", "make a mod", "mod.json", "shops.json", "tex1_", "Mods tab", "playac-mod", "moddev", "texture inspector", "my mod won't load", "share my mod".
---

# Making a Play AC Online mod

You are helping someone make a mod for Play AC Online, a town life game that
runs in the browser at playaconline.com. They do NOT have the game's source
code and neither do you. Everything you need is in this file and in
`reference/`:

- `reference/api.md`: every mod.json key, file format, Lua function, event and limit.
- `reference/errors.md`: every error message a mod can get, with its code, meaning and fix.
- `reference/examples.md`: the site's complete working example mods, file by file.
- `reference/items.md`: item ids each shop can stock, with names, prices and price floors.

Never invent API. If something is not in `reference/api.md`, the game does not
have it: say so plainly and offer what IS possible. Online, the same docs are at
https://playaconline.com/modding/ (errors: https://playaconline.com/modding/errors/).

<!-- BEGIN generated facts: from the mod API spec, do not edit by hand -->
## Facts from the API spec (generated)

- The game reads mod api level 1. Every mod.json says `"api": 1`; without it the mod is refused.
- Level 1 (2026-11-16): The first level. Content is textures, lines (a messages file or a folder of translations), shops (the flower shop and Nook's stock), new furniture on a vanilla base (an items file, renames), letter templates, calendar days and villager line pools. Scripts get fifteen events, each handed one table. They also get log, message, the game queries, a store per town with a part per player and one per browser, settings, remote calls between mods and a seeded rng. Four commands (cmd.send_letter, give_item, show_line, ask) are declared in permissions and applied at the end of a frame's update. Mods also have depends and conflicts with version ranges, and data_version with the data_migrated event.
- Versioning: A level is read for at least 12 months after the next level ships. A deprecated name keeps working for at least two more levels and at least 90 days, whichever is later.
- mod.json keys: `$schema`, `schema`, `api`, `id`, `name`, `version`, `authors`, `description`, `tags`, `scope`, `content`, `scripts`, `permissions`, `exports`, `assets_original`, `renames`, `depends`, `conflicts`, `data_version`, `settings`. Reserved and refused: `game`, `save`. Any other key is refused (`unknown-key`), in mod.json, at the top of each content file and in each entry; the message names the closest known key.
- `content` keys: `textures`, `messages`, `shops`, `items`, `letters`, `calendar`, `talk`.

Events (15; list each one a script uses in `scripts.events`; every handler gets ONE table `e`, and a field marked `?` may be nil):

- `villager_talked` e = { villager { id, name, species?, personality? } }, returns string|nil: The player starts an ordinary talk with a villager. Return a line and the villager says it before their usual greeting. Return nil to stay quiet. The first mod in load order whose handler returns a line wins that talk, and later mods' villager_talked handlers are not called for it. An empty string, a line over 400 bytes or one holding a zero byte is not a line. It is logged and the next mod is asked. Special talks never reach mods. These are a first meeting, a villager moving out, one with an errand, delivery or contest going with you, a complaint, a pitfall or a bee chase, an islander, Kamakura and summer camp. No handler is called for a special talk. The villager's next ordinary talk calls it as usual, so a line a script is keeping for "the next talk" waits for that one.
- `day_started` e = { year, month, day, weekday }: A new day begins in the game. It fires once per day, also when the game starts on a new day. It does not fire again when the game restarts later on a day the town already saw, because the save holds the day it last began. If the game was not saved since that day began, the save still holds the day before, so the next start fires it again. Count days by storing the last date you saw, not by counting calls.
- `item_picked_up` e = { item, mod_item? }: The player got an item. They picked it up, caught it with the net or rod, or dug it up. Fires after it is in their pockets.
- `scene_entered` e = { scene, name? }: A scene starts, such as the town, a house or a shop. Not in the title demo.
- `data_migrated` e = { from, to }: Fires once per town, when mod.json "data_version" differs from the version the town's data was written at. It runs as the town loads, before any other event's handlers run in that town. from is 0 for data from before data_version. If the handler errors, the script stops and the version stays, so the next start tries again. Migrations run in load order. A remote.call from a data_migrated handler into a mod whose own data_migrated has not run in that town yet is refused. Needs data_version.
- `hour_changed` e = { year, month, day, hour }: The game's clock reached a new hour. This is the game's own hourly update, midnight included.
- `item_bought` e = { item, mod_item?, price, shop, ordered }: The player bought a good for Bells at any counter in the game. It fires as the seller takes the price. shop says which counter: "nook" (Nook's in every size, The City's Nookington's too), "flower" (the flower shop), "redd" (Crazy Redd), "saharah" (her carpet, swapped for one of yours and Bells), "joan" (turnips), "fireworks" (the fireworks show's stall), "shrine" (the New Year fortune slip), "gyroid" (what another player put up at their gyroid) or "villager" (a villager selling you something). Test e.shop == "nook" to keep to Nook's. price is the Bells paid. ordered is true for a Nook's catalog order, which is paid now and mailed tomorrow, so it is not in the pockets yet. Only Nook's and the flower shop sell mod items. A visitor buying in a friend's town gets a plain piece, so mod_item is nil there. Paid services that hand over no good are not purchases and do not fire it. These are the barber, Katrina, the Dream Suite and an Able Sisters design.
- `item_sold` e = { item, mod_item?, count, bells, shop }: The player sold for Bells. It fires once the wallet is credited. shop says to whom: "nook" (Nook's in every size, The City's Nookington's too) or "villager" (a villager buying something from your pockets). Nobody else in the game buys. item is the first good, count is how many went and bells is what they fetched. mod_item is the first good's full id when it is a mod item. What another player buys at your gyroid does not fire it. The gyroid hands you the takings later as one sum, with no record of what sold.
- `fish_caught` e = { item, mod_item?, pocketed }: A fish was landed. pocketed says whether it went into the pockets. There is no size or length, because the game keeps none for a caught fish. Each kind has one fixed shadow size. Only the fishing tourney makes up a length, when the fish is shown to its host.
- `bug_caught` e = { item, mod_item?, pocketed }: A bug was netted. pocketed says whether it went into the pockets.
- `letter_read` e = { sender, item?, mod_item?, first_time }: The player chose Read on a letter. item is the present, nil when the letter carries none.
- `villager_moved_in` e = { villager { id, name, species?, personality? } }: A villager with no house was given one. It fires at the game start after a move-in. A brand-new town fires it for its first villagers.
- `visitor_arrived` e = { kind }: A friend is riding into this player's own town. This is a friend visit, on the host's side. kind is "friend".
- `command_finished` e = { id, command, ok, via?, code?, message? }: A command this mod queued was applied or refused. When applied, ok is true and via says how (mailbox, post_office, pockets, mail or shown). When refused, ok is false, with a code (command_codes) and a message. Sent only to that mod.
- `question_answered` e = { id, choice?, text? }: The player answered this mod's ask, or closed it. choice counts from 1 and text is the answer picked. Both are nil when the window closed with no pick. Sent only to that mod.

Lua globals (anything else does not exist):

- `on`
- `log`
- `message`
- `game`: `game.time`, `game.day_number`, `game.pockets`, `game.bells`, `game.town`, `game.villagers`, `game.player`, `game.calendar_today`
- `store`: `store.get`, `store.set`, `store.town`, `store.client.get`, `store.client.set`, `store.player.get`, `store.player.set`
- `settings`: `settings.get`
- `remote`: `remote.add`, `remote.call`, `remote.has`
- `cmd`: `cmd.send_letter`, `cmd.give_item`, `cmd.show_line`, `cmd.ask`
- `rng`

Commands (each needs its name in mod.json `permissions`; at most 4 per event; a call returns the id, or nil, a message and a code):

- `cmd.send_letter`: Queues a letter in the player's own mailbox. The post office keeps it when the mailbox is full. The save holds an ordinary letter, so it loads without the mod.
- `cmd.give_item`: Queues an item into the first empty pocket. With full pockets it comes by letter. Also takes this mod's own new item by its full id (author.mod:thing). A mod item is given with its identity, as a shop sells it, and full pockets refuse it.
- `cmd.show_line`: Queues a line in the player's own thought window, shown once the player is free. One line or question at a time.
- `cmd.ask`: Queues a question with 2 to 4 answers in the player's thought window. The pick comes back as a question_answered event.

Refusal codes (branch on the code, never on the message):

- `command-permission` (retry: never): The command is not in mod.json permissions.
- `command-args` (retry: never): Wrong arguments, such as their shape, a length, the paper or the choices.
- `command-item` (retry: never): An item the command cannot hand out, or an unknown item or letter id of the mod's own.
- `command-event-cap` (retry: next-event): More than commands.per_event commands in one event.
- `command-queue-full` (retry: later): The mod's queue, or the game's, is full.
- `command-day-cap` (retry: tomorrow): The per-day limit for this command in this town is used up.
- `command-city` (retry: later): Commands are off in The City.
- `command-visiting` (retry: later): On a visit, only the town owner's game changes the town.
- `command-lent-home` (retry: never): A lent mod acting outside the host's town.
- `command-no-room` (retry: later): No room now. The mailbox and the post office are full, or the pockets are full for a mod item.
- `command-not-shown` (retry: never): The line or question cannot be drawn.

Key limits: ZIP 16 MiB; 256 lines per messages file, 400 bytes each; script 200,000 instructions and 33 ms per event (the main chunk at start gets 100 ms; 3 runs over 8 ms also stop a script), 4 MB memory; store 8 KB per mod per town. All limits: `reference/api.md`.

### Common texture names

Any-palette (`$`) names: each covers every time of day and stretch of the year it is drawn in. A tree crown name covers golden trees too (same crown, gold palette).

- Tree crown (grown broadleaf, fruit and golden trees) (February 25 to December 9, except April 1 to 8): `tex1_64x64_a67216e4ad55d908_$_8.dds`
- Tree crown, cherry blossom days (April 1 to 8): `tex1_64x64_ac6a2be34281d4e2_$_8.dds`
- Tree crown, winter (snow on top) (December 10 to February 24): `tex1_64x64_53d6cc5ace654ac7_$_8.dds`
- Cedar crown (February 25 to December 9): `tex1_64x64_2913073a15235562_$_8.dds`
- Cedar crown, winter (December 10 to February 24): `tex1_64x64_136aa80a0926d0a3_$_8.dds`
- Palm fronds (February 25 to December 9): `tex1_128x32_9dff2c84fba803e5_$_8.dds`
- Palm fronds, winter (December 10 to February 24): `tex1_128x32_53b283fa3171bbdd_$_8.dds`
- Grass (3 variants) (February 25 to December 9): `tex1_32x32_626709d910129694_$_8.dds`, `tex1_32x32_903adc6355e36f59_$_8.dds`, `tex1_32x32_e96fecd242518c9f_$_8.dds`
- Grass, winter (3 variants) (December 10 to February 24): `tex1_32x32_e2ab673814e71af6_$_8.dds`, `tex1_32x32_cfa57a6e6f966d11_$_8.dds`, `tex1_32x32_82f28ec4199a45be_$_8.dds`
- Cliff faces (3 variants) (February 25 to December 9): `tex1_64x64_99c780e750314916_$_8.dds`, `tex1_64x64_16de5cbb85d58cc0_$_8.dds`, `tex1_64x64_f628105fb6e026fd_$_8.dds`
- Cliff faces, winter (3 variants) (December 10 to February 24): `tex1_64x64_0dd181f7c8e1d9e1_$_8.dds`, `tex1_64x64_e5488c12d43d6cbc_$_8.dds`, `tex1_64x64_64ac9d75399172f0_$_8.dds`
- River and pond banks (3 variants) (February 25 to December 9): `tex1_64x64_1218fdfe9c963f24_$_8.dds`, `tex1_64x64_78690dcebd874a3b_$_8.dds`, `tex1_64x64_2d865e307f1a0fdc_$_8.dds`
- River and pond banks, winter (3 variants) (December 10 to February 24): `tex1_64x64_2ec0ba79769bedc7_$_8.dds`, `tex1_64x64_b6437b8020145bc6_$_8.dds`, `tex1_64x64_9438dc9288174b5a_$_8.dds`

### The playac-mod tool

A command line tool (Node.js 18.17 or newer): `playac-mod new <id> --kind texture|lines|shop|script [--github]`, `check` (a folder or a .zip; Lua syntax by the game's own parser), `pack` (writes `<id>-<version>.zip` beside the folder), `dev`, `types`, `publish` (`--github <owner>/<repo>@<tag>` checks the tag first), `status`, `yank <version>`, `unyank <version>`, `logout`.
`playac-mod help` lists the commands and `playac-mod <command> --help` shows one command's options. Write commands as `playac-mod ...`, never `npx playac-mod ...`.
Install it with the line on https://playaconline.com/modding/cli/#install, which names one release by its address and gives its SHA-256. Never install or run the tool by its bare name from the npm registry (no `npx playac-mod`, no `npm install playac-mod`): a package there by that name is not the game's. Without Node, use the no-Node route: write the files, ZIP them, install with Choose ZIP (the same checks run).
<!-- END generated facts -->

## What a mod can and cannot do

Can:
- Replace any texture the game draws with your own art, as `.dds` or `.png`.
- Add lines a villager says before their usual hello: from a script's `villager_talked` handler, or with no code from talk pools (`content.talk`) and calendar days (`content.calendar`).
- Change the flower shop (name, hours, greeting, up to 6 goods and prices) and add goods to Nook's shelves (`"target": "nook"`).
- Add new furniture on a game piece's model (`content.items`), sold in your shops or given by a script.
- Letter templates (`content.letters`), calendar days with a bulletin board notice, villager lines and a letter.
- Scripts on every event listed above, reading the date, pockets, Bells, town, villagers; a per-town store and a per-player one (`store.player`: a town has up to 4 residents); settings the player sets; translations; calls between mods (`remote`).
- Commands, declared in `permissions`, applied at the end of a frame's update (before it is drawn): see the list above. Daily caps are per mod per town (for every resident together: a safety limit), and a command counts when it is applied.

Cannot (do not promise these):
- Add villagers, buildings, acres, music, or new kinds of item other than house furniture on a game model.
- Change shops other than the flower shop and Nook's, or set Bells.
- Run code every frame, change the game's code or memory, read files, reach the internet, or run JavaScript. There is no `io`, `os`, `require`, `load` or `debug`.
- Change anything in The City (every command is refused there) or a friend's town while visiting (letters and items are refused).

## Rules (a mod breaking these is refused or removed)

- Only the author's own work. No textures, models, music or text taken or traced from any Nintendo game or any other game, film, show or brand. Exported textures from the inspector are the game's art: use them only to see the size and layout, and draw a new picture. A recolour, hue shift, filter, touch-up or trace of a game texture is NOT original and cannot be shared (fine in the player's own game); say so plainly when asked to recolour one for sharing. Unchanged copies are refused automatically.
- No Nintendo or franchise names or logos in a mod's name, id, description or pictures.
- `"assets_original": true` in mod.json is the author's promise of the above.
- Nothing sexual, hateful, or holding personal information. Scripts must not try to slow or break the game.
- Sharing needs an account, age 13 or older, two-factor sign-in, and accepting the mod rules. Full rules: https://playaconline.com/wiki/mod-rules/

## Pick the path

Ask what they want to make, then follow ONE of these. Each ends with a mod that installs.

### 1. Artist (textures, no tools needed)

1. Open `https://playaconline.com/play/?moddev=1` and load the town.
2. Settings, Mods, Developer: press **Record textures**. Close Settings, walk to what should change, open Settings again. The newest textures are first; **Flash** paints one magenta in the game for 3 seconds to find it.
3. Tick the textures and press **Export**: a working mod ZIP with each texture as an uncompressed `.dds`, already named right. A texture with a palette (grass, trees, cliffs) is exported under its `$` (any palette) name, `tex1_32x32_626709d910129694_$_8.dds`, so the art shows at night and in every season: keep the `$`. The common names (trees by season, cedars, palms, grass, cliffs, banks) are listed under "Common texture names" above, so a mod for those needs no recording at all.
4. Unzip, and in an editor that reads DDS (GIMP, Paint.NET) draw a NEW picture on a layer over each one, then delete the game's layer; or save it as `.png` under the same name. Keep each file name exactly. 2x or 4x the size is fine; smaller looks blurry.
5. Delete the textures you did not change (unchanged ones are refused when shared). Edit mod.json: your own id, name, authors.
6. ZIP the folder (Finder Compress or Windows Send to; the folder or the files inside it both work). Keep other ZIPs out of the folder: a `.zip` inside a mod is refused. Settings, Mods, "Install from a file", **Choose a file**, then **Restart now**.

Texture facts: names are `tex1_<w>x<h>_<texture hash>_<palette hash>_<format>.dds` (or `.png`; no palette part for a texture without a palette; `$` in place of the palette hash matches any palette; a `$` file is loaded once and shared by every palette, and any mod's exact-palette file wins over it for that palette). A `.dds` must be BC7, DXT1, DXT5 or uncompressed 32-bit RGBA (either channel order: RGBA or BGRA/A8R8G8B8), ONE level, no mipmaps (the game draws a DDS with mipmaps, but the mod list refuses it). A `.png` is drawn too: at most 2048 x 2048, and all mods' PNGs together at most 96 MB of pixels (24 MB on a phone). Do not keep a `.png` and a `.dds` of the same texture: the game uses only one. A mod's texture wins over the HD pack. On a phone all switched-on mods share 24 MB unpacked.

### 2. Writer (lines, shops, letters, calendar days; a text editor)

1. Make a folder with `mod.json` (template below) and the content file.
2. Villager lines, no script: a talk pools file (`content.talk`): lines by personality or by villager, with a daily `chance`. See `reference/api.md` and the Chatty Villagers example. Use this first for per-personality lines.
3. Lines in the player's language: `messages/en.json` (+ `fr.json` ... in a messages folder) and a tiny script (the talk example below). ONLY `content.messages` translates: talk pools, calendar day lines, notices, letters, shop text, item names and setting labels are one language for everyone, and letters and notices take plain US keyboard characters only (no accents).
4. A shop: `shops.json` (template below), `"scope": "world"`. Themed goods that are furniture (lanterns, a tea set) need the mod's own items (`content.items`), which the flower shop and Nook's both sell; the flower shop cannot show the game's own furniture.
5. A letter: `content.letters` with `id`, `header` (`{player}` for the name), `body` (6 lines), `footer` (the sign-off, up to 32 characters) and an optional `sender` (up to 8, the name in the mailbox list, which otherwise shows the footer cut to 8: "The Lantern Keepers" reads "The Lant"; `check` warns), `item`, `paper`. A script mails it with `cmd.send_letter`, a calendar day with `letter`.
6. A calendar day: `content.calendar` (a file with a top-level `"days"` list) where a day has `board` (world scope), `talk` lines or `letter`, any of the three (the id of one of the mod's `content.letters` letters, mailed on the day with NO script, once per town). `"week": 2, "weekday": 5` means the second Friday of the month (week n = the nth such weekday; `"last"` = the last). To test: set the date to today while testing; or move the device clock (the game reads it at start; back up the save first). Installed mid-day, the notice posts the next time the player walks outside that day; `day_started` does not fire again after a restart the same day, so a script uses `game.calendar_today()`.
7. ZIP the folder (the folder or its files, either works), Settings, Mods, "Install from a file", **Choose a file**, **Restart now**.

### 3. Scripter (Lua, ideally VS Code and Node)

1. With the playac-mod tool (see "The playac-mod tool" above): `playac-mod new yourname.my-mod --kind script` makes the folder with mod.json, main.lua, editor types (LuaLS) and JSON schemas in `.playac/`, and this skill. Kinds: `texture`, `lines`, `shop`, `script` (default `lines`). `playac-mod types` refreshes `.playac/` after a game update.
2. `playac-mod check` runs every rule the game runs at install, lists every problem at once (JSON errors with line and column), and FAILS on a script the game would stop at load: a Lua syntax error (checked with the game's own Lua 5.4 parser, built into the tool) and an `on()` for an event not in `scripts.events`. It warns about what the game accepts but probably not as meant (cmd.* not in permissions, a shop good the game leaves out, a texture the mod list refuses). `check some.zip` checks a ZIP exactly as the Mods tab reads it. `playac-mod pack` writes `<id>-<version>.zip` NEXT TO the mod folder (the same bytes every time) and prints its content hash. Hidden files and folders (`.playac/`, `.claude/`, `.vscode/`) and a top-level `CHANGELOG.md` never go in the ZIP; README.md does, so it is for players.
3. Test without zipping: open the game with `?moddev=1`, then Settings, Mods, Developer: **Choose folder** (the folder with mod.json), or run `playac-mod dev` and **Connect** to the address it prints (`http://127.0.0.1:2604`, or the next free port when 2604 is taken: use the printed one). Restart once; after that, saving reloads it in the running game: lines, shops, `talk`, `letters` and `calendar` files at once (shop goods on the next visit, a talk pool on a villager's first talk of the day), `main.lua` restarts the script with its store kept, textures are drawn again, and the `items` file is read again at once (a new name or price shows the next time it is shown or offered; a new base is what new pieces are made of, while pieces already in the town keep the base they were made of; a removed item's pieces show as their base and are it again when it is back; the Mod log says which applies). A mod.json change needs a restart, and so does giving a removed item's pieces a new id (a `renames` entry in mod.json). Errors (with a Lua traceback), stops and refused files are in the Mods tab's **Mod log**. While a mod is loaded this way, friend visits and sharing are off.
4. Without Node: write the files by hand from the templates here, ZIP them and install with **Choose a file**: the install runs the same checks.

### 4. Power user (sharing, versions, dependencies, multiplayer)

- Raise `version` for every shared update; a version can never be replaced.
- `playac-mod publish` signs in with a code: it prints an address on the site and an 8-letter code; the user opens it signed in (two-factor on), checks the code and presses Approve. Two clocks: a code from the authenticator app opens a 15-minute window in that browser to upload on the site or approve a sign-in; the approved CLI sign-in then lasts one hour on its own. The sign-in only uploads mods and lists or withdraws (`yank`) the user's own versions; `playac-mod logout` ends it. `--github owner/repo@tag` imports a tagged GitHub release instead, after checking the tag against mod.json, the listing (screenshots 200 to 4096 px a side and at most 3840x2160 pixels in all, as an 8 bit PNG or a standard JPEG, in `.playac/screenshots/`, a `## <version>` section in `CHANGELOG.md`) and git (tag exists, pushed).
- `playac-mod status` lists every uploaded version and its state (pending, listed, superseded, yanked, rejected with the reason, removed). `playac-mod yank 1.2.0 --reason "..."` takes a listed version out of the list; `unyank 1.2.0` lists it again.
- A GitHub repo: `playac-mod new yourname.my-mod --github` adds `.github/workflows/mod.yml` (check on push, pack on a `v*` tag; it downloads one playac-mod release from the site and refuses it unless its SHA-256 matches the one written in the workflow, so it never runs a package found on npm by name) and `CHANGELOG.md` (never packed, so editing it keeps the content hash).
- A library and a mod that needs it: developer mode loads ONE folder, and that copy counts as installed for `depends`; install the other from its ZIP (`playac-mod pack`), either way round. A library declares `exports` (name -> one-line description) in mod.json; `playac-mod types` in a dependent beside it (or with `PLAYAC_LIBS`) adds them as `remote.call` hints.
- Translations on any disc: open the game with `?moddev=1&modlang=fr` (de, es, it, en) and `message()` answers in that language for the session.
- `data_migrated` (`e.from`, `e.to`) runs as the town loads, NOT at the restart, before any other event in that town.
- `data_migrated` runs only for data that exists: on a fresh install there is none, so it is not called, and the first `store.set` writes at the current `data_version`. `from` is 0 for data saved before the mod set a `data_version`.
- World mods (`"scope": "world"`) that count must match for friend visits: same mods, same versions, same order, same settings. Every setting of a World mod counts, so keep cosmetic toggles out of World mods. Just you mods (`"scope": "client"`) never block a visit. When every World mod of the host that counts is a reviewed version from the mod list, the visitor can load them for that visit only: nothing is installed, they run with the host's settings (a text setting changed from its default must pass the site's word checks, or the visit is refused) and an empty store that is never kept, and at the visitor's home (the restarts before and after the trip) their shop, Nook goods, board notices, items, renames and commands do nothing. A mod installed from a file cannot be lent, so publish World mods. A World mod that depends on a Just you mod cannot load for a friend without that Just you mod, so the visit is refused: World mods should depend only on World mods.
- In The City, World mods' shops and board notices switch off and every command is refused; textures, lines and scripts keep running for the player.

## mod.json

```json
{
  "schema": 1,
  "api": 1,
  "id": "yourname.my-mod",
  "name": "My Mod",
  "version": "1.0.0",
  "authors": ["yourname"],
  "description": "What it does, in a sentence or two.",
  "scope": "client",
  "content": {
    "textures": "textures/",
    "messages": "messages/en.json"
  },
  "scripts": { "main": "main.lua", "events": ["villager_talked", "day_started"] },
  "assets_original": true
}
```

- Required: `schema` (1), `api` (1), `id`, `name`, `version`, `authors`, `scope`, `assets_original: true`.
- `id`: `author.mod-name`, lowercase letters, digits and dashes, one dot. Never change it after sharing. `playaconline`, `official`, `admin` and `example` are reserved author names.
- `version`: `"1.0.0"` style, three numbers, no leading zeros.
- `scope`: `"client"` (only the player sees it) or `"world"` (changes the town for visitors; REQUIRED for shops and board notices).
- `content`: the keys listed above. Paths are exact, case-sensitive, relative to mod.json.
- `scripts.events`: every event the script uses with `on()`, each once. An `on()` for an event NOT in `events` raises an error at load and the whole script stops (the mod still installs): always add the event to `events`. A library mod that only offers `remote.add` functions still lists one event and registers no handler for it.
- `settings`, one of each type: `[{ "name": "greet", "type": "bool", "label": "Say hello", "default": true }, { "name": "price", "type": "number", "label": "Fruit price", "default": 600, "min": 100, "max": 5000 }, { "name": "drink", "type": "choice", "label": "Drink", "default": "tea", "choices": ["tea", "coffee"] }, { "name": "motto", "type": "text", "label": "Shop motto", "default": "", "max_length": 40 }]`. name 1 to 32 of `a-z 0-9 _` starting with a letter; label 1 to 60 characters; optional description up to 200; at most 16. Read with `settings.get("price")`.
- `permissions`: every command the script uses (`cmd.<name>`).
- JSON is strict: double quotes, no comments, no trailing commas, no key twice.
- A key the game does not know is refused, in mod.json and in every data file except messages, and the message names the closest key: `mod.json: unknown key "permisions" (did you mean "permissions"?)`.

## shops.json (World mods only)

```json
{
  "shops": [{
    "target": "flower",
    "name": "Tea House",
    "hours": { "open": "15:00", "close": "01:00" },
    "greeting": "Welcome in!",
    "stock_line": "Fresh fruit on every table.",
    "stock": [{ "item": "0x2800", "price": 600 }]
  }]
}
```

- `target` is `"flower"` or `"nook"`, at most one entry for each. Flower: `name` 1 to 40 characters, `hours` two-digit 24-hour times, open and close different, close may pass midnight (the shop still shuts 2 AM to 7 AM), `greeting` and `stock_line` 1 to 160 characters, at most 3 line breaks, 1 to 6 goods. Nook: only `mode` (`add` or `replace`) and `stock`, 1 to 16 goods.
- `item` is a STRING `"0x"` + 4 hex digits, or one of the mod's own items by full id (`"yourname.my-mod:tea-chest"`). `price` optional, whole Bells 1 to 99999; below the good's floor it is raised to it (the floor is what Nook pays; a town fruit at the flower shop is 500).
- What each shop may stock is in `reference/items.md` (flower and Nook's columns). The flower shop needs a good with a shop table model: none of the game's own furniture has one, but the mod's OWN items always work there. Nook's sells the game's furniture, clothing, stationery, carpets, wallpaper, tools, umbrellas, paint, saplings, flower bags; not fruit. Money, tickets, grab bags, turnips and fossils never. A refused good is left out, with the reason on the Mods tab row after a restart; `playac-mod check` warns first.

## messages/en.json

```json
{ "greet": "Hello there!", "shop.hours": "We open at three." }
```

Ids 1 to 48 of `a-z 0-9 _ . -`; at most 256 lines; each 1 to 400 bytes. Lines wrap by width, not by a count of characters: a line holds 180 pixels of the game's font (about 24 letters, more of narrow ones, fewer of wide ones), 4 lines to a page; characters the font lacks show as `?`. A script reads its own line with `message("greet")` and another mod's with `message("author.mod:greet")` (nil when that mod is not installed). `content.messages` may be a folder of `en.json` plus `de es fr it` translations.

## Scripts (Lua 5.4)

```lua
-- main.lua: the top level runs once at start, BEFORE any town is loaded.
-- Register handlers here. Read and save the store only inside events.
-- Every handler gets ONE table, e. A field with nothing to say is nil.
on("villager_talked", function(e)   -- e.villager = { id, name, species, personality }
  if store.get("met_" .. e.villager.id) then return nil end
  store.set("met_" .. e.villager.id, true)
  return message("greet")           -- the villager says this, then their usual hello
end)

on("day_started", function(e)       -- e = { year, month, day, weekday }
  local today = ("%04d-%02d-%02d"):format(e.year, e.month, e.day)
  if store.get("last_day") ~= today then  -- a restart the same day does not fire it again; count by date
    store.set("last_day", today)
    store.set("days", (store.get("days") or 0) + 1)
  end
  log("day", store.get("days"))
end)
```

- `store` is per mod per TOWN (8 KB): `store.get` answers nil and `store.set` is refused at the top level, before a town loads. A town has up to 4 residents and they share `store`; `store.player.get/set` is per mod, per town, per player, inside the same 8 KB: keep anything one resident earns (a quest, today's gift) there. `game.player()` is `{ name, id }`. `store.client` is per browser. Strings, numbers, booleans only; `set(key, nil)` deletes.
- Every `store.set`, `store.player.set` and `store.client.set` writes the mod's file in the save folder before it returns. The browser keeps the save folder at the game's next save sync (a game save, and a mod-data upload at most every 2 minutes for the cloud). A tab closed before that sync loses the last sets.
- Ids are numbers in Lua (`e.item == 0x2800`). JSON files write them as `"0x2800"` strings. `cmd.*` take a number, `"0x2800"` or the mod's own `"author.mod:thing"`.
- `rng()`, `rng(n)`, `rng(m, n)`: each call gives the mod's next number for this town and game day, so calls differ and a reload carries on (it cannot reroll). `math.random` and `math.randomseed` are not available: calling one stops the script with an error that says to use `rng()`. `game.day_number()` is the game day as one whole number.
- `log(...)` writes a line in the Mods tab's **Mod log** and the browser console as `[Mods] <id>: ...` (20 per event, 500 per session).
- `villager_talked`: the FIRST mod in load order whose handler returns a line wins. Textures and shops: the LAST mod wins (so a mod loaded in developer mode, which loads last, wins textures and shops but not a talk). Talk pools from every mod are pooled, not ranked. `command_finished` and `question_answered` go only to the mod that asked, `data_migrated` only to the mod whose data version moved; every other event runs every mod's handlers.
- Commands (`cmd.send_letter{...}`, `cmd.give_item(item)` ...) return the command's id, or `nil, message, code`; the outcome arrives as a `command_finished` event: `e.ok` true with `e.via`, or `e.ok` false with `e.code` and `e.message`. The code says whether to try again (the codes are listed above and in `reference/api.md`). Mark a reward as given only in `command_finished` when `e.ok`; on `e.code == "command-day-cap"` try tomorrow, on `"command-no-room"` or `"command-queue-full"` try later, on any other code do not try again. At most 4 per event; daily caps and every command's arguments in `reference/api.md`. A question with answers:

```lua
-- mod.json: "permissions": ["ask", "show_line"], "scripts": { "main": "main.lua", "events": ["scene_entered", "question_answered"] }
local asked = false
on("scene_entered", function(e)     -- e = { scene, name }: name is "player_house", "museum"..., or nil
  if asked then return end
  asked = true
  cmd.ask{ text = "Join the fishing derby?", choices = { "Sign me up!", "No thanks" } }
end)

on("question_answered", function(e) -- e = { id, choice, text }: choice counts from 1; nil if closed with no pick
  if e.choice == 1 then cmd.show_line("You're in the derby!") end
end)
```

- A letter body is 192 pixels a line in the game's font: about 30 characters of ordinary English a line, 6 lines (capitals, m and w are wider: 19 W's fill a line; words never split). Keep text a script builds under about 150 characters with at most 5 line breaks; `cmd.send_letter` refuses one that does not fit at once: it returns `nil, message, code`. Plain US keyboard characters only.
- `fish_caught` gives `e.item` (the fish) and `e.pocketed`; there is no size or length.
- Over a limit, or on any Lua error (syntax errors included), the script stops for the session and the Mods tab row says why with the line; the rest of the mod keeps working. `pcall` does not get around the budget. Payloads are copies. No `__gc`, no `__len` passed to table functions.

## Testing checklist

1. `playac-mod check` (or install the ZIP: the Mods tab refuses with the reasons). Read every warning.
2. Restart the game and read the mod's row in Settings, Mods: anything the game itself refused (shop items, a script that stopped) is listed there.
3. Script output: the Mods tab's **Mod log** (log() lines, errors with a traceback, stops, refused files, live), and the browser console (F12, Console), lines starting `[Mods] yourname.my-mod:`.
4. Something broke the game? Settings, Mods, **Start without mods**, or add `?nomods=1` to the play address.
5. Before sharing: no file you did not make, unchanged textures deleted, version raised, description says what it does, a screenshot ready.

## Sharing and review

1. Sign in at playaconline.com with two-factor sign-in on. Settings, Mods, Share a mod. The first time, confirm age 13+ and accept the mod rules.
2. Upload the ZIP (or Import from GitHub). The automatic checks answer at once (the same rules, plus image checks: unchanged game textures, DDS formats, mipmaps).
3. A moderator reviews it, usually within 7 days. Refusals and removals come with a reason code (`review-*` in `reference/errors.md`) and a note. Every upload sends the author an email.
4. Updates: raise `version` and upload again. Players who have it see "Update available". A version the moderators removed is switched off in every player's game.

## Troubleshooting: always use the errors catalogue

When the user pastes an error, find it in `reference/errors.md` (search a distinctive phrase; the page's, the site's and the game's wordings are all listed) and answer with: the code, what it means in one sentence, and the exact fix applied to THEIR file. Link `https://playaconline.com/modding/errors/#<code>`. A Lua syntax error (`main.lua:7: 'end' expected near <eof>`) is `script-syntax`; any other Lua error with a file and line is `script-error`: open that line.

Common ones: no mod.json at the top of the ZIP (`zip-no-manifest`: zip the folder's contents, not a parent folder); a `"scope": "client"` mod with shops (`shops-need-world`); `"item": 0x2800` without quotes (`shop-item`); an event used with `on()` but missing from `scripts.events` (`script-on-event`); a misspelt key (`unknown-key`); a texture that does not show (the name must be exact, check it with the inspector's Copy name; a DDS saved with one level; a later mod in load order may replace it).

## How to answer

- Give COMPLETE files, ready to save, never fragments with "...".
- Check every file against the rules above before you give it: required keys, `"api": 1`, string item ids, `scripts.events` matching `on()` calls, permissions matching `cmd.` calls, scope world for shops, limits.
- Prefer the smallest mod that does what they asked. Say what it cannot do instead of faking it.
- Remind them to raise `version` when they change a shared mod.
- No Nintendo names in ids, names or descriptions you write.
