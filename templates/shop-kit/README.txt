My Shop

A starter kit for changing the shops: the flower shop and Nook's store.

1. Open mod.json in any text editor. Change "yourname" in "id" and "authors"
   to your own name (lower case letters, digits and dashes), and give the mod
   a "name" and "description" of your own.
2. Open shops.json. It has one entry for each shop, named by "target". Both
   take the same entry:
   - "mode": "replace" makes your goods the shop's whole stock. "add" puts
     them in up to half the spots of their kind, and the shop's own goods
     keep the rest.
   - "hours": when your entry applies. Inside them the shop is yours, and
     open even at night. Outside them it is the game's own. Leave "hours" out
     for all day.
   - "stock": each good is an item number and a price in Bells. The item
     number is a string like "0x2900". Leave "price" out for the usual price.
   The flower shop ("flower") takes 1 to 6 goods, and also a name, a greeting
   and a stock line. Nook's ("nook"), here a writing desk and a parasol added
   to his own goods, takes 1 to 16 goods, each in a spot of its own kind,
   from the next morning's restock. Nook's has no name or lines.
   Delete the entry for a shop you do not want to change.
3. ZIP the folder with Finder Compress or Windows Send to. Zipping the files
   inside it works too.
   In the game, open Settings, Mods. Under Install from a file, choose
   Choose a file. Then choose Restart now.
4. Visit the flower shop during your hours. Nook's goods show from
   the next restock, the first time the town is played on a day at or after
   6:00 AM.

A shop changes the town, so this is a World mod ("scope": "world"), and a
friend who visits needs it too.

Guide and item numbers, for both shops:
https://playaconline.com/modding/guides/shops/
