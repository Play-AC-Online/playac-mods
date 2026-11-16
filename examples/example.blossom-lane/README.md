# Blossom Lane

A texture-only example mod. Every grown tree in town wears a cherry blossom
crown all year, with snow on top in winter. Fallen petals dot the grass from
spring to autumn. Golden trees stay gold, and saplings keep their look.

## In the game

![before](../../examples-media/example.blossom-lane/before.webp)

Before: a corner of town on a September afternoon, with no mods and the HD texture pack.

![after](../../examples-media/example.blossom-lane/after.webp)

After: the same spot with Blossom Lane installed. The fruit trees wear pink blossom (cherries still on them) and fallen petals dot the grass. The cedar in front is not a fruit tree and stays green.

![fruit trees](../../examples-media/example.blossom-lane/fruit-trees.webp)

Further along, the pear trees blossom too and keep their fruit among the pink flowers.

[![Play the film](../../examples-media/example.blossom-lane/film.webp)](../../examples-media/example.blossom-lane/film.mp4)

The film (click the picture): A walk past the houses with Blossom Lane installed: the fruit trees are in pink blossom, with petals on the grass all around.

A small program draws every pixel. Nothing is copied from the game. The crown
is lit puffs covered in five-petal flowers. The grass is seamless, with petal
drifts. Each texture is one 128x128 RGBA DDS, named the way the game looks
textures up:

    tex1_<width>x<height>_<texture hash>_<palette hash>_<format>.dds

A name can have `$` in place of the palette hash. That file is the texture
under any palette. This mod uses both kinds, 48 files in all:

| What | Texture hash | Files |
|---|---|---|
| Tree crown, the rest of the year (February 25 to December 9) | `a67216e4ad55d908` (64x64) | 15, one per palette |
| Tree crown, cherry blossom days (April 1 to 8) | `ac6a2be34281d4e2` (64x64) | 15, one per palette |
| Tree crown, winter (December 10 to February 24, snow-capped) | `53d6cc5ace654ac7` (64x64) | 15, one per palette |
| Grass, spring to autumn | `626709d910129694`, `903adc6355e36f59`, `e96fecd242518c9f` (32x32) | 3, one `$` file per texture |

## Why the grass uses `$` files

The game draws the grass under nine palettes, for the time of day and the
stretch of the year. The petal grass is the same picture under all of them, so
one `$` file per texture covers it. A `$` file is loaded once and shared by
every palette.

## Why the crowns do not

The trees change palette through the year. Golden trees are the same crowns
under a gold palette. A `$` crown matches any palette, the gold one too, and
would turn the golden trees pink. So this mod names every palette but the gold
one, and golden trees stay gold. That is why each crown is saved 15 times,
once per palette, though the picture is the same.

Cedars, palms and saplings have crowns of their own, and this mod leaves them
as they are. Their names are in the common textures table of the textures
guide.

The crown keeps the game's cut-out shape. Its corners are fully transparent,
so it draws as a round crown, never a square.

## With other mods

Winter grass is left as it is. The names say which in-game texture to replace,
and the pixels are our own.

Clover Meadow and Cobble Town also replace the grass, with `$` files like this
mod's. When two mods change the same texture, the lower one in your list wins.
A file named for one palette beats a `$` file for that palette, wherever its
mod is in the list.
