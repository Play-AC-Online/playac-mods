-- My Lines: once a day, each villager you talk to says one of your lines
-- before their usual hello. You do not need to change this file: write your
-- lines in messages/en.json as "line1", "line2", "line3" and so on.

local told = {}   -- villagers who have said a line today, by id
local count = nil -- how many lines messages/en.json has, counted once

local function count_lines()
  local n = 0
  while n < 256 and message("line" .. (n + 1)) do
    n = n + 1
  end
  return n
end

on("day_started", function(e)
  told = {}
end)

on("villager_talked", function(e)
  local id = e.villager.id
  if told[id] then return nil end
  told[id] = true
  count = count or count_lines()
  if count == 0 then return nil end
  return message("line" .. rng(count))
end)
