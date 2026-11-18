# Harvest Fair

A calendar example (`calendar.json`) with a letter template
(`letters.json`).

## In the game

![board](../../examples-media/example.harvest-festival/board.webp)

On the third Wednesday of September the town bulletin board carries the mod's notice, dated by the game.

![fair line](../../examples-media/example.harvest-festival/fair-line.webp)

All day, villagers open with a line about the fair from the mod's calendar.json.

![own words](../../examples-media/example.harvest-festival/own-words.webp)

Then the villager carries on in their own words: the fair line comes first, nothing of the game's is lost.

[![Play the film](../../examples-media/example.harvest-festival/film.webp)](../../examples-media/example.harvest-festival/film.mp4)

The film (click the picture): The Harvest Fair notice on the bulletin board, then Twiggy talking about the fair before her usual chat.

- It adds two calendar days. The Harvest Fair is the third Wednesday of
  September (`week` 3, `weekday` 3). Apple Day is October 21 (`day`).
- On each day a notice goes up on the town bulletin board. It is posted once,
  in the player's own town only. Villagers say one of the day's lines before
  their hello.
- A board notice changes the town, so this is a World mod
  (`"scope": "world"`).
- `fair-thanks` is a letter that a mod command can mail. Use `send_letter` and
  name it `example.harvest-festival:fair-thanks`. The player's name goes where
  `{player}` is, and an apple comes with it.
- The letter signs "The Fair Committee". The mailbox list has room for 8
  characters, so `sender` names it "The Fair" there.

Letter and notice text is plain ASCII and must fit six lines of the paper. The
game measures it in its own font and refuses text that does not fit.

## In German and French

`translations/de.json` and `translations/fr.json` hold the same texts in German
and French (`"translations": "translations/"` in `mod.json`).

- A key is the path of a text. `calendar/harvest-fair/board` is that day's
  notice. `calendar/harvest-fair/talk/2` is its second line.
  `letters/fair-thanks/body` is the letter's body.
- The game shows a text in its own language when that language's file has it.
  It shows the English text from `calendar.json` or `letters.json` when not.
  Each text is decided alone.
- A translation follows the rule of the text it replaces. The notices and the
  letter stay plain ASCII in every language, so the German notice says "fuer"
  and the German letter says "waechst". The villager lines can use the accented letters the game's font
  has, so they say "glänzt" and "fête".
- `mod/name` and `mod/description` are the mod's own name and description. The
  Mods tab shows them. The game does not.
- There is no `en.json`. English is the text in the mod's own files.
- To try a language on any disc, turn developer mode on and add `?modlang=de`
  to the game's address.
