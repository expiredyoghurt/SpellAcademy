# Say It! Learn to read: pilot and calibration protocol

Prepared for v1.0. **Nothing here has been done yet.** The software is built and tested with a fake microphone; it has never heard a real child. These steps are what turns v1.0 from "built" into "validated". Do them before any class-wide use, and before telling parents the app "checks pronunciation".

## 0. Before anyone records a child
1. Finish docs/PRIVACY_AND_CONSENT.md: school and MOE policy check, parent consent form, data-protection impact assessment.
2. Decide the engine for the pilot (Whisper on Workers AI is what worked best for you in v0.5). Confirm in the Cloudflare dashboard what Workers AI costs after the free allowance. The app caps each pupil at 60 voice submissions per 24 hours (`SAY_DAILY` in src/sayit.js).
3. Switch voice on for the pilot class only (Teacher, class, Settings, Say It!). Each parent then ticks consent in the grown-ups area.
4. Record the sounds and voice-overs (docs/RECORDING_CHECKLIST.md). Without them the browser voice stands in and will say some sounds badly: judge sounds teaching only after real recordings are in.

## 1. Child playtests (ages 3 to 7, parent present for ages 3 to 5)
Run 6 to 10 children across the age range, 15 minutes each, on the devices you really use (iPad, phone, school Chromebook). The adult watches and does not help unless the child is stuck for 10 seconds. Note, per child:
- Did they start without help? Did they understand every prompt from the voice alone?
- Where did they tap the wrong thing, get stuck, or look for an adult?
- Did lifting a finger mid-trace cause trouble? Did the mic button feel obvious?
- Did the child leave happy? How many minutes before attention dropped?
Fix anything that stops 2 or more children. Re-test those screens.

## 2. False-reject rate (child said it right, app said no)
This is the number that decides whether children are frustrated. Proposed target: **under 10 percent**.
1. Sit with each pilot child. For 20 CVC words they can read, an adult watches and marks "said correctly" or "not".
2. Compare with what the app decided (table `rd_log`, columns act='read', ok). Count words the adult marked correct that the app marked not correct. False-reject rate = those words / all words the adult marked correct.
3. Repeat in 3 voices: an adult, an older child, a younger child. Run it in a quiet room and in a noisy classroom.
4. For every false reject, write down what was heard. The app deliberately does not store this. Use a test build or a handwritten log. Add genuine variants to `VARIANTS` in public/sayit-read.js (for example Singapore English th-stopping, final-consonant dropping), then repeat.
5. Also measure the **false accept** rate (child said it wrong, app said yes): include 10 deliberate misreads (sit for sat).

Useful queries (D1 Console):
```sql
-- accept rate per word in the pilot
select key word,count(*) tries,sum(ok) correct from rd_log where act='read' and kind='w' group by key order by correct*1.0/count(*);
-- attempts per pupil per day
select student_id,day,count(*) from rd_log where act='read' group by student_id,day;
```

## 3. Things to tune from the pilot (all constants, in one place each)
| Setting | Where | Starting value |
| --- | --- | --- |
| Promote a sound after | `mastered()` in public/sayit-read.js | 5 of the last 6 tries, on 2 different days |
| Review spacing | `BOXES` | 1, 2, 4, 7 days |
| Session length cap | `compose()` cap | 12 minutes |
| Tries before the app helps | `ACT.read` in public/sayit-play.js | 2 |
| Quiet that ends a recording | `listenOnce()` | 0.9 s of quiet, 5 s at most |
| Accepted variants and near-miss words | `VARIANTS`, `conf` in sayit-read.js | small starter list |

## 4. Accessibility pass (iPad and phone)
- Touch targets are 75 px or larger on every play screen (checked automatically in the browser test). Check with real small fingers.
- Voice-over for every prompt and a mute button. Check VoiceOver and TalkBack read the buttons sensibly (every button has a label).
- Reduced motion: animations only run when the device allows them.
- Colour is never the only signal (mastery map uses symbols; tiles are labelled).
- The type face is Andika if installed, with a fallback. Andika is **not bundled** (no third-party requests by design). To get single-storey a and g everywhere, download Andika (SIL Open Font License), put the .woff2 in public/ and add an @font-face rule.

## 5. Sign-off checklist for v1.0
- [ ] Sounds and voice-overs recorded, spot-checked by an adult who knows phonics
- [ ] Playtests done, blocking issues fixed
- [ ] False-reject rate measured in 3 voices; under 10 percent or the variants/thresholds adjusted until it is
- [ ] Consent form, DPIA and school approval done
- [ ] Parents told, in plain words, where the voice goes
- [ ] Per-day cost checked after a week of pilot use
