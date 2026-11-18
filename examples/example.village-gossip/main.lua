-- Village Gossip: each villager shares one line of gossip a day, then says
-- their usual hello. A worked example of the mod script API.

local told = {}        -- villagers who have gossiped today, by id
local GOSSIP = 4       -- gossip1..gossip4 in messages/en.json

-- day_started can fire twice for one day when the game was not saved, so a
-- day is counted by its date, not by the call.
on("day_started", function(e)
  told = {}
  local today = string.format("%04d-%02d-%02d", e.year, e.month, e.day)
  if store.get("last_day") ~= today then
    store.set("last_day", today)
    store.set("days", (store.get("days") or 0) + 1)
  end
end)

on("villager_talked", function(e)
  local who = e.villager
  if told[who.id] then return nil end
  told[who.id] = true

  -- The Tea House mod is an optional dependency (mod.json "optional_depends"):
  -- this mod works without it. remote.version says whether it is there. When
  -- it is, one talk in three mentions it.
  local tea = remote.version("example.tea-house") and message("example.tea-house:hours")
  if tea and rng(3) == 1 then
    return who.name .. " here! " .. tea .. " Pop in!"
  end

  return message("gossip" .. rng(GOSSIP))
end)

log("ready")
