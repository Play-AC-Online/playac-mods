My Lines

A starter kit for villager lines. There is no code to write. Talk to a
villager and choose to chat (an answer such as "I'm bored!" after their
hello). They pick a topic, the way they always do: a trade, a letter, a
hint, or small talk about the weather and the day. When they pick small
talk, one of your lines can be what they say.

The lines are in talk.json, in pools. A pool is a list of lines, and it
says who may say them, and when:

- A pool with no "personality" and no "villager" is for everyone.
- "personality" is one of normal, peppy, lazy, jock, cranky and snooty.
- "villager" is one villager's name, such as "Bob". Any case works.
- "season" is spring, summer, fall or winter.
- "time" is morning (5 to 12), day (12 to 17), evening (17 to midnight)
  or night (midnight to 5).
- "weather" is clear, rain or snow.
- "chance" is how many small talks in 100 say the pool's line. Leave it
  out for every one.

How the game uses the pools:

- Each time a villager picks small talk, the game looks at the villager's
  own pools if there are any, else the pools for their personality, else
  the pools for everyone. A pool counts only when its season, time and
  weather are the ones now.
- Only that one level counts. In this kit a peppy villager says a peppy
  line, and a jock says a line for everyone, because no pool names jocks.
  On a rainy day a jock may say the rain line too, and in the evening
  the evening line.
- A villager can say several of your lines in a day, and never the same
  one twice running when there is another.
- Other mods can have pools too. When several fit, all their lines are
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
4. Talk to a villager and choose to chat, a few times.

A line that depends on something else, such as an item in your pockets,
needs a Lua script. The Script kit shows one.

Guide: https://playaconline.com/modding/guides/lines/
