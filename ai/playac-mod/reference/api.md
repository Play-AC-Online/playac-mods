# Mod API reference

Generated from https://playaconline.com/schemas/api.json, the mod API spec. Do not edit by hand.

This game reads mod API level 1. Put `"api": 1` in mod.json: a mod.json without "api" is refused.

Versioning: A level is read for at least 12 months after the next level ships. A deprecated name keeps working for at least two more levels and at least 90 days, whichever is later.

- Level 1 (2026-11-16): The first level. Content is textures, lines (a messages file), shops (the flower shop and Nook's stock), new furniture on a vanilla base (an items file, renames), letter templates, calendar days and villager line pools. Scripts get sixteen events, each handed one table. They also get log, message, the game queries, a store per town with a part per player and one per browser, settings, remote calls between mods, a seeded rng and timers on the game clock. Six commands (cmd.send_letter, give_item, show_line, ask, take_item, take_bells) are declared in permissions and applied at the end of a frame's update. Mods also have depends and conflicts with version ranges, and data_version with the data_migrated event. Mods can name optional_depends, and a setting can be world or client.

## mod.json

| key | required | what | example |
|---|---|---|---|
| `$schema` | no | Optional. The JSON Schema an editor checks mod.json against, for autocomplete and errors as you type. The game ignores it. since api 1 | `"https://playaconline.com/schemas/mod.schema.json"` |
| `schema` | yes | The manifest format. Always 1. since api 1 | `1` |
| `api` | yes | The mod API level the mod is made for. The game checks a mod by the rules of its own level. It runs an older level through shims while that level is supported. Use the newest level. since api 1 | `1` |
| `id` | yes | author.mod-name, in lowercase letters, digits and dashes, with one dot. The author parts playaconline, official, admin and example are reserved for the site's own mods in the mod list. The mod list also refuses an author part that passes for one of them (official-, examples, playaconline-official). since api 1 | `"yourname.tea-stall"` |
| `name` | yes | The name players see, 1 to 60 characters after trimming spaces. The mod list also refuses a name with a line break, another control character or a hidden text-direction character. since api 1 | `"Tea Stall"` |
| `version` | yes | x.y.z, each part 1 to 9 digits with no leading zero. Every upload needs a version number this mod has not used yet. The number of a refused upload can be used again. since api 1 | `"1.0.0"` |
| `authors` | yes | 1 to 8 names, each 1 to 40 characters. The mod list also refuses a name with a line break, another control character or a hidden text-direction character. since api 1 | `["Your Name"]` |
| `description` | no | Optional text of at most 500 characters. null is refused. Leave the key out instead. since api 1 | `"The flower shop becomes a tea stall in the evening."` |
| `tags` | no | Optional. The mod list's filters: at most 5 different tags from a fixed list, lower case. Players filter the mod list by them. The game never reads them. Anything else is refused (manifest-tags). since api 1 | `["textures","seasonal"]` |
| `scope` | yes | client is a Just you mod, which only you see. world is a World mod, which changes what a visitor to your town would see. Only a World mod may hold a shop (content.shops) or a calendar file with a board notice. A friend visit needs the same World mods that count (see visit_scope) on both sides. since api 1 | `"client"` |
| `content` | no | What the mod adds, each a path inside the mod: textures, messages, shops, items, letters, calendar and talk. Anything else is refused. textures names a folder, and every other key names one file. There are no translations: every text shows as written. since api 1 | `{"messages":"messages/en.json"}` |
| `scripts` | no | A Lua script and the events it listens to. events may list data_migrated only with a data_version. since api 1 | `{"main":"main.lua","events":["villager_talked","day_started"]}` |
| `permissions` | no | The commands the mod's script may queue, each once. The game refuses any command the list leaves out. The Mods tab and the moderators' review show what the list lets the mod do. take_item and take_bells let the mod ask the player for items or Bells. The game itself shows the question with the true item and amount, and nothing is taken unless the player says yes. Needs scripts. since api 1 | `["send_letter"]` |
| `exports` | no | A library's remote functions by name, each with a one-line description. These are what other mods may remote.call. At most 32 names, each 1 to 32 of a-z 0-9 _. Each description is 1 to 120 characters on one line. When exports is declared, the game lets remote.add offer only these names. The Mod log says when a listed name was never offered. Needs scripts. since api 1 | `{"count_pieces":"How many workshop pieces the player bought, as a whole number."}` |
| `assets_original` | yes | Must be true. It is your promise that the mod holds only work its authors made, never files taken from the game. since api 1 | `true` |
| `renames` | no | Maps an old full item id of this mod to the full id of an item in this mod's items file. At most 64. Needs content.items. Each rename runs once per save, and mod-items.json records it. A renamed item already in a house therefore keeps working. since api 1 | `{"yourname.tea-stall:old-cup":"yourname.tea-stall:cup"}` |
| `depends` | no | Mods this one needs, as mod id to version range. A range is "*", or up to 4 comparisons (>= <= > < = and a version) split by one space. At most 16. This mod loads after them. It does not load when one is missing, off, out of range or not loading. The game checks again when it starts: a mod whose dependency is not loaded before it, in range, is not loaded at all. since api 1 | `{"yourname.tea-lib":">=1.0.0 <2.0.0"}` |
| `optional_depends` | no | Mods this one can use but does not need, as mod id to version range. Ranges are written as in depends. At most 16. This mod always loads. An optional dependency is present when it is installed, switched on, loading and inside the range. A present one loads before this mod. One that is missing, off, not loading or outside the range is absent, and nothing waits for it. A script asks with remote.version(id). remote.call to an absent one returns nil, a message and a code. It is not an error. A mod id may be in only one of depends, optional_depends and conflicts. since api 1 | `{"yourname.tea-lib":">=1.0.0 <2.0.0"}` |
| `conflicts` | no | Mods this one cannot run with, as mod id to version range. At most 16. A mod id may be in only one of depends, optional_depends and conflicts. This mod stays off while a matching one is on. since api 1 | `{"someone.other-shop":"*"}` |
| `data_version` | no | A whole number 1 to 1000000 for the shape of what the scripts save. When it changes, the data_migrated event runs once per town. Listing data_migrated in scripts.events needs it. since api 1 | `1` |
| `settings` | no | At most 16 settings the player sets on the Mods tab and scripts read with settings.get. The types are bool, number (whole, with min and max), choice (2 to 16 choices) and text (max_length 1 to 200). A setting may say "scope". "world" is the default: the value is part of the town, a friend visit compares it, and a visitor lent the mod runs the host's value. "client" is the player's own: it is never compared or sent, and each player keeps theirs on a visit. Use client for a choice that only changes what its own player sees or hears. since api 1 | `[{"name":"greet","type":"bool","label":"Say hello","default":true,"scope":"client"}]` |

Reserved keys, refused: `game`, `save`. Top-level keys reserved for planned features. Each is refused, even when null, so no mod carries one a later game would start obeying. Any other key mod.json does not list above is refused too (unknown-key), and the message names the known key it is closest to.

### Rules across keys

- content.shops requires scope world.
- A key the game does not know is refused. This applies at the top of mod.json, at the top of the shops, items, letters, calendar and talk files, and in each of their entries (a shop, a stock entry, an item, a letter, a calendar day, a talk pool). The messages file is the exception, because its keys are the lines. The message is <file>: unknown key "<key>", followed by (did you mean "<known>"?) when a known key is close. $schema is known wherever a file may carry it. Keys are case-sensitive.
- Duplicate keys and \u0000 are refused in every JSON file.
- A mod may hold only these file types (case-insensitive).
- All mods share 4 ms of Lua time a frame. Past it, every game event without an answer (day_started, item_picked_up, scene_entered and the others) waits for the next frame. Events wait in order for each mod, at most 64 at a time, and one past that is dropped. villager_talked is skipped for the rest of that frame, so the villager says their own greeting. A mod with events still waiting is not asked for a villager_talked line until they have run. The next mod is asked instead. Each mod therefore sees its own events in the order they happened. A remote.call into a mod is not one of its events. It runs at once, inside the caller's event. command_finished and question_answered wait too, but are never dropped or skipped. A command queued by a command_finished handler is applied at the next frame boundary, not the one that delivered the result. data_migrated runs as a town loads, outside the limit.
- scripts.events may list data_migrated only with a data_version.
- A mod id may be in only one of depends, optional_depends and conflicts. None of them may name the mod itself.
- A World mod that declares world settings adds a hash of their values to its entry in the list of mods a friend visit compares. The entry gains +<sha256 of "name=value\n" per world setting, sorted>. The visit's list of mods carries that hash and the values too, so two towns on one mod with different settings are told "same mod, different settings". A setting whose scope is client is not in the hash, and its value is never in the list. A mod with only client settings adds no hash. A mod with no client setting hashes as it did before scopes existed.
- Which mods a friend visit compares. A Just you mod never counts. A World mod counts if its content has textures, shops or items (visit_scope_content), or if its permissions are not a list of strings. Every other World mod does not count. That covers a mod with only lines, letters, calendar days or talk pools. No command makes a mod count. send_letter, give_item, take_item and take_bells are refused on a visit, and show_line and ask show only to their own player. Only mods that count must match between the two towns. An optional dependency is a mod like any other here. When it is a World mod that counts, it is in the list, and installing it changes what a visit compares.
- The content keys that make a World mod count for visits, whatever its permissions. They are what a visitor must draw or meet in the town.
- What needs scope world, because it changes the town a visitor sees: a shops file (content.shops), and a calendar file with a board notice. Everything else may be client (only you see it) or world.
- When two mods change the same thing, the last in load order wins it whole. For each shop target (the flower shop, Nook's stock), nothing is merged. The later mod's shop is the shop. The earlier mod's row in the Mods tab says its shop is not used and names the mod that has it. Shops are not merged for three reasons. A good is known on the shelf by its game item alone, so two mods' items made on the same base piece could not be told apart at the till. A flower shop's name, hours and lines are written for its own goods. The shelves are few, so a merge would cut each mod's stock by what else is installed. For a texture, the kind of file comes first. A file for one exact palette (tex1_..._<tlut>_<fmt>) beats any mod's every-palette file (tex1_..._$_<fmt>) for the same texture, whatever the order. Between two files of the same kind, the later mod's is drawn. A mod's texture of either kind beats the HD pack's.
- The villager_talked event goes to mods in load order. The first handler that returns a line wins that talk, and later mods' villager_talked handlers are not asked. This applies only to the event. The villager lines of talk files and calendar files are not first-wins. Every mod's matching pools are put together and one line is picked from all of them. The pick depends on the day and the villager, so it is the same line all day.
- Developer mode reloads these while you play, with no restart: the content files named here, any .lua script ("scripts") and the files under content.textures. Developer mode means a mod loaded from a folder or from playac-mod dev. Each value is a content key, or "scripts".
- Developer mode loads a change to these only when the game restarts: mod.json and the content files named here. mod.json is read once at start, and so is a file added or removed. Each value is "mod.json" or a content key.
- Visiting with the host's mods. When every World mod of the host that counts is a reviewed version from the mod list, a visitor can load them for that visit only, after agreeing. They run with the host's world settings. Each mod's world values travel with the visit, are checked against what its mod.json allows, and are never kept on the visitor's game. A text setting the host changed from its default must pass the site's word checks (no rude words, contact details or risky phrases). If it does not, the visit is refused instead of lent. A client setting is the visitor's own. It keeps the value the visitor set on their installed copy of the mod, and it is the default when the visitor does not have the mod. Nothing is installed. The game restarts with the lent mods, and their scripts start with an empty store that is never saved. A lent mod acts only in the host's town. At home, in the restart before the trip and the one after it, its shop, Nook goods, board notices, items, renames and commands do nothing. It therefore never changes the visitor's own town or save. A mod installed from a file cannot be lent. Nothing is lent while mods are switched off for everyone. A set that would not load whole on the visitor's game, in the host's order, with the visitor's own Just you mods and under the same limits, is refused before the restart.
- The City's own mod set is a short list chosen by the site and changed only with a release. A City mod may hold only textures and messages. It has no shops, no scripts and no permissions.
- A calendar file with a board notice requires scope world. The board is the town's, and a visitor reads it.
- A calendar day's "letter" goes out once per day per town. It goes out only in the player's own town, not on a visit and not in The City. It counts against the mod's daily send_letter limit. A refusal is written to the Mod log, never to a script.
- The characters the game's font draws in a mod's lines (messages, talk lines, shop greetings, show_line and ask). Every printable ASCII character is drawn, except $ * ^ | \ which are each drawn as ?. The characters # + / ; are drawn by the font's own signs. [ ] { } are drawn as ( ), ` as ' and ~ as the villagers' wavy tilde. The letters and signs listed here are drawn too. Curly quotes, dashes, the ellipsis and a no-break space become their ASCII spelling. Any other character is drawn as ?. Letters and board notices take plain ASCII only. values holds the extra characters, from the font's own table.
- permissions requires scripts, because only a script can use a command.
- exports requires scripts, because only a script offers functions.
- Nothing of a mod runs outside the player's own game. At the title screen, at player select and in the intro no event fires, no timer fires, no command is applied, no calendar letter goes out and no town data is loaded, so data_migrated does not run there either. The title screen plays a demo in the player's own save with the clock set to a date in 2001. A script never sees that date. Whatever was waiting keeps waiting and carries on when play starts: a timer that came due fires then, and a command queued before a save and quit is applied then. The one part of a script that runs outside the game is its main chunk, at start, before a town loads.
- An event handler never changes the game. Each cmd.* call queues a command. The game applies the queue at one point in each frame: at the end of the game's update, after the world moves and before that frame is drawn. It applies commands only while the player is free, which means not in a talk, menu, cutscene, door or scene change. A command's result comes back as a command_finished event to the mod that queued it.
- Every command is refused in The City. On a visit to a friend's town, send_letter, give_item, take_item and take_bells are refused, because only the town owner's game changes a town or a player's save. show_line and ask still run.
- A letter's present and a given item follow the shop's item rules: no money, turnips, tickets, grab bags, fossils or reserve ids. give_item also takes this mod's own new item by its full id. Full pockets refuse a mod item, because a letter cannot carry its identity. A plain item comes by letter instead.
- In Lua an id is always a number, never a hex string. That holds for an item, a villager and a scene. JSON data files write an item as a string, "0x2800". The commands take an item as a number, as "0x2800", or as the mod's own "author.mod:thing".
- A setting is world or client. A world setting is part of the town. A friend visit compares it, and a visitor lent the mod runs the host's value. A client setting is the player's own. It is never compared and never sent, and on a visit each player runs their own value. A client setting may decide only what its own player sees or hears: a line, a question, a display choice. It may not decide what the town gets or gives up. The game checks this where it can. In an event that read a client setting with settings.get, a command that changes the town is refused with the code command-client-setting. Those commands are the values of this rule. The check covers one event. A value kept in a variable, in store or in a timer's data and used in a later event is not caught, and neither is a value passed through remote.call. timer.after is not refused after a client setting was read, because a timer that only shows its player a line later is a proper use. Those cases are the modder's to avoid. Their failure is silent: the host's town gets what the host's value says, while a visitor's copy of the mod runs the visitor's value and can show a line that does not match.
- Load order with optional dependencies. A present optional dependency loads before the mod that names it, exactly as a needed one does. An absent one changes nothing. Present means installed, switched on, loading and inside the range. A mod whose optional dependency is outside the range still loads, and that dependency counts as absent for it.
- A cycle through an optional dependency never stops a mod from loading. When every mod left to place waits for another, the earliest of them in the player's order whose needed dependencies are all placed loads next. It loads before the optional dependencies it was waiting for, and they load after it. Such a dependency is still present. remote.version and remote.call work in events. Only the promise that it loads first is dropped for that one mod, so its main chunk must not count on the dependency. A cycle made only of needed dependencies is still refused.

## Files

### shops (`content.shops`)

Restocks and rewords a shop: the flower shop or Nook's. For target nook, the goods are added to or replace the day's roll per spot kind, in every store size, from the next restock. Nook's goods are off in The City. The game itself, not the page or the mod list, refuses goods with no shelf model, money, turnips, tickets, grab bags, fossils and reserve ids. It raises a price below the item's buy-back to the buy-back. items.json lists what may be stocked. A good may be an item of the same mod, by its full id. Without a price it takes the item's price. When two switched-on mods change the same shop, the one later in the load order has it whole and the other's is not used (rule load_order_last_wins). The earlier mod's row says so. (since api 1)

Schema:

```json
{
  "type": "object",
  "required": [
    "shops"
  ],
  "additionalProperties": false,
  "properties": {
    "$schema": {
      "type": "string"
    },
    "shops": {
      "type": "array",
      "minItems": 1,
      "maxItems": 2,
      "items": {
        "type": "object",
        "required": [
          "target",
          "stock"
        ],
        "additionalProperties": false,
        "properties": {
          "target": {
            "enum": [
              "flower",
              "nook"
            ],
            "description": "Which shop: \"flower\" or \"nook\". One shop per target. A nook entry takes only mode and stock."
          },
          "name": {
            "type": "string",
            "minLength": 1,
            "maxLength": 40,
            "description": "The shop's name on its sign, on one line with no line break.",
            "pattern": "^[^\\n]*$"
          },
          "hours": {
            "type": "object",
            "required": [
              "open",
              "close"
            ],
            "properties": {
              "open": {
                "type": "string",
                "pattern": "^([01][0-9]|2[0-3]):[0-5][0-9]$"
              },
              "close": {
                "type": "string",
                "pattern": "^([01][0-9]|2[0-3]):[0-5][0-9]$"
              }
            },
            "description": "HH:MM. Open and close must differ. Close may be past midnight. Hours can only shorten the shop's own."
          },
          "greeting": {
            "type": "string",
            "minLength": 1,
            "maxLength": 160,
            "description": "What the keeper says first. At most 3 line breaks."
          },
          "stock_line": {
            "type": "string",
            "minLength": 1,
            "maxLength": 160,
            "description": "What the keeper says about the stock. At most 3 line breaks."
          },
          "stock": {
            "type": "array",
            "minItems": 1,
            "maxItems": 16,
            "items": {
              "type": "object",
              "required": [
                "item"
              ],
              "additionalProperties": false,
              "properties": {
                "item": {
                  "type": "string",
                  "description": "The item id as a string, \"0x\" and 4 hex digits, or the full id of an item in this mod's items file (author.mod:thing). Each item is listed at most once. Two mod items may not share a base.",
                  "anyOf": [
                    {
                      "pattern": "^0x[0-9a-fA-F]{4}$"
                    },
                    {
                      "pattern": "^([a-z0-9][a-z0-9-]{0,31}\\.[a-z0-9][a-z0-9-]{0,47}):([a-z0-9][a-z0-9-]{0,31})$"
                    }
                  ]
                },
                "price": {
                  "type": "integer",
                  "minimum": 1,
                  "maximum": 99999,
                  "description": "The price in Bells. Leave it out for the game's own price."
                }
              }
            },
            "description": "The flower shop: 1 to 6 goods, one per table spot. Nook's: 1 to 16 goods, each in a spot of its own kind."
          },
          "mode": {
            "enum": [
              "add",
              "replace"
            ],
            "description": "Nook's only. \"add\" (the default) puts the goods in at most half of each kind's spots. \"replace\" puts them in all of them."
          }
        },
        "allOf": [
          {
            "description": "The flower shop sells at most 6 goods, one per table spot. Nook's sells up to 16.",
            "if": {
              "required": [
                "target"
              ],
              "properties": {
                "target": {
                  "const": "flower"
                }
              }
            },
            "then": {
              "properties": {
                "stock": {
                  "maxItems": 6
                }
              }
            }
          }
        ]
      }
    }
  }
}
```

### messages (`content.messages`)

Lines a script or another mod can use, by key. A script reads its own with message("key") and another mod's with message("author.mod:key"). This file cannot carry a $schema key, because every key is a line. Point your editor at messages.schema.json in its settings instead. (since api 1)

Schema:

```json
{
  "type": "object",
  "maxProperties": 256,
  "propertyNames": {
    "pattern": "^[a-z0-9_.-]{1,48}$"
  },
  "additionalProperties": {
    "type": "string",
    "minLength": 1,
    "description": "1 to 400 UTF-8 bytes. Lines wrap by width, not by a count of characters. A row holds 180 pixels of the game's font, which is about 24 letters. Narrow letters like i and l take less room, and wide ones like W and m take more. A page holds 4 rows."
  }
}
```

### textures (`content.textures`)

A folder of replacement textures, named the way Dolphin names a custom texture. A mod's texture beats the HD pack. Among mods, the one lower in the list wins. The exception is that a file for one exact palette beats any mod's "$" (every palette) file for the same texture (rule load_order_last_wins). All mods' DDS textures together may take 96 MB on the graphics card, or 24 MB on a phone. Their PNGs may take 96 MB of pixels, or 24 MB on a phone. A texture past its limit is left out and named on its mod's row. A mod's texture is read a little each frame after it is first drawn, so the game's own texture shows for a moment before it. Use the texture inspector (Settings, Mods, Developer) to find a texture's name. (since api 1)

### scripts (`scripts.main`)

Lua 5.4 source text, run once when the game starts. Bytecode is refused. The script registers handlers with on() and returns nothing. Each mod has its own Lua state, and mods cannot see each other's globals. (since api 1)

### items (`content.items`)

New furniture, each on a vanilla base piece. The game also refuses a base with no model, fossils, gyroids, clothing, design pieces and pieces that become a pocket item. In the save, a mod item is its base piece. A file beside the save (mod-items.json) maps it back. Removing the mod therefore leaves the base piece behind, and reinstalling restores the mod item. That file belongs to the save it was written beside. Next to another save of the same town, such as a backup put back or an older town file imported, it is not used. Those pieces are then plain base pieces again. (since api 1)

Schema:

```json
{
  "type": "object",
  "required": [
    "items"
  ],
  "additionalProperties": false,
  "properties": {
    "$schema": {
      "type": "string"
    },
    "items": {
      "type": "array",
      "minItems": 1,
      "maxItems": 64,
      "items": {
        "type": "object",
        "required": [
          "id",
          "name",
          "base"
        ],
        "additionalProperties": false,
        "properties": {
          "id": {
            "type": "string",
            "pattern": "^[a-z0-9][a-z0-9-]{0,31}$",
            "description": "The item's own id. Its full id is <mod id>:<id>."
          },
          "name": {
            "type": "string",
            "pattern": "^[A-Za-z0-9](?:[A-Za-z0-9 '.,!&-]{0,14}[A-Za-z0-9'.,!&-])?$",
            "description": "1 to 16 characters: letters, digits, space and ' . , ! & -. It starts with a letter or digit and does not end with a space."
          },
          "base": {
            "type": "string",
            "pattern": "^0x[0-9a-fA-F]{4}$",
            "description": "A south-facing furniture id: 0x1000 to 0x1FFC or 0x3000 to 0x33C4, a multiple of 4."
          },
          "price": {
            "type": "integer",
            "minimum": 1,
            "maximum": 99999,
            "description": "The price in Bells. Leave it out for the base piece's price."
          }
        }
      }
    }
  }
}
```

### mod-items sidecar (`none (engine-owned)`)

/save/card_a/mod-items.json. The game writes it beside the home save, and a mod never reads or writes it. It records which placed or carried base pieces are which mod item, and which renames have run. It rides in the cloud save and in a friend visit's town copy. (since api 1)

### letters (`content.letters`)

Letter templates that a mod command (send_letter) mails through the mailbox, named "<mod id>:<letter id>". The game wraps the body at the paper's width in its own font and refuses one that needs more than 6 lines. It also refuses a present that is money, turnips, a ticket, a grab bag, a fossil or not an item. Either scope. (since api 1)

Schema:

```json
{
  "type": "object",
  "required": [
    "letters"
  ],
  "additionalProperties": false,
  "properties": {
    "$schema": {
      "type": "string"
    },
    "letters": {
      "type": "array",
      "minItems": 1,
      "maxItems": 32,
      "items": {
        "type": "object",
        "required": [
          "id",
          "header",
          "body",
          "footer"
        ],
        "additionalProperties": false,
        "properties": {
          "id": {
            "type": "string",
            "pattern": "^[a-z0-9_.-]{1,48}$",
            "description": "Unique in the file."
          },
          "header": {
            "type": "string",
            "minLength": 1,
            "maxLength": 32,
            "description": "1 to 24 characters besides at most one {player}, where the name goes. No line break. Plain text: printable ASCII, no { or }."
          },
          "body": {
            "type": "string",
            "minLength": 1,
            "maxLength": 192,
            "description": "1 to 192 characters on at most 6 lines. Plain text: printable ASCII, no { or }."
          },
          "footer": {
            "type": "string",
            "minLength": 1,
            "maxLength": 32,
            "description": "The sign-off at the foot of the letter, 1 to 32 characters. Plain text: printable ASCII, no { or }. The mailbox list shows only its first 8 characters unless the letter has a sender."
          },
          "sender": {
            "type": "string",
            "minLength": 1,
            "maxLength": 8,
            "description": "Optional. The name in the mailbox list, 1 to 8 characters, which is all the list has room for. Without it the list shows the footer's first 8 characters, so \"The Lantern Keepers\" reads \"The Lant\". The letter itself always signs with the whole footer. Plain text: printable ASCII, no { or }."
          },
          "item": {
            "type": "string",
            "pattern": "^0x[0-9a-fA-F]{4}$",
            "description": "A present, optional."
          },
          "paper": {
            "type": "integer",
            "minimum": 0,
            "maximum": 63,
            "description": "The stationery, default 0."
          }
        }
      }
    }
  }
}
```

### calendar (`content.calendar`)

Calendar days: dated days with safe effects only, and no script. A day can have a notice on the town bulletin board. The notice is posted once on the day in the player's own town, never on a visit or in The City, and needs scope world. A day can have villager lines for the day, which come ahead of talk pools. A day can have a letter from the same mod's letters file. The letter is mailed once on the day to the player's mailbox in their own town, never on a visit or in The City, and counts against the mod's daily letter limit. A day cannot add decorations, because the game has no data format for them. (since api 1)

Schema:

```json
{
  "type": "object",
  "required": [
    "days"
  ],
  "additionalProperties": false,
  "properties": {
    "$schema": {
      "type": "string"
    },
    "days": {
      "type": "array",
      "minItems": 1,
      "maxItems": 16,
      "items": {
        "type": "object",
        "required": [
          "id",
          "date"
        ],
        "additionalProperties": false,
        "anyOf": [
          {
            "required": [
              "board"
            ]
          },
          {
            "required": [
              "talk"
            ]
          },
          {
            "required": [
              "letter"
            ]
          }
        ],
        "properties": {
          "id": {
            "type": "string",
            "pattern": "^[a-z0-9_.-]{1,48}$",
            "description": "Unique in the file."
          },
          "date": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "month"
            ],
            "description": "{month, day} (February 29 works) or {month, week 1 to 4 or \"last\", weekday 0 Sunday to 6}.",
            "properties": {
              "month": {
                "type": "integer",
                "minimum": 1,
                "maximum": 12
              },
              "day": {
                "type": "integer",
                "minimum": 1,
                "maximum": 31
              },
              "week": {
                "anyOf": [
                  {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 4
                  },
                  {
                    "enum": [
                      "last"
                    ]
                  }
                ]
              },
              "weekday": {
                "type": "integer",
                "minimum": 0,
                "maximum": 6
              }
            }
          },
          "board": {
            "type": "string",
            "minLength": 1,
            "maxLength": 192,
            "description": "A bulletin board notice: 1 to 192 characters on at most 6 lines. Plain text: printable ASCII, no { or }. Needs scope world."
          },
          "talk": {
            "type": "array",
            "minItems": 1,
            "maxItems": 16,
            "items": {
              "type": "string",
              "minLength": 1,
              "maxLength": 160,
              "description": "A villager line: 1 to 160 characters, at most 3 line breaks."
            }
          },
          "letter": {
            "type": "string",
            "pattern": "^[a-z0-9_.-]{1,48}$",
            "description": "The id of a letter in this mod's letters file, mailed on the day. It is mailed once per town per day, the first time the player is free in their own town. It follows the same rules as cmd.send_letter: it goes to the mailbox or else the post office, and counts against the daily letter limit. No permission or script is needed."
          }
        }
      }
    }
  }
}
```

### talk (`content.talk`)

Villager line pools. On an ordinary talk where no script said a line, a villager says at most one data line a day, then their own hello. A special talk never uses a pool. Today's calendar lines come first. Otherwise the most specific matching pools are used: this villager, else this personality, else everyone. When several mods have pools that match, their lines are put together and one is picked. It is not always the first mod's. The game keeps which villagers had their line today per town with the save, so restarting the game does not make them say one again. Either scope. Pools run in The City too. (since api 1)

Schema:

```json
{
  "type": "object",
  "required": [
    "pools"
  ],
  "additionalProperties": false,
  "properties": {
    "$schema": {
      "type": "string"
    },
    "pools": {
      "type": "array",
      "minItems": 1,
      "maxItems": 32,
      "items": {
        "type": "object",
        "required": [
          "lines"
        ],
        "additionalProperties": false,
        "properties": {
          "personality": {
            "enum": [
              "normal",
              "peppy",
              "lazy",
              "jock",
              "cranky",
              "snooty"
            ],
            "description": "Not with villager."
          },
          "villager": {
            "type": "string",
            "minLength": 1,
            "maxLength": 8,
            "description": "A villager's name, any case. Not with personality."
          },
          "chance": {
            "type": "integer",
            "minimum": 1,
            "maximum": 100,
            "description": "Days in 100 the pool speaks to a villager. Default 100."
          },
          "lines": {
            "type": "array",
            "minItems": 1,
            "maxItems": 32,
            "items": {
              "type": "string",
              "minLength": 1,
              "maxLength": 160,
              "description": "A villager line: 1 to 160 characters, at most 3 line breaks."
            }
          }
        }
      }
    }
  }
}
```

## Lua globals

| name | params | returns | what |
|---|---|---|---|
| `on` | event: string, fn: function | nil | Registers a handler for an event. Call it while the mod's own script loads, not from inside a handler and not from a function another mod calls with remote.call. The event must be in mod.json's scripts.events. At most 16 handlers per event. A handler gets one table, e, holding the event's fields. since api 1 |
| `log` | ...: any | nil | Writes a line to the Mods tab's Mod log and the browser console as "[Mods] <id>: ...". Arguments are joined with spaces. A line is cut at 299 bytes. At most 20 lines per event and 500 per session. A refused cmd.* or timer.* call writes a line of its own, and those lines count toward the same two limits. A script error or stop is written to the Mod log too, with a Lua traceback, whatever the limits. The log keeps the newest 400 lines of all mods. When it is full, the oldest line of the mod with the most lines goes first, so one mod cannot push out another mod's lines. since api 1 |
| `message` | key: string | string\|nil | A line from a messages file. "key" reads this mod's own line, and "author.mod:key" reads another mod's. Returns nil when there is no such line. since api 1 |
| `game` |  |  | Read-only facts about the game. since api 1 |
| `store` |  |  | A small saved table per mod, per town. It holds strings, numbers and booleans, up to 8 KB per mod per town. It travels with the town (cloud save, backups, Export with mod data). No town is loaded while the main chunk runs, so get answers nil and set raises an error there. On a visit or in The City it lives in memory only. store.player is this player's part of it. store.client is a separate store per browser. A key cannot start with a control character (a byte under 0x20). Every store.set, store.player.set and store.client.set writes the mod's file in the save folder before it returns. The browser keeps the save folder in IndexedDB at the game's next save sync. That sync happens at a game save, and for the cloud at a mod-data upload at most every 2 minutes. A tab closed before that sync loses the last sets. Daily command counts and the rng counter are written the same way. since api 1 |
| `settings` |  |  | The mod's settings from mod.json "settings", as the player set them on the Mods tab. They are read when the game starts. since api 1 |
| `remote` |  |  | Calls between mods. One mod offers named functions and another calls them. Values are deep copies of nil, booleans, numbers, strings and tables of them, within 64 KB, 16 levels, 4096 values and 8 results. The called function runs on the caller's budget and clock, and going over stops the caller. Its commands count toward the caller's per-event limit. Its rng draws from its own counter. A call into a mod that is already running is refused. since api 1 |
| `cmd` |  |  | The commands. Each queues an effect that the game applies at the end of a frame's update, before the frame is drawn. Each needs its name in mod.json permissions. A call returns the command's id. When it is refused at once, it returns nil, a message and a code (command_codes). In The City every command is refused at once. On a visit send_letter, give_item, take_item and take_bells are refused at once. A command refused at once counts against no daily limit. A command queued at home and applied after the player left comes back as a failed command_finished, and its count is given back. since api 1 |
| `rng` | m: integer\|nil, n: integer\|nil | number\|integer | Seeded random numbers. rng() gives a number in [0,1), rng(n) a whole number 1..n and rng(m, n) a whole number m..n. The seed is the mod, the town, the game day and how many numbers this mod has drawn in this town on this game day. Each call in a day therefore gives another number, and a reload cannot reroll. The count is saved with the town store at the end of a run that drew numbers, and a reload carries on from it. If the tab closes before that write, the same numbers come again, never new ones. A new game day starts the count at 0, and changing the game's clock gives other numbers. The count is kept in memory only away from home, for a lent mod and before a town loads. Inside a remote.call, the called mod draws from its own counter. math.random and math.randomseed are not available. Use rng(). since api 1 |
| `timer` |  |  | Timers. A script asks to be called later, and the game sends it a timer_fired event. Time is counted on the game's clock in whole game minutes, so a timer keeps counting while the game is closed and fires at the first chance after it is due. A timer never fires at the title screen or at player select. It fires once play has started (the rule own_game_only). Timers belong to the town. They are kept in this mod's town store, count toward its store.bytes and survive a save and a reload. On a visit, in The City and for a lent mod they live in memory only and are gone when the town changes. Scene changes do not touch them. A mod may have timers.per_mod waiting in one town. since api 1 |

- `game.time`(): The game's clock now.
- `game.day_number`(): The game clock's day as one whole number: days since 2000-01-01. It goes up by one each game day, so it tells one day from the next without date maths.
- `game.pockets`(): The items the player holds, in slot order: { { slot, item, mod_item }, ... }. Only held items are listed, so an empty slot has no entry. Returns {} when the pockets are empty or before a town is loaded.
- `game.bells`(): The wallet, or nil before a town is loaded.
- `game.town`(): The town: { name, id, year, month, day, hour, minute, weekday, season }, or nil before a town is loaded. season is spring, summer, autumn or winter.
- `game.villagers`(): The town's villagers: { { id, name, species, personality }, ... }. Returns {} before a town is loaded.
- `game.player`(): The player: { name, id }, or nil before a town is loaded. A town has up to 4 residents, each playing it from their own save slot.
- `game.calendar_today`(): The ids of this mod's own calendar days that fall on the town's date today, in file order. Returns {} when there are none, or before a town is loaded. Only the calling mod's days are listed.
- `store.get`(key: string): A value this mod saved in this town, or nil. It is nil while the main chunk runs. Integers come back as integers.
- `store.set`(key: string, value: string|number|boolean|nil): Saves a string, number or boolean under a key in this town. nil deletes the key. Keys are up to 64 bytes and strings up to 1024. A set that would take this town's store over 8 KB raises an error and changes nothing. So does a set before a town is loaded, in the main chunk.
- `store.town`(): Which town the store is for now, as an opaque text that changes when the town does ("v:..." away from home). nil before a town is loaded. Compare it to reload what you keep in locals when the player moves to another town.
- `store.client`: The per-browser store. It has the same get, set and limits, with one store per mod per browser whatever town is loaded.
- `store.player`: This player's part of the town store. It has the same get and set, per mod, per town, per player (game.player().id). It lives inside the mod's town store and shares its 8 KB. Before a town is loaded, get answers nil and set raises an error. With a town but no player in the game yet, get answers nil and set raises its own error (no player is in the game yet). When a resident is deleted, everything mods saved for them here is deleted too and its room is given back. A new resident in that save slot starts with nothing. On a visit it lives in memory only.
- `settings.get`(name: string): A setting's value: the player's, else the default. It is a boolean, an integer or a string. nil for a name the mod does not declare.
- `remote.add`(name: string, fn: function): Offers a function to other mods, while the script loads. Names are 1 to 32 of a-z 0-9 _, at most 32 per mod. With mod.json "exports", only the names it lists.
- `remote.call`(mod: string, name: string, ...: any): Calls a function another running mod offers. Its errors come back as yours, and it keeps running. When the mod is one of this mod's optional_depends and it is absent, nothing is called and nothing is raised: the call returns nil, a message and a code from dependency_codes.
- `remote.has`(mod: string, name: string): Whether a running mod offers that function.
- `remote.version`(mod: string): Whether a mod this one names in depends or optional_depends is present, and at what version. Returns its version, such as "1.2.0", when it loaded inside the range. Returns nil, a message and a code from dependency_codes when it did not. Ask in an event. In the main chunk an optional dependency that the cycle rule placed after this mod has loaded no script yet.
- `cmd.send_letter`(t: table): Queues a letter in the player's own mailbox. The post office keeps it when the mailbox is full. The save holds an ordinary letter, so it loads without the mod.
- `cmd.give_item`(item: integer|string|table): Queues an item into the first empty pocket. With full pockets it comes by letter. Also takes this mod's own new item by its full id (author.mod:thing). A mod item is given with its identity, as a shop sells it, and full pockets refuse it.
- `cmd.show_line`(text: string): Queues a line in the player's own thought window, shown once the player is free. One line or question at a time.
- `cmd.ask`(t: table): Queues a question with 2 to 4 answers in the player's thought window. The pick comes back as a question_answered event.
- `cmd.take_item`(t: table): Asks the player to hand over items from their pockets. The game shows its own question, which names the item, the count and this mod. The mod's name stands between quotes, and a mod item is named as the pockets show it. A script cannot change that text. On yes the items leave the pockets and command_finished says via taken. On no, or when the window closes with no pick, nothing is taken and command_finished carries command-declined. It is refused with command-not-held when the pockets do not hold that many. Only plain pocket slots count. A wrapped present or an item held for a villager's errand is never taken. Items a command cannot give cannot be taken either (money bags, turnips, tickets, grab bags, fossils). It is refused on a visit and in The City, so a lent mod can never take anything.
- `cmd.take_bells`(t: table): Asks the player to pay Bells from their wallet. The game shows its own question, which names the amount and this mod. The mod's name stands between quotes. A script cannot change that text. On yes the Bells leave the wallet and command_finished says via taken. On no, or when the window closes with no pick, nothing is taken and command_finished carries command-declined. It is refused with command-not-held when the wallet holds less than the amount, so the wallet never goes below zero. The bank account and money bags in the pockets are never touched. It is refused on a visit and in The City, so a lent mod can never take anything.
- `timer.after`(minutes: integer, name: string, data: string|number|boolean|nil): Sets a timer that fires once, at least that many game minutes from now. It returns the timer's id. When it is refused it returns nil, a message and a code (timer_codes). Setting a timer rewrites the town store, so it is charged to the event's budget like store.set.
- `timer.cancel`(id: integer): Cancels a waiting timer of this mod in this town. It answers true when there was one. A timer that already fired, or an id from another town, answers false.
## Events (scripts.events)

List each event a script handles in mod.json `scripts.events`. Every handler gets ONE table, `e`: `on("day_started", function(e) ... end)`. A field marked `?` is nil when there is nothing to say.

| event | e | return | when |
|---|---|---|---|
| `villager_talked` | { villager { id, name, species?, personality? } } | string\|nil | The player starts an ordinary talk with a villager. Return a line and the villager says it before their usual greeting. Return nil to stay quiet. The first mod in load order whose handler returns a line wins that talk, and later mods' villager_talked handlers are not called for it. An empty string, a line over 400 bytes or one holding a zero byte is not a line. It is logged and the next mod is asked. Special talks never reach mods. These are a first meeting, a villager moving out, one with an errand, delivery or contest going with you, a complaint, a pitfall or a bee chase, an islander, Kamakura and summer camp. No handler is called for a special talk. The villager's next ordinary talk calls it as usual, so a line a script is keeping for "the next talk" waits for that one. since api 1 |
| `day_started` | { year, month, day, weekday } | nil | A new day begins in the game. It fires once per day, also when the game starts on a new day. It does not fire again when the game restarts later on a day the town already saw, because the save holds the day it last began. If the game was not saved since that day began, the save still holds the day before, so the next start fires it again. Count days by storing the last date you saw, not by counting calls. since api 1 |
| `item_picked_up` | { item, mod_item? } | nil | The player got an item. They picked it up, outdoors or off a room's floor, caught it with the net or the rod, or dug it up with the shovel. It fires once the item is in their pockets, or in the wallet for Bells. It does not fire for anything bought. A fish or a bug that goes into the pockets fires this event and then fish_caught or bug_caught, so a script that counts both counts that catch twice. It does not fire when the pockets were full. Outdoors the game then offers to swap the item for one in the pockets, and no event is sent whatever the player chooses. Indoors a full pocket refuses the pickup. since api 1 |
| `scene_entered` | { scene, name? } | nil | A scene starts, such as the town, a house or a shop. Not in the title demo, at player select or in the intro (the rule own_game_only). since api 1 |
| `data_migrated` | { from, to } | nil | Fires once per town, when mod.json "data_version" differs from the version the town's data was written at. It runs as the town loads, before any other event's handlers run in that town. from is 0 for data from before data_version. If the handler errors, the script stops and the version stays, so the next start tries again. Migrations run in load order. A remote.call from a data_migrated handler into a mod whose own data_migrated has not run in that town yet is refused. Needs data_version. since api 1 |
| `hour_changed` | { year, month, day, hour } | nil | The game's clock reached a new hour. This is the game's own hourly update, midnight included. since api 1 |
| `item_bought` | { item, mod_item?, price, shop, ordered } | nil | The player bought a good for Bells at any counter in the game. It fires as the seller takes the price. shop says which counter: "nook" (Nook's in every size, The City's Nookington's too), "flower" (the flower shop), "redd" (Crazy Redd), "saharah" (her carpet, swapped for one of yours and Bells), "joan" (turnips), "fireworks" (the fireworks show's stall), "shrine" (the New Year fortune slip), "gyroid" (what another player put up at their gyroid) or "villager" (a villager selling you something). Test e.shop == "nook" to keep to Nook's. price is the Bells paid. ordered is true for a Nook's catalog order, which is paid now and mailed tomorrow, so it is not in the pockets yet. Only Nook's and the flower shop sell mod items. A visitor buying in a friend's town gets a plain piece, so mod_item is nil there. Paid services that hand over no good are not purchases and do not fire it. These are the barber, Katrina, the Dream Suite and an Able Sisters design. since api 1 |
| `item_sold` | { item, mod_item?, count, bells, shop } | nil | The player sold for Bells. It fires once the wallet is credited. shop says to whom: "nook" (Nook's in every size, The City's Nookington's too) or "villager" (a villager buying something from your pockets). Nobody else in the game buys. item is the first good, count is how many went and bells is what they fetched. mod_item is the first good's full id when it is a mod item. What another player buys at your gyroid does not fire it. The gyroid hands you the takings later as one sum, with no record of what sold. since api 1 |
| `fish_caught` | { item, pocketed } | nil | A fish was landed. pocketed says whether it went into the pockets. There is no size or length, because the game keeps none for a caught fish. Each kind has one fixed shadow size. Only the fishing tourney makes up a length, when the fish is shown to its host. When pocketed is true, item_picked_up fired for the same catch just before this event. since api 1 |
| `bug_caught` | { item, pocketed } | nil | A bug was netted. pocketed says whether it went into the pockets. When pocketed is true, item_picked_up fired for the same catch just before this event. since api 1 |
| `letter_read` | { sender?, item?, mod_item?, first_time, letter? } | nil | The player chose Read on a letter. item is the present, nil when the letter carries none. letter names the letters file letter it is, when a mod sent it. since api 1 |
| `villager_moved_in` | { villager { id, name, species?, personality? } } | nil | A villager with no house was given one. It fires at the game start after a move-in. A brand-new town fires it for its first villagers. since api 1 |
| `visitor_arrived` | { kind } | nil | A friend is riding into this player's own town. This is a friend visit, on the host's side. kind is "friend". since api 1 |
| `command_finished` | { id, command, ok, via?, code?, message? } | nil | A command this mod queued was applied or refused. When applied, ok is true and via says how (mailbox, post_office, pockets, mail, shown or taken). When refused, ok is false, with a code (command_codes) and a message. Sent only to that mod. since api 1 |
| `question_answered` | { id, choice?, text? } | nil | The player answered this mod's ask, or closed it. choice counts from 1 and text is the answer picked. Both are nil when the window closed with no pick. Sent only to that mod. since api 1 |
| `timer_fired` | { id, name, data? } | nil | A timer this mod set with timer.after is due. It fires once, at the end of a frame's update, in whatever scene the player is in, and the timer is gone before the handler runs. It is an event like any other. Its handlers share one instruction budget, it waits for a later frame when the frame's time is spent, and the commands it queues count against the per-event and per-day caps. At most one timer per mod fires in a frame. A timer that came due while the game was closed fires soon after the town loads. Sent only to that mod. since api 1 |

## Commands

Call them as `cmd.<name>(...)` inside an event handler. Each needs its name in mod.json `permissions`. A call returns the command's id, or, when it is refused at once, nil, a message and a code (also logged). The outcome comes back as a `command_finished` event: `e.ok` true with `e.via`, or `e.ok` false with `e.code` and `e.message`.

### cmd.send_letter(t)

Queues a letter in the player's own mailbox. The post office keeps it when the mailbox is full. The save holds an ordinary letter, so it loads without the mod. (since api 1; permission `send_letter`)

| argument | type | what |
|---|---|---|
| `t` | table | { text, item?, from?, paper? } or { template }. text is 1 to 192 characters fitting 6 lines. item is a number or "0x" and four hex digits. from is 1 to 8 characters on one line ("A friend" when left out). paper is 0 to 63. template is one of this mod's own letters.json letters, by its id or "<this mod's id>:<id>". The header, body, sign-off, present and paper then all come from the template. |

Returns integer|nil: The command's id. When it is refused at once: nil, then a message and a code.

### cmd.give_item(item)

Queues an item into the first empty pocket. With full pockets it comes by letter. Also takes this mod's own new item by its full id (author.mod:thing). A mod item is given with its identity, as a shop sells it, and full pockets refuse it. (since api 1; permission `give_item`)

| argument | type | what |
|---|---|---|
| `item` | integer\|string\|table | An item number, "0x" and four hex digits, this mod's "author.mod:thing", or { item, from? }. |

Returns integer|nil: The command's id. When it is refused at once: nil, then a message and a code.

### cmd.show_line(text)

Queues a line in the player's own thought window, shown once the player is free. One line or question at a time. (since api 1; permission `show_line`)

| argument | type | what |
|---|---|---|
| `text` | string | 1 to 400 bytes. |

Returns integer|nil: The command's id. When it is refused at once: nil, then a message and a code.

### cmd.ask(t)

Queues a question with 2 to 4 answers in the player's thought window. The pick comes back as a question_answered event. (since api 1; permission `ask`)

| argument | type | what |
|---|---|---|
| `t` | table | { text, choices }. text is 1 to 120 characters. choices is 2 to 4 answers of 1 to 16 characters. |

Returns integer|nil: The command's id. When it is refused at once: nil, then a message and a code.

### cmd.take_item(t)

Asks the player to hand over items from their pockets. The game shows its own question, which names the item, the count and this mod. The mod's name stands between quotes, and a mod item is named as the pockets show it. A script cannot change that text. On yes the items leave the pockets and command_finished says via taken. On no, or when the window closes with no pick, nothing is taken and command_finished carries command-declined. It is refused with command-not-held when the pockets do not hold that many. Only plain pocket slots count. A wrapped present or an item held for a villager's errand is never taken. Items a command cannot give cannot be taken either (money bags, turnips, tickets, grab bags, fossils). It is refused on a visit and in The City, so a lent mod can never take anything. (since api 1; permission `take_item`)

| argument | type | what |
|---|---|---|
| `t` | table | { item, count? }. item is an item number, "0x" and four hex digits, or this mod's own "author.mod:thing". count is 1 to 15 and is 1 when left out. An item number matches plain pieces only, never a mod item standing on that piece. |

Returns integer|nil: The command's id. When it is refused at once: nil, then a message and a code.

### cmd.take_bells(t)

Asks the player to pay Bells from their wallet. The game shows its own question, which names the amount and this mod. The mod's name stands between quotes. A script cannot change that text. On yes the Bells leave the wallet and command_finished says via taken. On no, or when the window closes with no pick, nothing is taken and command_finished carries command-declined. It is refused with command-not-held when the wallet holds less than the amount, so the wallet never goes below zero. The bank account and money bags in the pockets are never touched. It is refused on a visit and in The City, so a lent mod can never take anything. (since api 1; permission `take_bells`)

| argument | type | what |
|---|---|---|
| `t` | table | { amount }. amount is a whole number of Bells, 1 to 99999. |

Returns integer|nil: The command's id. When it is refused at once: nil, then a message and a code.

### Refusal codes

A refusal carries a stable code: the third value `cmd.<name>` returns, and `e.code` of a failed `command_finished`. Branch on the code, never on the message. "retry" says when the same call can work.

| code | retry | when |
|---|---|---|
| `command-permission` | never | The command is not in mod.json permissions. |
| `command-args` | never | Wrong arguments, such as their shape, a length, the paper or the choices. |
| `command-item` | never | An item the command cannot hand out, or an unknown item or letter id of the mod's own. Also sent in command_finished when the mod's item or letter was gone by the time the game applied the command. |
| `command-event-cap` | next-event | More than commands.per_event commands in one event. |
| `command-queue-full` | later | The mod's queue, or the game's, is full. |
| `command-day-cap` | tomorrow | The per-day limit for this command in this town is used up. |
| `command-city` | later | Commands are off in The City. |
| `command-visiting` | later | On a visit, only the town owner's game changes the town. |
| `command-lent-home` | never | A lent mod acting outside the host's town. It arrives in command_finished, never as the return of a cmd call. |
| `command-no-room` | later | No room now. The mailbox and the post office are full, or the pockets are full for a mod item. The command still counts against the day's cap, so do not try again in a loop. |
| `command-not-shown` | never | The line or question cannot be drawn in the window, because the text has too many pages. The command still counts against the day's cap. |
| `command-not-held` | later | A take the player cannot meet. The pockets do not hold that many of the item in plain slots, or the wallet holds fewer Bells. |
| `command-declined` | later | The player said no to a take's question, or closed it with no pick. Nothing was taken. |
| `command-client-setting` | never | The event read a client setting, and a client setting cannot decide what the town gets or gives up. Make the setting world, or do not read it in an event that sends a letter, gives an item, or takes an item or Bells. |


### Dependency codes

`remote.version(mod)` returns the version of a mod named in `depends` or `optional_depends`, or nil, a message and one of these codes. `remote.call` to an absent optional dependency returns the same three and raises nothing.

| code | when |
|---|---|
| `dependency-absent` | The mod is not installed, is switched off, did not load, or has no running script. |
| `dependency-version` | The mod loaded, but its version is outside the range this mod names. |
| `dependency-undeclared` | The mod is not in this mod's depends or optional_depends. |

## Timer refusal codes

`timer.after` returns the timer's id, or nil, a message and one of these codes. Branch on the code, never on the message.

| code | retry | when |
|---|---|---|
| `timer-args` | never | Wrong arguments, such as the minutes, the name or the data. Also when the script has no timer_fired handler. |
| `timer-limit` | later | The mod already has timers.per_mod timers waiting in this town. |
| `timer-no-town` | later | No town is loaded yet. The script's main chunk runs before the save loads. |
| `timer-no-clock` | later | The game clock is not set. It reads a date before the year 2000, so there is no minute to count from. |
| `timer-store-full` | later | The timer does not fit in this mod's town store (store.bytes), or the store could not be written. |

## Reference lists

Generated from the game's own tables. Fetch one when you need its rows.

- https://playaconline.com/schemas/scenes.json: Every scene a player can be in, from the game's own scene table. Each has the number scene_entered hands a script (e.scene), its stable name (e.name) and a title in plain words. Fields: `scene`, `name`, `title`.
- https://playaconline.com/schemas/villagers.json: Every villager the game has. Each has the id a script sees (villager.id), the name, the species and the personality they start with. Species and personality are from the game's own villager tables. A name is the villager's name in the game, read from the running game's own name table, with its space or punctuation ("Wart Jr", "Sue E", "T-Bone", "O'Hare"). In a talk pool's "villager", write the name as the game shows it. Fields: `id`, `name`, `species`, `personality`.

## Sandbox

Each mod runs in its own Lua 5.4 state with only these standard libraries. It takes source text only, no bytecode. The libraries are read-only. Assigning to string.<name>, rawset on a library or setmetatable on a library raises "string.<name> is read-only". getmetatable of a library or a string is the string "locked". The built-in globals (the base functions, the libraries, on, log, message, game, store) cannot be assigned, set to nil or rawset. A local may shadow one, and a mod's own globals are writable as usual. pairs(_G) lists only the mod's own globals. Work the instruction count cannot see is charged to the budget. That covers patterns (per step, and per 16 bytes of a [...] set or of a gsub replacement), comparing long strings and allocations. The run's clock is read every 100 instructions, and a run past its deadline stops. A weak-keyed table (__mode "k" without "v") keeps its keys, because weak-keyed tables made one garbage collection cost the square of their size. Weak values work as usual.

- libraries: `base` Lua's base functions, without the removed ones below. pcall, xpcall and setmetatable are wrapped., `string` Without string.dump. Pattern matching is charged against the budget, and string.pack, packsize and unpack per 4 bytes of their format. Read-only., `table` insert, remove, sort, concat, move and unpack are charged per element. insert, remove, sort and concat refuse a table with a __len metamethod. Read-only., `math` The math library without random and randomseed (see removed). Use rng(). Read-only., `utf8` codepoint, len and offset are charged per byte. Read-only., `coroutine` resume and close are wrapped like pcall. Read-only.
- removed: `dofile` Reaches files., `loadfile` Reaches files., `load` Loads code past the text-only loader., `collectgarbage` Controls memory the sandbox manages., `print` Use log()., `string.dump` Hands out bytecode., `math.random` Still a function, but calling it raises an error: use rng(), which is seeded so a reload cannot reroll., `math.randomseed` Still a function, but calling it raises an error: use rng(), which is seeded so a reload cannot reroll.
- absent libraries: `io`, `os`, `package`, `debug`
- wrapped: `pcall` Cannot catch a budget stop. Once the budget is gone it raises again., `xpcall` As pcall. The message handler is skipped after a budget stop., `coroutine.resume` As pcall., `coroutine.close` As pcall., `setmetatable` Refuses a __gc field, because finalizers could never be stopped., `table.insert` Charged per element., `table.remove` Charged per element., `table.sort` Charged n log n., `table.concat` Charged per element., `table.move` Charged per element., `table.unpack` Charged per result., `string.byte` Charged per result., `utf8.codepoint` Charged per result., `utf8.len` Charged per 64 bytes., `utf8.offset` Charged per 64 bytes., `string.pack` Charged per 4 bytes of the format., `string.packsize` Charged per 4 bytes of the format., `string.unpack` Charged per 4 bytes of the format., `string.format` Charged per 64 bytes of its string arguments., `tonumber` Charged per 64 bytes of a string argument. A string over 200 bytes is never a number, here or in arithmetic.

## Limits

| limit | value | what |
|---|---|---|
| `zip.bytes` | 16 MB | The largest mod ZIP, compressed. |
| `zip.unpacked_bytes` | 64 MB | What every file in one mod adds up to, unpacked. |
| `zip.files` | 2,000 files | The most files one mod may hold. Folder entries and junk are dropped first and not counted. Junk is __MACOSX, Thumbs.db and any hidden name starting with a dot, such as .DS_Store, .gitignore and .github/. |
| `zip.path_bytes` | 160 bytes | The longest path inside a mod, after the one top folder is stripped. ASCII only. |
| `file.manifest_bytes` | 64 KB | The largest mod.json. |
| `file.json_bytes` | 256 KB | The largest .json file other than mod.json. |
| `file.lua_bytes` | 512 KB | The largest .lua file. |
| `json.depth` | 32 levels | How deep JSON may nest. The top value is depth 0, and nothing may sit deeper than 32. |
| `mods.enabled` | 32 mods | The most mods switched on at once. |
| `mods.enabled_unpacked_bytes` | 96 MB | Every switched-on mod together, unpacked, on a computer. |
| `mods.enabled_unpacked_bytes_phone` | 24 MB | Every switched-on mod together, unpacked, on a phone or a low-memory device. |
| `messages.lines` | 256 lines | The most lines in one mod's messages file. |
| `messages.key_bytes` | 48 bytes | The longest line key. |
| `messages.text_bytes` | 400 bytes | The longest line, in UTF-8 bytes. Lines wrap by width, not by a count of characters. A row holds 180 pixels of the game's font, which is about 24 letters. Narrow letters like i and l take less room, and wide ones like W and m take more. A page holds 4 rows. |
| `shops.per_file` | 2 shops | The most shops in one shops.json. That is one per target (flower, nook). |
| `shops.stock` | 6 goods | The most goods in one shop's stock. |
| `shops.name_chars` | 40 characters | The longest shop name, in Unicode code points. |
| `shops.line_chars` | 160 characters | The longest greeting or stock_line, in Unicode code points. |
| `shops.line_newlines` | 3 newlines | The most line breaks in a greeting or stock_line. |
| `shops.price_max` | 99,999 Bells | The highest price a mod shop may ask. The game raises a price below its own buy-back to the buy-back. The buy-back is what Nook pays for the item. |
| `lua.memory_bytes` | 4 MB | Memory one mod's script may use. Over it, the script stops for the session. |
| `lua.memory_total_bytes` | 16 MB | Memory every mod's script together may use. |
| `lua.budget` | 200,000 instructions | Instructions one mod may run per event, counting all its handlers for that event together. The main chunk gets its own count. Library work is charged too: every 64 bytes allocated, every 4 pattern-matching steps and every element a table function touches. An allocation the memory limit refuses is charged too: one instruction for every 64 bytes the script holds. Over the limit, the script stops for the session. |
| `lua.deadline_ms` | 250 milliseconds | Wall-clock backstop on a script's main chunk, for time the instruction count cannot see: one long call into C, or a garbage collection. The instruction budget is what stops a main chunk that does too much. On a slow device it is stretched by the device's pace (lua.pace_frame_ms). |
| `lua.handlers_per_event` | 16 handlers | The most handlers one mod may register for one event. |
| `lua.log_per_event` | 20 lines | Mod log lines kept per event for one mod: its log() lines and the refusals written when it called cmd.* or timer.*. The rest are dropped, and the log says so once. |
| `lua.log_per_session` | 500 lines | Mod log lines kept per mod per session: log() lines and every refusal of its commands and timers. A script stop is always written. |
| `store.bytes` | 8 KB | The whole store of one mod in one town, store.player's values included. The whole store.client of one mod has the same limit. A set that would go over is refused and changes nothing. |
| `store.key_bytes` | 64 bytes | The longest store key. |
| `store.value_bytes` | 1 KB | The longest string a store value may be. |
| `items.per_mod` | 64 items | Items in one mod's items file. |
| `items.total` | 512 items | Mod items across every switched-on mod. |
| `items.renames` | 64 renames | Entries in one mod.json "renames". |
| `lua.event_deadline_ms` | 125 milliseconds | Wall-clock backstop on one event run, for time the instruction count cannot see: one long call into C, or a garbage collection. The instruction budget is what stops an event run that does too much, and it counts the same on every device. On a slow device it is stretched by the device's pace (lua.pace_frame_ms). A busy device does not stop a mod that stays inside its budget. |
| `lua.frame_budget_ms` | 4 milliseconds | Lua time all mods together get per frame. Once it is spent, every game event without an answer waits for the next frame, and villager_talked is skipped for the rest of that frame. command_finished and question_answered always run. It never stops or strikes a mod. At least one waiting event runs each frame, so on a slow device events wait longer but still run. |
| `lua.slow_run_ms` | 8 milliseconds | An event run longer than this is a strike. On a slow device it is stretched by the device's pace (lua.pace_frame_ms). |
| `lua.slow_runs` | 3 strikes | Strikes in a row before the script is stopped ("kept the game waiting"). A run under the limit clears the strikes. |
| `lua.pace_frame_ms` | 4 milliseconds | The game's own work per frame that counts as full speed. Mods' Lua time is left out of it. When the game's recent frames take longer (a slow phone, a busy machine), the wall-clock limits are stretched. The stretch is recent frame work divided by this, from 1 up to lua.pace_stretch_max. It applies to lua.deadline_ms, lua.event_deadline_ms and lua.slow_run_ms. The frame cap and the instruction budget are never stretched. |
| `lua.pace_stretch_max` | 8 times | The most a slow device stretches the wall-clock limits. At this stretch an event run's backstop is 1 second and a strike is a run over 64 ms. |
| `lua.deferred_events` | 64 events | Events waiting for a later frame. Past that, an event is dropped and logged. |
| `textures.png_side` | 2,048 pixels | The longest side of a PNG texture. |
| `textures.png_decoded_bytes` | 96 MB | Decoded pixels of every mod's PNG textures together, on a computer. A PNG past it is left out and named on its mod's row. |
| `textures.png_decoded_bytes_phone` | 24 MB | The same on a phone or low-memory device. |
| `textures.dds_bytes` | 96 MB | Image bytes of every mod's DDS textures together on a computer, as the graphics card holds them. Only the first mip level counts: 1 byte a pixel for BC7 and DXT5, half a byte for DXT1 and 4 bytes uncompressed. A DDS past the limit is left out and named on its mod's row. The HD pack does not count. |
| `textures.dds_bytes_phone` | 24 MB | The same on a phone or low-memory device. |
| `settings.per_mod` | 16 settings | Settings one mod declares. |
| `depends.per_mod` | 16 mods | Mods in depends, in optional_depends and in conflicts, each. |
| `data_version.max` | 1,000,000 version | The largest data_version. |
| `store.towns` | 16 towns | Towns whose mod data one browser keeps. Writing a 17th drops the file of the least recently written other town. |
| `remote.copy_bytes` | 64 KB | Data a remote.call copies each way. |
| `remote.functions` | 32 functions | Functions one mod offers with remote.add. |
| `exports.per_mod` | 32 functions | Remote functions one mod.json "exports" lists. It is also the most that remote.add offers. |
| `exports.description_chars` | 120 characters | One "exports" description, on one line. |
| `nook.stock` | 16 goods | The most goods in Nook's stock entry. |
| `letters.per_file` | 32 letters | Letters in one letters file. |
| `letters.header_chars` | 24 characters | A letter header, not counting {player}. |
| `letters.body_chars` | 192 characters | A letter body or a board notice. |
| `letters.body_lines` | 6 lines | Lines on the letter paper or a board page. |
| `letters.footer_chars` | 32 characters | A letter footer. |
| `letters.sender_chars` | 8 characters | A letter's name in the mailbox list. It is the letter's optional sender. Without a sender, it is the footer's first 8 characters. |
| `calendar.per_file` | 16 days | Days in one calendar file. |
| `calendar.talk_lines` | 16 lines | Talk lines in one calendar day. |
| `talk.pools` | 32 pools | Pools in one talk file. |
| `talk.lines_per_pool` | 32 lines | Lines in one pool. |
| `talk.line_chars` | 160 characters | A villager line (pool or calendar day), in Unicode code points. It may have at most 3 line breaks. |
| `commands.per_event` | 4 commands | Commands one mod may queue in one event. |
| `commands.waiting` | 32 commands | Commands waiting, all mods together. |
| `commands.waiting_per_mod` | 8 commands | Commands one mod may have waiting. |
| `commands.letters_per_day` | 3 commands | send_letter per mod per game day in each town. The count is per town and shared by its residents, not per player. It is a safety limit, not a game rule. A command counts when the game applies it, and the count is kept across a reload. A command lost with a closed tab before then never counts. The limit check adds the commands still waiting. A command refused for where the player is (The City, a visit) does not count. |
| `commands.items_per_day` | 5 commands | give_item per mod per game day in each town. The count is per town and shared by its residents, not per player. It is a safety limit, not a game rule. |
| `commands.lines_per_day` | 20 commands | show_line per mod per game day in each town. One that cannot be drawn (command-not-shown) does not count. The count is per town and shared by its residents, not per player. It is a safety limit, not a game rule. |
| `commands.asks_per_day` | 10 commands | ask per mod per game day in each town. One that cannot be drawn (command-not-shown) does not count. The count is per town and shared by its residents, not per player. It is a safety limit, not a game rule. |
| `commands.take_items_per_day` | 6 commands | take_item per mod per game day in each town. A take counts when its question is shown, whatever the player answers. One that cannot be drawn (command-not-shown) does not count. The count is per town and shared by its residents, not per player. It is a safety limit, not a game rule. |
| `commands.take_bells_per_day` | 6 commands | take_bells per mod per game day in each town. A take counts when its question is shown, whatever the player answers. One that cannot be drawn (command-not-shown) does not count. The count is per town and shared by its residents, not per player. It is a safety limit, not a game rule. |
| `commands.take_item_count` | 15 items | The most pieces of one item a single take_item may ask for. It is the number of pockets. |
| `commands.take_bells_amount` | 99,999 Bells | The most Bells a single take_bells may ask for. It is the most a wallet holds. |
| `timers.per_mod` | 16 timers | The most timers one mod may have waiting in one town. |
| `timers.minutes_max` | 10,080 minutes | The longest a timer may wait, in game minutes. It is 7 game days. A timer never waits longer than this from any moment, so a clock set back cannot strand one. |
| `timers.name_bytes` | 40 bytes | The longest timer name. A name is letters, digits, _, - and . only. |
| `timers.data_bytes` | 240 bytes | The longest text a timer's data may be. |
| `commands.letter_chars` | 192 characters | A letter's text. It must also fit the letter's 6 lines of 192 pixels. |
| `commands.letter_from_chars` | 8 characters | A letter's signature, also the mailbox list's sender. It is one line. A line break or another control character is refused. |
| `commands.line_bytes` | 400 bytes | A show_line text. |
| `commands.ask_chars` | 120 characters | An ask question. |
| `commands.choice_chars` | 16 characters | One answer of an ask. |
| `commands.choices_min` | 2 answers | The fewest answers an ask may offer. |
| `commands.choices_max` | 4 answers | The most answers an ask may offer. |
| `commands.papers` | 64 papers | Letter papers, numbered 0 to 63. |
| `calendar.board_per_day` | 3 notices | Board notices that go up on one day across every mod. The first ones in load order go up. On a full board, a mod notice first takes the place of an earlier day's mod notice. It never pushes off a page dated today. |
| `store.towns_bytes` | 1536 KB | What every town's mod data in one browser adds up to. Writing past it drops the least recently written other towns' files first. Mod data therefore never pushes a save over the cloud's 5 MB. |
| `talk.line_newlines` | 3 newlines | The most line breaks in a villager line (pool or calendar day). |
| `talk.villager_chars` | 8 characters | A pool's "villager" name, as the game spells it. |
| `items.price_max` | 99,999 Bells | The highest price an item in a mod's items file may have. |
| `manifest.name_chars` | 60 characters | The longest mod "name", in Unicode code points, spaces at the ends not counted. |
| `manifest.authors` | 8 names | The most names in "authors". |
| `manifest.author_chars` | 40 characters | The longest name in "authors", spaces at the ends not counted. |
| `manifest.description_chars` | 500 characters | The longest "description". |
| `manifest.tags` | 5 tags | The most different tags in "tags". |
| `settings.label_chars` | 60 characters | A setting's "label", spaces at the ends not counted. |
| `settings.description_chars` | 200 characters | A setting's "description". |
| `settings.choices_min` | 2 choices | The fewest "choices" a choice setting lists. |
| `settings.choices` | 16 choices | The most "choices" a choice setting lists. |
| `settings.choice_chars` | 40 characters | One choice of a choice setting, on one line. |
| `settings.text_chars` | 200 characters | The largest "max_length" a text setting may ask for. |
| `settings.number_max` | 1,000,000,000 number | A number setting's "min" and "max" lie within minus this and this. |
| `depends.range_bytes` | 64 bytes | The longest version range in depends or conflicts. |
| `depends.range_parts` | 4 comparisons | The most comparisons in one version range, like ">=1.0.0 <2.0.0" (two). |
