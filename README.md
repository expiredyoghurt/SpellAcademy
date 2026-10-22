# 🔮 Spell Academy

A spelling game for Singapore primary pupils. Cast spells by spelling words. Runs on Cloudflare Workers (static assets + API), D1 (database) and a Durable Object (duel arena).

```
wrangler.toml      Worker config, D1 + Durable Object bindings
schema.sql         D1 tables
src/worker.js      API, login, XP, analytics, DuelRoom Durable Object
public/index.html  Page shell (guest switch lives here)
public/app.css     Styles: responsive layout, theme colours, bottom tab bar
public/core.js     Shared helpers: sound effects, toasts, badges list, sprites
public/player.js   Pupil screens: Home, Rooms, Spellbook, Me, all game modes
public/teacher.js  Teacher / admin dashboard
migrations/        One-off SQL for upgrading an older deployment
```

## Deploy from your browser only (GitHub + Cloudflare dashboard)

You need a GitHub account and a Cloudflare account on the **Workers Paid plan** (Durable Objects need it).

### 1. Put the code on GitHub
1. On github.com, click **New repository**, name it `spell-academy`, keep it Private, create it.
2. Click **uploading an existing file**, drag in the *contents* of this folder (`wrangler.toml`, `schema.sql`, `README.md`, `src/`, `public/`, `migrations/`) and commit.
   The `src` and `public` folders must sit at the top level of the repo.

### 2. Create the database
1. Cloudflare dashboard → **Storage & Databases → D1 SQL Database → Create database**. Name it `spell-academy`.
2. Open the database, copy its **Database ID**.
3. Open the **Console** tab, paste the whole contents of `schema.sql`, and run it. You should see 9 tables under **Tables**.
4. Back on GitHub, open `wrangler.toml`, click the pencil icon, replace `REPLACE_WITH_YOUR_D1_ID` with the ID, and commit.

### 3. Connect the repo to Workers
1. Dashboard → **Workers & Pages → Create → Import a repository** (Workers Builds).
2. Authorise GitHub, pick `spell-academy`.
3. Worker name must be `spell-academy` (matches `wrangler.toml`).
4. Leave Build command empty. Deploy command: `npx wrangler deploy`. Root directory: `/`.
5. Click **Save and Deploy**. The first deploy also creates the Durable Object class.

### 4. Add the two secrets
Worker → **Settings → Variables and Secrets → Add**, type **Secret**:
- `SECRET`: any long random string (signs login sessions)
- `ADMIN_KEY`: a password only you know (creates teacher accounts)

Then click **Deploy** so the secrets take effect.

### 5. First use
1. Open your `*.workers.dev` URL → **Teacher / Admin**.
2. Under *Admin: create teacher*, enter your admin key plus a username and password.
3. Log in as that teacher → **Create class**. Share the 6-letter class code.
4. Pupils enter their name and the class code. They are enrolled automatically the first time.
5. For duels, pupils in the same class (or anyone) type the same room code in **Duel Arena**.

Every push to GitHub redeploys automatically.

## The story
The Great Grimoire of Aldermere once held every word in perfect order, until the Misspell Wraiths crept in and twisted its letters, and spells began to fizzle. Pupils are new apprentices at Aldermere Academy who restore the Grimoire one word at a time. Ranks: Apprentice (Lv1), Novice (Lv5), Adept (Lv10), Sorcerer (Lv15), Archmage (Lv20).

- 🎧 **Echo Hall** (mode 1): hear the Grimoire whisper a word and write it down. Open from Lv1.
- ✏️ **Mending Workshop** (mode 2): repair a spell the Wraiths twisted. Unlocks at Lv10.
- 🔍 **Curse-Breaking Tower** (mode 3): spot the cursed words, then break each curse. Unlocks at Lv20.
- ⚔️ **Duel Arena**: apprentices hurl cursed words at each other and deflect them. Open from Lv1.
- 🕳️ **Wraith Dungeon** (solo): 100 Wraiths over 10 floors, each with its own story chapter and a spelling tip. Start with 3 hearts and lose one for each word you fail after 3 attempts. Random events can heal a heart (up to 5) or drop bonus XP. The run ends after 100 correct answers (+100 XP). See *Dungeon checkpoints* below. Words you have missed before appear more often. Limits per run: hearts never exceed 5, at most 3 heals, 6 random events and 1,500 XP (change `HEAL_MAX`, `EV_MAX`, `RUN_XP_CAP` at the top of `src/worker.js`). Unlocks at Lv5 and can be locked by teachers like other rooms.

### Dungeon checkpoints (v2.2)
Every 10 Wraiths silenced (10, 20 … 90) is a checkpoint, and the story moves on to the next floor. When the pupil loses all their hearts they are not out yet: they wake at the start of the floor they fell on with one heart fewer.
- Start: 3 hearts. After the 1st fall: back at the last checkpoint with **2** hearts. After the 2nd fall: back at the last checkpoint with **1** heart. After the 3rd fall: thrown out of the dungeon, and the next descent starts again from Floor 1 with 3 hearts.
- A fall before the first checkpoint sends the pupil back to the very start of the run (with fewer hearts).
- XP already earned is kept. The per-run limits (heals, random events, 1,500 XP) cover the whole run including replayed floors, so replaying a floor cannot farm unlimited XP.
- Leaving the dungeon and starting again always begins a new run from Floor 1.
- The teacher dashboard's dungeon best counts the furthest point reached in a run, not where the pupil restarted from.
- The word timer restarts when the pupil taps through a story screen, so reading never costs the speed bonus.
- To change the starting hearts or the floor size, edit `START_HEARTS` and `FLOOR` at the top of `src/worker.js`. The 10 chapters live in the `DST` list in `public/player.js` (keep `FLOOR` at 10, or add or remove chapters to match).

## Pupil experience (v2)
Pupils land on a **Home** screen with a bottom tab bar (a top bar on tablets and desktops): **Home**, **Rooms**, **Spellbook** and **Me**.
- **Daily goal and streak:** answering 5 words in a day (Singapore time) completes the goal. Consecutive goal days build a 🔥 streak. One missed day per Monday to Sunday week is forgiven automatically (a streak freeze), as long as the day before it was a goal day. Change the target with `GOAL` near the top of `src/worker.js`.
- **Spellbook:** every word the pupil has met, marked *Learning* or *Mastered* (right 3 times in a row). Tap a word for its sentence and clue, and to hear it. The Curse-Breaking Tower's spotting round does not count, because it tests recognition rather than spelling.
- **Badges:** 16 badges (first spell, 100 and 500 right, Flawless 10, 3, 7 and 30 day streaks, 10 and 50 words mastered, four rank-ups, dungeon cleared, Curse Breaker, Duel Winner). They are awarded by the server and shown on the **Me** tab.
- **Feel:** sound effects (switch off under **Me**), vibration on wrong answers on phones, a combo counter, confetti on round results and rank-ups, and a letter-by-letter comparison of the pupil's spelling with the correct word. Reduced-motion settings are respected.
- **Phones and tablets:** large touch targets, answer boxes with autocorrect and auto-capitalise turned off, and a 🐢 slow replay button for words.

## Teacher dashboard (v2.1)
Sign in under **Teacher / Admin**. The bottom (or top) bar has **Classes**, **Word lists** and **Sign out**. Pick a class, then use its four tabs:
- **Overview:** pupils active this week, class accuracy against last week, words attempted, and how many pupils reached today's goal. Below that are **Needs attention** (not started, inactive 7+ days, accuracy under 60%, or dropping 15+ points), the **Hardest words** (with the wrong spellings pupils most often wrote), and a 14-day practice heatmap. Two CSV exports are included. Wrong spellings are collected from v2.1 onwards, so older attempts do not show them.
- **Pupils:** a sortable table. Tap a pupil for their accuracy, streak, mastered words, weakest words, results by room and dungeon best. Add pupils in bulk and print login cards here.
- **Word lists:** quick pick by level, or tick any lists, then **Save lists**. Tick nothing for the Default list.
- **Settings:** lock or open each room, and choose whether pupils may create their own accounts.

The **Word lists** tab in the main bar is where you create your own lists, tag them by level and check for repeats. Teacher sessions last until the browser tab is closed.

## Duel Arena
Duels are now checked by the server. It deals each player three words, marks every spelling, rejects impossible speeds, awards the XP (capped at 300 per visit), and records wins. Pupils cannot send their own words or text to opponents. A pupil can only be in a room once, and a duel needs a second player before spells can be cast. The last wizard standing wins, earns the **Duel Winner** badge (the 16th badge), and anyone can press **Rematch**. Guests can duel but earn no XP. A teacher who locks the Duel Arena for a class locks it for those pupils.

## Pupil accounts, cards and room locks (teacher dashboard)
- **Add pupils in bulk:** open a class's **Pupils** tab, expand *Add pupils in bulk*, paste one name per line. The name is the pupil's username.
- **Print cards:** click *Print login cards* on the Pupils tab. A print dialog opens with one card per pupil (username, class code, game URL), two per row, cut-out ready.
- **Rooms:** on the **Settings** tab, set each room to *By level* (default), *Always open* or *Locked*. Locked rooms are sealed for that class and the server rejects their answers.
- **Sign-up:** switch to *Teacher-created only* so pupils cannot create new accounts by typing a new name.

## Guest mode
The login screen has a **Play as guest** button. Guests play Echo Hall, Mending Workshop, Curse-Breaking Tower and the Duel Arena with the built-in words. Their XP is not saved, teachers do not see them in analytics, and the Wraith Dungeon needs a real account. To hide the button, set `GUEST=false` at the top of the script in `public/index.html`.

## Upgrading from the first version
Run `migrations/002_class_settings.sql` once in the D1 Console, then `migrations/003_runs.sql` (dungeon), then `migrations/004_wordlists.sql` (word lists), then `migrations/005_list_levels.sql` (level tags), then `migrations/006_review.sql` (review), then `migrations/007_progress.sql` (badges and streaks), then `migrations/008_duels_analytics.sql` (duel wins and wrong-spelling analytics), then `migrations/009_checkpoints.sql` (dungeon checkpoints, v2.2; run it BEFORE deploying v2.2), then commit the new files to GitHub.

## Word lists
Seven lists are built in: **Default** (the original mixed list, used by guests), and **Primary 1** to **Primary 6**. All six levels are written with 100 words each (600 in total), and no word appears in more than one built-in list (Default included). To add words, append lines to the matching list in this file, or have teachers create custom lists in the dashboard. They live in `src/words.js`, one `word|sentence with {w}|clue` per line.

In the teacher dashboard, open a class and tick the lists under **Word lists**, then Save. Pupils and the dungeon draw from the ticked lists combined. A class with nothing ticked uses Default. Lists with fewer than 4 words can't be used in the Curse-Breaking Tower.

**Quick pick:** the buttons *Lower P1–P2*, *Middle P3–P4* and *Upper P5–P6* tick the matching level lists for a class (other level lists are unticked; Default and custom lists are left as they are). Press *Save lists* to apply. You can still tick any mix of levels by hand.

**Level tags and shared lists:** when you create a custom list, tick P1 to P6 to add its words to those level lists. Your own classes get the words straight away. For other teachers' classes to get them, the admin must approve each tag: open **Teacher / Admin**, enter the admin key and click **Review**. The admin sees each pending list with repeat warnings, then clicks Approve or Decline per level. Teachers see the status (awaiting review, shared, not shared) under **My word lists**.

**Repeated words:** repeats inside an uploaded list are removed automatically when it is saved. Under **My word lists**, *Check repeats* flags words that are repeated, already in the built-in level list, or already in another shared list, and *Remove repeats* deletes the repeats and any words already in the built-in lists for the list's tags. The admin also gets *Remove repeats from shared lists*, which cleans all approved lists so each word appears once per level.

## Custom word lists
Teacher dashboard → **Upload word list**, one word per line:

```
necessary|It is {w} to wear a helmet when cycling.|One collar, two sleeves.
```
`{w}` marks where the word goes in the sentence. The hint is shown when a pupil gets it wrong. Lists you create belong to your account; assign them to any of your classes under **Word lists**.

## Notes
- XP is calculated on the server from accuracy and speed. Level = floor(XP / 150) + 1, so Lv10 needs 1,350 XP and Lv20 needs 2,850 XP.
- Voice uses the browser's built-in speech (en-GB). Pupils should use Chrome, Edge or Safari with sound on.
- Duels and the Wraith Dungeon are checked by the server. Echo Hall, Mending Workshop and the Curse-Breaking Tower still take the browser's word on whether an answer was right, so treat their XP as practice rather than assessment.

## Troubleshooting
- **"Not found or not signed in"**: the secrets are missing; redo step 4 and redeploy.
- **Deploy fails on Durable Objects**: confirm the Workers Paid plan is active.
- **"Unknown class code"**: the teacher must create the class first.
- **Database errors**: check the ID in `wrangler.toml` and that `schema.sql` ran.
