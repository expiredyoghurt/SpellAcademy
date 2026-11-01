# Say It! Learn to read: privacy and consent checklist

Not legal advice. Check your school's policy and the PDPC's guidance on children's personal data (advisory guidelines, March 2024). For under-13s, parental consent is expected and the data is treated as sensitive.

## What the software does (verified in code and tests)
- Voice is **off by default** for every class. A teacher switches it on per class, and then each child's parent must also tick consent in the grown-ups area. Both are needed before the microphone is used for reading.
- Audio is sent only when the child taps the microphone on Read the Word or Sentence Reader. Say the Sound and the mic check listen on the device only and send nothing.
- The Worker forwards audio to the speech engine for that request and discards it. **No audio and no transcript are stored.** Tables hold only: word, engine, a score, and a correct/not-correct flag (`speech_attempts`, `rd_log`, `rd_state`). The test suite checks that no column named audio or transcript exists.
- No third-party scripts, fonts, trackers or ads: the test suite fails if any file in public/ names an outside host.
- Limits: one submission per 2 seconds, 60 per pupil per 24 hours.
- The reading path never pays XP or points.

## Where the audio goes (say this plainly to parents)
| Engine | Who receives the audio |
| --- | --- |
| Whisper on Workers AI | Cloudflare |
| Azure | Microsoft |
| Google | Google |
| Browser recognition (when nothing above is set up) | The browser maker (for Chrome, Google; for Safari, Apple) |
The app uses the first of Azure, Google, Whisper that is configured. Check the provider's own retention terms for the plan you use; the app cannot control them.

## Parent consent text (as shown in the app)
"Allow voice reading. When your child reads a word aloud, the sound is sent to a speech-checking service (Cloudflare Workers AI, Microsoft Azure or Google, depending on how the school set it up, or the browser's own service) so the word can be checked. Spell Academy does not keep the recording or what was heard. It keeps only whether the word was read correctly. You can turn this off at any time."
Adjust this text if you change the engine or add storage.

## Before launch
- [ ] School/MOE policy checked; who is the data controller (you, the school)?
- [ ] Data-protection impact assessment written (what data, why, who sees it, how long, how a parent deletes it)
- [ ] A way for a parent to see and delete their child's data (a teacher can remove a pupil in the teacher dashboard, which does not yet clear the new reading tables: see HANDOFF)
- [ ] Retention decided (suggest: delete reading logs when the child leaves the class)
- [ ] Parent information sheet and consent form sent home
- [ ] Contact person named for data questions
