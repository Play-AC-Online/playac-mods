My Shop

A starter kit for changing the shops: the flower shop, and the goods at
Nook's.

1. Open mod.json in any text editor. Change "yourname" in "id" and "authors"
   to your own name (lower case letters, digits and dashes), and give the mod
   a "name" and "description" of your own.
2. Open shops.json. It has one entry for each shop, named by "target".
   - "flower": the shop's name, hours, greeting, stock line and stock. Each
     good is an item number and a price in Bells. The item number is a
     string like "0x2900". Leave "price" out for the usual price. The flower
     shop has 1 to 6 goods.
   - "nook": goods for Nook's, here a writing desk and a parasol. "mode"
     "add" puts them in up to half the spots of their kind, and Nook's own
     goods keep the rest. "replace" takes every spot of the kind. Nook's has
     1 to 16 goods, each in a spot of its own kind, from the next morning's
     restock. A nook entry takes no name or lines.
   Delete the entry for a shop you do not want to change.
3. ZIP the folder with Finder Compress or Windows Send to. Zipping the files
   inside it works too.
   In the game, open Settings, Mods. Under Install from a file, choose
   Choose a file. Then choose Restart now.
4. Visit the flower shop during your opening hours. Nook's goods show from
   the next restock, the first time the town is played on a day at or after
   6:00 AM.

A shop changes the town, so this is a World mod ("scope": "world"), and a
friend who visits needs it too.

Guides and item numbers: https://playaconline.com/modding/guides/flower-shop/
and https://playaconline.com/modding/guides/more-targets/#nook
