# Say It! (inside Spell Academy v4.5.0): hand-off

Say It! is now a room inside Spell Academy, not a stand-alone app. Read README.md ("Say It!" sections) first.

## State
- v4.4.0: Read aloud (10 XP per word, capped), sound chart, Word attack, My words, class switches.
- v4.5.0 = Say It! v1.0 "Learn to read": ages 3 to 7 reading path. Built and tested with a fake microphone only.
- **Not done (needs people, not code):** recordings of 57 sounds and 44 voice-overs, child playtests, false-reject measurement, privacy review. See docs/PILOT_PROTOCOL.md and docs/PRIVACY_AND_CONSENT.md.

## Decisions taken without asking (change freely)
- Pupil identity stays Spell Academy's name + class code (no avatar login). The avatar is a cosmetic choice in the grown-ups area.
- No points. Reading pays mastery and stars only. Read aloud (older pupils) keeps the 10 XP cap.
- Parent consent is a tickbox inside the app behind an arithmetic gate. It is not a signed form: the school should still collect one.
- Pictures are emoji (no licensing, no files). Replace with original art later.
- Recording ends on 0.9 s of quiet (5 s max).
- Tapping tiles, not dragging, in Word Builder (easier for small fingers).
- Original actions and wording. Nothing copied from any commercial phonics programme.
- Group 5 of the sound order is from memory. Verify against the school's scheme.

## Files
| File | Role |
| --- | --- |
| public/sayit-read.js | Data and rules, shared by browser, Worker, tests: sounds `GR`, orders `SEQ`, words `WORDS`, `SENT`, tricky words, `decodable`, `judge`, `alignSentence`, `update`/`mastered`, `compose`, voice-over text `VO` |
| public/sayit-play.js | Child screens, audio (recorded file else browser voice), silence-ended recording, grown-ups area |
| src/reading.js | `/api/rd/*` routes: setup, me, session, log, done, read, sent, heard, sentheard |
| src/sayit.js | Engines, `sayCfg` (on, voice, read), Say It! XP rule |
| migrations/016_reading.sql | rd_prof, rd_state, rd_log |
Tests (build tools): t9 (read aloud), t10 (reading rules and routes, privacy), ui9 (read aloud in browser), ui10 (reading path in browser, touch targets, no-scroll, mic denied, no third-party requests).

## Known gaps and traps
- The mic is never opened for the reading path unless voice is on AND the parent ticked consent.
- Whisper corrects toward real words, so near misses (sit for sat) may be heard as the target and accepted. Measure this in the pilot; if too lenient, add Azure for phoneme feedback.
- `judge()` hints rely on both words being in the bank. Unknown heard words give no hint.
- Sentence Reader checks words after reading, not live. Word timestamps from Workers AI Whisper are unverified.
- Andika font is not bundled (avoids third-party requests).
- Tracing has no stroke-order check: it counts how much of the letter was covered.
- `speech_attempts` rows are shared with Read aloud (same 60 per day and 2 second limits).
- Teacher dashboard has no view of the reading path yet; only the parent summary exists.
- Existing issue found and fixed: removing a pupil never deleted lesson_* rows; it does now.
