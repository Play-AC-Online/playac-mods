My Shop

A starter kit for changing the shops: the flower shop and Nook's store.

1. Open mod.json in any text editor. Change "yourname" in "id" and "authors"
   to your own name (lower case letters, digits and dashes), and give the mod
   a "name" and "description" of your own.
2. Open shops.json. Each key under "shops" is a shop id: "flower" is the
   flower shop and "nook" is Nook's store. Each shop takes a block, and every
   field of a block means the same on every shop:
   - "when": when the block applies. Here "hours" from 9:00 to 21:00. Leave
     "when" out for all day.
   - "own_goods": false makes your goods the shop's whole stock while the
     block applies. Leave it out and your goods join the shop's own, in up
     to half the spots of their kind.
   - "goods": each good is an item number and a price in Bells. The item
     number is a string like "0x2900". Leave "price" out for the usual price.
   - "name": the flower shop's name, on its door sign while it is shut.
   - "lines": what the keeper says. "greeting" is her hello, "stock" her
     answer to "What's in stock?".
   The flower shop takes 1 to 6 goods. Nook's, here a writing desk and a
   parasol added to his own goods, takes 1 to 16, each in a spot of its own
   kind, from the next morning's restock. Nook's has no name or lines.
   Other shops (Crazy Redd, Saharah, the barber shop and more) take a block
   by their own id. Which fields each one has:
   https://playaconline.com/modding/guides/shops/#table
   Delete the key of a shop you do not change.
3. ZIP the folder with Finder Compress or Windows Send to. Zipping the files
   inside it works too.
   In the game, open Settings, Mods. Under Install from a file, choose
   Choose a file. Then choose Restart now.
4. Visit the flower shop between 9:00 and 21:00. Nook's goods show from
   the next restock, the first time the town is played on a day at or after
   6:00 AM.

A shop changes the town, so this is a World mod ("scope": "world"), and a
friend who visits needs it too.

Guide and item numbers, for every shop:
https://playaconline.com/modding/guides/shops/
