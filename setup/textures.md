# Texture tools

A texture mod is a folder of pictures. Each picture is saved under the exact
name of the game texture it replaces. You need three things: the name, a paint
program and a file the game reads. This guide gets you each one.

You need no command line. The only terminal step is optional: converting to
DDS with ImageMagick or texconv.

The textures guide has more detail:
https://playaconline.com/modding/guides/textures/

## 1. A mod folder to put pictures in

Get one in any of these ways:

- **The texture kit (recommended):** download it from
  the newest "Starter kits and AI pack" release of this repository,
  https://github.com/Play-AC-Online/playac-mods/releases, and unzip it. It works as it is,
  and turns the town grass into a green check. Its pictures are in
  `textures/`.
- **The Clover Meadow example:** the `playac-example-clover-meadow`
  repository, also a ZIP on the downloads page. It draws clover over the town
  grass, with one `$` file per grass texture.
- **With the tool:** run `playac-mod new yourname.my-textures --kind texture`
  ([Node.js and playac-mod](node-and-cli.md)).

Open the folder's `mod.json` in any text editor. Change `yourname` in `"id"`
and `"authors"` to your own name. Use lower case letters, digits and dashes.

## 2. Find a texture's name

### In the model viewer

The model viewer names the textures of a model: a villager, a tree, a rock, a
piece of furniture or clothing, a tool or a building. Start here.

1. Open https://playaconline.com/viewer/. Like the game, it reads your own
   disc on this device.
2. Pick a model from the list and press **Textures**. It lists each texture
   with its picture, size, format and file name.
3. Pick a texture and use its buttons:
   - **Copy name** copies its file name.
   - **Any palette** copies the `$` name of a texture with a palette.
   - **Save PNG** saves the picture to look at.

### In the game, with the texture inspector

The ground, the sky, the water, the menus and the effects are not models, so
the viewer cannot show them. The game shows you every texture it draws, under
the same file names.

1. Open https://playaconline.com/play/?moddev=1 and load your town.
   [The game](game.md) explains developer mode.
2. Open **Settings, Mods**. In the **Developer** section at the bottom, press
   **Record textures**.
3. Close Settings and walk to where the texture is drawn.
4. Open **Settings, Mods** again. The newest textures are listed first. The
   filter box narrows them by name or size, such as `64x64`.
5. Use the buttons on each texture to find the right one:
   - **Flash** draws it bright magenta in the game for 3 seconds, so you can
     see which it is.
   - **Copy name** copies its file name.
   - **Any palette** copies the `$` name of a texture with a palette.
   - **PNG** saves the picture to look at.

**Check it worked:** paste the name somewhere. A texture with no palette is
named like `tex1_32x32_8b5a1b4a83d4d7c7_14`. A texture with a palette has its
palette hash too, like `tex1_32x32_626709d910129694_193ca5974976e36e_8`, and
its any-palette name has `$` in its place:
`tex1_32x32_626709d910129694_$_8`. Your file is that name ending `.png` or
`.dds`.

**Seasons and times of day.** Many textures, such as grass, trees and cliffs,
are drawn with a colour palette. The palette changes through the day and the
year, and each palette gives the texture another name. A name with `$` in
place of the palette part matches all of them, like
`tex1_32x32_626709d910129694_$_8.dds`. Press **Any palette** to copy that
name. Use the exact name to change one season only.

A PNG saved from the viewer or the inspector is the game's own art. Use it
only for the size and the layout, draw your own picture, and never share the
game's. The mod list refuses an unchanged copy.

## 3. A paint program

Any program that saves PNG works. These are free:

| Program | macOS | Windows | Linux | Saves DDS itself |
|---|---|---|---|---|
| Krita, https://krita.org | yes | yes | yes | no, save PNG |
| GIMP, https://www.gimp.org | yes | yes | yes | **yes** |
| Paint.NET, https://www.getpaint.net | | yes | | **yes** |
| Pinta, https://www.pinta-project.com | yes | yes | yes | no, save PNG |
| LibreSprite (pixel art), https://libresprite.github.io | yes | yes | yes | no, save PNG |
| Photopea, https://www.photopea.com (in the browser) | yes | yes | yes | no, save PNG |

Install one in your system's usual way, or with one of these lines:

- macOS (with Homebrew): `brew install --cask krita` or
  `brew install --cask gimp`
- Windows: `winget install KDE.Krita`, `winget install GIMP.GIMP.3` or
  `winget install dotPDN.PaintDotNet`
- Linux: your software centre, or Flathub with
  `flatpak install flathub org.kde.krita` or
  `flatpak install flathub org.gimp.GIMP`

**Check it worked:** open the PNG the viewer saved and you see the texture.

Tips:

- Keep the picture the same shape as the original. A 32x64 texture stays twice
  as tall as it is wide.
- The same size works. 2x or 4x is sharper.
- Many game textures are tiny and tile. Paint at 4x and check that the edges
  meet.

## 4. Save it, PNG or DDS

| | PNG | DDS |
|---|---|---|
| Easiest | **yes**, every program saves it | needs GIMP, Paint.NET or a converter |
| File name | the texture's name ending `.png` | the texture's name ending `.dds` |
| Memory in the game | uncompressed, 4 bytes a pixel | uncompressed, or much less as BC1/BC3/BC7 |
| Transparency | yes | yes (BC1 only on or off) |

**Start with PNG.** Use DDS when your pictures are big or many. Compressed DDS
(BC1 or BC3) takes a quarter of the memory or less. All of a player's
switched-on mods together may use 96 MB on a computer and 24 MB on a phone.

Never put a `.png` and a `.dds` of the same name in one mod. Delete every
picture you did not repaint.

### PNG

1. Save or export as PNG under the texture's name, ending `.png`, in your
   mod's `textures/` folder.
2. Delete the `.dds` of the same name.

Any kind of PNG works, up to 2048 x 2048.

### DDS from GIMP (all systems)

Choose **File, Export As** and give a name ending `.dds`. In the DDS dialog:

- **Compression**: choose one of these.
  - **None**, then **Format: RGBA8**.
  - **BC3 / DXT5**, for smooth transparency.
  - **BC1 / DXT1**, the smallest, with no smooth transparency.
- **Mipmaps**: **No mipmaps**.

With Compression None, do not leave Format on **Default**. For a picture
without an alpha channel it can save 24-bit RGB, which the game cannot draw.

**BC7** also works, but many phones cannot draw it.

### DDS from Paint.NET (Windows)

1. Choose **File, Save As** and the type **DirectDraw Surface (DDS)**.
2. Pick **BC3 (Linear, DXT5)**, **BC1 (Linear, DXT1)** or an uncompressed
   32-bit format (B8G8R8A8 or R8G8B8A8).
3. **Untick Generate Mip Maps.**

### DDS from the command line

These lines convert a PNG you painted. Put the name in single quotes, because
the `$` in a palette name means something to every shell.

**ImageMagick** (all systems). Install it with one of these:

- macOS: `brew install imagemagick`
- Windows: `winget install ImageMagick.ImageMagick`
- Linux: `sudo apt install imagemagick` or `sudo dnf install ImageMagick`

Check it with `magick -version`. On Debian and Ubuntu the older version 6 has
no `magick`. Use `convert` in its place below.

```bash
magick 'tex1_32x32_626709d910129694_$_8.png' -alpha on -define dds:compression=none -define dds:mipmaps=0 'tex1_32x32_626709d910129694_$_8.dds'
```

- `-alpha on` matters. Without it a picture with no transparency is saved as
  24-bit, which the game cannot draw.
- `dds:mipmaps=0` matters too. ImageMagick adds mipmaps by default.
- For a smaller file use `dds:compression=dxt5` or `dxt1`.

**texconv** (Windows). Get it from
https://github.com/microsoft/DirectXTex/releases or with
`winget install Microsoft.DirectXTex.Texconv`.

```powershell
texconv -f BC3_UNORM -m 1 -y 'tex1_32x32_626709d910129694_$_8.png'
```

- `-m 1` means one level, no mipmaps.
- `-f R8G8B8A8_UNORM` (or `BGRA`) is uncompressed.
- `BC1_UNORM` is the smallest.

### The channel order

An uncompressed DDS file stores its colours as RGBA or as BGRA, depending on
the program. ImageMagick and some others write BGRA, which some tools call
A8R8G8B8. The game reads both and draws the right colours. Pick whichever your
program offers.

**Check it worked:**

1. Zip the folder.
2. Install it with **Settings, Mods, Install from a file, Choose a file**, then
   **Restart now**.
3. Go to the spot in the game.

With the tool, `playac-mod check` tells you before you install. It names any
file the game cannot read, a file with mipmaps and a format the game cannot
draw.

It is faster to load the folder in developer mode while you paint
([The game](game.md#4-load-a-mod-you-are-making)). After one restart, every
picture you save is drawn again at once.

## If your texture does not show

- The name must match exactly. Upper and lower case do not matter. Copy it
  from the viewer or the inspector rather than typing it.
- Grass, trees and the like change palette with the season and the hour. Use
  the `$` name, or record the texture again at that time to get its other
  names.
- When two mods replace the same texture, the mod lower in the Mods tab list
  wins.
- The Mod log names a file the game could not read.

More: https://playaconline.com/modding/faq/ and
[Troubleshooting](troubleshooting.md).

## Before you share

Every picture must be your own work. Use no art from Nintendo or any other
game, film, show or brand. Traced or redrawn copies count too. A moderator
looks at every texture. The rules are at
https://playaconline.com/modding/rules/.
