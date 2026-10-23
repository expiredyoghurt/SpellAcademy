# 🔮 Spell Academy

A spelling game for Singapore primary pupils. Cast spells by spelling words. Runs on Cloudflare Workers (static assets + API), D1 (database) and a Durable Object (duel arena).

```
wrangler.toml      Worker config, D1 + Durable Object bindings
schema.sql         D1 tables
src/worker.js      API, login, XP, analytics, DuelRoom Durable Object
public/index.html  Page shell (guest switch lives here)
public/app.css     Styles: responsive layout, theme colours, bottom tab bar
public/core.js     Shared helpers: sound effects, toasts, badges list, sprites, review-queue fetch
public/spelling.js Misspelling generator and error classifier (used by the browser AND imported by the Worker)
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
3. Open the **Console** tab, paste the whole contents of `schema.sql`, and run it. You should see 10 tables under **Tables**.
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
2. Click **Open the admin page**, enter your admin key, and on the **Teachers** tab choose *Create a teacher* (username 3+ characters, password 6+ characters).
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
- **Spellbook:** every word the pupil has met, marked *Learning* or *Mastered*, with when it is next due for review. Mastered means spelled right first time on 3 different days (see *Spaced review* below). Tap a word for its sentence and clue, and to hear it. The Curse-Breaking Tower's spotting round does not count, because it tests recognition rather than spelling.
- **Badges:** 16 badges (first spell, 100 and 500 right, Flawless 10, 3, 7 and 30 day streaks, 10 and 50 words mastered on 3 separate days, four rank-ups, dungeon cleared, Curse Breaker, Duel Winner). They are awarded by the server and shown on the **Me** tab.
- **Feel:** sound effects (switch off under **Me**), vibration on wrong answers on phones, a combo counter, confetti on round results and rank-ups, and a letter-by-letter comparison of the pupil's spelling with the correct word. Reduced-motion settings are respected.
- **Phones and tablets:** large touch targets, answer boxes with autocorrect and auto-capitalise turned off, and a 🐢 slow replay button for words.

## Teacher dashboard (v2.1)
Sign in under **Teacher / Admin**. The bottom (or top) bar has **Classes**, **Word lists** and **Sign out**. Choose a class from the **Class** dropdown (it shows each class's pupil count and code, and ends with *New class*), then use its four tabs. The page remembers your last class and tab while the browser tab stays open:
- **Overview:** pupils active this week, class accuracy against last week, words attempted, and how many pupils reached today's goal. Below that are **Needs attention** (not started, inactive 7+ days, accuracy under 60%, or dropping 15+ points), the **Hardest words** (with the wrong spellings pupils most often wrote), and a 14-day practice heatmap. A **Kinds of mistakes** card sorts every wrong answer into a type (see *Error types* below), so you can see that a class struggles with, say, double letters rather than just which words are hard. Two CSV exports are included (the hardest-words export has a kinds-of-mistake column). Wrong spellings are collected from v2.1 onwards, so older attempts do not show them. A pupil's page has the same card for that pupil.
- **Roster:** every pupil account in the class, numbered, including pupils who have never logged in (marked *Not started*). Search by name, filter (needs attention, not started, inactive 7+ days, active in the last 7 days) and sort from dropdowns, or tap a column heading. Tap a pupil for their accuracy, streak, mastered words, weakest words, results by room and dungeon best; **Prev**, **Next** and a pupil dropdown move between pupils without going back. Export the roster as CSV, print a roster, print login cards and add pupils in bulk here. Open a pupil and use **Manage this account** to **rename** them (fix a typo; they log in with the new name from then on, and their progress is kept) or **remove** them (permanently deletes the account, progress, badges and dungeon runs, after a confirmation).
- **Word lists:** quick pick by level, or open the dropdown, search and tick any lists (built-in and your own), then **Save lists**. Tick nothing for the Default list.
- **Settings:** lock or open each room, choose whether pupils may create their own accounts, **rename the class**, or **delete the class**. Deleting asks you to type the class name, and permanently removes the class, all its pupil accounts and their progress.

The **Word lists** tab in the main bar is where you create your own lists, tag them by level and check for repeats. If you have several lists, pick one from the dropdown to see it. **Edit words** lets you rename a list and add, change or delete words after saving it (same one-word-per-line format; repeats are removed). If a list has already been shared with other teachers' classes, editing its words sends it back for admin review, and you are warned before you save. The **Account** tab shows who is signed in and lets you change your own password (current password, then the new one twice; 6 or more characters). Teacher sessions last until the browser tab is closed.

### Admin page (v2.2)
On the **Teacher / Admin** screen click **Open the admin page** and enter the admin key. The key is held only in the browser tab's memory and forgotten when you press **Lock** or reload. The page has four tabs:
- **Teachers:** totals (teachers, classes, pupils), a table of every teacher with their class and pupil counts, *Create a teacher*, and *Reset a teacher's password* (pick the teacher from a dropdown).
- **Classes:** choose a teacher (or all teachers), then a class from the dropdown, to see its full roster with level, XP, words attempted and last active. Search the roster and export it as CSV.
- **Review:** the queue of shared word lists waiting for approval. Pick a list from the dropdown, check the repeat warnings and the full word list, then Approve or Decline each level (or approve all levels at once). The queue moves on to the next list.
- **Tools:** *Remove repeats from shared lists* (asks you to confirm) and Lock.

## Spaced review (v2.3)
Every word a pupil answers gets a review box (0 to 5) and a due date, kept in the `word_state` table. The Home button **Cast today's spells** and the Echo Hall, Mending Workshop and Curse-Breaking Tower rooms all draw their words from this queue: words that are due first (most overdue first), then words the pupil has not met yet. When a backlog is large, one third of each round is kept for new words so progress does not stall.
- **Moving up:** a word moves up one box only when it is spelled right on the first try on a day it is due. Repeating a word several times in one sitting does not move it, and neither does answering early.
- **Gaps:** the next review comes 1, 3, 7, 14, then 30 days after the last promotion (edit `BOX_GAP` in `src/worker.js`).
- **Mastered** = box 3 or higher = spelled right first time on 3 different days, with a growing gap (at least 1 day, then at least 3 days). This replaces "right 3 times in a row", which could happen in one sitting and measured short-term memory. The 10 and 50 mastered badges, the Spellbook, Home and the teacher dashboard all use it. Earned badges are never taken back, but the mastered count can fall.
- **Right after a hint** (second or third try): no promotion, due again tomorrow. **Wrong:** the word slides back two boxes, and a mastered word stops being mastered until it is earned again.
- Every answer except the Tower's spotting round counts: Echo Hall, Mending Workshop, the Tower's repair step, the Dungeon and Duels. Dungeon and Duel word choice is unchanged.
- **Existing pupils:** nothing to copy. The first time a pupil plays, opens Home, or a teacher opens that pupil, their old attempts are replayed day by day to build their `word_state`. Expect mastered counts to drop for pupils who practised in long single sessions. Home shows each pupil a one-time note explaining the new meaning.
- **Targeting:** if a pupil has made at least 5 classified mistakes in the last 60 days and one or two kinds are 30% or more of them, the queue favours words where those kinds of slip are plausible (new words first, then due words of the same overdue day).

## Misspellings and error types (v2.3)
`public/spelling.js` is shared by the browser and the Worker.
- **Realistic misspellings:** modes that show a wrong spelling (Mending Workshop, the Tower, the Dungeon's fix challenges, Duel curses) no longer just swap two letters. The generator picks a kind of slip first (vowel pattern, double/single letter, sounds-right, missing letter, swapped letters), then a rule for it: ie/ei, ea/ee, silent letters (kn, wr, mb, gh, gu), ph/f, c/s, -tion, -ant/-ent, -able/-ible, -ful/-full, silent e, a lone vowel changed (seperate), and so on. Edit `RULES` and `TW` in `spelling.js` to tune it.
- **Real mistakes from your pupils:** when 2 or more different pupils in a class have written the same near-miss for a word, that spelling joins a distractor bank for the class, and half the time the misspelling shown is one of them. Needs no setup; refreshed every 5 minutes. Guests always get the rule-based misspellings.
- **Error types:** each wrong answer is tagged when it is saved (`attempts.etype`): *Vowel pattern*, *Double or single letters*, *Sounds right, spelled wrong*, *Missing letter*, *Extra letter*, *Swapped letters* or *Other*. Swapped vowels such as ie/ei count as vowel pattern. Blank answers (timeouts) get no tag. Older attempts have no stored tag; dashboards classify them on the fly from the wrong spelling, so history shows up immediately.
- Modes 1 to 3 are still judged by the browser, so treat error-type counts from them as practice data, like their XP.

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
Run `migrations/002_class_settings.sql` once in the D1 Console, then `migrations/003_runs.sql` (dungeon), then `migrations/004_wordlists.sql` (word lists), then `migrations/005_list_levels.sql` (level tags), then `migrations/006_review.sql` (review), then `migrations/007_progress.sql` (badges and streaks), then `migrations/008_duels_analytics.sql` (duel wins and wrong-spelling analytics), then `migrations/009_checkpoints.sql` (dungeon checkpoints, v2.2; run it BEFORE deploying v2.2), then `migrations/010_spaced_review.sql` (spaced review and error types, v2.3; run it BEFORE deploying v2.3, because the new code writes to the new column and table), then commit the new files to GitHub.

## Word lists
Seven lists are built in: **Default** (the original mixed list, used by guests), and **Primary 1** to **Primary 6**. All six levels are written with 100 words each (600 in total), and no word appears in more than one built-in list (Default included). To add words, append lines to the matching list in this file, or have teachers create custom lists in the dashboard. They live in `src/words.js`, one `word|sentence with {w}|clue` per line.

In the teacher dashboard, open a class and tick the lists under **Word lists**, then Save. Pupils and the dungeon draw from the ticked lists combined. A class with nothing ticked uses Default. Lists with fewer than 4 words can't be used in the Curse-Breaking Tower.

**Quick pick:** the buttons *Lower P1–P2*, *Middle P3–P4* and *Upper P5–P6* tick the matching level lists for a class (other level lists are unticked; Default and custom lists are left as they are). Press *Save lists* to apply. You can still tick any mix of levels by hand.

**Level tags and shared lists:** when you create a custom list, tick P1 to P6 to add its words to those level lists. Your own classes get the words straight away. For other teachers' classes to get them, the admin must approve each tag: open the admin page and use the **Review** tab. The admin sees each pending list with repeat warnings, then clicks Approve or Decline per level. Teachers see the status (awaiting review, shared, not shared) under **My word lists**.

**Repeated words:** repeats inside an uploaded list are removed automatically when it is saved. Under **My word lists**, *Check repeats* flags words that are repeated, already in the built-in level list, or already in another shared list, and *Remove repeats* deletes the repeats and any words already in the built-in lists for the list's tags. The admin also gets *Remove repeats from shared lists* (admin page, **Tools** tab), which cleans all approved lists so each word appears once per level.

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
