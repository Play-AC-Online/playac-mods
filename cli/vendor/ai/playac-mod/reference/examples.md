# Example mods

Generated from the Play AC Online mod API spec and errors catalogue. Do not edit by hand. These are the site's own working example mods, file by file. Each is its own repository, with the mod at the top: clone it, or download the ZIP of its tag.

## example.springtime-town

Repository: https://github.com/Play-AC-Online/playac-example-springtime-town (tag v1.0.0)

### example.springtime-town/README.md

```
# Springtime Town

A Just you mod (`"scope": "client"`) in two halves, with no script:

- **The grass** (`textures/`): the town grass is our own drawing, seamless
  green ground with clover leaves and small white flowers.
- **The talk** (`talk.json`): on the first talk of the day, each villager says
  one new line in their own personality's voice, then their usual hello.

Both are data. Neither changes what a visitor sees, so the mod is Just you.

## In the game

![before](media/before.webp)

Before: a corner of town on a September afternoon, with no mods and the HD texture pack.

![after](media/after.webp)

After: the same spot with Springtime Town installed. The grass is the mod's, drawn with clover and tiny white flowers; the trees, houses and paths are untouched.

![mod line](media/mod-line.webp)

The first talk of the day opens on a new line from the mod's talk pools, picked for the villager's personality.

![own hello](media/own-hello.webp)

The next page is the villager's own hello: the mod's line comes first, and the game's conversation carries on as usual.

[![Play the film](media/film.webp)](media/film.mp4)

The film (click the picture): A walk past the houses on the mod's clover grass, then Twiggy's first talk of the day: the mod's line, then her own words. A second talk skips straight to her hello.

## The grass

The grass is one 128x128 uncompressed RGBA DDS picture, saved under every name
the game draws the grass with. The names say which in-game texture to replace,
and the pixels are our own.

The grass is six textures. The game draws each under several palettes, through
the seasons and the time of day. A file can name one texture and one palette:

    tex1_32x32_<texture>_<palette>_8.dds

Or it can put `$` in place of the palette, for that texture under any palette:

    tex1_32x32_<texture>_$_8.dds

Our grass is the same picture all year, so the mod has one `$` file per
texture. That is six files.

These three grass textures are drawn under nine palettes:

    textures: 626709d910129694 903adc6355e36f59 e96fecd242518c9f
    palettes: 193ca5974976e36e 20430b0042498b04 4f54e78515f0a185
              8910d24f6fbd5f83 8b8a1c2cacd60254 963dc45f18e13cf7
              b2e512f9c0fe88ad e7f9e59c09c5f9d0 f83e63a8b6cb47b7

And these three under three palettes:

    textures: 82f28ec4199a45be cfa57a6e6f966d11 e2ab673814e71af6
    palettes: 6d5ff5628ae85b42 ce63d23d746a058a d9eb32f9a8b17411

To change the grass for one stretch of the year or one time of day, add a file
named with that palette next to the `$` file. The file named for one palette
wins under that palette, and the `$` file still covers the rest.

With one file per palette, 36 files, the mod could change with every palette.
A `$` file is loaded once and shared, so it is the lighter choice when the
picture does not change.

The pictures were drawn by a small program, never copied from the game.

## The talk

`talk.json` holds line pools. Each personality has its own pool. On the first
ordinary talk of the day, a villager says one line from their personality's
pool. Then they say their usual hello and carry on as normal. Talk again the
same day and there is no new line.

A pool can instead name one villager (`"villager": "Bob"`), or nobody, which
means every villager. A pool can say a line only on some days
(`"chance": 40`). The most specific pools that match a villager decide.

The game picks the line. No script is needed.

## Install

In Play AC Online, open the Mods tab. Springtime Town is in the mod list as an
official example: install it from there. Or download its ZIP from the
[cookbook](https://playaconline.com/modding/cookbook/) and add the file in the
Mods tab.

## Make your own

This repository is one mod, laid out the way the GitHub import wants it:
`mod.json` at the top, and a tag named for the version in `mod.json`.

1. Copy the repository to your own account.
2. Change `"id"` in `mod.json` to your own, like `yourname.springtime-town`.
   Ids that start with `example.` are kept for these examples, so the import
   refuses them.
3. Tag the commit with the version, like `v1.0.0`.
4. In the Mods tab, choose Import from GitHub and paste
   `github.com/<you>/<repository>@v1.0.0`.

To keep only one half, delete the other half's files and its lines in
`mod.json`, and `playac-mod check` tells you if anything still points at them.

The modding guide is at [playaconline.com/modding](https://playaconline.com/modding/).

`media/` holds the pictures and the film the cookbook shows, with their
captions in `media/media.json`. `.playac/screenshots/` holds the listing's
screenshots. The pack rule leaves the pictures, the film and the screenshots
out of the mod.

## License

MIT, see [LICENSE](LICENSE).
```

### example.springtime-town/mod.json

```json
{
  "schema": 1,
  "api": 1,
  "id": "example.springtime-town",
  "name": "Springtime Town",
  "version": "1.0.0",
  "authors": [
    "Play AC Online"
  ],
  "description": "Town grass with clover and tiny white flowers, and one new line a day from each villager in their own personality's voice. Textures and data only, no script.",
  "scope": "client",
  "content": {
    "textures": "textures/",
    "talk": "talk.json"
  },
  "assets_original": true
}
```

### example.springtime-town/talk.json

```json
{
  "pools": [
    {
      "personality": "normal",
      "lines": [
        "I baked something this morning. The whole house smells like cinnamon now.",
        "Have you seen the flowers by the river? I could look at them all day.",
        "I wrote you a letter in my head. Maybe one day I'll put it on paper!"
      ]
    },
    {
      "personality": "peppy",
      "lines": [
        "Guess what? Nothing happened today, and I'm SO excited about it!",
        "I practiced my dance moves all night. Want to see? Okay, maybe later!",
        "Today feels like a sparkly day. Do you feel sparkly too?"
      ]
    },
    {
      "personality": "lazy",
      "lines": [
        "I was going to nap, but then I thought about snacks. Now I'm too busy.",
        "Do you ever just lie in the grass and count clouds? I got to three.",
        "Bugs are my friends. Well, the slow ones are."
      ]
    },
    {
      "personality": "jock",
      "lines": [
        "I ran around the whole town twice before breakfast. Feel the burn!",
        "You look strong today. Have you been lifting rocks? Keep it up!",
        "Every step is a workout if you stomp hard enough!"
      ]
    },
    {
      "personality": "cranky",
      "lines": [
        "Hmph. Kids these days don't even know how to sit on a bench properly.",
        "Back in my day the river was wetter. Don't ask me how.",
        "I'm not grumpy. I'm just thinking very loudly."
      ]
    },
    {
      "personality": "snooty",
      "lines": [
        "Darling, your outfit is almost fashionable. Almost.",
        "I only drink tea from the finest cups. The chipped ones are for guests.",
        "One must always look one's best. Even for the fish."
      ]
    }
  ]
}
```

- `textures/`: 6 binary file(s), not shown

## example.evening-tea-room

Repository: https://github.com/Play-AC-Online/playac-example-evening-tea-room (tag v1.0.0)

### example.evening-tea-room/README.md

```
# Evening Tea Room

A World mod (`"scope": "world"`) in two halves:

- **The shop** (`shops.json`, `messages/en.json`): in the evening the flower
  shop becomes the Evening Tea Room, with its own sign, hours, greeting and
  goods.
- **The furniture** (`items.json`): two pieces of furniture of the mod's own,
  a Tea Chest and a Reading Chair, sold in that shop.

A shop changes the town, so the mod is a World mod.

## In the game

![sign at noon](media/sign-at-noon.webp)

At noon the flower shop's door stays shut and its sign is the mod's: Evening Tea Room, open 3:00 PM to 1:00 AM.

![shop at six](media/shop-at-six.webp)

Inside at 6 PM: the west bench holds the mod's Tea Chest and Reading Chair, and the other tables four fruits at the mod's prices.

![stock line](media/stock-line.webp)

Ask Joan what's in stock and she answers with the mod's stock line.

![placed](media/placed.webp)

Bought and put in your room through the pocket menu: the blue chest in the middle is the mod's Tea Chest.

[![Play the film](media/film.webp)](media/film.mp4)

The film (click the picture): Knocking at noon gets the Evening Tea Room sign and its hours; in the evening the shop is open with the mod's furniture and fruit, and Joan greets you and answers what's in stock with the mod's words.

## The shop

`shops.json` gives the flower shop a name, hours, a greeting, an answer to
"What's in stock?" and six goods with prices.

- `hours` is 15:00 to 01:00. Hours can only shorten the shop's own, and a
  close past midnight is fine. Outside them the door stays shut and its sign
  shows the name and the hours.
- The flower shop has six table spots, so it sells at most six goods. Here they
  are the mod's two items and four fruits.
- A good may be an item of the same mod, named by its full id,
  `example.evening-tea-room:tea-chest`. Without a `price` it takes the item's own price
  from `items.json`. The fruits have a price of their own.

`messages/en.json` holds one line, `hours`. Other mods can read it as
`example.evening-tea-room:hours`, with `message("example.evening-tea-room:hours")` in a
script, so a villager could tell you when the tea room opens.

## The furniture

`items.json` lists the new items. Each has an `id`, a `name`, a `price`
and a `base`: the game's own piece it is built on. The base is what the
player sees and what the game saves. The mod's id is kept beside it.

- With the mod installed, the piece is the mod's item, with its own name.
- Remove the mod and the piece stays in the house as the plain base piece.
- Put the mod back and it is the mod's item again.

Other files name an item as `example.evening-tea-room:tea-chest`: the mod id, a
colon, and the item id. Never change an item's id once players have it. To
rename one in a later version, map the old id to the new one with `"renames"`
in `mod.json`.

## Install

In Play AC Online, open the Mods tab. Evening Tea Room is in the mod list as an
official example: install it from there. Or download its ZIP from the
[cookbook](https://playaconline.com/modding/cookbook/) and add the file in the
Mods tab.

## Make your own

This repository is one mod, laid out the way the GitHub import wants it:
`mod.json` at the top, and a tag named for the version in `mod.json`.

1. Copy the repository to your own account.
2. Change `"id"` in `mod.json` to your own, like `yourname.evening-tea-room`.
   Ids that start with `example.` are kept for these examples, so the import
   refuses them.
3. Tag the commit with the version, like `v1.0.0`.
4. In the Mods tab, choose Import from GitHub and paste
   `github.com/<you>/<repository>@v1.0.0`.

To keep only one half, delete the other half's files and its lines in
`mod.json`, and `playac-mod check` tells you if anything still points at them.

The modding guide is at [playaconline.com/modding](https://playaconline.com/modding/).

`media/` holds the pictures and the film the cookbook shows, with their
captions in `media/media.json`. `.playac/screenshots/` holds the listing's
screenshots. The pack rule leaves the pictures, the film and the screenshots
out of the mod.

## License

MIT, see [LICENSE](LICENSE).
```

### example.evening-tea-room/items.json

```json
{
  "items": [
    { "id": "tea-chest", "name": "Tea Chest", "base": "0x1008", "price": 1800 },
    { "id": "reading-chair", "name": "Reading Chair", "base": "0x10f8", "price": 1200 }
  ]
}
```

### example.evening-tea-room/messages/en.json

```json
{
  "hours": "The Evening Tea Room is open from 3 PM until 1 AM."
}
```

### example.evening-tea-room/mod.json

```json
{
  "schema": 1,
  "api": 1,
  "id": "example.evening-tea-room",
  "name": "Evening Tea Room",
  "version": "1.0.0",
  "authors": [
    "Play AC Online"
  ],
  "description": "The flower shop becomes a tea room, open from 3 PM until 1 AM. On its tables: a Tea Chest and a Reading Chair of the mod's own, and fruit for tea. Remove the mod and the furniture stays in your house as the plain pieces it is built on.",
  "scope": "world",
  "content": {
    "items": "items.json",
    "shops": "shops.json",
    "messages": "messages/en.json"
  },
  "assets_original": true
}
```

### example.evening-tea-room/shops.json

```json
{
  "shops": [
    {
      "target": "flower",
      "name": "Evening Tea Room",
      "hours": {
        "open": "15:00",
        "close": "01:00"
      },
      "greeting": "Welcome to the Evening Tea Room! Sit down and take your time. Everything on the tables goes lovely with a cup.",
      "stock_line": "A Tea Chest and a Reading Chair, made here and nowhere else, and four kinds of fruit for tea. Point at one for the price.",
      "stock": [
        {
          "item": "example.evening-tea-room:tea-chest"
        },
        {
          "item": "example.evening-tea-room:reading-chair"
        },
        {
          "item": "0x2800",
          "price": 600
        },
        {
          "item": "0x2801",
          "price": 600
        },
        {
          "item": "0x2802",
          "price": 600
        },
        {
          "item": "0x2803",
          "price": 600
        }
      ]
    }
  ]
}
```


## example.harvest-post

Repository: https://github.com/Play-AC-Online/playac-example-harvest-post (tag v1.0.0)

### example.harvest-post/README.md

```
# Harvest Post

A World mod (`"scope": "world"`) in two halves:

- **The calendar** (`calendar.json`, `letters.json`): two days of our own.
  The Harvest Fair is the third Wednesday of September and Apple Day is
  October 21. A notice goes up on the bulletin board and villagers talk about
  it all day.
- **The post** (`main.lua`, `messages/en.json`): once a game day, a script
  mails you a letter with a little present. A worked example of mod commands
  and a timer.

A board notice changes the town, so the whole mod is a World mod. The script
half would run in a Just you mod too.

## In the game

![board](media/board.webp)

On the third Wednesday of September the town bulletin board carries the mod's notice, dated by the game.

![fair line](media/fair-line.webp)

All day, villagers open with a line about the fair from the mod's calendar.json, then carry on in their own words.

![at the mailbox](media/at-the-mailbox.webp)

The day's first visit to town: the mod's script has already mailed today's letter, so there is mail waiting at the house.

![the letter](media/the-letter.webp)

The letter is the mod's own text, from its messages file, sent with the send_letter command from "A friend", with a little present attached.

[![Play the film](media/film.webp)](media/film.mp4)

The film (click the picture): The Harvest Fair notice on the bulletin board and Twiggy talking about the fair before her usual chat, then a walk to the mailbox to take out the day's letter and read it.

## The calendar

- It adds two calendar days. The Harvest Fair is the third Wednesday of
  September (`week` 3, `weekday` 3). Apple Day is October 21 (`day`).
- On each day a notice goes up on the town bulletin board. It is posted once,
  in the player's own town only. Villagers say one of the day's lines before
  their hello.
- `fair-thanks` in `letters.json` is a letter template. A script of this mod
  can mail it with `cmd.send_letter{ template = "fair-thanks" }`, and another
  mod's command names it `example.harvest-post:fair-thanks`. The player's name goes
  where `{player}` is, and an apple comes with it.
- The letter signs "The Fair Committee". The mailbox list has room for 8
  characters, so `sender` names it "The Fair" there.

Letter and notice text is plain ASCII and must fit six lines of the paper. The
game measures it in its own font and refuses text that does not fit.

## The post: commands

An event handler never changes the game itself. It queues a command, and the
game applies it at the end of a frame's update, once the player is free.

- `cmd.send_letter{ text = ..., item = ..., from = ... }` queues the letter.
  It returns the command's id, or `nil`, a message and a code when the game
  refuses it now. The text and the sender come from `messages/en.json`, read
  with `message("letter")` and `message("from")`.
- `"permissions": ["send_letter"]` in `mod.json` names the command. A
  command the mod does not name is refused.
- `command_finished` says what happened to it: `e.ok`, `e.via`
  (`mailbox`, or `post_office` when the mailbox was full), or `e.code` and
  `e.message` for a refusal.
- The game's cap is 3 letters a day from one mod, per town. The refusal's code
  is `command-day-cap`.

## The post: timers

A letter the game could not take now (both boxes full, or the player away from
home) is tried again half a game hour later.

- `timer.after(30, "retry", p.id)` counts game minutes. The timer is kept with
  the town's data, so it still fires after a save and a reload.
- `timer_fired` brings back the name and the data: here, whose letter it was.

## The post: saved data

- `store.player` remembers the day's letter, so each resident of the town gets
  their own.
- The town's `store` keeps the mark that a retry timer is waiting, under the
  resident's id. The timer may fire while another resident plays, and only the
  town's store can be cleared then.
- `rng()` counts the numbers the mod drew in this town today and keeps that
  count with the town, so reloading the game cannot reroll the present.

## The post: events

`day_started` sends the day's letter. `scene_entered` tries too, since a game
loaded on a day it already saw does not run `day_started` again.

## Install

In Play AC Online, open the Mods tab. Harvest Post is in the mod list as an
official example: install it from there. Or download its ZIP from the
[cookbook](https://playaconline.com/modding/cookbook/) and add the file in the
Mods tab.

## Make your own

This repository is one mod, laid out the way the GitHub import wants it:
`mod.json` at the top, and a tag named for the version in `mod.json`.

1. Copy the repository to your own account.
2. Change `"id"` in `mod.json` to your own, like `yourname.harvest-post`.
   Ids that start with `example.` are kept for these examples, so the import
   refuses them.
3. Tag the commit with the version, like `v1.0.0`.
4. In the Mods tab, choose Import from GitHub and paste
   `github.com/<you>/<repository>@v1.0.0`.

To keep only one half, delete the other half's files and its lines in
`mod.json`, and `playac-mod check` tells you if anything still points at them.

The modding guide is at [playaconline.com/modding](https://playaconline.com/modding/).

`media/` holds the pictures and the film the cookbook shows, with their
captions in `media/media.json`. `.playac/screenshots/` holds the listing's
screenshots. The pack rule leaves the pictures, the film and the screenshots
out of the mod.

## License

MIT, see [LICENSE](LICENSE).
```

### example.harvest-post/calendar.json

```json
{
  "days": [
    {
      "id": "harvest-fair",
      "date": { "month": 9, "week": 3, "weekday": 3 },
      "board": "HARVEST FAIR TODAY!\nBring your best fruit and\nshow it to your neighbours.\nThe biggest apple wins\nbragging rights for a year.",
      "talk": [
        "It's the Harvest Fair! I've been polishing my pears since sunrise.",
        "Harvest Fair day! Did you bring any fruit? Mine is the shiniest, I checked.",
        "The fair smells like apples and wood smoke. Best day of the season!"
      ]
    },
    {
      "id": "apple-day",
      "date": { "month": 10, "day": 21 },
      "board": "APPLE DAY\nShare an apple with a friend\ntoday. Any apple will do,\nbut a red one says it best.",
      "talk": [
        "Happy Apple Day! Have you shared an apple with anyone yet?",
        "An apple a day, they say. Today it's an apple for everyone!"
      ]
    }
  ]
}
```

### example.harvest-post/letters.json

```json
{
  "letters": [
    {
      "id": "fair-thanks",
      "header": "Dear {player},",
      "body": "Thank you for coming to the\nHarvest Fair! Here is an apple\nfrom the prize table. Plant it\nand see what grows.",
      "footer": "The Fair Committee",
      "sender": "The Fair",
      "item": "0x2800",
      "paper": 12
    }
  ]
}
```

### example.harvest-post/main.lua

```lua
-- Harvest Post, the script half: once a game day, a letter with a little
-- present arrives in the mailbox. A worked example of mod commands: an event
-- handler never changes the game itself, it QUEUES a command, and the game
-- applies it at the end of a frame's update, once the player is free. mod.json
-- must name the command in "permissions".
--
-- It also shows a timer. A letter the game could not take now (both boxes
-- full, or the player away from home) is tried again half a game hour later.
--
-- The day's letter is remembered in store.player, so each resident of the town
-- gets their own. The game's cap is per town, not per player: 3 letters a day
-- from one mod, so in a town of four the fourth resident to play that day
-- gets none.

-- Fruit: always a fine present (the shop's item rules refuse money, turnips,
-- tickets, grab bags, fossils and reserve ids).
local GIFTS = { 0x2800, 0x2801, 0x2802, 0x2803, 0x2804 }

-- The game day as one number, 20261112, or nil before a town is loaded.
local function today()
  local t = game.town()
  if not t then return nil end
  return t.year * 10000 + t.month * 100 + t.day
end

local function send_today()
  local day = today()
  if not day or store.player.get("sent") == day then return end
  -- rng() counts the numbers this mod has drawn in this town today and keeps
  -- that count with the town, so a reload carries on from it: reloading the
  -- game cannot reroll the present.
  local gift = GIFTS[rng(#GIFTS)]
  local id, why, code = cmd.send_letter{ text = message("letter"), item = gift, from = message("from") }
  if id then
    store.player.set("sent", day)
    log("letter #" .. id .. " queued with item " .. string.format("0x%04X", gift))
  else
    log("no letter today: " .. why .. " (" .. code .. ")")
    -- The town's letters for today are used up: do not ask again until tomorrow.
    if code == "command-day-cap" then store.player.set("sent", day) end
  end
end

-- A new day, and the first scene of each session (a game loaded on a day it
-- already saw does not run day_started again).
on("day_started", send_today)
on("scene_entered", send_today)

-- Try again later. timer.after counts GAME minutes and keeps the timer with
-- this town's data, so it still fires after a save and a reload. One timer per
-- resident is enough: a second refusal finds the first still waiting. The name
-- comes back in timer_fired, and the data says whose letter it was.
--
-- The mark that a timer is waiting is kept in the town's store under the
-- resident's id, not in store.player. The timer may fire while another
-- resident plays, and only the town's store can be cleared then.
local RETRY_MINUTES = 30
local function retry_key(id) return "retry:" .. tostring(id) end
local function retry_later()
  local p = game.player()
  if not p or store.get(retry_key(p.id)) then return end
  local id, why, code = timer.after(RETRY_MINUTES, "retry", p.id)
  if id then
    store.set(retry_key(p.id), id)
  else
    log("no retry timer: " .. why .. " (" .. code .. ")")
  end
end

-- What happened to it: e.via is "mailbox", or "post_office" when the mailbox
-- was full. A refusal has e.code (stable, for the script) and e.message (for
-- the log).
on("command_finished", function(e)
  if e.ok then
    log("letter #" .. e.id .. " delivered via " .. e.via)
  elseif e.code == "command-day-cap" then
    log("letter #" .. e.id .. " not delivered: " .. e.message)
  else
    -- Refused for now (in The City, visiting a friend, both boxes full): the
    -- day's letter is owed again. The next scene tries, and so does a timer
    -- half a game hour from now, for a player who stays where they are.
    -- Away from home, store and timers live in memory only. A result that
    -- arrives there clears "sent" in that copy, not at home, so the letter is
    -- not owed again today. Tomorrow's comes as usual.
    log("letter #" .. e.id .. " not delivered: " .. e.message)
    store.player.set("sent", nil)
    retry_later()
  end
end)

-- The timer is gone once it fires, so its mark goes too, whoever is playing.
-- Send only to the resident it was set for: another resident may be playing by
-- now, and has a letter of their own.
on("timer_fired", function(e)
  if e.name ~= "retry" then return end
  store.set(retry_key(e.data), nil)
  local p = game.player()
  if p and p.id == e.data then send_today() end
end)
```

### example.harvest-post/messages/en.json

```json
{
  "letter": "Good morning! Here is a little something to start your day. Have a lovely time in town, and come back tomorrow for another!",
  "from": "A friend"
}
```

### example.harvest-post/mod.json

```json
{
  "schema": 1,
  "api": 1,
  "id": "example.harvest-post",
  "name": "Harvest Post",
  "version": "1.0.0",
  "authors": [
    "Play AC Online"
  ],
  "description": "Two calendar days of our own, the Harvest Fair and Apple Day, with a notice on the bulletin board and villagers talking about it all day. And once a game day, a script mails you a letter with a little present: a worked example of mod commands and a timer.",
  "scope": "world",
  "content": {
    "calendar": "calendar.json",
    "letters": "letters.json",
    "messages": "messages/en.json"
  },
  "scripts": {
    "main": "main.lua",
    "events": [
      "day_started",
      "scene_entered",
      "command_finished",
      "timer_fired"
    ]
  },
  "permissions": [
    "send_letter"
  ],
  "assets_original": true
}
```
