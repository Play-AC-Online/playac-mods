# Example mods

Generated from the Play AC Online mod API spec and errors catalogue. Do not edit by hand. These are the site's own working example mods, file by file. Each is its own repository, with the mod at the top: clone it, or download the ZIP of its tag.

## example.clover-meadow

Repository: https://github.com/Play-AC-Online/playac-example-clover-meadow (tag v1.0.1)

### example.clover-meadow/README.md

```
# Clover Meadow

A texture-only example mod. It replaces the town grass with our own drawing:
seamless green ground with clover leaves and small white flowers. It is one
128x128 uncompressed RGBA DDS picture, saved under every name the game draws
the grass with.

## In the game

![before](media/before.webp)

Before: a corner of town on a September afternoon, with no mods and the HD texture pack.

![after](media/after.webp)

After: the same spot with Clover Meadow installed. The grass is the mod's, drawn with clover and tiny white flowers; the trees, houses and paths are untouched.

![close up](media/close-up.webp)

A closer look at the mod's grass: clover leaves and small white flowers, drawn from scratch.

[![Play the film](media/film.webp)](media/film.mp4)

The film (click the picture): A walk past the houses with Clover Meadow installed: every grass tile in town is the mod's clover.

The names say which in-game texture to replace, and the pixels are our own.
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

The pictures were drawn by a small program, never copied from the game. They
are in `textures/`, ready to install.

## Install

In Play AC Online, open the Mods tab. Clover Meadow is in the mod list as an
official example: install it from there. Or download its ZIP from the
[cookbook](https://playaconline.com/modding/cookbook/) and add the file in the
Mods tab.

## Make your own

This repository is one mod, laid out the way the GitHub import wants it:
`mod.json` at the top, and a tag named for the version in `mod.json`.

1. Copy the repository to your own account.
2. Change `"id"` in `mod.json` to your own, like `yourname.clover-meadow`.
   Ids that start with `example.` are kept for these examples, so the import
   refuses them.
3. Tag the commit with the version, like `v1.0.0`.
4. In the Mods tab, choose Import from GitHub and paste
   `github.com/<you>/<repository>@v1.0.0`.

The modding guide is at [playaconline.com/modding](https://playaconline.com/modding/).

`media/` holds the pictures and the film the cookbook shows, with their
captions in `media/media.json`. `.playac/screenshots/` holds the listing's
screenshots. The pack rule leaves the pictures, the film and the screenshots
out of the mod.

## License

MIT, see [LICENSE](LICENSE).
```

### example.clover-meadow/mod.json

```json
{
  "schema": 1,
  "api": 1,
  "id": "example.clover-meadow",
  "name": "Clover Meadow",
  "version": "1.0.1",
  "authors": ["Play AC Online"],
  "description": "Town grass with clover and tiny white flowers. A texture-only mod, drawn from scratch.",
  "scope": "client",
  "content": {
    "textures": "textures/"
  },
  "assets_original": true
}
```

- `textures/`: 6 binary file(s), not shown

## example.chatty-villagers

Repository: https://github.com/Play-AC-Online/playac-example-chatty-villagers (tag v1.0.1)

### example.chatty-villagers/README.md

```
# Chatty Villagers

A villager line pool example (`talk.json`). It is a Just you mod
(`"scope": "client"`), so only you hear it. It has no script. The game picks
the line.

## In the game

![mod line](media/mod-line.webp)

The first talk of the day opens on a new line from the mod's talk pools, picked for the villager's personality.

![own hello](media/own-hello.webp)

The next page is the villager's own hello: the mod's line comes first, and the game's conversation carries on as usual.

![second talk](media/second-talk.webp)

Talk again the same day and there is no mod line: one new line per villager per day.

[![Play the film](media/film.webp)](media/film.mp4)

The film (click the picture): Twiggy's first talk of the day opens on the mod's line, then her own words; a second talk skips straight to her hello.

Each personality has its own pool. On the first ordinary talk of the day, a
villager says one line from their personality's pool. Then they say their
usual hello and carry on as normal.

A pool can instead name one villager (`"villager": "Bob"`), or nobody, which
means every villager. A pool can say a line only on some days
(`"chance": 40`). The most specific pools that match a villager decide.

## Install

In Play AC Online, open the Mods tab. Chatty Villagers is in the mod list as an
official example: install it from there. Or download its ZIP from the
[cookbook](https://playaconline.com/modding/cookbook/) and add the file in the
Mods tab.

## Make your own

This repository is one mod, laid out the way the GitHub import wants it:
`mod.json` at the top, and a tag named for the version in `mod.json`.

1. Copy the repository to your own account.
2. Change `"id"` in `mod.json` to your own, like `yourname.chatty-villagers`.
   Ids that start with `example.` are kept for these examples, so the import
   refuses them.
3. Tag the commit with the version, like `v1.0.0`.
4. In the Mods tab, choose Import from GitHub and paste
   `github.com/<you>/<repository>@v1.0.0`.

The modding guide is at [playaconline.com/modding](https://playaconline.com/modding/).

`media/` holds the pictures and the film the cookbook shows, with their
captions in `media/media.json`. `.playac/screenshots/` holds the listing's
screenshots. The pack rule leaves the pictures, the film and the screenshots
out of the mod.

## License

MIT, see [LICENSE](LICENSE).
```

### example.chatty-villagers/mod.json

```json
{
  "schema": 1,
  "api": 1,
  "id": "example.chatty-villagers",
  "name": "Chatty Villagers",
  "version": "1.0.1",
  "authors": ["Play AC Online"],
  "description": "Villagers say one new line a day before their usual hello, each in their own personality's voice. Data only, no script.",
  "scope": "client",
  "content": {
    "talk": "talk.json"
  },
  "assets_original": true
}
```

### example.chatty-villagers/talk.json

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


## example.tea-house

Repository: https://github.com/Play-AC-Online/playac-example-tea-house (tag v1.1.1)

### example.tea-house/README.md

```
# Tea House

A World mod (`"scope": "world"`) that turns the flower shop into a tea house in
the evening, in five languages.

## In the game

![sign at noon](media/sign-at-noon.webp)

At noon the flower shop's door stays shut and its sign is the mod's: Tea House, open 3:00 PM to 1:00 AM.

![shop at six](media/shop-at-six.webp)

Inside at 6 PM: the tables hold the mod's six fruits, at the mod's prices.

![greeting](media/greeting.webp)

Joan greets you with the mod's words from shops.json.

![stock line](media/stock-line.webp)

Ask her what's in stock and she answers with the mod's stock line.

[![Play the film](media/film.webp)](media/film.mp4)

The film (click the picture): Knocking at noon gets the Tea House sign and its hours; in the evening the shop is open, and a chat with Joan is the mod's greeting and stock line.

## The shop

`shops.json` gives the flower shop a name, hours, a greeting, an answer to
"What's in stock?" and six goods with prices. A shop changes the town, so the
mod is a World mod.

`messages/en.json` holds one line, `hours`. Other mods can read it as
`example.tea-house:hours`, with `message("example.tea-house:hours")` in a script.

## In other languages

`"translations": "translations/"` in `mod.json` names a folder with the shop's
texts in German, Spanish, French and Italian.

- Each file is one list of key and text. A key is the path of a text:
  `shops/flower/name`, `shops/flower/greeting`, `shops/flower/stock_line`.
- `mod/name` and `mod/description` are the mod's own name and description. The
  Mods tab shows them. The game does not.
- There is no `en.json`. English is the text in `shops.json` itself.
- The game shows a text in its own language when that language's file has it.
  It shows the English text when not. Each text is decided alone.
- A translation follows the rule of the text it replaces. A greeting is at most
  160 characters with at most 3 line breaks, in every language.
- A shop line can use the accented letters the game's font has, such as the "é"
  in "thé". A letter or a board notice cannot.

To try a language on any disc, turn developer mode on and add `?modlang=de` to
the game's address.

## Install

In Play AC Online, open the Mods tab. Tea House is in the mod list as an
official example: install it from there. Or download its ZIP from the
[cookbook](https://playaconline.com/modding/cookbook/) and add the file in the
Mods tab.

## Make your own

This repository is one mod, laid out the way the GitHub import wants it:
`mod.json` at the top, and a tag named for the version in `mod.json`.

1. Copy the repository to your own account.
2. Change `"id"` in `mod.json` to your own, like `yourname.tea-house`.
   Ids that start with `example.` are kept for these examples, so the import
   refuses them.
3. Tag the commit with the version, like `v1.0.0`.
4. In the Mods tab, choose Import from GitHub and paste
   `github.com/<you>/<repository>@v1.0.0`.

The modding guide is at [playaconline.com/modding](https://playaconline.com/modding/).

`media/` holds the pictures and the film the cookbook shows, with their
captions in `media/media.json`. `.playac/screenshots/` holds the listing's
screenshots. The pack rule leaves the pictures, the film and the screenshots
out of the mod.

## License

MIT, see [LICENSE](LICENSE).
```

### example.tea-house/messages/en.json

```json
{
  "hours": "The Tea House is open from 3 PM until 1 AM."
}
```

### example.tea-house/mod.json

```json
{
  "schema": 1,
  "api": 1,
  "id": "example.tea-house",
  "name": "Tea House",
  "version": "1.1.1",
  "authors": ["Play AC Online"],
  "description": "The flower shop becomes a tea house in the evening. It has its own greeting and hours, and fruit for tea on every table.",
  "scope": "world",
  "content": {
    "shops": "shops.json",
    "messages": "messages/en.json",
    "translations": "translations/"
  },
  "assets_original": true
}
```

### example.tea-house/shops.json

```json
{
  "shops": [
    {
      "target": "flower",
      "name": "Tea House",
      "hours": { "open": "15:00", "close": "01:00" },
      "greeting": "Welcome to the Tea House! Every fruit here goes lovely with a cup. Take your time.",
      "stock_line": "Fresh fruit, all six kinds, on the tables by the walls. Point at one and I'll tell you the price.",
      "stock": [
        { "item": "0x2800", "price": 600 },
        { "item": "0x2801", "price": 600 },
        { "item": "0x2802", "price": 600 },
        { "item": "0x2803", "price": 600 },
        { "item": "0x2804", "price": 600 },
        { "item": "0x2807", "price": 800 }
      ]
    }
  ]
}
```

### example.tea-house/translations/de.json

```json
{
  "mod/name": "Teehaus",
  "mod/description": "Am Abend wird der Blumenladen zum Teehaus. Es hat eine eigene Begrüßung, eigene Öffnungszeiten und Obst zum Tee auf jedem Tisch.",
  "shops/flower/name": "Teehaus",
  "shops/flower/greeting": "Willkommen im Teehaus! Jedes Obst hier passt wunderbar zu einer Tasse. Lass dir Zeit.",
  "shops/flower/stock_line": "Frisches Obst, alle sechs Sorten, auf den Tischen an den Wänden. Zeig auf eins und ich sage dir den Preis."
}
```

### example.tea-house/translations/es.json

```json
{
  "mod/name": "Casa de té",
  "mod/description": "Por la tarde, la floristería se convierte en una casa de té. Tiene su propio saludo, su horario y fruta para el té en cada mesa.",
  "shops/flower/name": "Casa de té",
  "shops/flower/greeting": "Bienvenido a la casa de té. Aquí toda la fruta va muy bien con una taza. Tómate tu tiempo.",
  "shops/flower/stock_line": "Fruta fresca, las seis clases, en las mesas junto a las paredes. Señala una y te digo el precio."
}
```

### example.tea-house/translations/fr.json

```json
{
  "mod/name": "Salon de thé",
  "mod/description": "Le soir, la boutique de fleurs devient un salon de thé. Il a son propre accueil, ses horaires et des fruits pour le thé sur chaque table.",
  "shops/flower/name": "Salon de thé",
  "shops/flower/greeting": "Bienvenue au salon de thé ! Chaque fruit ici se marie bien avec une tasse. Prends ton temps.",
  "shops/flower/stock_line": "Des fruits frais, les six sortes, sur les tables près des murs. Montre-m'en un et je te dis le prix."
}
```

### example.tea-house/translations/it.json

```json
{
  "mod/name": "Sala da tè",
  "mod/description": "La sera il negozio di fiori diventa una sala da tè. Ha il suo saluto, i suoi orari e frutta per il tè su ogni tavolo.",
  "shops/flower/name": "Sala da tè",
  "shops/flower/greeting": "Benvenuto nella sala da tè! Ogni frutto qui sta benissimo con una tazza. Fai con calma.",
  "shops/flower/stock_line": "Frutta fresca, tutti e sei i tipi, sui tavoli lungo le pareti. Indicane uno e ti dico il prezzo."
}
```


## example.cosy-corner

Repository: https://github.com/Play-AC-Online/playac-example-cosy-corner (tag v1.0.1)

### example.cosy-corner/README.md

```
# Cosy Corner

A World mod (`"scope": "world"`) that adds two pieces of furniture of its own,
a Tea Chest and a Reading Chair, and sells them at the flower shop.

## In the game

![offer](media/offer.webp)

At the flower shop Joan offers the mod's Tea Chest by its own name, for 1,800 Bells.

![in pockets](media/in-pockets.webp)

Bought, it sits in your pockets as the Tea Chest, a mod item on top of a plain piece of furniture.

![placed](media/placed.webp)

Put in your room through the pocket menu: the blue chest in the middle is the mod's Tea Chest.

[![Play the film](media/film.webp)](media/film.mp4)

The film (click the picture): Buying the Tea Chest from Joan, then putting it in the house from the pockets.

## The items

`items.json` lists the new items. Each has an `id`, a `name`, a `price`
and a `base`: the game's own piece it is built on. The base is what the
player sees and what the game saves. The mod's id is kept beside it.

- With the mod installed, the piece is the mod's item, with its own name.
- Remove the mod and the piece stays in the house as the plain base piece.
- Put the mod back and it is the mod's item again.

Other files name an item as `example.cosy-corner:tea-chest`: the mod id, a
colon, and the item id.

## The shop

`shops.json` gives the flower shop a name, a greeting, an answer to
"What's in stock?" and three goods: the two new items at the price
`items.json` gives them, and apples at a price of their own.

## Renaming an item

The first version called the Tea Chest `tea-box`. `"renames"` in
`mod.json` maps the old name to the new one, so a Tea Chest saved under the
old name is still a Tea Chest.

## Install

In Play AC Online, open the Mods tab. Cosy Corner is in the mod list as an
official example: install it from there. Or download its ZIP from the
[cookbook](https://playaconline.com/modding/cookbook/) and add the file in the
Mods tab.

## Make your own

This repository is one mod, laid out the way the GitHub import wants it:
`mod.json` at the top, and a tag named for the version in `mod.json`.

1. Copy the repository to your own account.
2. Change `"id"` in `mod.json` to your own, like `yourname.cosy-corner`.
   Ids that start with `example.` are kept for these examples, so the import
   refuses them.
3. Tag the commit with the version, like `v1.0.0`.
4. In the Mods tab, choose Import from GitHub and paste
   `github.com/<you>/<repository>@v1.0.0`.

The modding guide is at [playaconline.com/modding](https://playaconline.com/modding/).

`media/` holds the pictures and the film the cookbook shows, with their
captions in `media/media.json`. `.playac/screenshots/` holds the listing's
screenshots. The pack rule leaves the pictures, the film and the screenshots
out of the mod.

## License

MIT, see [LICENSE](LICENSE).
```

### example.cosy-corner/items.json

```json
{
  "items": [
    { "id": "tea-chest", "name": "Tea Chest", "base": "0x1008", "price": 1800 },
    { "id": "reading-chair", "name": "Reading Chair", "base": "0x10f8", "price": 1200 }
  ]
}
```

### example.cosy-corner/mod.json

```json
{
  "schema": 1,
  "api": 1,
  "id": "example.cosy-corner",
  "name": "Cosy Corner",
  "version": "1.0.1",
  "authors": ["Play AC Online"],
  "description": "Adds two pieces of furniture, a Tea Chest and a Reading Chair, sold at the flower shop. Remove the mod and they stay in your house as the plain pieces they are built on. Put it back and they are yours again.",
  "scope": "world",
  "content": {
    "items": "items.json",
    "shops": "shops.json"
  },
  "renames": {
    "example.cosy-corner:tea-box": "example.cosy-corner:tea-chest"
  },
  "assets_original": true
}
```

### example.cosy-corner/shops.json

```json
{
  "shops": [
    {
      "target": "flower",
      "name": "Cosy Corner",
      "greeting": "Welcome! Today the tables hold something for the house, made here and nowhere else.",
      "stock_line": "A Tea Chest and a Reading Chair, and fruit for the table. Point at one and I'll tell you the price.",
      "stock": [
        { "item": "example.cosy-corner:tea-chest" },
        { "item": "example.cosy-corner:reading-chair" },
        { "item": "0x2800", "price": 600 }
      ]
    }
  ]
}
```


## example.harvest-festival

Repository: https://github.com/Play-AC-Online/playac-example-harvest-festival (tag v1.1.2)

### example.harvest-festival/README.md

```
# Harvest Fair

A calendar example (`calendar.json`) with a letter template
(`letters.json`).

## In the game

![board](media/board.webp)

On the third Wednesday of September the town bulletin board carries the mod's notice, dated by the game.

![fair line](media/fair-line.webp)

All day, villagers open with a line about the fair from the mod's calendar.json.

![own words](media/own-words.webp)

Then the villager carries on in their own words: the fair line comes first, nothing of the game's is lost.

[![Play the film](media/film.webp)](media/film.mp4)

The film (click the picture): The Harvest Fair notice on the bulletin board, then Twiggy talking about the fair before her usual chat.

- It adds two calendar days. The Harvest Fair is the third Wednesday of
  September (`week` 3, `weekday` 3). Apple Day is October 21 (`day`).
- On each day a notice goes up on the town bulletin board. It is posted once,
  in the player's own town only. Villagers say one of the day's lines before
  their hello.
- A board notice changes the town, so this is a World mod
  (`"scope": "world"`).
- `fair-thanks` is a letter that a mod command can mail. Use `send_letter` and
  name it `example.harvest-festival:fair-thanks`. The player's name goes where
  `{player}` is, and an apple comes with it.
- The letter signs "The Fair Committee". The mailbox list has room for 8
  characters, so `sender` names it "The Fair" there.

Letter and notice text is plain ASCII and must fit six lines of the paper. The
game measures it in its own font and refuses text that does not fit.

## In German and French

`translations/de.json` and `translations/fr.json` hold the same texts in German
and French (`"translations": "translations/"` in `mod.json`).

- A key is the path of a text. `calendar/harvest-fair/board` is that day's
  notice. `calendar/harvest-fair/talk/2` is its second line.
  `letters/fair-thanks/body` is the letter's body.
- The game shows a text in its own language when that language's file has it.
  It shows the English text from `calendar.json` or `letters.json` when not.
  Each text is decided alone.
- A translation follows the rule of the text it replaces. The notices and the
  letter stay plain ASCII in every language, so the German notice says "fuer"
  and the German letter says "waechst". The villager lines can use the accented letters the game's font
  has, so they say "glänzt" and "fête".
- `mod/name` and `mod/description` are the mod's own name and description. The
  Mods tab shows them. The game does not.
- There is no `en.json`. English is the text in the mod's own files.
- To try a language on any disc, turn developer mode on and add `?modlang=de`
  to the game's address.

## Install

In Play AC Online, open the Mods tab. Harvest Fair is in the mod list as an
official example: install it from there. Or download its ZIP from the
[cookbook](https://playaconline.com/modding/cookbook/) and add the file in the
Mods tab.

## Make your own

This repository is one mod, laid out the way the GitHub import wants it:
`mod.json` at the top, and a tag named for the version in `mod.json`.

1. Copy the repository to your own account.
2. Change `"id"` in `mod.json` to your own, like `yourname.harvest-festival`.
   Ids that start with `example.` are kept for these examples, so the import
   refuses them.
3. Tag the commit with the version, like `v1.0.0`.
4. In the Mods tab, choose Import from GitHub and paste
   `github.com/<you>/<repository>@v1.0.0`.

The modding guide is at [playaconline.com/modding](https://playaconline.com/modding/).

`media/` holds the pictures and the film the cookbook shows, with their
captions in `media/media.json`. `.playac/screenshots/` holds the listing's
screenshots. The pack rule leaves the pictures, the film and the screenshots
out of the mod.

## License

MIT, see [LICENSE](LICENSE).
```

### example.harvest-festival/calendar.json

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

### example.harvest-festival/letters.json

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

### example.harvest-festival/mod.json

```json
{
  "schema": 1,
  "api": 1,
  "id": "example.harvest-festival",
  "name": "Harvest Fair",
  "version": "1.1.2",
  "authors": ["Play AC Online"],
  "description": "Two calendar days of our own. The Harvest Fair is the third Wednesday of September and Apple Day is October 21. A notice goes up on the bulletin board and villagers talk about it all day. It also carries a thank-you letter template for mod commands.",
  "scope": "world",
  "content": {
    "calendar": "calendar.json",
    "letters": "letters.json",
    "translations": "translations/"
  },
  "assets_original": true
}
```

### example.harvest-festival/translations/de.json

```json
{
  "mod/name": "Erntefest",
  "mod/description": "Zwei eigene Kalendertage. Das Erntefest ist am dritten Mittwoch im September und der Apfeltag am 21. Oktober. Am Schwarzen Brett hängt ein Aushang, und die Bewohner reden den ganzen Tag davon. Dazu gibt es eine Vorlage für einen Dankesbrief.",
  "calendar/harvest-fair/board": "HEUTE IST ERNTEFEST!\nBring dein bestes Obst mit\nund zeig es den Nachbarn.\nDer dickste Apfel gewinnt\nRuhm fuer ein ganzes Jahr.",
  "calendar/harvest-fair/talk/1": "Heute ist Erntefest! Ich poliere meine Birnen schon seit Sonnenaufgang.",
  "calendar/harvest-fair/talk/2": "Erntefest! Hast du Obst dabei? Meins glänzt am schönsten, ich habe nachgesehen.",
  "calendar/harvest-fair/talk/3": "Es riecht nach Äpfeln und Holzrauch. Der schönste Tag der Saison!",
  "calendar/apple-day/board": "APFELTAG\nTeile heute einen Apfel\nmit einem Freund. Jeder\nApfel passt, ein roter\nsagt es am besten.",
  "calendar/apple-day/talk/1": "Frohen Apfeltag! Hast du heute schon einen Apfel geteilt?",
  "calendar/apple-day/talk/2": "Ein Apfel am Tag, sagt man. Heute gibt es einen für alle!",
  "letters/fair-thanks/header": "Hallo {player},",
  "letters/fair-thanks/body": "Danke, dass du beim Erntefest\nwarst! Hier ist ein Apfel vom\nPreistisch. Pflanz ihn ein\nund schau, was waechst.",
  "letters/fair-thanks/footer": "Das Festkomitee",
  "letters/fair-thanks/sender": "Das Fest"
}
```

### example.harvest-festival/translations/fr.json

```json
{
  "mod/name": "Fête des récoltes",
  "mod/description": "Deux jours de calendrier à nous. La fête des récoltes est le troisième mercredi de septembre et le jour de la pomme est le 21 octobre. Un avis est affiché au panneau et les habitants en parlent toute la journée. Il y a aussi un modèle de lettre de remerciement.",
  "calendar/harvest-fair/board": "FETE DES RECOLTES !\nApporte tes plus beaux\nfruits et montre-les aux\nvoisins. La plus grosse\npomme gagne la gloire.",
  "calendar/harvest-fair/talk/1": "C'est la fête des récoltes ! Je fais briller mes poires depuis l'aube.",
  "calendar/harvest-fair/talk/2": "La fête des récoltes ! Tu as apporté des fruits ? Les miens brillent le plus, j'ai vérifié.",
  "calendar/harvest-fair/talk/3": "Ça sent la pomme et le feu de bois. Le plus beau jour de la saison !",
  "calendar/apple-day/board": "JOUR DE LA POMME\nPartage une pomme avec\nun ami. Toutes vont bien,\nmais une rouge le dit\nmieux.",
  "calendar/apple-day/talk/1": "Joyeux jour de la pomme ! As-tu déjà partagé une pomme ?",
  "calendar/apple-day/talk/2": "Une pomme par jour, dit-on. Aujourd'hui, une pomme pour tout le monde !",
  "letters/fair-thanks/header": "Bonjour {player},",
  "letters/fair-thanks/body": "Merci d'etre venu a la fete\ndes recoltes ! Voici une pomme\nde la table des prix. Plante-la\net regarde ce qui pousse.",
  "letters/fair-thanks/footer": "Le comite de la fete",
  "letters/fair-thanks/sender": "La fete"
}
```


## example.daily-gift

Repository: https://github.com/Play-AC-Online/playac-example-daily-gift (tag v1.1.2)

### example.daily-gift/README.md

```
# Daily Gift

A Just you mod (`"scope": "client"`) with a Lua script. Once a game day, a
letter with a little present arrives in your mailbox.

## In the game

![at the mailbox](media/at-the-mailbox.webp)

The day's first visit to town: the mod's script has already mailed today's letter, so there is mail waiting at the house.

![letter in pockets](media/letter-in-pockets.webp)

Taken from the mailbox, it is a letter to you from "A friend", sent with the send_letter command.

![the letter](media/the-letter.webp)

The letter is the mod's own text, from its messages file, with a little present attached.

[![Play the film](media/film.webp)](media/film.mp4)

The film (click the picture): Walking up to the mailbox, taking out the Daily Gift letter and reading it.

## Commands

An event handler never changes the game itself. It queues a command, and the
game applies it at the end of a frame's update, once the player is free.

- `cmd.send_letter{ text = ..., item = ..., from = ... }` queues the letter.
  It returns the command's id, or `nil`, a message and a code when the game
  refuses it now.
- `"permissions": ["send_letter"]` in `mod.json` names the command. A
  command the mod does not name is refused.
- `command_finished` says what happened to it: `e.ok`, `e.via`
  (`mailbox`, or `post_office` when the mailbox was full), or `e.code` and
  `e.message` for a refusal.
- The game's cap is 3 letters a day from one mod, per town. The refusal's code
  is `command-day-cap`.

## Timers

A letter the game could not take now (both boxes full, or the player away from
home) is tried again half a game hour later.

- `timer.after(30, "retry", p.id)` counts game minutes. The timer is kept with
  the town's data, so it still fires after a save and a reload.
- `timer_fired` brings back the name and the data: here, whose letter it was.

## Saved data

- `store.player` remembers the day's letter, so each resident of the town gets
  their own.
- The town's `store` keeps the mark that a retry timer is waiting, under the
  resident's id. The timer may fire while another resident plays, and only the
  town's store can be cleared then.
- `rng()` counts the numbers the mod drew in this town today and keeps that
  count with the town, so reloading the game cannot reroll the present.

## Events

`day_started` sends the day's letter. `scene_entered` tries too, since a game
loaded on a day it already saw does not run `day_started` again.

## Install

In Play AC Online, open the Mods tab. Daily Gift is in the mod list as an
official example: install it from there. Or download its ZIP from the
[cookbook](https://playaconline.com/modding/cookbook/) and add the file in the
Mods tab.

## Make your own

This repository is one mod, laid out the way the GitHub import wants it:
`mod.json` at the top, and a tag named for the version in `mod.json`.

1. Copy the repository to your own account.
2. Change `"id"` in `mod.json` to your own, like `yourname.daily-gift`.
   Ids that start with `example.` are kept for these examples, so the import
   refuses them.
3. Tag the commit with the version, like `v1.0.0`.
4. In the Mods tab, choose Import from GitHub and paste
   `github.com/<you>/<repository>@v1.0.0`.

The modding guide is at [playaconline.com/modding](https://playaconline.com/modding/).

`media/` holds the pictures and the film the cookbook shows, with their
captions in `media/media.json`. `.playac/screenshots/` holds the listing's
screenshots. The pack rule leaves the pictures, the film and the screenshots
out of the mod.

## License

MIT, see [LICENSE](LICENSE).
```

### example.daily-gift/main.lua

```lua
-- Daily Gift: once a game day, a letter with a little present arrives in the
-- mailbox. A worked example of mod commands: an event handler never changes the
-- game itself, it QUEUES a command, and the game applies it at the end of a frame's
-- update, once the player is free. mod.json must name the command in "permissions".
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

### example.daily-gift/messages/en.json

```json
{
  "letter": "Good morning! Here is a little something to start your day. Have a lovely time in town, and come back tomorrow for another!",
  "from": "A friend"
}
```

### example.daily-gift/mod.json

```json
{
  "schema": 1,
  "api": 1,
  "id": "example.daily-gift",
  "name": "Daily Gift",
  "version": "1.1.2",
  "authors": ["Play AC Online"],
  "description": "Once a game day, a letter with a little present arrives in your mailbox. A worked example of mod commands and a timer.",
  "scope": "client",
  "content": {
    "messages": "messages/en.json"
  },
  "scripts": {
    "main": "main.lua",
    "events": ["day_started", "scene_entered", "command_finished", "timer_fired"]
  },
  "permissions": ["send_letter"],
  "assets_original": true
}
```
