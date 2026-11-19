My Lines

A starter kit for villager lines. There is no code to write. Once a day,
each villager you talk to says one of your lines, then carries on with
their usual hello.

The lines are in talk.json, in pools. A pool is a list of lines, and it
says who may say them:

- A pool with no "personality" and no "villager" is for everyone.
- "personality" is one of normal, peppy, lazy, jock, cranky and snooty.
- "villager" is one villager's name, such as "Bob". Any case works.
- "chance" is how many days in 100 the pool speaks. Leave it out for
  every day.

How the game uses the pools:

- On a villager's first ordinary talk of the day, the game picks one line.
  It uses the villager's own pools if there are any, else the pools for
  their personality, else the pools for everyone.
- Only that one level counts. In this kit a peppy villager says a peppy
  line, and a jock says a line for everyone, because no pool names jocks.
  Bob says his own line on about half the days and no line on the others.
- The game saves who has said a line today with your town, so a restart
  does not make a villager say a second one.
- Other mods can have pools too. When several match, all their lines are
  put together and one is picked.
- Special talks, such as a first meeting or an errand, never use a pool.

1. Open mod.json in any text editor. Change "yourname" in "id" and "authors"
   to your own name (lower case letters, digits and dashes), and give the mod
   a "name" and "description" of your own.
2. Open talk.json. Change the lines, and add or remove pools. A file holds
   up to 32 pools, and a pool 1 to 32 lines. Each line is 1 to 160
   characters, with at most 3 line breaks, written \n. Keep the quotes, and
   the commas between lines and between pools.
3. ZIP the folder with Finder Compress or Windows Send to. Zipping the files
   inside it works too.
   In the game, open Settings, Mods. Under Install from a file, choose
   Choose a file. Then choose Restart now.
4. Talk to a villager.

A line that depends on something, such as the time, the date or an item in
your pockets, needs a Lua script. The Script kit shows one.

Guide: https://playaconline.com/modding/guides/lines/
