-- My Script: the everyday events in one file, a little saved data, two
-- commands, a setting and an optional dependency. Every event used here is
-- listed in mod.json under "scripts" > "events". log() lines show in the Mod
-- log, at the bottom of Settings, Mods, under For mod authors. They are also
-- in the browser console, as "[Mods] yourname.my-script: ...". There are more
-- events (item_bought, letter_read, hour_changed and others): see the scripts
-- guide. Every handler gets one table, e, with the event's fields.

-- The main chunk runs once, when the game starts, BEFORE any town is loaded.
-- Register handlers here. Do not read the store here: store is kept per town,
-- so store.get answers nil until a town is loaded. Read it inside events.
log("loaded")

local APPLE = 0x2800 -- the apple's item number, from the item list
local HARVEST = "example.harvest-post" -- named in mod.json "optional_depends"

-- Another mod this one can use but does not need. mod.json names it in
-- "optional_depends" with a version range, so the game loads it first when it
-- is there and loads this mod either way. remote.version answers its version,
-- or nil, a message and a code when it is absent. remote.has says whether it
-- offers a function, and remote.call calls it. Ask inside an event.
local function fair_today()
  local version, why, code = remote.version(HARVEST)
  if not version then
    log("Harvest Post is not here:", code) -- dependency-absent or dependency-version
    return false
  end
  if not remote.has(HARVEST, "fair_today") then return false end
  local fair = remote.call(HARVEST, "fair_today") == true
  log("Harvest Post", version, "is here, fair today:", fair)
  return fair
end

-- The fair line, once a day, the first time you are in town. A scene is the
-- place to ask: the town and its calendar are loaded by then.
local fair_asked = nil -- the day it was asked
local function fair_line()
  if fair_asked == game.day_number() then return end
  fair_asked = game.day_number()
  -- show_line puts a line in your thought window once you are free.
  if fair_today() then
    local id, why, code = cmd.show_line(message("fair"))
    if not id then log("no fair line:", why, code) end
  end
end

-- A new day in the game (also when the game starts on a new day). A restart
-- later on a day the town already saw does not fire it again, so the day is
-- counted by date, not by call.
on("day_started", function(e)
  local today = string.format("%04d-%02d-%02d", e.year, e.month, e.day)
  if store.get("last_day") ~= today then
    store.set("last_day", today)
    store.set("days", (store.get("days") or 0) + 1)
  end
  log("day", today, "days seen in this town:", store.get("days"))
end)

-- You got an item: picked up, caught with the net or the rod, or dug up. It
-- is already in your pockets, or in the wallet for Bells. A fish or a bug
-- also fires fish_caught or bug_caught, so count a catch in one place only.
on("item_picked_up", function(e)
  local n = (store.get("picked") or 0) + 1
  store.set("picked", n)
  log(string.format("picked item 0x%04X (%d so far)", e.item, n))
end)

-- You landed a fish. e.item is the fish, and e.pocketed says whether it went
-- into your pockets (item_picked_up fired for it just before). Fish are
-- counted here, per player, and the first fish of each day gets a line.
on("fish_caught", function(e)
  local n = (store.player.get("fish") or 0) + 1
  store.player.set("fish", n)
  log(string.format("caught fish 0x%04X (%d so far, pocketed: %s)", e.item, n, tostring(e.pocketed)))
  if store.player.get("fish_day") ~= game.day_number() then
    store.player.set("fish_day", game.day_number())
    local id, why, code = cmd.show_line(message("first_fish"))
    if not id then log("no fish line:", why, code) end
  end
end)

-- You started talking to a villager. Return text to have them say it first,
-- or nil to leave the talk alone. A line that is the same whatever happens
-- needs no script: put it in a talk.json pool, as the lines kit does. A script
-- is for a line that depends on something. Here a villager notices an apple
-- in your pockets, once a day each. game.pockets() lists what you hold. The
-- list of who noticed is kept in memory, so a restart empties it.
local noticed = {}      -- villagers who noticed an apple, by id
local noticed_on = nil  -- the day that list is for

local function holding(item)
  for _, p in ipairs(game.pockets()) do
    if p.item == item then return true end
  end
  return false
end

-- "notice" is a setting in mod.json, which the player turns on or off on
-- the Mods tab. settings.get reads it. This is a Just you mod, so a setting's
-- "scope" changes nothing a visit sees, and it is left out.
on("villager_talked", function(e)
  if not settings.get("notice") then return nil end
  if noticed_on ~= game.day_number() then
    noticed, noticed_on = {}, game.day_number()
  end
  if noticed[e.villager.id] or not holding(APPLE) then return nil end
  noticed[e.villager.id] = true
  return message("apple")
end)

-- A command: every resident of the town gets one apple, once. A handler
-- cannot change the game itself. It queues a command (mod.json names it in
-- "permissions"), the game applies it a moment later, and command_finished
-- says how it went. store.player is kept per player, so "gift" is each
-- resident's own. command_finished comes for show_line too, so it checks
-- e.command first.
local waiting = false -- an apple is queued and has not finished
local resting = nil   -- the day today's cap ran out, or true to stop asking

local function give_apple()
  if waiting or resting == true or resting == game.day_number() then return end
  if store.player.get("gift") then return end
  local id, why, code = cmd.give_item(APPLE)
  if id then
    waiting = true
  else
    log("apple not queued:", why, code)
    if code == "command-day-cap" then resting = game.day_number() end
  end
end

-- The game entered a scene (outdoors, a house, a shop and so on). e.name is
-- nil for a scene with no published name.
on("scene_entered", function(e)
  log("scene", e.scene, e.name or "(no name)")
  give_apple()
  if e.name == "town" then fair_line() end
end)

-- Mark the apple as given only here, when the game says it was. A refusal has
-- a code that says whether to try again: the full list is in the commands
-- guide, https://playaconline.com/modding/guides/commands/#codes
on("command_finished", function(e)
  if e.command ~= "give_item" then return end -- a line reports via "shown"
  waiting = false
  if e.ok then
    store.player.set("gift", true)
    log("apple given, via", e.via)
  elseif e.code == "command-day-cap" then
    resting = game.day_number() -- today's gifts are used up: tomorrow
  elseif e.code == "command-no-room" then
    log("no room for the apple now: trying again in the next scene")
  elseif e.code == "command-city" or e.code == "command-visiting" then
    log("the apple waits until you are home")
  else
    resting = true -- a refusal that will not change: stop asking
    log("apple refused:", e.code, e.message)
  end
end)
