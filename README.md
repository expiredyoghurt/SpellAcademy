# 🔮 Spell Academy

A spelling game for Singapore primary pupils. Cast spells by spelling words. Runs on Cloudflare Workers (static assets + API), D1 (database) and a Durable Object (duel arena).

```
wrangler.toml      Worker config, D1 + Durable Object bindings
schema.sql         D1 tables
src/forge.js       Word Forge data: 184 root + ending items and the rules that join them
src/worker.js      API, login, XP, analytics, DuelRoom Durable Object
public/index.html  Page shell (guest switch lives here)
public/app.css     Styles: responsive layout, theme colours, bottom tab bar
public/core.js     Shared helpers: sound effects, toasts, badges list, sprites, review-queue fetch
public/spelling.js Misspelling generator and error classifier (used by the browser AND imported by the Worker)
public/lessons.js  Spellcraft Lessons content and pattern tools (also shared with the Worker)
public/lesson.js   Pupil screens for Spellcraft Lessons
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
- 🔨 **Word Forge** (v2.4): join a root and an ending (or a prefix and a root) and apply the spelling rule. Open from Lv1 and can be locked by teachers like other rooms. See *Word Forge* below.
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
- **Badges:** 24 badges (first spell, 100 and 500 right, Flawless 10, 3, 7 and 30 day streaks, 10 and 50 words mastered on 3 separate days, nine rank-ups, dungeon cleared, Curse Breaker, Duel Winner, Forgemaster, Trial Taker, Trial Ace). They are awarded by the server and shown on the **Me** tab.
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
- Every answer except the Tower's spotting round counts: Echo Hall, Mending Workshop, the Tower's repair step, the Dungeon and Duels. Dungeon and Duel word choice follows the cool-down rules below.
- **Existing pupils:** nothing to copy. The first time a pupil plays, opens Home, or a teacher opens that pupil, their old attempts are replayed day by day to build their `word_state`. Expect mastered counts to drop for pupils who practised in long single sessions. Home shows each pupil a one-time note explaining the new meaning.
- **Targeting:** if a pupil has made at least 5 classified mistakes in the last 60 days and one or two kinds are 30% or more of them, the queue favours words where those kinds of slip are plausible (new words first, then due words of the same overdue day).

## Cool-downs and retries (v2.6)
Rules for when a word may appear, in every practice room (Echo Hall, Mending Workshop, Curse-Breaking Tower, Word Forge, Dungeon, Duels):
- **Once per round.** A word appears at most once in a round of Cast today's spells, the Tower or the Forge, and every card in a Duel hand is different.
- **Right first time: not again for 24 hours** (longer once the word climbs the boxes: 3, 7, 14, 30 days). Timing is to the second, not by calendar day (`word_state.nxt`).
- **Missed: back within minutes, never straight away.** A missed word is eligible again 20 seconds later (`RETRY_S`), is placed first in the next round of ANY room, and is never in the same round. It stays a "recent miss" for 5 minutes (`RETRY_WIN`), then is an ordinary due word.
- **A right answer straight after a miss** re-learns the word and rests it 24 hours, but does not promote it, so Mastered still means right first time on 3 different days.
- **Rounds can be short.** Words still resting are never used to pad a round. When nothing is eligible the pupil sees "All caught up". Guests have no saved progress and still get random words.
- **Dungeon and Duels need many more words than a round**, so with a small word list they cannot honour the 24 hours strictly. They prefer eligible words, then fall back to the words coming due soonest, and never repeat a word within the last few questions (up to 8 in the Dungeon, 6 in Duels, fewer on short lists).
- The Trial of the Archmage is teacher-set and ignores the cool-down; its answers still update the schedule.

## Battle stage and sprites (v2.7)
Every word room now shows the pupil's wizard on the left and a wraith on the right, using the pixel art in `public/img/` (`p_apprentice`, `p_novice`, `p_adept`, `p_sorcerer`, `p_archmage` plus the crowned `p_sorcerer_crown` and `p_archmage_crown`, shared across the ten tiers described below; `w_simple`, `w_ice`, `w_fire`, `w_gloom`, `w_bone`, `w_cursed`, `w_ancient`, `w_void` for the wraiths). Right answer: the wizard casts, a bolt flies, the wraith bursts and vanishes. Wrong answer: the wraith lunges and the wizard is hit. The Dungeon waits about a second for the spell to land, and its wraith type follows the floor (plain at the top, Void Wraith on Floor 10). The Curse-Breaking Tower and the Duel Arena use the same stage. The stage stays pinned to the top of the screen so the spell is still visible when the keyboard is open. **Give up:** Echo Hall, Mending Workshop, the Tower and Word Forge show a 🏳️ Give up button (tap twice to confirm). It ends the round at once and the server takes back every XP point that round earned (`POST /api/giveup`); the answers still count for the review schedule and badges already awarded stay. The Dungeon has its own 🏳️ Give up the run (tap twice): the XP already earned is kept, the run ends, and the next descent starts again from Floor 1 (`POST /api/run/giveup`). Duels have no Give up button. **Rank colours:** the interface accent and the spell bolt follow the pupil's rank, matching that rank's wizard: Apprentice teal, Novice green (Lv5), Adept blue (Lv10), Sorcerer ice-blue (Lv15), Archmage purple (Lv20). These replaced the old Ember, Frost and Gold wand themes. To swap art, replace the PNGs (transparent background, any size; they are drawn 96 to 120 px high).

## Ten player tiers (v2.8)
Tiers are worked out from XP (Level = floor(XP / 150) + 1), so nothing is stored and every pupil moves to the right tier the moment v2.8 is deployed. Each tier has its own accent colour for the whole app, a wand theme, a rank badge, a wizard look and a spell.

| # | Tier | From | XP | Wizard | Spell |
|---|---|---|---|---|---|
| 1 | Apprentice | Lv1 | 0 | Apprentice | Wind Arrow (green arrow) |
| 2 | Novice | Lv5 | 600 | Apprentice + aura | Wind Cutter (green crescent) |
| 3 | Adept | Lv10 | 1,350 | Green wizard | Water Ball (blue sphere) |
| 4 | Sorcerer | Lv15 | 2,100 | Green wizard + aura | Water Cutter (long blue blade) |
| 5 | Enchanter | Lv20 | 2,850 | Blue wizard | Earth Bullet |
| 6 | Conjurer | Lv30 | 4,350 | Blue wizard + aura | Lightning Ball |
| 7 | Warlock | Lv40 | 5,850 | Black wizard | Lightning Bolt |
| 8 | Magus | Lv50 | 7,350 | Black wizard + crown + aura | Fireball |
| 9 | Sage | Lv60 | 8,850 | Purple wizard | Arcane Comet |
| 10 | Archmage | Lv70 | 10,350 | Purple wizard + crown + aura | Starfall (gold star) |

- **Where it lives:** `TT`, `TH`, `TL` (the level each tier starts at), `RC` (accent colours), `BC` (spell colours), `UN` (unlock list), `BD` (badges) and `SPELLS` (the spells, in the order they are learned) in `public/core.js`; `SPR`, `AU` and `PK` (sprite, aura and size per tier) in `public/player.js`; the `body[data-t=...]` accents, `.pl.au` auras and `.bolt.b1` to `.b10` spells at the end of `public/app.css`; the rank badge levels in `src/worker.js`. To change when a tier starts, edit `TL` and the matching `l>=` numbers in `src/worker.js`.
- **Swapping in real art later:** replace the PNGs in `public/img/`, or point `SPR` at new file names. Crowned sprites have extra space at the top, and `PK` scales them up so the wizard stays the same size.
- **Rank badges:** 9 now (Novice, Adept, Sorcerer, Enchanter, Conjurer, Warlock, Magus, Sage, Archmage). Pupils who already earned the 👑 Archmage badge at Lv20 keep it. They will show as Enchanter until Lv70.
- **Unchanged:** the room locks (Mending Workshop at Lv10, Curse-Breaking Tower at Lv20) and the Dungeon (Lv5) do not depend on tiers. No database migration is needed.

## My Spells (v2.9)
Each tier teaches one spell (the table above). The **Me** tab now has a **My Spells** section showing all ten: learned spells play a looping preview and can be tapped to make them the active spell, and locked ones show the level they are learned at. The active spell is the one the wizard casts on every right answer in all modes. **Always use my newest spell** is the default, so a pupil who never touches the picker gets each new spell as they level up; picking a spell fixes it until they pick another or switch the option back on. **Cycle through all my spells** (added in v2.10) casts every spell the pupil has learned in turn, one per right answer, in the order they were learned (it starts over from the first spell each time the page is opened, and new spells join the rotation as they are learned). The round result also announces "New spell learned" when a pupil reaches a new tier.
- **Saved per pupil**, so it follows them to any device. Guests keep their pick on that device only. The server rejects a spell the pupil has not reached yet.
- **Upgrading:** run `migrations/013_spell.sql` once in the D1 Console BEFORE deploying v2.9 (it adds `students.spell`; re-running fails on the duplicate column). A fresh install already has the column in `schema.sql`.
- **Reordering or adding spells:** change the order of `SPELLS` in `public/core.js` (spell number N is learned at tier N). The pictures are the `.bolt.bN` classes at the end of `public/app.css`.

## Spellcraft Lessons (v3.0 to v3.3)
Spell Academy now **teaches** spelling as well as practising it. A lesson explains a pattern, shows why it works (and why some words break it), lets pupils practise with hints, then tests whether they can do it alone, on words they were never taught, and again days later. Pupils open it from **Rooms → 📜 Spellcraft Lessons** (open from Lv1 for logged-in pupils; guests are asked to log in because progress must be tracked).

| Stage | What happens | Judged by |
|---|---|---|
| 📜 Learn | **Encounter** (listen to pairs or words), **notice** (pattern and error-doctor question cards), **strategy** (the rule, a worked example, the exceptions that have a reason, and "why" cards) | cards logged by the browser |
| 🧪 Guided | Six words, with up to **3 progressive hints** (name the pattern → apply it to this word → show the shape). A wrong answer shows targeted feedback and opens the next hint | logged by the browser, with the number of hints used |
| 🧠 Recall | 6 words picked from a pool, **no hints, one try**. Pass = 4 of 6 | the Worker (it holds the answers, like Trials) |
| 🌍 Transfer | 5 words never used earlier in the lesson (extra words come from the class's own word bank when they fit the pattern), plus two "explain your decision" cards. Pass = 3 of 5 | the Worker |
| 🕰️ Memory check | Opens **2 days** after the last independent answer: mostly words met before plus new ones. Pass = 4 of 6 | the Worker |

- **Independent vs hint-assisted.** *Independent* means no hints and one try (recall, transfer, memory check). Guided answers always record how many hints were used, and are reported separately ("guided words with no hint"). A guided word answered right **with** hints earns less XP and does **not** move the word up its spaced-review box (it rests 24 hours, like any hint-assisted answer); a right answer with no hint is promoted as usual. Every lesson answer also feeds the normal word state, so spaced review, the Spellbook and Mastered counts all see it.
- **What is tracked** (pupil's lesson page and the teacher dashboard): independent spelling accuracy, transfer accuracy, delayed retention, pattern recognition (notice and error-doctor cards), strategy knowledge (why and rule cards), and guided words done without a hint.
- **XP is deliberately small** (right on your own 6, with hints 2, a miss 1, a question card 2; stage bonuses once per lesson: learn 10, guided 10, recall 20, transfer 25, memory check 30). Lessons teach; they are not a place to farm. Learn and guided XP stops after 80 answers per lesson per day. All numbers are constants at the top of the lesson block in `src/worker.js` (`LES_XP`, `LES_BONUS`, `LES_N`, `LES_PASS`, `RETAIN_DAYS`).
- **To test the memory check without waiting:** set `RETAIN_DAYS` to `0` in `src/worker.js`, deploy, test, then set it back to `2`.
- **Teacher dashboard.** Class page → *Spellcraft Lessons*: pupils started, how many passed recall, transfer and the memory check, the class's accuracy on its own, and the share of guided words done with no hint (low numbers show what to reteach). Each pupil's page shows the same per lesson. **Class settings → Rooms** has a *Spellcraft Lessons* lock like the other rooms.
- **Review integration.** If a pupil's independent accuracy in a lesson is under 60% (6+ answers), words that fit that lesson's pattern come up sooner in spaced review. The **Spellbook** shows a pattern chip on words that fit a lesson (for example 🪄 silent e).
- **Badges (4 new, 28 in all):** Spellcraft Student (finish a lesson's learn stage), Charm Caster (pass recall), Pattern Seer (pass transfer), Long Memory (pass a memory check).
- **New error type:** `silente` (kit for kite, hop for hope) is now separate from the general *vowel* type. Earlier answers keep their stored type; old rows are reclassified from the wrong spelling when the analytics are read.
- **Upgrading:** run `migrations/014_lessons.sql` once in the D1 Console BEFORE deploying v3.0. It only creates tables and indexes (`if not exists`), so re-running is harmless. A fresh install already has them in `schema.sql`. v3.1, v3.2 and v3.3 need no migration.
- **Adding a lesson** is data only: push one object onto `LIST` in `public/lessons.js` (the existing lessons are the template: encounter, notice cards, strategy, guided / recall / transfer word pools, hints, an error-diagnosis function and a pattern matcher). `lessons.js` is shared by the browser and the Worker, so nothing else changes. The other planned lessons already show under *Coming next*.
- **Files:** `public/lessons.js` (content), `public/lesson.js` (pupil screens), the lesson block in `src/worker.js` (endpoints `/api/lessons`, `/api/lesson/log`, `/stage`, `/start`, `/answer`), `migrations/014_lessons.sql`.

### Lesson 2: The Silent-e Charm (v3.0)
cap → cape, kit → kite, hop → hope. Pupils notice that one final e makes the vowel say its name (vowel + consonant + e), then meet the exceptions that have a reason: have, give, live and love (English words do not end in v, so an e hides it) and come, some, done and love (an old handwriting habit wrote o beside m, n and v). Error feedback names the slip (a short-vowel word with the e left off, another long-vowel spelling used, a rule-breaker). 30 practice words in the pools plus any matching words from the class's word bank.

### Lesson 3: The Doubling Charm (v3.1)
hop → hopping, plan → planning, swim → swimming. Pupils learn the **Three Ones** test (one syllable, one vowel, one consonant at the end) and that the double letter is a fence that keeps the vowel short, which links back to Lesson 2 (hoping would read as hope-ing). Contrast words (help, rain, fix, snow, camping) teach when NOT to double. The strategy page also covers the exceptions with a reason (w, x and y never double; endings that start with a consonant do not trigger doubling), and a stress note for longer words (beginning vs visiting) plus the British travel → travelled. Items are root + ending sums (30 in the pools); in the transfer round pupils are asked "Which rule did you use?" for two of their answers. Error feedback tells apart "joined without doubling", "doubled when it should not" and "too many letters". No migration is needed.

### Lesson 4: The Shape-Shifting Suffix (v3.2)
happy → happier, carry → carried, hope → hoping. This is a **decision lesson** that pulls Lessons 2 and 3 together: the "Ending Detective" looks at the end of the root and the first letter of the ending, then chooses one of six rules (drop the silent e, keep the silent e, change y to i, keep the y, double the last letter, or just add). The exceptions come with reasons (why not carriiing; why hopeful keeps its e but hoping drops it; why played keeps its y; a few words such as truly, wholly and argument that drop the e anyway). Items are root + ending sums (30 in the pools), and in the transfer round pupils are asked "Which rule did you use?" for two answers, with all six rules as options. Error feedback names the rule that was missed, and warns specifically about changing the y before -ing and dropping the e before a consonant ending. No migration is needed.

## Misspellings and error types (v2.3)
`public/spelling.js` is shared by the browser and the Worker.
- **Realistic misspellings:** modes that show a wrong spelling (Mending Workshop, the Tower, the Dungeon's fix challenges, Duel curses) no longer just swap two letters. The generator picks a kind of slip first (vowel pattern, double/single letter, sounds-right, missing letter, swapped letters), then a rule for it: ie/ei, ea/ee, silent letters (kn, wr, mb, gh, gu), ph/f, c/s, -tion, -ant/-ent, -able/-ible, -ful/-full, silent e, a lone vowel changed (seperate), and so on. Edit `RULES` and `TW` in `spelling.js` to tune it.
- **Real mistakes from your pupils:** when 2 or more different pupils in a class have written the same near-miss for a word, that spelling joins a distractor bank for the class, and half the time the misspelling shown is one of them. Needs no setup; refreshed every 5 minutes. Guests always get the rule-based misspellings.
- **Error types:** each wrong answer is tagged when it is saved (`attempts.etype`): *Vowel pattern*, *Double or single letters*, *Sounds right, spelled wrong*, *Missing letter*, *Extra letter*, *Swapped letters* or *Other*. Swapped vowels such as ie/ei count as vowel pattern. Blank answers (timeouts) get no tag. Older attempts have no stored tag; dashboards classify them on the fly from the wrong spelling, so history shows up immediately.
- Modes 1 to 3 and the Word Forge are still judged by the browser, so treat error-type counts from them as practice data, like their XP. Trials, the Dungeon and Duels are judged by the server.

## Word Forge (v2.4)
Pupils join a root and an ending (`hope + ing`) or a prefix and a root (`in- + legal`) and type the result. About a third of the items are *fix* rounds that show the classic wrong join (`hopeing`, `stoping`, `happyness`) and ask for the correct spelling. Three tries per item: the first miss names the rule, the second gives the rule in words and the start of the word. Every item, right or wrong, ends with a rule card and a worked example, because the rule is the thing being taught.
- **Content:** `src/forge.js` holds 184 items under 22 rules, tagged by level (38 at P3, 46 at P4, 69 at P5, 31 at P6): join as-is, drop the silent e, keep the silent e (and its rule-breakers), soft c and g, -ee/-ye and ie→y, doubling for short words and for stressed last syllables, when not to double, y→i and keeping the y, plurals in -es, f→ves (and f words that do not change), words in -o, -le→-ly, -fully and -ally, -ically, adding k (panicked), keeping both letters at a prefix join (misspell), and in- becoming il-/im-/ir-. Each rule has a short checker, so a test can prove every item follows its rule.
- **Which items a class gets:** Settings → *Word Forge level*. *Automatic* uses the highest P-level among the class's ticked word lists (and all levels if none is ticked). Or fix it at P3 only, up to P4, P5 or P6, or all. Items of a lower level are always included.
- **Spaced review:** answers feed the same review schedule as the word rooms (the key is the built word, for example `hoping`), so Forge items come back when due. Built words also appear in the Spellbook with their sentence and rule.
- **Teachers:** the class Overview and each pupil's page have a **Word Forge rules** card showing accuracy per rule, weakest first. Forge answers count in the Kinds of mistakes card (a missing double is *Double or single letters*; `hopeing` is *Extra letter*).
- **Guests** can play a short Forge round (P3 and P4 items).
- Forge answers are judged by the browser, like Echo Hall, so treat the XP as practice. A Forgemaster badge is awarded for 50 right answers.
- To add items, append lines to `DATA` in `src/forge.js` (`left+right=result|rule|level|sentence with {w}`; results must be unique).

## Trials of the Archmage (v2.5)
A Trial is a scheduled spelling test. Every pupil in a class gets the same words in their own random order, **one attempt each, no hints, no second tries**, and every answer is marked **on the server** (the browser is never told if an answer was right until the end). Use Trials as the evidence that practice is working; the practice rooms are still judged by the browser.
**Teacher: class → Trials tab**
- **New Trial:** a title, 5 to 40 words (one per line, or `word|sentence with {w}|clue`; sentences are filled in from the word lists when you leave them out), a format, an opening time and a closing time (Singapore time), and when pupils may see their answers. *Add the class's hardest words* and *Add 10 random class words* fill the box for you. Formats: **Hear and spell** (the pupil hears the word and its sentence), **Find and fix** (one word in a sentence is misspelled, using the same realistic misspellings and class error bank as the practice rooms, and the pupil writes it correctly), or **Mixed**. Opening and closing times schedule the assignment; nothing needs to run in the background.
- **Results:** finished and average, highest and lowest, every pupil (including those who have not started) with their answers and the kind of each mistake, the hardest words in the Trial with common wrong spellings, and a Kinds of mistakes card. **CSV** exports every answer.
- **Retest:** copies a Trial's words into a new Trial. When pupils have finished both, the retest's results show **Before and after** for each pupil on the words the two share, with the number of practice-room answers each pupil made in between, so you can see whether practice went with improvement. Treat it as a guide, not proof: pupils see the words twice and nothing here has a control group.
- **Close now**, **Delete** (removes every result), and per pupil **Let them retake** (clears that pupil's attempt, for an absent pupil or a technical problem). A Trial's words cannot be edited after it is created; delete and recreate it instead.
- A pupil's page lists the Trials they have taken.
**Pupils** see open Trials on Home (and all Trials under Rooms). Begin starts it; refreshing the page resumes at the same word. There is no feedback while answering. At the end they see their score and, depending on the teacher's setting, their answers (right away, or only after the Trial closes). A Trial pays 3 XP per right answer and 25 XP for finishing, deliberately small. Trial answers also feed the review schedule and the Kinds of mistakes analytics. Badges: *Trial Taker* (finish one) and *Trial Ace* (90% or more on 5+ words).
**Honest limits:** the word is sent to the browser for the Hear format so it can be spoken, and pupils can in principle read it; for primary pupils on shared classroom devices this is a low risk, but it means a Trial is a classroom assessment, not an exam-secure one. There is no per-question timer.

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
Run `migrations/002_class_settings.sql` once in the D1 Console, then `migrations/003_runs.sql` (dungeon), then `migrations/004_wordlists.sql` (word lists), then `migrations/005_list_levels.sql` (level tags), then `migrations/006_review.sql` (review), then `migrations/007_progress.sql` (badges and streaks), then `migrations/008_duels_analytics.sql` (duel wins and wrong-spelling analytics), then `migrations/009_checkpoints.sql` (dungeon checkpoints, v2.2; run it BEFORE deploying v2.2), then `migrations/010_spaced_review.sql` (spaced review and error types, v2.3; run it BEFORE deploying v2.3, because the new code writes to the new column and table), then commit the new files to GitHub. v2.4 (Word Forge) needs no new migration. Then `migrations/011_trials.sql` (Trials of the Archmage, v2.5; run it BEFORE deploying v2.5). Then `migrations/012_cooldown.sql` (second-level cool-downs, v2.6; run it BEFORE deploying v2.6, once only: re-running fails on the duplicate columns). v2.8 (ten tiers) needs no migration. Then `migrations/013_spell.sql` (chosen active spell, v2.9; run it BEFORE deploying v2.9, once only). Removing a pupil or a class now also deletes their review schedule and Trial results (v2.3 and v2.4 left the review schedule behind). Then `migrations/014_lessons.sql` (Spellcraft Lessons, v3.0; run it BEFORE deploying v3.0; safe to re-run).

## Word lists
Seven lists are built in: **Default** (the original mixed list, used by guests), and **Primary 1** to **Primary 6**. Every list has 100 words (700 in total). No word appears in more than one level list (P1 to P6). Default is a mixed list of classic misspellings, so some of its words also appear in a level list; a class that ticks both still gets each word once. To add words, append lines to the matching list in this file, or have teachers create custom lists in the dashboard. They live in `src/words.js`, one `word|sentence with {w}|clue` per line.

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
