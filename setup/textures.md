# Texture tools

A texture mod is a folder of pictures, each named for the game texture it
replaces. You need a mod folder: download the texture kit from the newest
"Starter kits and AI pack" release,
https://github.com/Play-AC-Online/playac-mods/releases, unzip it and put your
name in its `mod.json`.

Then it is three steps.

## 1. Save the pictures

In the model viewer, https://playaconline.com/viewer/, open the model, press
**Textures**, then **Save all**. You get `<model>-textures.zip` with every
texture of the model, each already named.

## 2. Paint over the pictures

Use any paint program that saves PNG (see [paint programs](#paint-programs)).
Keep each file's name. Delete the ones you did not paint.

Paint every pixel yourself. The saved pictures are the game's art: use them
for the layout only. A recolour or a trace is still the game's picture, fine in
your own game and never in a shared mod.

## 3. Drop them in and watch them change

Unzip them into the mod's `textures/` folder. Run `playac-mod dev` in the mod
folder and connect the game to it
([The game](game.md#4-load-a-mod-you-are-making)). After one restart, the game
draws each picture again every time you save it.

No `playac-mod`? Choose the folder in developer mode instead, or ZIP it and
install it from **Settings, Mods**.

## Reference

You need none of this for the three steps. The textures guide has the rest:
https://playaconline.com/modding/guides/textures/

### Names

```
<label>_tex1_<width>x<height>_<texture hash>_<palette hash>_<format>.png
```

- **Labels.** The label is optional. The game matches only the `tex1_...`
  part. A label is 1 to 40 lower case letters, digits and dashes, then one
  underscore: `bookshelf-top_tex1_32x32_626709d910129694_$_8.png`. Two files
  for the same texture are an error, such as one texture under two labels.
- **`$` names.** `$` in place of the palette hash matches the pixels under
  every palette, so the picture shows all day and all year. **Save all** uses
  the `$` name where there is one.
- **One season only.** Many textures change palette with the season and the
  hour, and each palette has its own name. In the viewer, pick the texture and
  press **Copy name** for its exact name. That name is for that palette only,
  and it wins over a `$` file.
- A texture with no palette has no palette part:
  `tex1_32x32_8b5a1b4a83d4d7c7_14.png`.
- The width and height are the game's own size, whatever size your picture is.
- In a shell, put a name in single quotes. `$` means something to every shell.

### What the viewer lists

Models: villagers, furniture, clothing, tools, trees and rocks, buildings and
more. Then what is not a model. **Ground and water** has the town's acres.
**Rooms and sky** has room floors and walls, and the train window. **Menus and
UI**, **Effects** and **More textures** have the rest.

### Paint programs

Any program that saves PNG works. These are free:

| Program | macOS | Windows | Linux | Saves DDS itself |
|---|---|---|---|---|
| Krita, https://krita.org | yes | yes | yes | no, save PNG |
| GIMP, https://www.gimp.org | yes | yes | yes | **yes** |
| Paint.NET, https://www.getpaint.net | | yes | | **yes** |
| Pinta, https://www.pinta-project.com | yes | yes | yes | no, save PNG |
| LibreSprite (pixel art), https://libresprite.github.io | yes | yes | yes | no, save PNG |
| Photopea, https://www.photopea.com (in the browser) | yes | yes | yes | no, save PNG |

- macOS (Homebrew): `brew install --cask krita` or `brew install --cask gimp`
- Windows: `winget install KDE.Krita`, `winget install GIMP.GIMP.3` or
  `winget install dotPDN.PaintDotNet`
- Linux: your software centre, or `flatpak install flathub org.kde.krita` or
  `flatpak install flathub org.gimp.GIMP`

### Sizes

- The same size as the original works. 2x or 4x is sharper.
- Keep the shape. A 32x64 texture stays twice as tall as it is wide.
- Many game textures are tiny and tile. Paint at 4x and check that the edges
  meet.

### PNG or DDS

Start with PNG. Use DDS when your pictures are big or many.

| | PNG | DDS |
|---|---|---|
| Easiest | **yes**, every program saves it | needs GIMP, Paint.NET or a converter |
| Memory in the game | uncompressed, 4 bytes a pixel | uncompressed, or much less as BC1/BC3/BC7 |
| Transparency | yes | yes (BC1 only on or off) |

- Any kind of PNG works, up to 2048 x 2048.
- All of a player's switched-on mods together may use 96 MB on a computer and
  24 MB on a phone.
- Keep one file per texture, not a `.png` and a `.dds`.
- Save a DDS with one level, no mipmaps.

**GIMP:** File, Export As, a name ending `.dds`. Compression **None** with
Format **RGBA8** (never Default, which can save 24-bit), or **BC3 / DXT5**, or
**BC1 / DXT1**. Mipmaps: **No mipmaps**.

**Paint.NET:** File, Save As, **DirectDraw Surface (DDS)**. Pick **BC3**,
**BC1** or an uncompressed 32-bit format (B8G8R8A8 or R8G8B8A8). Untick
**Generate Mip Maps**.

**ImageMagick** (`brew install imagemagick`,
`winget install ImageMagick.ImageMagick`, `sudo apt install imagemagick`). On
older Debian and Ubuntu use `convert` for `magick`.

```bash
magick 'tex1_32x32_626709d910129694_$_8.png' -alpha on -define dds:compression=none -define dds:mipmaps=0 'tex1_32x32_626709d910129694_$_8.dds'
```

`-alpha on` stops a 24-bit file, and `dds:mipmaps=0` stops mipmaps. For a
smaller file use `dds:compression=dxt5` or `dxt1`.

**texconv** (Windows, `winget install Microsoft.DirectXTex.Texconv`):

```powershell
texconv -f BC3_UNORM -m 1 -y 'tex1_32x32_626709d910129694_$_8.png'
```

`-m 1` is one level. `R8G8B8A8_UNORM` is uncompressed, `BC1_UNORM` the
smallest. RGBA and BGRA (A8R8G8B8) both draw the right colours.

`playac-mod check` names a file the game cannot read, a file with mipmaps and
a format the game cannot draw.

### If your texture does not show

- The `tex1_...` part must match exactly. Upper and lower case do not matter.
  Use **Save all** or **Copy name** rather than typing it.
- If it shows in one season only, use the `$` name.
- When two mods replace the same texture, the mod lower in the Mods tab list
  wins.
- The Mod log names a file the game could not read.

More: https://playaconline.com/modding/faq/ and
[Troubleshooting](troubleshooting.md).

### Before you share

Every picture must be your own work. Use no art from Nintendo or any other
game, film, show or brand. Traced or redrawn copies count too. A moderator
looks at every texture. The rules are at
https://playaconline.com/modding/rules/.
