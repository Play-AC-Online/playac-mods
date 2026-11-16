---@meta playac
-- Play AC Online mod API, level 1. Generated from the mod API spec (https://playaconline.com/schemas/api.json). Do not edit by hand.
-- Reference: https://playaconline.com/modding/reference/  Put this file where your editor's Lua language server finds it
-- (for example a "types" folder listed in .luarc.json "workspace.library").

---@alias PlayacEvent "villager_talked"|"day_started"|"item_picked_up"|"scene_entered"|"data_migrated"|"hour_changed"|"item_bought"|"item_sold"|"fish_caught"|"bug_caught"|"letter_read"|"villager_moved_in"|"visitor_arrived"|"command_finished"|"question_answered"

---The stable code of a refused command: what cmd.* returns third, and command_finished's e.code.
--- - `command-permission` (retry: never): The command is not in mod.json permissions.
--- - `command-args` (retry: never): Wrong arguments, such as their shape, a length, the paper or the choices.
--- - `command-item` (retry: never): An item the command cannot hand out, or an unknown item or letter id of the mod's own.
--- - `command-event-cap` (retry: next-event): More than commands.per_event commands in one event.
--- - `command-queue-full` (retry: later): The mod's queue, or the game's, is full.
--- - `command-day-cap` (retry: tomorrow): The per-day limit for this command in this town is used up.
--- - `command-city` (retry: later): Commands are off in The City.
--- - `command-visiting` (retry: later): On a visit, only the town owner's game changes the town.
--- - `command-lent-home` (retry: never): A lent mod acting outside the host's town.
--- - `command-no-room` (retry: later): No room now. The mailbox and the post office are full, or the pockets are full for a mod item.
--- - `command-not-shown` (retry: never): The line or question cannot be drawn.
---@alias playac.CommandCode "command-permission"|"command-args"|"command-item"|"command-event-cap"|"command-queue-full"|"command-day-cap"|"command-city"|"command-visiting"|"command-lent-home"|"command-no-room"|"command-not-shown"

---The villager. It is a copy, so changing it changes nothing.
---@class PlayacVillager
---@field id integer The villager's id (villagers.json).
---@field name string The villager's name.
---@field species string? cat, dog and so on (villagers.json). nil when the game cannot tell.
---@field personality string? normal, peppy, lazy, jock, cranky or snooty. nil when the game cannot tell.

---The one table a handler of villager_talked gets, as e.
---@class PlayacVillagerTalkedEvent
---@field villager PlayacVillager The villager. It is a copy, so changing it changes nothing.

---The one table a handler of day_started gets, as e.
---@class PlayacDayStartedEvent
---@field year integer
---@field month integer 1 to 12.
---@field day integer 1 to 31.
---@field weekday integer 0 (Sunday) to 6, as game.time().

---The one table a handler of item_picked_up gets, as e.
---@class PlayacItemPickedUpEvent
---@field item integer The item number (items.json). For a mod item, it is the base piece the item stands on.
---@field mod_item string? The full id ("author.mod:thing") when the pocket slot it landed in holds a mod item. nil for a plain item, or when the game cannot tell.

---The one table a handler of scene_entered gets, as e.
---@class PlayacSceneEnteredEvent
---@field scene integer The scene number (scenes.json).
---@field name string? The scene's name from scenes.json, like "town". nil for a scene with no published name.

---The one table a handler of data_migrated gets, as e.
---@class PlayacDataMigratedEvent
---@field from integer The version the town's data was written at. 0 for data from before data_version.
---@field to integer mod.json data_version now.

---The one table a handler of hour_changed gets, as e.
---@class PlayacHourChangedEvent
---@field year integer
---@field month integer
---@field day integer
---@field hour integer 0 to 23.

---The one table a handler of item_bought gets, as e.
---@class PlayacItemBoughtEvent
---@field item integer The item number (items.json). For a mod item, it is the base piece the item stands on.
---@field mod_item string? The full id ("author.mod:thing") when the piece is a mod item, else nil.
---@field price integer The Bells paid.
---@field shop string Which counter.
---@field ordered boolean true for a catalog order, mailed tomorrow.

---The one table a handler of item_sold gets, as e.
---@class PlayacItemSoldEvent
---@field item integer The item number (items.json). For a mod item, it is the base piece the item stands on.
---@field mod_item string? The full id ("author.mod:thing") when the piece is a mod item, else nil.
---@field count integer How many goods went.
---@field bells integer What they fetched.
---@field shop string Who bought.

---The one table a handler of fish_caught gets, as e.
---@class PlayacFishCaughtEvent
---@field item integer The item number (items.json). For a mod item, it is the base piece the item stands on.
---@field mod_item string? Always nil today, because no fish is a mod item.
---@field pocketed boolean

---The one table a handler of bug_caught gets, as e.
---@class PlayacBugCaughtEvent
---@field item integer The item number (items.json). For a mod item, it is the base piece the item stands on.
---@field mod_item string? Always nil today, because no bug is a mod item.
---@field pocketed boolean

---The one table a handler of letter_read gets, as e.
---@class PlayacLetterReadEvent
---@field sender string The name the letter is from.
---@field item integer? The present's item number. nil when the letter carries none.
---@field mod_item string? The present's full id when it is a mod item, else nil. A letter does not carry a mod item's identity today, so nil.
---@field first_time boolean true the first time this letter is read.

---The one table a handler of villager_moved_in gets, as e.
---@class PlayacVillagerMovedInEvent
---@field villager PlayacVillager The villager who moved in.

---The one table a handler of visitor_arrived gets, as e.
---@class PlayacVisitorArrivedEvent
---@field kind string "friend".

---The one table a handler of command_finished gets, as e.
---@class PlayacCommandFinishedEvent
---@field id integer The id the cmd.* call returned.
---@field command string send_letter, give_item, show_line or ask.
---@field ok boolean
---@field via string? How it was applied: mailbox, post_office, pockets, mail or shown. nil when refused.
---@field code playac.CommandCode? The refusal's stable code (command_codes). nil when applied.
---@field message string? Why it was refused, in words. nil when applied.

---The one table a handler of question_answered gets, as e.
---@class PlayacQuestionAnsweredEvent
---@field id integer The id cmd.ask returned.
---@field choice integer? Which answer, counting from 1. nil with no pick.
---@field text string? The answer's text. nil with no pick.

---@class PlayacGameTimeResult
---@field year integer
---@field month integer 1 to 12.
---@field day integer 1 to 31.
---@field hour integer 0 to 23.
---@field minute integer 0 to 59.
---@field weekday integer 0 (Sunday) to 6.

---@class PlayacPocketItem
---@field slot integer 1 to 15.
---@field item integer The item number (items.json). For a mod item, it is the base piece the item stands on.
---@field mod_item string? The full id ("author.mod:thing") when the slot holds a mod item, else nil.

---@class PlayacGameTownResult
---@field name string
---@field id integer
---@field year integer
---@field month integer
---@field day integer
---@field hour integer
---@field minute integer
---@field weekday integer
---@field season string? spring, summer, autumn or winter. nil when the game cannot tell.

---@class PlayacGamePlayerResult
---@field name string
---@field id integer Stays the same for that resident in that town. A new resident who later takes a freed slot gets a different id. On a visit it is the visitor's own number, never equal to a resident's.

---Registers a handler for an event. Call it while the mod's own script loads, not from inside a handler and not from a function another mod calls with remote.call. The event must be in mod.json's scripts.events. At most 16 handlers per event. A handler gets one table, e, holding the event's fields.
---@overload fun(event: "villager_talked", fn: fun(e: PlayacVillagerTalkedEvent): string?)
---@overload fun(event: "day_started", fn: fun(e: PlayacDayStartedEvent))
---@overload fun(event: "item_picked_up", fn: fun(e: PlayacItemPickedUpEvent))
---@overload fun(event: "scene_entered", fn: fun(e: PlayacSceneEnteredEvent))
---@overload fun(event: "data_migrated", fn: fun(e: PlayacDataMigratedEvent))
---@overload fun(event: "hour_changed", fn: fun(e: PlayacHourChangedEvent))
---@overload fun(event: "item_bought", fn: fun(e: PlayacItemBoughtEvent))
---@overload fun(event: "item_sold", fn: fun(e: PlayacItemSoldEvent))
---@overload fun(event: "fish_caught", fn: fun(e: PlayacFishCaughtEvent))
---@overload fun(event: "bug_caught", fn: fun(e: PlayacBugCaughtEvent))
---@overload fun(event: "letter_read", fn: fun(e: PlayacLetterReadEvent))
---@overload fun(event: "villager_moved_in", fn: fun(e: PlayacVillagerMovedInEvent))
---@overload fun(event: "visitor_arrived", fn: fun(e: PlayacVisitorArrivedEvent))
---@overload fun(event: "command_finished", fn: fun(e: PlayacCommandFinishedEvent))
---@overload fun(event: "question_answered", fn: fun(e: PlayacQuestionAnsweredEvent))
---@param event PlayacEvent An event name.
---@param fn function Called with one table, e, holding the event's fields.
function on(event, fn) end

---Writes a line to the Mods tab's Mod log and the browser console as "[Mods] <id>: ...". Arguments are joined with spaces. A line is cut at 300 bytes. At most 20 lines per event and 500 per session. A script error or stop is written to the Mod log too, with a Lua traceback.
---@param ... any Values to print.
function log(...) end

---A line from a messages file. "key" reads this mod's own line, and "author.mod:key" reads another mod's. Returns nil when there is no such line. A mod's messages can be a folder of translations. The line then comes in the game's language (en, de, es, fr or it, from the disc), with English as the fallback.
---@param key string "key" or "author.mod:key".
---@return string?
function message(key) end

---Read-only facts about the game.
---@class PlayacGame
game = {}

---The game's clock now.
---@return PlayacGameTimeResult
function game.time() end

---The game clock's day as one whole number: days since 2000-01-01. It goes up by one each game day, so it tells one day from the next without date maths.
---@return integer
function game.day_number() end

---The items the player holds, in slot order: { { slot, item, mod_item }, ... }. Only held items are listed, so an empty slot has no entry. Returns {} when the pockets are empty or before a town is loaded.
---@return PlayacPocketItem[]
function game.pockets() end

---The wallet, or nil before a town is loaded.
---@return integer?
function game.bells() end

---The town: { name, id, year, month, day, hour, minute, weekday, season }, or nil before a town is loaded. season is spring, summer, autumn or winter.
---@return PlayacGameTownResult?
function game.town() end

---The town's villagers: { { id, name, species, personality }, ... }. Returns {} before a town is loaded.
---@return PlayacVillager[]
function game.villagers() end

---The player: { name, id }, or nil before a town is loaded. A town has up to 4 residents, each playing it from their own save slot.
---@return PlayacGamePlayerResult?
function game.player() end

---The ids of this mod's own calendar days that fall on the town's date today, in file order. Returns {} when there are none, or before a town is loaded. Only the calling mod's days are listed.
---@return string[]
function game.calendar_today() end

---A small saved table per mod, per town. It holds strings, numbers and booleans, up to 8 KB per mod per town. It travels with the town (cloud save, backups, Export with mod data). No town is loaded while the main chunk runs, so get answers nil and set raises an error there. On a visit or in The City it lives in memory only. store.player is this player's part of it. store.client is a separate store per browser. A key cannot start with a control character (a byte under 0x20). Every store.set, store.player.set and store.client.set writes the mod's file in the save folder before it returns. The browser keeps the save folder in IndexedDB at the game's next save sync. That sync happens at a game save, and for the cloud at a mod-data upload at most every 2 minutes. A tab closed before that sync loses the last sets. Daily command counts and the rng counter are written the same way.
---@class PlayacStore
store = {}

---A value this mod saved in this town, or nil. It is nil while the main chunk runs. Integers come back as integers.
---@param key string
---@return (string|number|boolean)?
function store.get(key) end

---Saves a string, number or boolean under a key in this town. nil deletes the key. Keys are up to 64 bytes and strings up to 1024. A set that would take this town's store over 8 KB raises an error and changes nothing. So does a set before a town is loaded, in the main chunk.
---@param key string
---@param value (string|number|boolean)?
function store.set(key, value) end

---Which town the store is for now, as an opaque text that changes when the town does ("v:..." away from home). nil before a town is loaded. Compare it to reload what you keep in locals when the player moves to another town.
---@return string?
function store.town() end

---The per-browser store. It has the same get, set and limits, with one store per mod per browser whatever town is loaded.
---@class PlayacStoreClient
store.client = {}

---A value this mod saved in this browser, or nil.
---@param key string
---@return (string|number|boolean)?
function store.client.get(key) end

---Saves a value in this browser. nil deletes it. 8 KB per mod.
---@param key string
---@param value (string|number|boolean)?
function store.client.set(key, value) end

---This player's part of the town store. It has the same get and set, per mod, per town, per player (game.player().id). It lives inside the mod's town store and shares its 8 KB. Before a town is loaded, get answers nil and set raises an error. On a visit it lives in memory only.
---@class PlayacStorePlayer
store.player = {}

---A value this mod saved for this player in this town, or nil.
---@param key string
---@return (string|number|boolean)?
function store.player.get(key) end

---Saves a value for this player in this town. nil deletes it. The key and value rules are the same as for store.set.
---@param key string
---@param value (string|number|boolean)?
function store.player.set(key, value) end

---The mod's settings from mod.json "settings", as the player set them on the Mods tab. They are read when the game starts.
---@class PlayacSettings
settings = {}

---A setting's value: the player's, else the default. It is a boolean, an integer or a string. nil for a name the mod does not declare.
---@param name string
---@return (boolean|integer|string)?
function settings.get(name) end

---Calls between mods. One mod offers named functions and another calls them. Values are deep copies of nil, booleans, numbers, strings and tables of them, within 64 KB, 16 levels, 4096 values and 8 results. The called function runs on the caller's budget and clock, and going over stops the caller. Its commands count toward the caller's per-event limit. Its rng draws from its own counter. A call into a mod that is already running is refused.
---@class PlayacRemote
remote = {}

---Offers a function to other mods, while the script loads. Names are 1 to 32 of a-z 0-9 _, at most 32 per mod. With mod.json "exports", only the names it lists.
---@param name string
---@param fn function
function remote.add(name, fn) end

---Calls a function another running mod offers. Its errors come back as yours, and it keeps running.
---@param mod string
---@param name string
---@param ... any Copied arguments.
---@return any
function remote.call(mod, name, ...) end

---Whether a running mod offers that function.
---@param mod string
---@param name string
---@return boolean
function remote.has(mod, name) end

---The commands. Each queues an effect that the game applies at the end of a frame's update, before the frame is drawn. Each needs its name in mod.json permissions. A call returns the command's id. When it is refused at once, it returns nil, a message and a code (command_codes). In The City every command is refused at once. On a visit send_letter and give_item are refused at once. A command refused at once counts against no daily limit. A command queued at home and applied after the player left comes back as a failed command_finished, and its count is given back.
---@class PlayacCmd
cmd = {}

---Queues a letter in the player's own mailbox. The post office keeps it when the mailbox is full. The save holds an ordinary letter, so it loads without the mod.
---@param t table { text, item?, from?, paper? } or { template }. text is 1 to 192 characters fitting 6 lines. item is a number or "0x" and four hex digits. from is 1 to 8 characters ("A friend"). paper is 0 to 63. template is one of this mod's own letters.json letters, by its id or "<this mod's id>:<id>". The header, body, sign-off, present and paper then all come from the template.
---@return integer? id The command's id. When it is refused at once: nil, then a message and a code.
---@return string? message Why it was refused, in words.
---@return playac.CommandCode? code The refusal's stable code (command_codes).
function cmd.send_letter(t) end

---Queues an item into the first empty pocket. With full pockets it comes by letter. Also takes this mod's own new item by its full id (author.mod:thing). A mod item is given with its identity, as a shop sells it, and full pockets refuse it.
---@param item integer|string|table An item number, "0x" and four hex digits, this mod's "author.mod:thing", or { item, from? }.
---@return integer? id The command's id. When it is refused at once: nil, then a message and a code.
---@return string? message Why it was refused, in words.
---@return playac.CommandCode? code The refusal's stable code (command_codes).
function cmd.give_item(item) end

---Queues a line in the player's own thought window, shown once the player is free. One line or question at a time.
---@param text string 1 to 400 bytes.
---@return integer? id The command's id. When it is refused at once: nil, then a message and a code.
---@return string? message Why it was refused, in words.
---@return playac.CommandCode? code The refusal's stable code (command_codes).
function cmd.show_line(text) end

---Queues a question with 2 to 4 answers in the player's thought window. The pick comes back as a question_answered event.
---@param t table { text, choices }. text is 1 to 120 characters. choices is 2 to 4 answers of 1 to 16 characters.
---@return integer? id The command's id. When it is refused at once: nil, then a message and a code.
---@return string? message Why it was refused, in words.
---@return playac.CommandCode? code The refusal's stable code (command_codes).
function cmd.ask(t) end

---Seeded random numbers. rng() gives a number in [0,1), rng(n) a whole number 1..n and rng(m, n) a whole number m..n. The seed is the mod, the town, the game day and how many numbers this mod has drawn in this town on this game day. Each call in a day therefore gives another number, and a reload cannot reroll. The count is saved with the town store at the end of a run that drew numbers, and a reload carries on from it. If the tab closes before that write, the same numbers come again, never new ones. A new game day starts the count at 0, and changing the game's clock gives other numbers. The count is kept in memory only away from home, for a lent mod and before a town loads. Inside a remote.call, the called mod draws from its own counter. math.random and math.randomseed are not available. Use rng().
---@param m integer?
---@param n integer?
---@return number|integer
function rng(m, n) end
