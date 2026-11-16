# Publishing

Sharing puts your mod in the mod list, which every player sees under **Browse
mods** in the Mods tab. Sharing needs an account and two-factor sign-in. If
you use the tool, it needs its own sign-in too. This guide sets those up once,
then goes through one upload.

You need none of this to make mods or to install your own. The publishing page
says what happens after review: https://playaconline.com/modding/publishing/

## 1. An account

1. On https://playaconline.com, press **Sign up** at the top right. Or go to
   https://playaconline.com/register/. **Log in** is next to it, for later.
2. Choose a username and password.
3. Confirm your email if asked.

**Check it worked:** you are signed in. Your name shows at the top right, and
https://playaconline.com/profile/ opens your Profile page.

Sharing is for players 13 or older. The first upload asks your age. Younger
players can still make and install mods for themselves.

## 2. Two-factor sign-in

Every upload needs two-factor sign-in. With it, nobody who learns your
password can publish in your name.

You need an authenticator app on your phone. Any of them works. Examples are
Google Authenticator, Microsoft Authenticator, 2FAS, Aegis on Android and the
Passwords app on an iPhone.

1. Open your **Profile** page, https://playaconline.com/profile/, and find
   **Two-factor sign-in**.
2. Press **Set up two-factor sign-in**. A QR code appears.
3. In the authenticator app, add an account and scan the QR code. You can type
   the key shown under it instead.
4. Type the 6 digit code the app shows and press **Turn on two-factor
   sign-in**.
5. **Keep the recovery codes** it shows. Press **Copy the codes** or **Save as
   a file** and keep them somewhere safe. They are shown only this once. Each
   works once, in place of a code, if you lose your phone.
6. Press **I saved them**.

**Check it worked:** the card says **On.** and how many recovery codes are
left.

How the codes are used:

- When you upload, the site asks for a code from the app.
- That code opens a 15-minute window in that browser. In
  that window you can upload or approve a `playac-mod` sign-in.
- A `playac-mod` sign-in you approve then lasts 60 minutes on
  its own.

## 3. Get the mod ready

- **The mod.** A ZIP that installs with no message and works after a restart.
  Or a folder that passes `playac-mod check` with no error.
- **Screenshots.** 1 to 4 screenshots of the mod in the game. They are PNG or
  JPEG, at least 200 pixels a side and up to 2 MB each. To take one, press
  Cmd+Shift+4 on macOS or Win+Shift+S on Windows. On Linux use the Print
  Screen key or your desktop's Screenshot app.
- **A changelog line.** One line about what this version changes, up to 300
  characters.
- **The rules.** Read them once: https://playaconline.com/modding/rules/. Share
  only your own work, with nothing from Nintendo or any other franchise. The
  checklist is at https://playaconline.com/modding/testing/.

## 4. Upload, in the game

1. Start the game, open **Settings, Mods** and scroll to **Share a mod**.
2. The first time, it asks your age and asks you to accept the mod rules.
3. Under **Upload a mod**, choose the ZIP. Add the screenshots and the
   changelog line.
4. Choose **Send for review**.
5. If it asks for a code, type the one your authenticator app shows.

The site checks the upload at once, with the game's rules and checks on the
pictures. A problem is named with its file, and nothing is kept. Fix it and
send again.

**Check it worked:** the upload shows under **Mods you shared** as **Waiting
for review**. An email confirms every upload under your account.

## 4b. Or upload with playac-mod

From the mod's folder:

```bash
playac-mod publish --shot shots/in-game.png --changelog "First version"
```

Without the flags it uses these files:

- the PNG and JPEG files in `.playac/screenshots/`
- this version's section of `CHANGELOG.md`, or `.playac/changelog.txt` if
  there is none

It checks the mod and those files before it asks you to sign in.

The first time, it signs in with a code. It does so again once its sign-in
has ended.

1. It prints an address on the site (`https://playaconline.com/cli/...`) and a
   code of 8 letters, like `BCDF-GHJK`. Then it waits.
2. Open the address in a browser where you are signed in to the site.
3. Check that the code on the page is the one in your terminal. Never approve
   a code you did not start yourself.
4. Press **Approve**. If the page asks, type a code from your authenticator
   app first.
5. The page says **Approved**. The terminal carries on by itself and uploads.

**Check it worked:** the terminal ends with
`uploaded yourname.my-mod 1.0.0 (content hash ...): waiting for review`.
`playac-mod status` lists your versions and their state.

About the saved sign-in:

- It is saved for 60 minutes. Another `publish` in that time
  asks nothing.
- It is saved in `~/.config/playac-mod/` on macOS and Linux, and in
  `%APPDATA%\playac-mod\` on Windows.
- `playac-mod logout` ends it at once.
- **Signed-in tools** on https://playaconline.com/cli/ lists the sign-ins and
  can revoke each one.
- `--no-save` keeps a sign-in for that one run only.

To upload from a GitHub tag instead of a folder, see
[Git and GitHub](git-github.md#4-share-a-version-from-a-tag).

## 5. Review

A moderator opens every file of every version: each texture, each line and
the script. There is no fixed time. The version waits in the queue until a
moderator gets to it. Until then nobody else can see or download it.

- **Listed**: it is in the mod list for everyone, with a page of its own at
  `https://playaconline.com/mods/<your id>/`.
- **Refused**: **Mods you shared** shows the rule it broke and the moderator's
  note. Fix it and send it again. A refused version may reuse its number.

**Check it worked:** **Mods you shared** shows the new state. So does
`playac-mod status`.

## Updates

1. Raise `"version"` in `mod.json`. Go from 1.0.0 to 1.0.1 for a fix, or to
   1.1.0 for something new.
2. Upload again the same way.

Each version is reviewed. Players with an older one see **Update available**.
A version number cannot be reused once it is waiting, listed or removed.

## When an upload is refused

Each message has a code. The errors catalogue explains the code and the fix:
https://playaconline.com/modding/errors/. The upload codes start with
`upload-`. These are the usual ones:

| You see | Code | Fix |
|---|---|---|
| Turn on two-factor sign-in on your Profile page before you share a mod. | `upload-two-factor` | Do step 2 above. |
| Enter the code from your authenticator app ... | `upload-two-factor` | Type the current code from the app. |
| This version of the mod is already uploaded. | `upload-version-exists` | Raise `"version"` in `mod.json`. |
| An id someone else owns | `upload-not-owner`, `upload-prefix-taken` | Use your own name before the dot. |
| A screenshot refused | `upload-screenshot` | Use PNG or JPEG, 200 pixels a side or more, 2 MB or less. |
| Too many uploads | `upload-too-many` | The limits are 5 uploads an hour and 10 waiting at once. Wait. |
| A texture that is an unchanged copy of the game's | `texture-copied` | Paint your own. Delete the files you did not repaint. |

More: [Troubleshooting](troubleshooting.md).
