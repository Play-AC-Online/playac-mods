-- Night Market: in the evening a few villagers mention the market at the
-- flower shop, and once it is open they pass on tonight's special.
--
-- The shop itself (hours, stock, prices, greeting) is shops.json: plain data
-- the game reads at boot. This script only TALKS. "Tonight's special" is
-- picked here from the day and named in villagers' lines; the stock and its
-- prices stay the same every night, because a script cannot change a shop.

local OPEN, CLOSE = 19, 1  -- the market's hours in shops.json: 7 PM to 1 AM
local EVENING = 17         -- villagers start talking about it at 5 PM
local SPECIALS = 6         -- special1..special6, one per stock table
local PER_NIGHT = 3        -- at most this many villagers a night say "soon", and 3 "open"

-- Tonight's special comes from game.day_number(), one number that moves by
-- one each day: not rng(), so the specials take turns, all six in six days.
local function pick(day) return day % SPECIALS + 1 end

local tonight, last_night  -- specials picked by day_started (nil until it runs)
local stretch              -- the evening and phase that `told` and `spoken` count
local told, spoken = {}, 0

on("day_started", function(e)
  last_night = tonight
  tonight = pick(game.day_number())
  log("tonight's special is special" .. tonight)
end)

on("villager_talked", function(e)
  -- "hints" is a CLIENT setting (mod.json "scope": "client"): it only decides
  -- what this player hears, so a friend can visit with the other choice. It is
  -- read here, in an event that only talks, never in one that gives or mails.
  if settings.get("hints") == false then return nil end
  local id = e.villager.id
  local t = game.time()
  local late = t.hour < CLOSE  -- just past midnight: still last night's market
  if t.hour < EVENING and not late then return nil end

  local day = game.day_number()
  if late then day = day - 1 end
  local soon = not late and t.hour < OPEN
  -- "Opens soon" and "open now" each get their own few villagers a night.
  local now = day .. (soon and "soon" or "open")
  if stretch ~= now then stretch, told, spoken = now, {}, 0 end

  -- Speak rarely: about one villager in three has heard, each says it once,
  -- and only a few say it at all. Everyone else is left to other mods.
  -- Who has heard is day number arithmetic, not rng(): the same villagers
  -- all night, however often they are asked.
  if told[id] or spoken >= PER_NIGHT or (id + day) % 3 ~= 0 then
    return nil
  end
  told[id] = true
  spoken = spoken + 1
  local which = rng(3) -- any of the three wordings

  if soon then return message("soon" .. which) end
  local special = late and (last_night or pick(day)) or (tonight or pick(day))
  return message("open" .. which) .. " " .. message("special" .. special)
end)
