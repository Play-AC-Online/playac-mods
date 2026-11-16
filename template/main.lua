-- Village Gossip: each villager shares one line of gossip a day, then says
-- their usual hello. A worked example of the mod script API.

local told = {}        -- villagers who have gossiped today, by id
local GOSSIP = 4       -- gossip1..gossip4 in messages/en.json

on("day_started", function(e)
  told = {}
  store.set("days", (store.get("days") or 0) + 1)
end)

on("villager_talked", function(e)
  local who = e.villager
  if told[who.id] then return nil end
  told[who.id] = true

  -- If the Tea House mod is installed too, one talk in three mentions it.
  local tea = message("example.tea-house:hours")
  if tea and rng(3) == 1 then
    return who.name .. " here! " .. tea .. " Pop in!"
  end

  return message("gossip" .. rng(GOSSIP))
end)

log("ready")
