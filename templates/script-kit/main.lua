-- My Script: the four everyday events in one file, a little saved data, and
-- one command. Every event used here is listed in mod.json under "scripts" >
-- "events". log() lines show in the Mod log, at the bottom of Settings, Mods,
-- under For mod authors. They are also in the browser console, as
-- "[Mods] yourname.my-script: ...". There are more events
-- (fish_caught, item_bought, letter_read and others): see the scripts guide.
-- Every handler gets one table, e, with the event's fields.

-- The main chunk runs once, when the game starts, BEFORE any town is loaded.
-- Register handlers here. Do not read the store here: store is kept per town,
-- so store.get answers nil until a town is loaded. Read it inside events.
log("loaded")

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

-- You started talking to a villager. Return text to have them say it first,
-- or nil to leave the talk alone. This one speaks once per play session.
local greeted = false
on("villager_talked", function(e)
  if greeted then return nil end
  greeted = true
  return message("first_talk")
end)

-- A command: every resident of the town gets one apple, once. A handler
-- cannot change the game itself. It queues a command (mod.json names it in
-- "permissions"), the game applies it a moment later, and command_finished
-- says how it went. store.player is kept per player, so "gift" is each
-- resident's own.
local waiting = false -- an apple is queued and has not finished
local resting = nil   -- the day today's cap ran out, or true to stop asking

local function give_apple()
  if waiting or resting == true or resting == game.day_number() then return end
  if store.player.get("gift") then return end
  local id, why, code = cmd.give_item(0x2800)
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
end)

-- Mark the apple as given only here, when the game says it was. A refusal has
-- a code that says whether to try again: the full list is in the commands
-- guide, https://playaconline.com/modding/guides/commands/#codes
on("command_finished", function(e)
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
