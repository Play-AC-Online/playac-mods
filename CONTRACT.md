# Mod rules: the ONE contract

Every layer (the game page's mods.js, the registry's validator on the server, the
game engine, the docs) must implement exactly this. Where a layer cannot check a rule
(e.g. JS/Go cannot know which items have shelf models) it says so in a comment.

## ZIP
- Junk entries are DROPPED silently before anything else, at any depth: any path
  with a segment `__MACOSX` or `Thumbs.db`, or a HIDDEN segment (one starting `.`,
  other than `.` and `..`, which stay refused as unsafe): `.DS_Store`, `._*`,
  `.gitignore`, `.github/`, `.vscode/`, `.playac/`, `.claude/`. Junk is never
  unpacked, hashed or counted, so a Finder or Explorer ZIP of a `playac-mod new`
  folder installs. A content key naming a file under a hidden folder finds
  nothing. The engine's texture scan skips `.` names too. Folder entries
  (names ending `/`) are ignored and never counted.
- Top folder: if `mod.json` is at the root, the root is the mod. Otherwise, if every
  remaining file sits under ONE top folder and that folder holds `mod.json`, strip
  that folder. Otherwise refuse "There is no mod.json at the top of the ZIP".
  Entry ORDER must not matter. The folder's name is never kept, so the path
  rules below do not apply to it: `Café Mod/`, a name with a colon or a
  space, a name over 160 bytes are all stripped. Only `.` and `..` are not.
- Paths (after stripping): relative; split on `/`; no empty segment, no `.` or `..`
  segment; no `\`, no `:`, no NUL or control char (< 0x20, 0x7f); no leading `/`;
  ASCII only; at most 160 bytes. Two paths equal ignoring ASCII case: refuse.
  A path that is also a folder of another path, compared ignoring ASCII case
  (`a.json` and `a.json/b.json`, or `tex.png` and `TEX.png/a.png`): refuse.
- Extensions (case-insensitive): .json .lua .dds .png .txt .md. Anything else: refuse.
- A `.lua` or `.json` file with a carriage return not followed by a line feed (a
  lone CR) is refused, `file-lone-cr`: Lua ends a line, and a `--`
  comment, at a lone CR, but a review's diff breaks lines at LF only, so code can
  hide in what reads as a comment. The words are the registry's: `"main.lua" has
  a carriage return with no line feed after it. Save it with LF or CRLF line
  endings`. mods.js refuses it at install (`readZip`), so `playac-mod check` does
  too; the engine refuses such a `scripts.main` before Lua reads it; the registry
  refuses it in `Inspect` (`loneCR`), the stage the contract cases
  drive, so all three refuse at the same step. A `.lua` that is not text (a
  picture under a script's name) is left to the image scan and refused for its
  name after it. CRLF and LF load; a `.txt` or `.md` is not judged.
- Limits: at most 2000 files; 16 MiB zipped; 64 MiB unpacked total;
  `mod.json` at most 64 KiB; any other `.json` at most 256 KiB; any `.lua` at most 512 KiB.
  Every file a `content` key names as JSON (`shops`, `messages` and each file of a
  messages folder, `items`, `letters`, `calendar`, `talk`) is read as JSON
  whatever its extension, so it is held to the 256 KiB cap too (`shops.txt` of
  300 KiB: refuse).

## Images (registry only,)
The registry decodes images and refuses an upload that
breaks these rules; mods.js does not read images. The engine skips a .dds it
cannot read, and decodes a .png texture itself: one it cannot
read, over 2048x2048, or past the decoded-pixel budget (all mods' PNGs
together at most 96 MiB of RGBA, 24 MiB on a phone, the same numbers as the
unpacked caps) is left out and named in the mod's error on the Mods tab.
Mods' DDS files have the same budget of their own (api limits
`textures.dds_bytes` / `_phone`): the level-0 bytes of every mod DDS together, as
the upload hands them to the graphics card, at most 96 MiB, 24 MiB on a phone; one
past it is left out and named on its mod's row. The HD pack is not counted. A mod's
DDS or PNG is read by the frame pump after its first draw, never inside the draw
(the game's own texture shows until it is ready), unless the boot preload loaded it.
Which file is drawn when several name one texture: a mod's file for one exact
palette beats any mod's `$` (every palette) file, then the later mod in load order
beats the earlier, and any mod's file beats the HD pack's.
- Every `.dds` must be what pc_texderive_dds_format reads: BC7, BC1/DXT1,
  BC3/DXT5 (legacy FourCC or DX10), DX10 R8G8B8A8 or B8G8R8A8, or legacy
  uncompressed 32 bits a pixel; 1..16384 a side; exactly level 0 and nothing
  after it (no stored mips: the game reads level 0 only). A legacy uncompressed
  file whose masks say A8R8G8B8 (red 0x00ff0000, blue 0x000000ff) is read as
  BGRA, any other masks as RGBA, in the engine and modimage alike.
- A `$` (any palette) name is one GL texture for every palette it matches:
  `pc_texpack_pick` / `pc_texpack_loaded_tlut` key the preload and the lookup the
  same way. A mod's exact-palette file beats any `$` file for that
  palette; a mod's `$` file beats the HD pack's exact one.
- Every `.png` must decode and be at most 2048x2048 pixels.
- An image whose level-0 pixels equal (same size, every pixel) an image in a
  reference list (the game's textures, the HD pack) is refused, naming the file.
- Every image is checked against known abuse imagery when a scanner is
  configured; a match is refused without a reason.

## JSON (all files)
These rules hold for every `.json` file of a mod and for every file a content
key names, in every layer. The contract cases' `json-cases.json` holds one file a case,
as text or as bytes, and mods.js, the registry and the engine each read it. Add a case there for any number, encoding or nesting edge.
- Encoding: UTF-8, no byte order mark. A byte sequence that is not UTF-8 (a
  Latin-1 letter, a character cut short, an overlong form, a surrogate written
  as bytes, anything past U+10FFFF) is refused, `json-invalid`. No layer may
  turn it into U+FFFD: the layers do not agree on how many. The engine's JSON reader alone
  reads past a byte order mark, because it also reads files that are not mods;
  mods.js decides what the engine sees.
- Numbers: RFC 8259's grammar, at any length. A number that does not fit a
  double (`1e999`, 400 nines) is refused, `json-invalid`, wherever it is, also
  in a file no content key names. One too small to hold (`1e-999`) is 0.
- `\uD800` to `\uDFFF` escapes: a high half followed by a low half is one
  character. A half alone is U+FFFD, so `"\ud800"` and `"\udc00"` are the same
  key.
- Duplicate object keys anywhere: refuse. `\u0000` anywhere: refuse.
- Nesting: the top value is level 0; any value deeper than level 32 (the engine's
  `PC_JSON_MAX_DEPTH`) is refused, so 33 nested empty arrays pass and 34 do not.
- Keys are matched case-sensitively (Go must not use encoding/json's case folding).

## mod.json
- `schema`: a number equal to 1.
- `api`: required, a whole JSON number (`1.0` counts as 1; `"1"`, `null`,
  `1.5` refused): the mod API level the mod was written for. The game reads the
  range API_MIN..API_MAX, today 1..1: ONE level (the API was never public
  before it, so the first release is level 1 whole) (mods.js `API_MIN`/`API_MAX`, Go
  `APIMin`/`APIMax`; change both together). Each level has its own manifest rules
  and a mod is checked by its OWN level's rules, at install and at every boot.
  Below the range: refused as "made for an older game"; above it: "needs a newer
  game". At boot an installed mod outside the range (or with no `api`) is not read
  at all: it is skipped with that reason on its Mods
  tab row (`skipped[].api` = `"older"` / `"newer"`), never a raw rule error. The
  examples and the docs' samples say the newest level (the game's build checks them).
  The engine's mod loader does not read `api`: mods.js keeps a mod it cannot read out of
  index.json. The engine's script host does: it does not start a script whose mod.json
  has no whole-number `api` in PC_MOD_API_MIN..MAX, and the mod's log says
  `mod.json needs "api": 1`.
- `game`, `save` at the top level: refused ("is not built yet", code
  `manifest-unbuilt-key`), even when null, until each is built. `depends` and
  `conflicts` are ordinary built keys (below).
- `id`: `^[a-z0-9][a-z0-9-]{0,31}\.[a-z0-9][a-z0-9-]{0,47}$` (max 81 chars). C buffers
  hold at least 96 bytes. The registry additionally reserves the author parts
  `playaconline`, `official`, `admin`, `example`. A file install may use them on
  purpose: the examples are `example.*`, and a file install is the player's own
  browser, never shown to anyone as the site's mod. cases.json marks such a
  registry-only refusal with `"go_ok": false` beside `"ok": true`.
  The registry also refuses an author part that passes for a reserved one: the same
  letters once dashes and digits are dropped or read as leet, a reserved word as one
  dash-separated part, a longer word starting or ending with one of 5 letters or
  more, or (for a reserved word of 7 letters or more) one edit away (`official-`, `examples`, `playaconline-official`,
  `0fficial`). That check needs no case here: it runs at upload, after the pack is
  valid.
- `name`: string, trimmed length 1..60 Unicode code points. The registry additionally
  refuses a trimmed name that holds a control character (a line break, a tab, the C1
  block), U+2028, U+2029, or a text-direction control (U+202A..U+202E, U+2066..U+2069,
  U+200E, U+200F, U+061C): the public list must show what the name holds. Registry-only,
  like the reserved author parts (`"go_ok": false`); the same rule holds for each
  `authors` entry.
- `version`: `x.y.z`, each part 1..9 digits, no leading zeros unless the part is `0`.
- `authors`: array of 1..8 strings, each trimmed 1..40 code points.
- `description`: optional; if present a string of at most 500 code points (null refused).
- `tags`: optional; if present an array of at most 5 different strings, each
  one of `textures clothing furniture scenery villagers dialogue shops seasonal
  holidays quality-of-life translation humor accessibility scripts` (case-sensitive;
  `[]` is fine, `null` refused). Only the storefront reads them (mods.js `TAGS`, Go
  `Tags`). `tags` was an unknown key and ignored.
- `scope`: `"client"` or `"world"`.
- `content`: optional object; only keys `textures`, `messages`, `shops`, `items`,
  `letters`, `calendar` and `talk` (any other key
  refused; buildings/acres are NOT supported yet and are refused; see "Mod items" and the
  typed targets below). Each value a
  non-empty path string that exists in the ZIP (`textures` names a folder that holds at
  least one file).
- `shops` requires `scope: "world"`. A `calendar` file with a `board` notice requires
  `scope: "world"` (checked on the calendar file, see below). `letters` and `talk` are
  allowed in either scope.
- `scripts`: optional; if present an object with `main` (path ending lowercase `.lua`,
  must exist) and `events` (non-empty array, no duplicates, each one of
  `villager_talked`, `day_started`, `item_picked_up`, `scene_entered`,
  `data_migrated`, `hour_changed`, `item_bought`, `item_sold`, `fish_caught`,
  `bug_caught`, `letter_read`, `villager_moved_in`, `visitor_arrived`,
  `command_finished`, `question_answered`, `timer_fired`: every event api.json lists;
  `data_migrated` needs a `data_version`). Unknown keys inside `scripts` refused.
  In all three layers an unknown `scripts.*` or `content.*` key refuses the
  WHOLE mod (the engine only said so, loaded the content and ran the
  script; it now sets the mod aside as for an unknown top-level key, and
  the engine's contract test judges those codes by `pc_mod_refused`, not by text).
- `permissions`: optional; if present a non-empty array, no duplicates,
  each one of `send_letter`, `give_item`, `show_line`, `ask`, `take_item`,
  `take_bells`, and the manifest must have `scripts`. Matched case-sensitively (`Permissions` is an
  unknown key, refused). The engine's mod loader does
  not check the shape (mods.js keeps a mod with a bad list out of index.json); the
  engine's script host grants only the known names and refuses every command a
  mod did not list.
- `exports`: optional; an object
  of at most 32 remote function names (remote.add's: `^[a-z0-9_]{1,32}$`), each
  mapped to a description of 1..120 characters with no control character (one
  line), and the manifest must have `scripts`. mods.js and Go refuse a mod that
  breaks it; the engine (`read_exports`) says a broken list in the
  mod log and ignores it. Declared, `remote.add` of a name it does not list is a
  script error, and a listed name the main chunk never offered is said in the
  mod log. `playac-mod types` appends a dependency's exports to the dependent's
  `.playac/playac.lua` as remote.call hints.
- `assets_original`: must be `true`.
- Unknown keys are REFUSED, in mod.json's top level and in each content
  file's top level (shops, items, letters, calendar, talk; NOT messages, whose
  keys are the lines), and in each shop, stock entry, letter, calendar day and
  talk pool, and in a calendar day's `date` (`month`, `day`, `week`,
  `weekday`; said as `calendar: day 1: date: unknown key "yaer"`. mods.js and Go
  refuse it. The engine reads the date keys it knows and does not look for
  another, so there the rule is mods.js's alone). The message is identical in mods.js, Go and the engine:
  `<file>: unknown key "<key>"` plus ` (did you mean "<known>"?)` when one is
  close, e.g. `mod.json: unknown key "permisions" (did you mean "permissions"?)`,
  `shops.json: unknown key "shop" (did you mean "shops"?)`,
  `shops.json: shop 1: unknown key "chanse"`. `<file>` is the path as the layer
  names files in its other errors. Code `unknown-key`. The closest key is the
  smallest Levenshtein distance over the known keys in spec order (the first
  wins a tie), suggested only at distance <= 2, or <= 3 for a key of 8 or more
  characters; a key equal after lowercasing A to Z (no other letter) is always
  suggested. Nested objects
  that refused unknown keys before keep their codes (`content-unknown`,
  `scripts-unknown-key`, item and setting entries).
- `$schema`: optional, the JSON Schema an editor checks the file against
  (`https://playaconline.com/schemas/mod.schema.json`). It is a known key that
  every layer skips; a contract case pins that. shops.json and the other data
  files may carry one too. A
  messages file may NOT: every key there is a line, and `$schema` is not a line key.

## mod.json: dependencies, data, settings
- `depends`, `optional_depends`, `conflicts`: optional objects of mod id
  -> version range, at most 16 each. Each key matches the id rule and is not the
  mod's own id; one id may be in only ONE of the three. A range is `*` (any), or 1 to 4 comparators split by ONE space, each
  an optional `>=`, `<=`, `>`, `<`, `=` and an `x.y.z` version (no op means `=`),
  at most 64 bytes. `^` and `~` are not ranges.
- `data_version`: optional whole number 1..1000000, the version of the data the
  mod's scripts keep. `scripts.events` may list `data_migrated`, and then needs it.
- `settings`: optional list of at most 16 objects. Each: `name`
  `^[a-z][a-z0-9_]{0,31}$`, unique; `type` `bool` | `number` | `choice` | `text`;
  `label` trimmed 1..60 code points; optional `description` at most 200 code
  points. Neither holds a character a reader cannot see (in mods.js,
  the registry, the engine's translations and `playac-mod check`): a control
  character (a description may break lines with LF), U+2028, U+2029, any
  format character (Unicode Cf: text-direction controls and marks, zero width
  space and joiners, word joiner, soft hyphen, a byte order mark inside), or a
  blank filler (U+115F, U+1160, U+3164, U+FFA0, U+2800). The label's words:
  `"label" must be 1 to 60 characters on one line, with no invisible,
  text-direction or control character`. Their translations follow the same
  rule. And per type (no other keys):
  - `bool`: `default` true or false.
  - `number`: `min`, `max`, `default` whole numbers within -1e9..1e9, `min < max`,
    `min <= default <= max`.
  - `choice`: `choices` 2..16 different strings, each 1..40 code points with no
    control character; `default` one of them.
  - `text`: `max_length` whole 1..200; `default` a string of at most that many
    code points with no control character (one line).
  - any type: optional `scope`, `"world"` (the default) or `"client"`.
    See "A setting's scope" below.
- `content.messages`: a FILE (English), or a FOLDER (named with or
  without a trailing `/`) whose every file is `<lang>.json` for a language in
  `en de es fr it`, with `en.json` required. Each file follows the messages
  rules; a translation may only hold keys `en.json` has.

## Translations of the data files
`content.translations` names a FOLDER (with or without a trailing `/`) whose every
file is `<lang>.json` for a language in `de es fr it`. There is no `en.json`:
English is the text in the mod's own files. Each file is one flat object of key
to text, read as JSON under the 256 KiB cap. It is the messages folder's shape,
for every text that is not a script's line.

- A key is the PATH of a text in the mod's own files:
  `mod/name`, `mod/description`; `settings/<name>/label`,
  `settings/<name>/description`; `items/<id>/name`; `shops/flower/name`,
  `shops/flower/greeting`, `shops/flower/stock_line`; `letters/<id>/header`,
  `.../body`, `.../footer`, `.../sender`; `calendar/<id>/board`,
  `calendar/<id>/talk/<n>`; `talk/<pool>/<line>`. `<n>`, `<pool>` and `<line>`
  count from 1 in file order, with no leading zero.
- A key must name a text the mod HAS: a letter with no `sender`, a day with no
  `board`, a mod with no `description` have nothing there to translate
  (`translations-key`). Nook's stock has no text.
- The text follows the rule of the text it replaces: the same length, the same
  line breaks, the same characters (`translations-text`). A letter's parts and a
  board notice stay printable ASCII in every language. A header may hold one
  `{player}` wherever its language wants it. Only C knows the paper's width: it
  alone refuses a translated body or notice that does not fit six lines.
- FALLBACK, one rule in every layer and the messages folder's: the game's
  language (the disc's; `?modlang` in developer mode), then English. English is
  `en.json` for a script's line and the mod's own data file for everything else.
  It is decided text by text: a letter with a German body and no German footer
  is the German body over the English footer. A letter's mailbox name, when the
  letter names no `sender`, follows the footer of the language shown.
- mods.js and the registry refuse the mod for a bad key or text. The engine
  leaves that ONE entry out, says so on the mod's row, and shows the English.
- The engine never shows `mod/*` or `settings/*` (it checks them all the same).
  mods.js keeps them on the installed row (`display`) for the Mods tab, and the
  registry's `Pack.Display` holds the name and description by language.
- The registry's text filter reads a translations file like the text it
  replaces: a translated `mod/name` meets the name's two
  checks (a word the site does not allow refuses the upload, naming the file
  and the key, code `upload-translation-word`; a claim to be the site is
  flagged), and every other text is flagged under its file and key. The word
  list and the phrase rules are English: they fold accents and look-alikes but
  do not read German, Spanish, French or Italian words. The reviewer reads the
  files (docs/moderation/MODS.md).
- Every language's copy of a board notice counts as "a mod's page" on the board,
  so a page posted in one language is not posted again in another.
- `letter_read`'s `letter` is found by what the save holds of a letter the
  engine mailed: its words (body and sign-off), the sender name in the
  mailbox list and the paper, and only when the game stamped the letter itself
  (`mMl_NAME_TYPE_MUSEUM`, which every mod letter gets; a letter a resident
  wrote by hand carries their own id and is never named). The match runs over
  the mod's own text AND every language's copy, whatever the game's language is
  at the read: a letter mailed in German is still named after the player
  switches language. The remaining limit: two letters with the same words,
  sender and paper in some language are one to the match (the first in load
  order, a mod's own text before a copy), whichever mod mailed it, and a letter
  mailed before its mod changed any of the three stops being named.

## Settings values
The player's values live on the installed row (mods.js `row.settings`, only the
ones that differ from the default) and change only through `setSetting`, which
refuses a value the declaration does not allow. At boot every declared setting's
EFFECTIVE value (the stored one when still allowed, else the default) goes to
the engine in index.json (`mods[].settings`); C hands a script booleans, whole
numbers and one-line texts (at most 800 bytes) and reports anything else.

## Load order and dependencies
Enabled mods load in the player's order, moved only as far as dependencies
need (dependencies first; of the mods whose dependencies are placed, the
earliest in the player's order goes next). A mod is not loaded, with the reason
on its Mods tab row, when: a mod it depends on is not installed, is off, is
outside the range, or itself does not load; it is in a dependency cycle; or it
declares a conflict with a mod that loads in a matching version (the DECLARING
mod stays off; a conflict with a mod that does not load itself, say for its own
conflict, switches nothing off; in a conflict cycle the earliest declaring mod
in the player's order stays off). The 32-mod and size caps apply to that order, and a mod whose
dependency the caps or a failed unpack left out does not load either. The
modset hash uses the resolved order. The engine checks `depends` again at
start (defence in depth): a mod whose dependency is not listed before
it in index.json, did not load itself, or is outside the range is not loaded
at all (no content, no script), with the reason on its row. `conflicts` is the
page's alone.

### Optional dependencies
`optional_depends` never stops a mod from loading. For each entry:
- PRESENT: the named mod is installed, on, loads (it is not skipped for its own
  reasons) and its version is inside the range. A present one is ordered like a
  needed one: it loads first.
- ABSENT: anything else, a version outside the range included. Nothing waits
  for it and the mod loads in the player's order.
- CYCLES. Needed edges are resolved first, as before: a cycle of needed edges
  refuses its mods. Then the order is built over the needed edges and the
  PRESENT optional ones. When every mod left waits for another, the cycle runs
  through an optional edge, and that edge gives way: the earliest mod in the
  player's order whose NEEDED dependencies are all placed goes next, before the
  optional dependencies it waited for. They load after it and are still present.
  mods.js `resolveLoad` reports `optional[mod][dep]` as `present`, `absent`,
  `range` or `late` (present, but placed after). A dependency that is in a
  cycle of needed edges never loads, so it is `absent`, never `late`.
- The engine keeps both lists per mod (it reads mod.json) and answers when
  asked, so a `late` dependency is present once it loaded:
  `remote.version(id)` returns the version, or `nil, message, code` with
  `dependency-absent` (not loaded, or no running script for a call),
  `dependency-version` (loaded, outside the range) or `dependency-undeclared`
  (not in `depends` or `optional_depends`). `remote.call` to an OPTIONAL
  dependency that is not present returns the same three and calls nothing; to
  any other mod it keeps its old meaning (an error when no such script runs).
- Visits: an optional dependency is a mod like any other. When it is a World mod
  that counts, it is in the modset and in the named list, and installing it
  changes what a visit compares.
- LENT ORDER. A visit's lent mods load in the HOST's order, as the
  list gives them. The order is part of the set (the hash is of it) and a
  visitor cannot work it out again: on the host it may come from the cycle rule
  through a mod that is not lent, a client mod say, which the visitor does not
  have. So `resolveLoad` treats the lent rows as PINNED: each waits for the
  lent row before it, an optional edge between two lent mods orders nothing
  (`present` when the host loads the dependency first, `late` when it does
  not), and the visitor's own mods are placed around them. Needed edges still
  bind. `lend` refuses (`visit-lend-wont-load`) a host list that has a mod
  before one it needs, and a set that cannot keep the host's order beside one
  of the visitor's own mods (a needed edge through it runs the other way): the
  message names that mod. A visitor's own mods are never blamed for an order
  the lent rows alone would give. The City's curated set is not pinned.

## A setting's scope
A setting is `world` (the default) or `client`.
- WORLD: part of the town. It is in the settings hash, its value is in the named
  list, and a visitor lent the mod runs the HOST's value.
- CLIENT: the player's own. Never hashed, never in a list, never sent. A lent
  mod runs the visitor's own value: the one set on their installed copy of that
  mod when they have it (and the mod still allows it), else the default.
  `lend` refuses a list entry that carries a client setting, and so does the
  accept (`LentSettingsProblem`): such a list is not the host's world settings.
- What a client setting may decide: only what its own player sees or hears. It
  may not decide what the town gets. ENFORCED per script run: `settings.get` of
  a client setting marks the run, and in a marked run a command that changes the
  town or what the player has (`send_letter`, `give_item`, `take_item`,
  `take_bells`: api.json rule `settings_scope`, the engine's `changes_town`) is
  refused at once with `command-client-setting`. `show_line` and `ask` are not.
  `timer.after` is not either: a timer that shows its player a line later is a
  proper use of a client setting, and refusing it would take that away. A run is
  one event handler call (or the main chunk); the next starts clean.
- NOT enforced, the modder's to avoid: a client value kept in a variable, in
  `store` or in a timer's `data` and used in a later run, or handed to another
  mod through `remote.call`. Nothing fails loudly. The host's town gets what the HOST's
  value says, since only the town owner's game changes a town; a visitor's copy
  of the mod runs the VISITOR's value and can say something that does not match.
  `playac-mod check` warns when a script reads a client setting and also calls
  a town command anywhere.
- On a Just you mod the scope changes nothing a visit can see (the mod never
  counts); the per-run rule holds all the same.

## Per-town data
A script's `store` is per TOWN; `store.client` is per browser; `store.player`
is per town per player (below). The engine keeps one file per town, `/save/mods/towns/<key>.dat`,
`<key>` = land id (4 hex) `-` town name bytes (16 hex) from the save's
land_info. Format: `acmods-town 1\n`, then per mod `@<id> <data version> <byte
length>\n` and that many bytes of store lines. 8 KB per mod per town, at most 16
town files (the least recently written other town's file goes first). Never
inside the vanilla .gci: cloud saves and backups carry it (they hold all of
/save), and the shell's importer keeps every /save/mods file a bundle does not
carry. A town exported "with mod data" is an ACSV bundle of exactly the card_a
.gci and that town's file; import checks the key matches the .gci. On a visit
or in the City the store lives in memory only. `data_migrated` (`{ from, to }`)
runs once per town when the part's version differs from `data_version`, as the
town loads: the scene_entered seam binds the town (town_bind) even when
no mod handles `scene_entered`, so it runs before any other event in that town,
not at boot. A failure stops the script and leaves the version.
- Players: a town has up to 4 residents (PLAYER_NUM 4), each playing
  the same town from their own save slot. `game.player` is `{ name, id }`, `id`
  = `((slot + 1) << 16) | player_ID.player_id` (slot 0..3), stable for that
  resident in that town; on a visit it is the visitor's own number (slot taken
  as 4), never equal to a resident's. The game draws `player_id` from 253
  values and avoids only the residents who exist, so a new resident in a freed
  slot CAN have the deleted one's id (the contract said it could not).
  What keeps their data apart is the reset: `pc_mod_lua_resident_reset(slot)`
  drops every `store.player` entry of that slot in this town, from every mod's
  part of the town file (a mod not running now included) and from the running
  scripts' tables, when a resident is deleted (the player select room) and
  again before a new one is made in the slot. The room goes back to the mod's
  8 KB. A new resident never inherits. `store.player.get/set` is per mod, per town, per
  player, by `store`'s key and value rules, INSIDE the mod's town part and its
  8 KB (store.bytes): reserved entries `"\x01p<id decimal>\x01<key>"` in the
  town store table. `store.get/set` and `store.client.get/set` refuse a key that
  starts with a byte under 0x20 (`store.set: a key cannot start with a control
  character`), so a mod cannot reach the reserved entries; store_parse accepts
  reserved keys up to PC_MOD_STORE_KEY_MAX + 24 bytes. With no town,
  `store.player.get` answers nil and `set` raises as `store.set` does. With a
  town and no player, `get` answers nil and `set` raises `store.player.set: no
  player is in the game yet (game.player is nil): ...` (code
  `script-store-no-player`). On a
  visit: memory only, as `store`.
- rng: `rng` is seeded by (mod id, town, game day, n), n = how many
  numbers this mod has drawn in this town on this game day. The count is a
  reserved entry in the mod's town part (key `"\x01rng"`, value
  `<yyyymmdd>:<count>`), written once at the end of a run that drew numbers:
  the outermost run, for the script and for every library it called with
  `remote.call` (the callee's was written after every call, uncharged).
  A run that ends in an error or a budget stop writes it too, so a script
  cannot draw, act on the number and stop itself to draw it again. A
  new day resets it. So calls in a day differ and a reload cannot reroll (if the
  tab dies before the write the same numbers come again, never new ones). Away
  from home, for a lent mod and before a town loads it is memory only. A
  `remote.call` callee draws from ITS OWN count. `math.random` and
  `math.randomseed` raise `math.random is not available: use rng (seeded, so a
  reload cannot reroll)` (code `script-sandbox`).
- When a store is written (one statement for every doc): every
  `store.set` / `store.player.set` / `store.client.set` writes the mod's file in
  the save folder before it returns; the browser keeps the save folder in
  IndexedDB at the game's next save sync (a game save, and a mod-data upload at
  most every 2 minutes for the cloud). A tab closed before that sync loses the
  last sets. Daily command counts and the rng count are written the same way.
Removing a mod with "delete its data" lists it in index.json `wipe`: the engine
deletes its client store and its part of every town file before any script runs.

## shops.json
- `{ "shops": [ ... ] }`, 1..2 entries (shops.per_file), at most one per `target`.
- `target`: `"flower"` or `"nook"`. The rules below are the flower shop's; Nook's
  are in "shops.json, target nook".
- `name`: optional string, 1..40 code points on ONE line (no `\n`: the engine
  drops the whole shop over a line break, so every layer refuses it).
- `hours`: optional `{ "open": "HH:MM", "close": "HH:MM" }`, strict two-digit
  00..23 / 00..59, nothing trailing. open == close refused. Close may be past
  midnight (open 15:00, close 01:00). Hours can only shorten the shop's own (closed
  02:00-07:00 anyway).
- `greeting`, `stock_line`: optional strings, 1..160 characters, at most 3 newlines.
- `stock`: required, an array of 1..6 entries `{ "item": "0x" + exactly 4 hex digits (string),
  "price": optional integer 1..99999 }`. Duplicate items refused. (The engine took a
  shop with no `stock` as "keep the game's" until the contract cases ran there,.)
- Only C knows the item tables: C refuses items with no shelf model, money bags,
  turnips, tickets, fossils, reserve/dummy ids (0xF000-0xFFFF band), and any
  non ITEM1/FTR name type, reporting the error on the Mods tab. C clamps a mod price
  up to at least the game's own buy-back (sell-to-Nook) price for that item.

## Mod items
New furniture a mod names, piloted on house furniture. In the save a mod item is
its `base`, a real furniture id, so vanilla code, visitors without the mod, the
save scrub and the map editor all see an ordinary piece; a sidecar beside the save
(`/save/card_a/mod-items.json`, never inside the save bytes) says which placed
pieces are which mod item. Removing the mod leaves the plain base piece;
reinstalling restores the name.
- The sidecar is ONE save's: its `town` object carries `save`, the stamp of
  the save file it was written beside (the .gci header's time, new at every write,
  different in every backup). Read beside a save of the same town with another stamp
  (a backup put back, an older town file imported) NONE of it is used: the cells it
  names describe a town that save does not hold, and a plain piece of the same base
  standing in one would become the mod item. The next save writes the list that save
  really has. A file from before the stamp, and a save with no stamp yet (a new town),
  are taken as they are. A friend's town on a visit (card_b) is not held to a stamp.
  The cost: the backup's own mod pieces come back as plain base pieces, since only
  the newest sidecar is kept.
- `content.items`: a path to a JSON file `{ "items": [ ... ] }`, 1..64 entries.
- `id`: `^[a-z0-9][a-z0-9-]{0,31}$`, unique in the file. The item's full id is
  `<mod id>:<id>` (at most 114 characters).
- `name`: 1..16 characters (the game's item name box), each a letter, digit, space
  or one of `' . , ! & -`; starts with a letter or digit, does not end with a space.
- `base`: a STRING `"0x"` + 4 hex digits, a furniture id facing south: in
  0x1000..0x1FFC or 0x3000..0x33C4 and a multiple of 4. Only C knows the
  furniture tables: it refuses (on the Mods tab) a base with no model, a fossil, a
  gyroid, a mannequin or umbrella design piece, clothing, and a piece that turns
  into a pocket item (balloons, diaries, fans, pinwheels).
- `price`: optional whole number 1..99999, what a shop asks when its stock entry
  sets no price.
- No other key in an item.
- `renames` (mod.json): optional object of at most 64 entries,
  `"<old full id>": "<full id of an item in this mod's items.json>"`, needs
  `content.items`; a key is in this mod's own namespace too (`<this mod's id>:<old name>`)
  and may not equal its value. Each rename runs once per save
  (the sidecar records it).
- shops.json: a stock `item` may also be a full id of an item in the SAME
  mod's items.json. Two goods of one shop may not share a base (a vanilla good's
  id is its base). A good with no price takes the item's price.
- The City never has mod items: the flower shop is off there and the engine
  neither names nor records mod items while the City lock is on.
- Where a mod item stays itself: a house room, the pockets (moved slot to slot
  too) and a letter, as its present (attached, kept, moved between the pockets,
  a mailbox and the post office, rewritten, taken out again). A letter is
  recognised by what it says, so two letters alike to the byte with the same
  base as present share one name. Stored in furniture, dropped outside or
  mailed to a villager it is the plain base piece.
- A trip away from home (The City, a friend's town, a dream) keeps it too
 : a mod item in the pockets or as a pocket letter's present is still
  itself when the player comes home, wherever it moved in the pockets. Away it
  is shown and sold as its base. Put down, sold, given or mailed away from home,
  it is the plain base piece from then on, and a piece bought or picked up away
  is never a mod item. When the game cannot tell what happened on the trip (a
  closed tab whose record does not match the pockets that came home), the
  player's carried mod items become their plain bases, never another mod item.
## shops.json, target nook
- An entry `{ "target": "nook", "mode": ..., "stock": [...] }`. It takes only `mode` and
  `stock`: `name`, `hours`, `greeting`, `stock_line` are the flower shop's and are
  refused. Unknown other keys are refused, as for the flower shop.
- `mode`: optional, `"add"` (the default) or `"replace"`.
- `stock`: 1..16 entries `{ "item": "0x" + 4 hex (string), "price": optional integer
  1..99999 }`, no item twice (compared as numbers, so `"0x10aa"` = `"0x10AA"`).
- Only C knows the item tables. It drops (and reports) a good that is money, turnips,
  a ticket, a grab bag, a fossil, not a pocket item or furniture, the signboard, or
  any good Nook's shelves have no spot for (fruit, for one). The spots, by kind:
  furniture, stationery and diaries, clothing, carpets, wallpaper, tools, umbrellas,
  paint, saplings, flower bags. A good of a kind the shop goods table draws (all but
  furniture, umbrellas, paint and diaries) also needs a shelf model.
- What the game does with it, every store size alike: when Nook's restocks for a new
  day, for each kind the mod lists, `add` puts the mod's goods in at most half
  (rounded up) of the spots the day's roll gave that kind, `replace` in all of them
  (spots left over stay bare). The rest of the shop is the game's own roll. A kind the
  store does not stock that day (paper on a grab-bag sale day) is left alone. When a
  mod lists more goods of a kind than it gets spots, the date and town pick which.
  Changes show from the next restock (the next day), not the day a mod is installed.
- Price: the mod's price for a good it lists, raised to at least Nook's buy-back for
  it; no price is retail. Only for goods bought off the floor (a catalog order pays
  retail).
- World content: off in the City (the game's own roll and prices there). The last mod
  in load order with a nook entry wins, whole (see "Two mods, one shop" below).
- Two mods, one shop (decided): for the flower shop and for Nook's stock the
  LAST mod in load order has the shop whole. Nothing is merged, not even two "add"
  entries, because (1) a good is known on the shelf by its game item id alone, so two
  mods' items on the same base furniture could not be told apart at the sale (whose
  item, whose price); (2) a flower shop's name, hours, greeting and stock line are
  written for its own goods, and "replace" means every spot; (3) the shelves are few,
  so a merge would cut each mod's stock by what else is installed, which its author
  cannot test. The engine says so on the EARLIER mod's row, once, naming the later
  mod: `shops: a later mod changes the flower shop too, so this mod's flower shop is
  not used: <id>` (and the same for `Nook's stock`). mods.js and Go judge one mod at a
  time and cannot see it.

## letters.json
- `{ "letters": [ ... ] }`, 1..32 letters. Each: `id` `^[a-z0-9_.-]{1,48}$`, not used
  twice in the file; `header`, `body`, `footer` required; `sender`, `item`, `paper` optional.
- Letter text is PLAIN: printable ASCII (0x20..0x7E) only, no `{` or `}` except where
  `{player}` is allowed. The letter font has no other letters; `$ * ^ | \` show as `?`.
- `header`: 1..24 characters besides at most one `{player}` (where the player's name
  goes, the game's header_back_start), no line break.
- `body`: 1..192 characters on at most 6 lines (`\n` breaks a line). C additionally
  wraps it at the letter paper's width (192 px in the game's font, words kept whole)
  and refuses a body that then needs more than 6 lines.
- `footer`: 1..32 characters, no line break (the sign-off, "Tom Nook").
- `sender`: 1..8 characters, no line break: the name in the mailbox list,
  whose sender slot is 8 characters (PLAYER_NAME_LEN). Without it the list shows
  the footer's first 8 characters; the letter keeps the whole footer.
- `item`: `"0x"` + 4 hex, a present; C refuses money, turnips, tickets, grab bags,
  fossils and anything not a pocket item or furniture (no shelf model needed).
- `paper`: whole number 0..63, the stationery (default 0).
- A letter is only data: it is sent by the `send_letter` command (Phase 2), which
  names it `"<mod id>:<letter id>"` (or its bare id inside the same mod). Either
  scope. A refused letter is left out; the other letters load.

## calendar.json (`content.calendar`)
The word "event" means only a Lua event. The dated days file is the calendar;
an entry is a "day". The game's own festivals are "the game's festivals".
- `{ "days": [ ... ] }`, 1..16 days. Each: `id` (as letters, unique in the file),
  `date`, and at least one of `board`, `talk` and `letter`.
- `date`: `{ "month": 1..12, "day": 1..days in that month (Feb 29 allowed) }` or
  `{ "month", "week": 1..4 or "last", "weekday": 0 (Sunday)..6 }` (the Nth, or the
  last, weekday of the month). Not both forms.
- `board`: plain text as a letter `body` (1..192 characters, at most 6 lines, C checks
  it fits a board page). Posted on the town bulletin board on the day, once
  (a page already up today with the same words is not posted again), only in the
  player's OWN town, never as a visitor or in the City. Changes the town, so the mod
  needs `scope: "world"`; refused in a client mod by every layer.
- `talk`: 1..16 lines, each 1..160 characters with at most 3 newlines (UTF-8 allowed,
  like a shop greeting). On the day these are the villager lines (see
  talk.json for how a line is said), ahead of any talk.json pool.
- `letter`: the `id` of a letter in the SAME mod's letters.json (a key like
  any id; every layer refuses one the letters file does not hold, or a mod with no
  letters file). On the day the game mails it once per town: the first
  time the player is free in their OWN town (never as a visitor, never in the
  City), through the command queue with send_letter's rules (mailbox, else the
  post office; counted against the mod's daily letter cap). No `permissions` and
  no script needed; no script is told, the mod log says what happened. Sent marks
  live in `/save/mods/<id>.fx` with the day's counts (`<day bits> <town seed>`
  after the counts), so a reload the same day sends nothing. Either scope. The
  mod log line is `calendar day <id>: letter ...`.
- `game.calendar_today`: the ids of the CALLING mod's calendar days whose
  date is the town's date, in file order; `{}` when none or no town.
- No decorations: the game's decorations belong to its own festivals' actors and
  schedule (m_event_schedule.c_inc, the festival map NPCs); there is no data seam for a
  mod to add one, so none is offered.

## talk.json
- `{ "pools": [ ... ] }`, 1..32 pools. Each: `lines` (1..32 lines, each 1..160
  characters, at most 3 newlines, UTF-8 allowed), and optionally ONE of
  `personality` (`normal`, `peppy`, `lazy`, `jock`, `cranky`, `snooty`) or
  `villager` (a name, 1..8 plain characters, matched ignoring case); neither means
  every villager. `chance`: whole number 1..100 (default 100).
- How a line is said: on an ordinary talk (the same talks a `villager_talked` handler gets: not a
  first meeting, an errand, a move, the island), when no script said a line, a
  villager says at most ONE data line a day, on the first talk of the day, then their
  own hello (the line chains to the villager's real message, never replaces it).
  "Once a day" is kept per town: who was told today is in
  `/save/mods/talk-told.txt` (one line a town: town key, date, the villagers),
  written at each first talk and carried to the browser's storage by the game's next
  save, like a script's store. After a restart on the same day a villager who had
  their line says no other. It is never in the save bytes; a restart before any save
  has no list to read. Not written while the save is frozen.
  Today's calendar day lines come first; else the most specific pools that match decide (this
  villager's, else this personality's, else everyone's); each of those pools is in
  with its `chance`, rolled from the date and the villager, so it repeats on that day.
- Client scope allowed (only the player hears it); runs in the City too.

## Languages of the typed targets
- letters.json, calendar.json and talk.json are ONE language, as written: they have no
  per-language folder and no fallback like messages. Letters and board
  notices are plain ASCII anyway (the letter font); talk lines show as written in
  every game language. A mod that wants translated villager lines uses a `villager_talked` script
  with `message` keys from a messages folder.

## messages/*.json
- An object of string -> string. Keys `^[a-z0-9_.-]{1,48}$`. At most 256 keys per mod.
  Values 1..400 bytes. Lines wrap by pixel width,
  not by a character count: 180 px of the game's font to a line (about 24
  letters; `PCMW_LINE_PX` in the engine), 4 lines a page.

## Visit scope: which mods a visitor must render
- A `client` mod never counts. A `world` mod COUNTS (is in the modset below)
  unless all it can do is make vanilla state or show its own player something:
  - its `content` has no `textures`, no `shops` and no `items` (a world mod's
    items must look the same to a visitor; a client mod's are vanilla bases to
    one), and
  - `permissions` (the Phase 2 command list) is absent, or an array whose every
    entry is one of `send_letter`, `give_item`, `show_line`, `ask`, `take_item`,
    `take_bells` (a letter or item is vanilla save state,
    a line or a question is read only by its player and the answer goes back to
    the mod; a take is refused on a visit and in The City, so a visitor never
    meets one). api.json `visit_scope` lists the same six; the drift test holds
    mods.js `VANILLA_OUTPUT_COMMANDS` and Go `VanillaOutputCommands` to it.
  - So a world mod with ONLY `messages`, `letters`, `calendar` or `talk` content
    and such commands does not count, and one with `textures`, `shops` or
    `items` always does.
- Anything else counts: a `permissions` value that is not an array of strings,
  or any command not in that list (a command this rule has not judged yet blocks
  visits until it is added here). Host-only commands are the command layer's
  rule, not this one: a mod that changes the town only on its owner's game still
  produces vanilla state for the visitor.
- mods.js `countsForVisits`, Go `CountsForVisits`;
  cases.json cases may carry `"visits": true|false` (an accepted mod that does,
  or does not, count) and every layer that computes a modset checks it.

## Modset hash (what a friend visit compares)
- Lines, one per ENABLED mod that COUNTS (Visit scope above), in LOAD ORDER
  (not sorted): `<id>@<version>#<contentsha>`, and for a mod that declares
  settings `<id>@<version>#<contentsha>+<settingssha>`: `<settingssha>` =
  sha256 hex of one `name=value\n` line per declared setting, sorted by name (byte
  order), value its EFFECTIVE value: `true`/`false`, a whole number in decimal
  (`-5`), or the text itself. A mod without settings keeps the plain line. Only
  WORLD settings are in the hash ("A setting's scope" below): a setting
  whose `scope` is `client` is left out, a mod with only client settings keeps the
  plain line, and a mod with no client setting hashes as it did before scopes.
  mods.js `modsetHash`/`settingsSha`, Go `ModsetHash`
  the contract cases' `modset-cases.json` pin both.
- `<contentsha>` = sha256 hex of the UTF-8 text made of one line per mod file after
  normalisation (junk dropped, top folder stripped), sorted by path (byte order):
  `<sha256 hex of file bytes> <path>\n`. So the same mod hashes the same whether it
  came from the author's ZIP or the registry's rebuilt ZIP.
- Modset = sha256 hex of the lines joined with `\n`. `""` when there are none.
- The content hash is what NAMES a mod across copies: the registry stores
  it per version (`mods.content_sha`), its denylist and `POST /api/mods/status`
  match on it, and mods.js stores it on every installed row (`contentSha`). The
  ZIP sha256 differs between the author's ZIP and the registry's rebuilt one, so
  it never identifies a mod. Go's copy is pinned to
  mods.js by a shared known value.
- `""` against a non-empty hash is a MISMATCH (refused). Only `""` vs `""` or equal
  hashes match.
- Only the first 32 enabled mods load (C cap); mods.js refuses to enable a 33rd.
  When index.json lists more anyway, the engine reports each mod past the cap on its
  OWN row (`only the first 32 mods load; not loaded`), never on the 32nd's.
- The named list: beside the hash a client sends one entry per line, in
  the same order, `{ id, version, name, content_sha }` (`name` the manifest
  name, trimmed). A mod that declares world settings adds `settings_sha` (the
  `<settingssha>` of its line) and `settings` (its EFFECTIVE values, every
  declared WORLD name: true/false, a whole number, or text; never a client
  setting), so the backend rebuilds
  the very lines the hash was made of; without them a settings mod's list never
  matched its hash (third review). The backend refuses (400) a malformed list or
  settings that do not hash to `settings_sha`; a well-formed list that does not
  hash to the hash it came with is DROPPED, never stored, and the hash alone
  gates (a developer-mode marker beside the real list is refused as a mismatch,
  not a 400). It decides `registry` itself (an approved registry version with
  that id, version and content hash, not on the denylist); a client's own
  `registry` claim is ignored. A refused visit names the difference from the
  two lists, "same mod, different settings" included. At most 32 entries.
  The contract cases' `modset-cases.json` pin each case's `list` too: mods.js makes
  it, Go (`visit.ModsetHashOf`, `NormalizeModsetList`) hashes it to the case's hash.

## City
- Only world-scope SHOPS (the flower shop and Nook's) and calendar BOARD notices switch
  off in The City (other players there don't have them; the City is not the player's
  town). Textures, lines (talk pools and calendar day lines too) and scripts keep running
  there for the player who has them, with two limits: every mod command is refused
  (below), and mod items are neither named nor recorded (the flower shop is off and
  the engine holds the City lock, see "Mod items"). Docs must say exactly this.
- Mod commands (cmd.*) are all refused in The City (`nil, message,
  "command-city"`). Visiting a friend's town, the commands that change a
  town or a save (`send_letter`, `give_item`, `take_item`, `take_bells`) are refused (`command-visiting`); only the town owner's game runs them.
- Taking: `cmd.take_item{ item, count? }` and `cmd.take_bells{ amount }`
  never take on the script's word. The ENGINE writes the question
  (`pc_mod_fx_take_text`: `Give <count> x <the item's own name> to the mod "<the
  mod's name, cut to 40 characters>"?` or `Pay <amount> Bells to the mod "<name>"?`).
  The mod's name stands between double quotes, and a double quote of any kind
  inside it is drawn as a single one, so a name written like a sentence stays a
  name. The name and a mod item's name are the translated ones in the
  game's language (`mod/name`, `items/<id>/name`), as the Mods tab and the
  pockets show them. The question comes with
  the answers `No, keep it` (first, where the cursor starts) and `Yes, give` /
  `Yes, pay`, in the same thought window `ask` uses. Nothing the script passes is
  shown. Only "yes" takes, and only what the question said; no, and a window
  closed with no pick, take nothing (`command-declined`). Held is checked when the
  command is queued, when it is applied and after "yes" (`command-not-held`): only
  pocket slots in the NORMAL condition count (never a wrapped present, never an
  errand's item), a plain item number never matches a slot that carries a mod
  item, and the errand goods (0x2500 to 0x250C) and everything `give_item`
  refuses are refused by number (`command-item`). Bells come from the wallet
  only, never the bank or a money bag, and never below zero. Per take: 1 to 15
  pieces, 1 to 99999 Bells. Per mod per game day per town: 6 `take_item` and 6
  `take_bells`, counted when the question is SHOWN, whatever the answer; one that
  cannot be drawn (`command-not-shown`) was not shown and does not count, and the
  same holds for `show_line` and `ask`. Refused
  on a visit and in The City; a lent mod acts only on a visit, so it never takes.
  A take sends no `question_answered`; its one result is `command_finished` with
  `via = "taken"` or a code. Each take that happened is a line in the Mod log.
- Timers: `timer.after(minutes, name, data?)` returns an id or
  `nil, message, code` (api.json `timer_codes`: timer-args, timer-limit,
  timer-no-town, timer-no-clock, timer-store-full); `timer.cancel(id)` answers true or false;
  the event is `timer_fired{ id, name, data }`, to that mod only. The clock is the
  game's (what `game.time` reads), in whole game minutes, 1 to 10080. A waiting
  timer is an entry of the mod's TOWN store under an engine key, so it is saved,
  exported and capped (the store's 8 KB) with the town data, survives a reload,
  and lives in memory only on a visit, in The City and for a lent mod. At most 16
  wait per mod per town. A due timer is removed from the store before its event
  is sent (it can be lost with a crash, never repeated). `timer_fired` is an
  ordinary event: the per-event instruction budget, the 4 ms frame cap (it waits,
  it is never dropped) and the per-event and per-day command caps all hold; at
  most one timer per mod fires per frame, and the shortest wait is one game
  minute. A clock set back never strands a timer more than 10080 minutes ahead.
  A clock that reads a date before 2000 is no clock: `timer.after` is refused
  (`timer-no-clock`) and no timer is looked at.
- The player's own game only (api.json rule `own_game_only`). Nothing of
  a mod runs at the title screen, in the title demo, at player select or in the
  intro: no event, no timer, no bound town (so no `data_migrated`), no applied
  command, no calendar letter, no boot-health frame. The title demo plays in the
  real save with the clock scripted to a date in 2001 (`mTM_demotime_set`), and before this rule every waiting timer was rewritten
  against that date and fired at the start of play. ONE definition, the game's
  (the engine's `fx_in_game`: a play scene, not the title demo or the logo,
  the real clock adopted, not a player select or intro scene), asked through
  `pc_mod_fx_in_game` by every entry point. A script's main chunk still runs
  at boot and on a developer reload, before any town.
- The Mod log's caps hold for every line a script can cause again and again
 : `log`, a `cmd.*` or `timer.*` call refused when the script made it,
  a command refused when it was applied, a talk line that cannot be shown. 20 a
  run, 500 a session per mod; a script's stop is always written. The page's log
  keeps 400 lines and drops the oldest line of the mod that holds the most, so
  one mod cannot push out another's.
- Refusals carry a stable code: `cmd.<name>(...)` returns `id` or
  `nil, message, code`, and a failed `command_finished` has `code` + `message`.
  A refusal when the command is APPLIED is also written to the Mod log
 , kind "refused": `cmd.<name> #<id> refused (<code>): <message>`,
  inside the log's 500 lines a session. A script with no `command_finished`
  handler sees it there.
- Event fields: a text the game has none of is absent (nil), never
  `""`. `fields_fill` drops an empty text for every event. A name (a villager
  in `villager_talked` and `villager_moved_in`, `letter_read`'s sender) is
  converted by the one function `game.villagers` and `game.player` use
  (`pcmw_from_font`: the font's letters as UTF-8).
  The codes and each one's `retry` ("never", "next-event", "later", "tomorrow")
  are api.json `command_codes`, from the errors catalogue: command-permission,
  command-args, command-item, command-event-cap, command-queue-full,
  command-day-cap, command-city, command-visiting, command-lent-home,
  command-no-room, command-not-shown, command-not-held, command-declined. The engine passes the code as a C string
  constant at every refusal site (no regex over prose). The mod log line stays
  `<event>: cmd.<name> refused: <message>`. Daily caps are PER TOWN on purpose (a
  safety limit, not a game rule).
- The curated City set: the site's `city-mods.json`, pinned in the
  build like the City bundle (changed only by a redeploy), `{ schema: 1, mods: [{ id,
  version, content_sha, blob_sha256 }] }`, at most 8. A City mod holds only `textures`
  and `messages`: no `shops`, no `scripts`, no non-empty `permissions` (mods.js
  `cityProblem`). While the set is EMPTY the rule above stands unchanged. Once it
  holds mods, a City trip loads exactly that set for everyone (each ZIP fetched by
  `GET /api/mods/blob/<blob_sha256>` and checked by content hash) and every mod of the player's
  own stays off until they are home; the plaza lock still keeps world shops and
  commands off.

## Visit with the host's mods
- A request may say `borrow_mods: true` (a game that can load mods for one visit).
  When the host accepts on another set and EVERY entry of the host's named list is
  a reviewed registry version (the server's mark: approved, not denylisted, same
  id, version and content hash), the accept lends the set instead of refusing: in
  the accept's own transaction it sets `mods_lent` and stores the host's set as the
  row's lent set (`visitor_lent_modset_hash`), leaving the visitor's own set as the
  request stored it, so a failed accept lends nothing. The host's named list is
  written by that same UPDATE: a row that reads accepted and lent always carries
  the list the visitor loads from. The host's inbox row says `visitor_borrows_mods`,
  and the host's page snapshots and uploads its town before such an accept as before
  any other, since it may be lent rather than refused.
- The visitor's page asks the player first, fetches each ZIP from
  `GET /api/mods/blob/<blob_sha256>` (the stored ZIP's hash, which the backend
  adds to each reviewed entry; a yanked version stays fetchable), and
  mods.js `lend` checks each against the named id, version and content hash, and
  the whole set, WITH the host's settings from its named list, against the host's
  modset hash: the visit runs the host's WORLD settings (a list entry's `settings`
  go into the lent row and index.json) beside the visitor's own client ones
 .
- The host's settings travel on the visit record, in the host's named
  list, never over the room. The accept lends only when each entry's values are
  exactly the settings its reviewed mod.json declares, each one it allows,
  hashing to the entry's `settings_sha`, and each `text` setting off its default
  passes the word checks a host's save names get on a visit (profanity, contact
  details) plus the board's risky-phrase rule; otherwise the visit is refused as
  a mismatch (a masked text would no longer be the host's set). `lend` checks
  the same against the ZIP's mod.json ("the friend's settings for <id> are not
  ones that mod takes", `visit-lend-failed`). The values go only on the lent
  row (its own database), never on the visitor's installed copy, and never
  change the host's. A list's `settings` values are sent back only to an
  accepted or active lent visit (the host's list); a refusal, the host's inbox
  and a 409 carry each entry's `settings_sha` alone.
- `lend` then runs the boot's own load plan
  (dependencies, conflicts, the 32-mod cap and this device's size cap, beside the
  player's own mods that stay on) and refuses, before any restart, a set that
  would not load whole ("the friend's mods would not all load here: ...",
  `visit-lend-wont-load`). Lent ZIPs live in a database of their own PER LEND
  (`acweb-mods-lent-<ms>-<8 hex>`, its name in the tab's mark and in localStorage
  `acweb.mods.lentdbs`), never the installed mods; a sessionStorage mark
  (`acweb.mods.lent`, 12 hours at most, dropped by a fresh page) makes only this
  tab's boots run them. A lent database is dropped by its own tab (leaving, or
  the next lend) or by any boot once its name is over 12 hours old, never by
  another tab's boot. Such a boot loads the player's mods that do not count for
  visits, then the lent ones in the host's order; a lent mod's index.json entry
  says `temp_store: true` and pc_mod_lua keeps its store in MEMFS (empty, never
  saved). Every boot asks `POST /api/mods/status` about the lent mods too (by id,
  version and content hash): a removed one does not load, and the kill switch
  stops the whole lent or City set, for a player with no mods of their own as
  well. The backend lends nothing while the kill switch is on. Leaving the visit
  clears the mark; the next boot runs the player's own set.
- A lent mod acts only in the host's town. At home, before the trip and
  after it, the engine treats it as inert where the visitor's own town or save
  would change: no shop (`pc_mod_shop`), no Nook goods, no board notice, no
  rename, no mod item bought or given, and every command refused ("a friend's
  mod lent for a visit acts only in their town"). Its per-day command counts live
  in MEMFS beside its store (`PC_MOD_TEMP_ROOT`). Textures, lines and talk still
  show. In the host's town (a foreigner) it runs as any visitor's mod does.
- Every way the visit ends before or without arrival (refused, ended, cancelled,
  an install that failed, a lent set that did not load whole, the player choosing
  "Back to my own mods") clears the mark and restarts the game on the player's
  own set once they are home. A "Load and visit" answer re-reads the visit and
  refuses unless it is still accepted.
- The host's visit copy carries `card_a` only: never `/save/mods` (the host's
  mod stores, per-town data and command counts are theirs).

## API spec and versioning
- `api/api.json` describes every manifest key, file format, limit, Lua global,
  event and command a mod may use. Nothing outside it is promised. the game's
  drift test fails when
  the engine, mods.js or the registry's validator disagree with it; schemas, Lua types,
  items.json, the reference pages and llms.txt are generated from it. A new rule
  here goes into api.json too.
- Every number a layer checks is an api.json limit, and its constant is GENERATED
  by the game's build: the engine's limits header, the
  registry's limits file and the "generated limits" region of mods.js, each
  name from the limit's `sources`. No layer defines one itself or writes the number
  in a rule or a message (C: `PC_MOD_STR`); the drift test fails on a stale
  generation, on a definition elsewhere, on a spec value written as a literal (its
  allowlist says why each lookalike is not a limit), on a schema number that is not
  its limit's, and on a permission or tag list that differs from api.json.
- Every mod names its api level; the game reads API_MIN..API_MAX and checks a mod
  by its own level's rules. A purely additive change stays in the current level; a
  change to an existing key's rules, a removal or a rename is a new level.
- The policy's numbers live ONCE, in api.json `api.policy`
  (`level_support_months`, `deprecation_levels`, `deprecation_days`), and
  validateApi enforces them: a level is read for at least `level_support_months`
  after the next level ships, and anything removed is deprecated first for at
  least `deprecation_levels` more levels AND at least `deprecation_days` days,
  whichever is later. Docs print them from the spec, never typed. While a level that still had it is supported, a Lua shim keeps it working
  for that level's mods and logs a deprecation once (api.json `shims`, applied by
  the game engine).
- Raising API_MIN drops a level: the registry refuses uploads for it, and an
  installed mod for it is skipped with "made for an older game" on its Mods tab
  row. The game's API notes hold the full policy.

## The shared cases (the contract's test cases)
- One case a line: `name`, `files` (path to text, in ZIP order), `ok`, and for a
  refusal `error` (a part of mods.js's wording), `go_error` (of Go's) and `code`,
  REQUIRED: the errors catalogue code every layer must name the refusal by.
  `go_code` / `c_code` only where that layer's wording is another (coarser) code
  on purpose: the engine reports a malformed item as one problem (`item-malformed`).
- `go_ok` only where the registry answers differently ON PURPOSE (a registry-only
  rule). mods.js runs every case by `ok`, Go by `go_ok` when present, else `ok`.
- The engine runs them too: the game's build lays each case out as
  mods.js would unpack it and
  the engine's contract test loads each through `pc_mod_init`. Every `ok` case
  must load with no error on the mod, except the few in its `k_engine_stricter`
  (rules only C can check, said at the rule: the letter font, the item tables).
  A refusal is judged when its `code` is one the engine checks (`k_engine_codes`:
  JSON, content paths, shops, messages, letters, calendar, talk, items); the rest
  (ZIP, paths, mod.json's top level, api levels, scripts) are mods.js's, since
  bootLoad keeps such a mod out of index.json. `k_left_to_mods_js` names the cases
  of an engine code whose rule the engine does not see (a .json no content key
  names, a BOM, an api-level rule). Both lists fail the run when they go stale.
  the engine's own words for every refusal it judges are run through the
  errors catalogue (in the game's build): one of its
  problems, or a problem's cause after "could not be read: ", must carry the
  case's `code` (or `c_code`). So a refusal's code is checked in all three layers.
  `k_engine_codes` gained `file-too-big` and `content-missing` (every file the
  engine opens is read under its cap; a content file it needs and cannot open is
  an error on the row); their cases the engine never meets (a .lua or .json no
  content key names, a textures folder) are in `k_left_to_mods_js`. A case whose
  outcome depends on the test machine's disk (path case) is in `k_disk_decides`.
