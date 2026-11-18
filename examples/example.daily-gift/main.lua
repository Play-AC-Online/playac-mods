-- Daily Gift: once a game day, a letter with a little present arrives in the
-- mailbox. A worked example of mod commands: an event handler never changes the
-- game itself, it QUEUES a command, and the game applies it at the end of a frame's
-- update, once the player is free. mod.json must name the command in "permissions".
--
-- It also shows a timer. A letter the game could not take now (both boxes
-- full, or the player away from home) is tried again half a game hour later.
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

-- Try again later. timer.after counts GAME minutes and keeps the timer with
-- this town's data, so it still fires after a save and a reload. One timer per
-- resident is enough: a second refusal finds the first still waiting. The name
-- comes back in timer_fired, and the data says whose letter it was.
--
-- The mark that a timer is waiting is kept in the town's store under the
-- resident's id, not in store.player. The timer may fire while another
-- resident plays, and only the town's store can be cleared then.
local RETRY_MINUTES = 30
local function retry_key(id) return "retry:" .. tostring(id) end
local function retry_later()
  local p = game.player()
  if not p or store.get(retry_key(p.id)) then return end
  local id, why, code = timer.after(RETRY_MINUTES, "retry", p.id)
  if id then
    store.set(retry_key(p.id), id)
  else
    log("no retry timer: " .. why .. " (" .. code .. ")")
  end
end

-- What happened to it: e.via is "mailbox", or "post_office" when the mailbox
-- was full. A refusal has e.code (stable, for the script) and e.message (for
-- the log).
on("command_finished", function(e)
  if e.ok then
    log("letter #" .. e.id .. " delivered via " .. e.via)
  elseif e.code == "command-day-cap" then
    log("letter #" .. e.id .. " not delivered: " .. e.message)
  else
    -- Refused for now (in The City, visiting a friend, both boxes full): the
    -- day's letter is owed again. The next scene tries, and so does a timer
    -- half a game hour from now, for a player who stays where they are.
    -- Away from home, store and timers live in memory only. A result that
    -- arrives there clears "sent" in that copy, not at home, so the letter is
    -- not owed again today. Tomorrow's comes as usual.
    log("letter #" .. e.id .. " not delivered: " .. e.message)
    store.player.set("sent", nil)
    retry_later()
  end
end)

-- The timer is gone once it fires, so its mark goes too, whoever is playing.
-- Send only to the resident it was set for: another resident may be playing by
-- now, and has a letter of their own.
on("timer_fired", function(e)
  if e.name ~= "retry" then return end
  store.set(retry_key(e.data), nil)
  local p = game.player()
  if p and p.id == e.data then send_today() end
end)
