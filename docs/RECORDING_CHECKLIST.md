# Say It! recording checklist (Learn to read)

The app looks for a recorded file first and uses the browser voice only if the file is missing. Record a human voice: browser text-to-speech cannot say pure sounds (sss, not suh).

## How to record
- A quiet room, a decent microphone, 44.1 kHz or 48 kHz, mono. Export mp3 (about 96 kbps is plenty). Trim silence at both ends; keep each sound under 1.2 seconds.
- **Pure sounds:** stretch continuous sounds (sss, mmm, fff, lll, nnn, rrr, vvv, zzz) and keep stop sounds short and clipped (t, p, k, d, b, g) with no "uh" added where you can. Say the sound, never the letter name.
- Accent: record in the accent you want children to copy and tell the pilot parents which it is. Singapore classrooms usually follow a British-style model.
- Do not use or copy any commercial programme's songs, actions or recordings. The actions in the app are original.
- Put files in public/audio/sounds, public/audio/vo and (optional) public/audio/words, then deploy. Bump the ?v= number of sayit-play.js if browsers keep the old fallback.

## 1. Sounds (public/audio/sounds/<id>.mp3): 57 files

| File | Sound shown | Say | Example words |
| --- | --- | --- | --- |
| s.mp3 | s | sss | sun, snail, sock |
| a.mp3 | a | ah | apple, ant, axe |
| t.mp3 | t | tuh | tent, tie, tree |
| i.mp3 | i | ih | ink, insect |
| p.mp3 | p | puh | pig, pan, pie |
| n.mp3 | n | nnn | nut, nose, net |
| ck.mp3 | ck | kuh | cat, kite, key, duck |
| e.mp3 | e | eh | egg, elephant, elf |
| h.mp3 | h | huh | hat, hen, house |
| r.mp3 | r | rrr | rat, ring, rain |
| m.mp3 | m | mmm | map, moon, mouse |
| d.mp3 | d | duh | dog, drum, duck |
| g.mp3 | g | guh | goat, gift, grapes |
| o.mp3 | o | oh | orange, octopus, olive |
| u.mp3 | u | uh | umbrella, up |
| l.mp3 | l | lll | lion, leaf, lemon |
| f.mp3 | f | fff | fish, fox, frog |
| b.mp3 | b | buh | ball, bee, bus |
| ai.mp3 | ai | ay | rain, snail, train |
| j.mp3 | j | juh | jet, jeans, juice |
| oa.mp3 | oa | oh | boat, coat, soap |
| ie.mp3 | ie | eye | pie, tie, kite |
| ee.mp3 | ee | ee | bee, tree, sheep |
| or.mp3 | or | or | fork, horse, corn |
| z.mp3 | z | zzz | zebra, zip, zero |
| w.mp3 | w | wuh | web, watch, wolf |
| ng.mp3 | ng | ng | ring, king, song |
| v.mp3 | v | vvv | van, volcano, violin |
| oo.mp3 | oo | oo | moon, spoon, boot |
| oo_s.mp3 | oo | uh | book, foot, cook |
| y.mp3 | y | yuh | yo-yo, yam, yacht |
| x.mp3 | x | ks | box, fox, six |
| ch.mp3 | ch | chuh | chip, cheese, chair |
| sh.mp3 | sh | shh | ship, sheep, shell, shoe |
| th.mp3 | th | thh | thumb, three, thread |
| th_v.mp3 | th | thuh | feather, father, mother |
| qu.mp3 | qu | kwuh | queen, quack, question |
| ou.mp3 | ou | ow | mouse, house, cloud |
| oi.mp3 | oi | oy | coin, oil |
| ue.mp3 | ue | oo | blue, clue |
| er.mp3 | er | er | sister, tiger, flower |
| ar.mp3 | ar | ar | car, star, shark, farm |
| c.mp3 | c | kuh | cat, cup, cow |
| k.mp3 | k | kuh | kite, key, kangaroo |
| ff.mp3 | ff | fff | puff, cliff, sniff |
| ll.mp3 | ll | lll | bell, shell, doll |
| ss.mp3 | ss | sss | kiss, dress, grass |
| zz.mp3 | zz | zzz | buzz, jazz, fizz |
| igh.mp3 | igh | eye | light, night, flight |
| ur.mp3 | ur | er | burger, purple, nurse |
| ow.mp3 | ow | ow | cow, owl, clown |
| ear.mp3 | ear | eer | ear, deer, beard |
| air.mp3 | air | air | chair, hair, stairs |
| ure.mp3 | ure | oor | tour |
| +s.mp3 | s (word ending) | sss | cats, dogs, pigs |
| +ed.mp3 | ed (word ending) | duh | jumped, helped, kissed |
| +ing.mp3 | ing (word ending) | ing | running, jumping, singing |

**Priority:** the first 45 rows in the order of the groups (42 sounds plus the three endings) cover the default sound order. The other 12 (c, k, ff, ll, ss, zz, igh, ur, ow, ear, air, ure) are used only by the Letters and Sounds style order and by spellings such as the ff in puff; record them second.

Notes: oo_s is the short sound in book; th_v is the buzzing th in this; +s, +ed, +ing are word endings (say the ending sound as in cats/dogs, jumped, running).

## 2. Voice-over lines (public/audio/vo/<key>.mp3): 44 files

Warm, slow, smiling. Children cannot read these on screen, so they carry every instruction.

| File | Say |
| --- | --- |
| tap_start.mp3 | Tap to start! |
| welcome.mp3 | Hello! Let us learn some sounds. |
| mic_check.mp3 | Say hello to me! |
| mic_ok.mp3 | I can hear you! |
| mic_no.mp3 | I cannot hear you, but that is okay. We can still play. |
| safari_first.mp3 | Which picture starts with the sound? |
| safari_mid.mp3 | Which picture has the sound? |
| safari_end.mp3 | Which picture ends with the sound? |
| teach_it.mp3 | This is the sound. Do the action with me. |
| say_sound.mp3 | Listen. Now you say it. |
| say_with.mp3 | Say the sound out loud, then tap the button. |
| say_good.mp3 | Great saying! |
| blend_tap.mp3 | Tap each letter to hear its sound. |
| blend_slide.mp3 | Now slide the sounds together. |
| blend_which.mp3 | Which word did we make? |
| blend_say.mp3 | Now say the word. |
| read_it.mp3 | Can you read this word? |
| read_good.mp3 | You read it! |
| read_try.mp3 | Good try! Let us look again. |
| read_near.mp3 | Nearly! Listen to each sound. |
| hint_first.mp3 | Check the first sound. |
| hint_middle.mp3 | Check the middle sound. |
| hint_last.mp3 | Check the last sound. |
| assist.mp3 | Let us blend it together. |
| tricky_find.mp3 | Find the word. |
| build_hear.mp3 | Listen to the word. Build it with the letters. |
| build_good.mp3 | You built it! |
| build_try.mp3 | Good try! Let us look again. |
| trace_it.mp3 | Trace the letter with your finger. |
| trace_good.mp3 | Lovely tracing! |
| trace_again.mp3 | Good try! Let us trace again. |
| sent_read.mp3 | Read the whole sentence. |
| sent_good.mp3 | You read the sentence! |
| sent_try.mp3 | Good try! Let us read it again. |
| rhyme_q.mp3 | Which word rhymes? |
| same_start.mp3 | Which word starts the same? |
| beats_q.mp3 | Clap the beats. Tap once for each beat. |
| good1.mp3 | Well done! |
| good2.mp3 | Lovely! |
| good3.mp3 | You did it! |
| retry.mp3 | Good try! Let us look again. |
| all_done.mp3 | All done for today. See you tomorrow! |
| stop_ask.mp3 | Do you want to stop now? |
| ask_adult.mp3 | Please ask a grown-up to help. |

## 3. Words (optional, public/audio/words/<word>.mp3): 386 files

If a word file is missing the browser voice says the word, which is usually fine for ordinary words. Record the tricky words first: the, to, I, no, go, a, he, she, we, me, be, is, his, has, was, you, my, are, they, said, have, like, so, do, all, come, some, little, one.
