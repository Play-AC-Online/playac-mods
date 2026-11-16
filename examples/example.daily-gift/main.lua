-- Daily Gift: once a game day, a letter with a little present arrives in the
-- mailbox. A worked example of mod commands: an event handler never changes the
-- game itself, it QUEUES a command, and the game applies it at the end of a frame's
-- update, once the player is free. mod.json must name the command in "permissions".
--
-- The day's letter is remembered in store.player, so each resident of the town
-- gets their own. The game's cap is per town, not per player: 3 letters a day
-- from one mod, so in a town of four the fourth resident to play that day
-- gets none.

-- Fruit: always a fine present (the shop's item rules refuse money, turnips,
-- tickets, grab bags, fossils and reserve ids).
local GIFTS = { 0x2800, 0x2801, 0x2802, 0x2803, 0x2804 }

-- The game day as one number, 20261112, or nil before a town is loaded.
local function today()
  local t = game.town()
  if not t then return nil end
  return t.year * 10000 + t.month * 100 + t.day
end

local function send_today()
  local day = today()
  if not day or store.player.get("sent") == day then return end
  -- rng() counts the numbers this mod has drawn in this town today and keeps
  -- that count with the town, so a reload carries on from it: reloading the
  -- game cannot reroll the present.
  local gift = GIFTS[rng(#GIFTS)]
  local id, why, code = cmd.send_letter{ text = message("letter"), item = gift, from = message("from") }
  if id then
    store.player.set("sent", day)
    log("letter #" .. id .. " queued with item " .. string.format("0x%04X", gift))
  else
    log("no letter today: " .. why .. " (" .. code .. ")")
    -- The town's letters for today are used up: do not ask again until tomorrow.
    if code == "command-day-cap" then store.player.set("sent", day) end
  end
end

-- A new day, and the first scene of each session (a game loaded on a day it
-- already saw does not run day_started again).
on("day_started", send_today)
on("scene_entered", send_today)

-- What happened to it: e.via is "mailbox", or "post_office" when the mailbox
-- was full. A refusal has e.code (stable, for the script) and e.message (for
-- the log).
on("command_finished", function(e)
  if e.ok then
    log("letter #" .. e.id .. " delivered via " .. e.via)
  elseif e.code == "command-day-cap" then
    log("letter #" .. e.id .. " not delivered: " .. e.message)
  else
    -- Refused for now (in The City, visiting a friend, both boxes full): try
    -- again in the next scene.
    log("letter #" .. e.id .. " not delivered: " .. e.message)
    store.player.set("sent", nil)
  end
end)
