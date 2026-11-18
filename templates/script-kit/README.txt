My Script

A starter kit for a Lua mod script.

main.lua listens to four everyday events: a talk, a new day, an item picked
up and a new scene. It keeps a count in the store and logs what happens.
It also queues one command, an apple for each resident, once. It reads the
result in command_finished.

Read the log lines in the Mod log. It is at the bottom of Settings, Mods,
under For mod authors. They are also in the browser's developer console. Open it with F12, or Cmd+Option+J on a Mac,
and type [Mods] in its filter box.

The store is kept per town. The top of main.lua runs before any town is
loaded, so read and save the store inside events, as main.lua does.

1. Change "yourname" in mod.json's "id" and "authors" to your own name.
2. Edit main.lua. List only the events you use in mod.json's "events", and
   only the commands you use in "permissions". More events, such as
   fish_caught, item_bought and letter_read, are in the scripts guide below.
3. ZIP the folder with Finder Compress or Windows Send to. Zipping the files
   inside it works too.
   In the game, open Settings, Mods. Under Install from a file, choose
   Choose a file. Then choose Restart now.

Guide: https://playaconline.com/modding/guides/scripts/
