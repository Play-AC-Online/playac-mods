My Script

A starter kit for a Lua mod script.

main.lua listens to five everyday events: a talk, a new day, an item picked
up, a fish caught and a new scene. It keeps counts in the store and logs
what happens. It also queues commands: an apple for each resident, once, and
a line in your thought window for the first fish of the day. It reads each
result in command_finished.

When you talk to a villager with an apple in your pockets, they notice it,
once a day each. The line is "apple" in messages/en.json. The script reads
your pockets with game.pockets() and says the line only when the apple is
there.

The "notice" setting in mod.json turns that line on or off. The player sets
it on the Mods tab, and main.lua reads it with settings.get("notice").

mod.json also names Harvest Post, one of the example mods, under
"optional_depends". This mod loads with or without it. When Harvest Post is
there and today is its Harvest Fair, a new day starts with a line about the
fair. main.lua asks with remote.version, remote.has and remote.call.

Lines or Lua? A line that is the same whatever happens needs no code: put
it in a talk.json pool, as the Villager lines kit does. The game then picks
a line by villager or personality, once a day, and saves who spoke. Use Lua
when the line depends on something, such as the time, the date, the store
or what is in your pockets.

Read the log lines in the Mod log. It is at the bottom of Settings, Mods,
under For mod authors. They are also in the browser's developer console. Open it with F12, or Cmd+Option+J on a Mac,
and type [Mods] in its filter box.

The store is kept per town. The top of main.lua runs before any town is
loaded, so read and save the store inside events, as main.lua does.

1. Change "yourname" in mod.json's "id" and "authors" to your own name.
2. Edit main.lua. List only the events you use in mod.json's "events", and
   only the commands you use in "permissions". More events, such as
   item_bought, letter_read and hour_changed, are in the scripts guide below.
3. ZIP the folder with Finder Compress or Windows Send to. Zipping the files
   inside it works too.
   In the game, open Settings, Mods. Under Install from a file, choose
   Choose a file. Then choose Restart now.
4. Load your town. The apple comes into your pockets, or by letter when
   they are full. Then talk to a villager, or go fishing.

Guide: https://playaconline.com/modding/guides/scripts/
Which example shows what: https://playaconline.com/modding/cookbook/#how-do-i
