// Spellcraft Lessons (v3.0+): lesson content and pattern tools, shared by the browser (classic script) and the Worker (import).
//   Lessons.LIST            the lessons that are built (each is plain data plus a few small functions)
//   Lessons.PLAN            all 12 planned lessons (the ones not built yet show as "coming next")
//   Lessons.get(id)         one lesson
//   Lessons.tag(w)          [{l: lesson id, t: short label}] pattern chips for a word (Spellbook, review scheduling)
//   Lessons.find(id,w)      the lesson item (sentence, hook...) for a word, if the lesson has it in a pool
// To add a lesson: push one object onto LIST (see the comments in the existing lessons). Nothing else needs to change.
// Optional lesson fields (v3.6/v3.7):  hl / dl = labels for the hook / meaning box;  accept(bankEntry) + mk(bankEntry) = which class-bank words may join the transfer pool, and what extra fields they get;
//   fix:true = items carry a misspelling (bad) and the pupil writes the right word;  diagQ(item) = a "what kind of slip" card after each word;  decide(item) = an "explain your decision" card after each word.
(function(g){
// word items:  word|sentence with {w}|tricky part|memory hook          join items:  root+ending=result|rule|sentence with {w}
const words=t=>t.trim().split('\n').map(l=>{const[w,s,tr,hook]=l.split('|');return{w:w.trim(),s:s.trim(),tr:tr||'',hook:hook||''}});
const joins=t=>t.trim().split('\n').map(l=>{const[eq,rule,s,def]=l.split('|'),[lr,w]=eq.split('='),[a,b]=lr.split('+');return{l:a,r:b,w,rule,s:s.trim(),def:def||''}}); // optional 4th field: a meaning shown in hints and feedback
const STAGES=['learn','guided','recall','transfer','retain'],BIT={learn:1,guided:2,recall:4,transfer:8,retain:16};
const PLAN=[[1,'Sound-to-Spelling Patterns','Common sounds, alternative letter patterns and grapheme choices.'],[2,'Silent-e and Vowel Changes','cap/cape, kit/kite, hop/hope.'],[3,'Double Consonants','hop/hopping, plan/planning, swim/swimming.'],[4,'Suffixes and Spelling Changes','happy/happier, carry/carried, hope/hoping.'],[5,'Prefixes, Roots and Word Families','help/helpful/helpless; sign/signal/signature.'],[6,'Syllables and Longer Words','Breaking words into manageable chunks.'],[7,'Easily Confused Words','their/there, quiet/quite, lose/loose.'],[8,'Tricky and Irregular Words','Learning words that cannot be fully explained by familiar patterns.'],[9,'Morphology and Meaning','magic/magician, compete/competition, decide/decision.'],[10,'Mnemonics and Visual Memory','Memorable spelling clues, such as necessary and accommodate.'],[11,'Error Diagnosis','Identify, explain and correct misspellings such as acommodate and seperate.'],[12,'Spelling Detectives','Apply the strategies to unfamiliar words and explain spelling decisions.']];
const LIST=[];
// A question card: k = notice (pattern recognition) | diag (error diagnosis) | why (strategy knowledge); o = options; a = index of the right option; x = explanation shown afterwards
const mc=(id,k,q,o,a,x)=>({id,k,q,o,a,x});
const lc=s=>String(s||'').toLowerCase();
// ---- Lesson 1: Sound-to-Spelling Patterns (word items from the existing word bank and their inflections) ----
// One sound, several spellings. G1 groups the spellings of three vowel sounds (plus igh); the position tips are the strongest honest rules there are.
const G1={ai:{snd:'long a',alts:['ay'],tip:'ai usually sits in the MIDDLE of a word (rain, paint, train).'},ay:{snd:'long a',alts:['ai'],tip:'ay usually sits at the END of a word or syllable (play, day, away).'},
 ee:{snd:'long e',alts:['ea'],tip:'ee is the most common spelling of this sound. Think of two eyes looking: see, tree, green.'},ea:{snd:'long e',alts:['ee'],tip:'ea is the sneaky spelling: there is no strict rule, so use the word family, the meaning and the hook.'},
 oa:{snd:'long o',alts:['ow'],tip:'oa sits in the MIDDLE of a word (boat, road, soap). It almost never ends a word.'},ow:{snd:'long o',alts:['oa'],tip:'ow often comes at the END of a word (snow, yellow, window).'},
 igh:{snd:'long i',alts:['ite'],tip:'igh is a trio that often travels before t: night, light, fright. If you hear “ite”, think igh.'}};
const GR1=['igh','ai','ay','ee','ea','oa','ow'],gr1=w=>GR1.find(g=>w.includes(g))||'';
const EXC1=new Set('head bread great break steak heavy weather again said straight breakfast ready bear pear wear tear swear'.split(' ')),RE1=/^[^aeiou]*(ai|ay|ee|ea|oa|ow|igh)[^aeiou]*$/;
const m1=w=>RE1.test(w)&&!EXC1.has(w)&&!/(ear|air|ow$)/.test(w.replace(/^(snow|show|grow|blow|flow|know|slow|low|row|bow|throw|yellow)$/,''))||/^(snow|show|grow|blow|flow|slow|low|row|throw)$/.test(w);
LIST.push({id:'sounds',no:1,icon:'🔊',name:'The Sound Sorter',sub:'rain · play · tree · sea · boat · snow',kind:'word',
 goal:'One sound can be spelled in several ways. Learn the position clues and memory hooks that help you choose the right spelling.',
 enc:{say:'Each pair has the SAME vowel sound but different spellings. Say them aloud. Which letters make the sound in each word?',sep:'&',pairs:[['rain','play'],['tree','sea'],['boat','snow'],['night','lightning']]},
 notice:[
  mc('n1','notice','Rain and play have the same vowel sound. Which spelling comes at the END of a word?',['ay','ai'],0,'ay usually ends a word or syllable (play, day, away). ai sits in the middle (rain, paint).'),
  mc('n2','notice','Which word has the long o sound spelled “oa”?',['boat','snow','yellow'],0,'boat: b-oa-t. In snow and yellow the long o is spelled ow, at the end.'),
  mc('n3','notice','Tree and sea have the same vowel sound. How are they spelled?',['ee and ea','ai and ay','oa and ow'],0,'Both say “ee”. ee and ea are the two most common spellings of this sound.'),
  mc('n4','notice','Which spelling of the long i sound often comes before t, as in night?',['igh','ie','y'],0,'igh: night, light, fright. It is a trio of letters that travels together.'),
  mc('d1','diag','Zoe wrote “rane” for the water that falls from the sky. What went wrong?',['She spelled the long a sound with a silent-e pattern; this word uses ai in the middle','She forgot a double letter','She used the wrong first letter'],0,'Rain uses ai. Another spelling of long a (a-e as in cake) is a different pattern.')],
 strat:{title:'The Sound Sorter',
  steps:['Say the word slowly and find the vowel SOUND. Which spellings can make it? (long a: ai, ay, a-e · long e: ee, ea · long o: oa, ow, o-e · long i: igh, i-e, y)','Use the clues. ay and ow often END a word; ai and oa sit in the MIDDLE. There is no strict rule for ee and ea, so use the family, the meaning and a hook.','Write the word and LOOK at it. Does it look right? Check it against your hook, then fix it. That is how good spellers work.'],
  ex:'The vowel sound in <b>pl_ _</b> is long a, and it is at the end of the word, so pl<b>ay</b>.<br>The vowel sound in <b>r_ _n</b> is long a, in the middle, so r<b>ai</b>n.<br>Two spellings, one sound: the position decides.',
  exc:[{t:'Why does ea sometimes say “e”, as in head and bread?',x:'The letters ea have three sounds: sea (long e), bread (short e) and great (long a). When you hear a short e, check the word family and learn it by heart (Lesson 8).'},
   {t:'Why does ow sometimes say “ow”, as in flower?',x:'ow has two sounds: snow (long o) and flower (as in ouch). Say the word and listen before you choose.'},
   {t:'Why does said have ai?',x:'It does not follow the sound rule at all. Said and again are words with no neat reason: find the tricky bit and make a hook (Lesson 8).'}],
  why:[mc('w1','why','Why can you not spell a word by sound alone?',['One sound can be spelled in several ways','English words are never spelled by sound','Vowels do not make sounds'],0,'Sound narrows down the choice. Position, family and memory do the rest.'),
   mc('w2','why','The sound is long a at the end of the word. Which spelling is the better first guess?',['ay','ai','a-e'],0,'ay is the usual choice at the end of a word, as in play and today.')]},
 guided:words(`rain|The {w} falls from the clouds.||
play|We {w} in the park.||
tree|A bird sits in the {w}.||
sea|We swim in the {w}.||
boat|A {w} floats on water.||
snow|It does not {w} in Singapore.||`),
 recall:words(`paint|Let us {w} a picture.||
train|The {w} stops at the station.||
today|It is sunny {w}.||
away|The bird flew {w}.||
green|The grass is {w}.||
sheep|The {w} has soft wool.||
clean|Please keep the room {w}.||
beach|We build sandcastles at the {w}.||
please|Say thank you and {w}.||
yellow|The banana is {w}.||
window|Please open the {w}.||
night|The stars shine at {w}.||
queen|The {w} wore a gold crown.||
dream|I had a happy {w}.||`),
 transfer:words(`rainbow|We saw a {w} after the rain.||
holiday|We went to Bali for our {w}.||
teacher|My {w} is kind.||
sweet|The candy is {w}.||
leaf|A {w} fell from the tree.||
tomorrow|We will visit the zoo {w}.||
lightning|We saw a flash of {w} before the thunder.||
played|The boys {w} football after school.||
sleeping|The baby is {w} in her cot.||
cleaning|We are {w} the classroom.||`),bank:true,
 explain:[mc('x1','why','Which clue helps you choose between ai and ay?',['Where the sound is: ay at the end, ai in the middle','Which one has fewer letters','Which one comes first in the alphabet'],0,'Position is a real clue: play, today, away end in ay; rain, paint, train keep ai in the middle.'),
  mc('x2','why','You are not sure whether the word has ee or ea. What can you do?',['Think of its family or a hook, then check how it looks','Always choose ee','Always choose ea'],0,'There is no strict rule for ee and ea, so use evidence: the family, the meaning, the hook.')],
 hints:it=>{const g=gr1(it.w),G=G1[g];return G?[`Listen to the vowel sound. It is a ${G.snd}. Which spellings can make it? ${Object.keys(G1).filter(k=>G1[k].snd===G.snd).join(', ')}.`,G.tip,`Here is the shape: ${it.w.replace(g,'_'.repeat(g.length))}. The vowel spelling is missing.`]:['Listen to the vowel sound and think about which spellings can make it.','Check the position of the sound: middle or end of the word?','Say the word slowly and write each sound.']},
 diag:(it,a)=>{a=lc(a);const g=gr1(it.w),G=G1[g];if(!G)return'Say the word slowly and check each sound.';
  const alt=G.alts.find(x=>a.includes(x)&&!it.w.includes(x));if(alt)return`You used “${alt}”, which can also make the ${G.snd} sound, but this word uses “${g}”. ${G.tip}`;
  if(!a.includes(g))return`The ${G.snd} sound is spelled “${g}” here. ${G.tip}`;return`The vowel spelling is right. Check the other letters one sound at a time.`},
 match:m1,tag:w=>m1(w)&&gr1(w)?gr1(w)+' sound':null});
// ---- Lesson 2: Silent-e and Vowel Changes ----
const EXC2=new Set('have give live love come some done gone there where were are one move lose prove'.split(' ')),RE2=/^[^aeiou]*[aeiou][^aeiouwxy]e$/;
LIST.push({id:'silente',no:2,icon:'🪄',name:'The Silent-e Charm',sub:'cap → cape · kit → kite · hop → hope',kind:'word',
 goal:'Learn how one silent e at the end of a word changes the vowel sound, and why a few words break the pattern.',
 // 1. Encounter: pairs to listen to
 enc:{say:'Listen to each pair. The letters are almost the same, but one word has an e on the end. Say them out loud. What happens to the vowel?',pairs:[['cap','cape'],['hop','hope'],['kit','kite'],['cut','cute']]},
 // 2. Notice
 notice:[
  mc('n1','notice','Which word has a LONG vowel, where the vowel says its own name?',['tap','tape'],1,'In tape the a says its name, “ay”. The silent e at the end is the clue.'),
  mc('n2','notice','Look at kit and kite. What did the e at the end change?',['It changed the vowel sound from short to long','It added a new syllable','It made the word plural'],0,'The e makes no sound of its own. Its job is to make the i say its name.'),
  mc('n3','notice','Look at cap → cape, hop → hope, cut → cute. Where does the e go?',['At the end, after one consonant that follows the vowel','At the start of the word','Between the two vowels'],0,'The pattern is vowel + consonant + e. The e reaches over one consonant to the vowel.'),
  mc('n4','notice','Which word has the pattern vowel + consonant + silent e?',['plan','plane','plain'],1,'plane = a + n + e. In plain, the long sound is made by the vowel pair ai, not by a silent e.'),
  mc('d1','diag','Maya wrote “kit” for the toy that flies in the sky. What went wrong?',['She left out the silent e, so the i stays short','She added a letter that is not needed','She wrote the wrong first letter'],0,'Without the e the word reads kit (short i). Kite needs the silent e to say “eye”.')],
 // 3. Strategy: the rule, a worked example, the exceptions that make sense, and two why-questions
 strat:{title:'The Silent-e Charm',
  steps:['Say the word. Does the vowel say its own name (a = ay, e = ee, i = eye, o = oh, u = you)?','If it does and only ONE consonant follows the vowel, add a silent e: vowel + consonant + e.','The e is silent, but it works. It reaches over the consonant and makes the vowel long.'],
  ex:'hop → hope<br>h-o-p says “hop” with a short o.<br>Add the charm: h-o-p-<b>e</b>. Now the o says its name: “hope”.',
  exc:[{t:'Why do have, give, live and love end in e?',x:'English words do not end in the letter v. So a silent e is added to hide the v, even though the vowel is short. That is why have does not rhyme with cave.'},{t:'Why do come, some, done and love have an o?',x:'In old handwriting, a u next to m, n or v looked like a row of tiny strokes, so scribes wrote o instead. The sound is the u sound; the spelling kept the o.'},{t:'Words to learn by heart',x:'are, were, there, where, one, move and lose break the pattern. Check them against the rule and spot what is different.'}],
  why:[mc('w1','why','Why does have end with e, even though the a is short?',['English words do not end in v, so an e is added','It is a spelling mistake that stuck','The e makes the a long'],0,'The e in have is a bodyguard for the v. It is not the Silent-e Charm.'),
   mc('w2','why','What job does the silent e do in kite?',['It makes the i say its name','It is said at the end of the word','It shows that the word is a noun'],0,'The e is silent. It changes the vowel before it from short to long.')]},
 // 4. Guided practice (hints on request, three levels)
 guided:words(`hope|I {w} the weather will be fine.
kite|We flew a {w} at East Coast Park.
tape|Please use {w} to stick the poster on the wall.
cube|She put an ice {w} in her drink.
plane|The {w} landed at Changi Airport.
slide|The children ran to the {w} in the playground.`),
 // 5. Independent recall (6 picked from these, no hints)
 recall:words(`cake|We shared a {w} on her birthday.
bike|He rides his {w} to school.
home|It is time to go {w}.
nose|A cold made my {w} run.
rope|The climbers held the {w} tightly.
lake|We rowed a boat on the {w}.
game|Let us play a {w} of chess.
time|What {w} does the train leave?
five|She is {w} years old.
hole|The mole dug a {w} in the garden.
note|Please write me a {w}.
wave|The surfer rode the {w}.
gate|Please close the {w} behind you.
tune|She hummed a happy {w}.`),
 // 6. Transfer: new words never used in the earlier stages (more are added from the class word bank)
 transfer:words(`shape|A circle is a round {w}.
stone|He skipped a {w} across the pond.
smoke|We saw {w} rising from the chimney.
flame|The candle {w} flickered in the breeze.
phone|I called Grandma on the {w}.
drive|Dad will {w} us to the airport.
skate|I learned to {w} at the ice rink.
whale|A blue {w} is the biggest animal on Earth.
globe|She spun the {w} to find Singapore.
prize|He won first {w} in the quiz.`),
 bank:true,
 explain:[mc('x1','why','Which job does the final e do in shape, stone and flame?',['It makes the vowel say its name','It adds an extra syllable','It shows the word is a plural'],0,'The silent e makes the vowel long. It never adds a syllable here.'),
  mc('x2','why','Which of these is a rule-breaker, where the vowel does NOT say its name?',['save','have','wave'],1,'have breaks the pattern. save and wave follow it.'),
  mc('x3','diag','Someone wrote “hopeing” by mistake instead of “hoping”. Which idea was missed?',['The silent e is dropped before -ing','The silent e must be doubled','The word needs another consonant'],0,'That is a Lesson 4 idea: drop the silent e before an ending that starts with a vowel. You will meet it soon!')],
 hints:it=>{const w=it.w,m=w.match(/([aeiou])([^aeiouwxy])e$/);return[
  'Say the word slowly. Does the vowel say its own name? Then you need the Silent-e Charm.',
  m?`The shape is vowel + consonant + silent e. Here the vowel is “${m[1]}”, then “${m[2]}”, then the silent e.`:'The shape is vowel + consonant + silent e.',
  `Here are the consonants: ${w.replace(/[aeiou]/g,'_')}. The vowel and the silent e are missing.`]},
 diag:(it,a)=>{const w=it.w;a=lc(a);
  if(w==='have'||w==='give'||w==='live'||w==='love')return'This one is a rule-breaker. English words do not end in v, so an e is added even though the vowel is short.';
  if(EXC2.has(w))return'This word is a rule-breaker. Learn it by heart and notice what is different from kite.';
  if(a===w.slice(0,-1))return'You wrote the short-vowel word. The silent e makes the vowel say its name, so this word needs the e at the end.';
  if(a.length>=w.length&&a.endsWith('e')&&a.slice(0,-1)!==w.slice(0,-1))return'The e is in the right place, but check the letters before it: vowel + ONE consonant + e.';
  if(/(ai|ay|ee|ea|oa|ow|igh|ie|ew|oo|ue)/.test(a)&&!/(ai|ay|ee|ea|oa|ow|igh|ie|ew|oo|ue)/.test(w))return'That is another way to spell a long vowel. For this word the long vowel comes from the silent-e pattern: vowel + consonant + e.';
  return'Check the pattern: vowel + consonant + silent e, like kite.'},
 match:w=>RE2.test(w)&&!EXC2.has(w),
 tag:w=>EXC2.has(w)?'e rule-breaker':RE2.test(w)?'silent e':null});
// ---- Lesson 3: Double Consonants (join items: root + ending = result, with the rule that applies) ----
const R3={dbl:{n:'Double the last letter',t:'One syllable, one vowel, one consonant at the end (the Three Ones), and the ending starts with a vowel: double the last letter.'},add:{n:'Just add the ending',t:'One of the Three Ones fails (two consonants, two vowels, or it ends in w, x or y), so nothing doubles. Join the root and the ending.'}};
LIST.push({id:'double',no:3,icon:'🔁',name:'The Doubling Charm',sub:'hop → hopping · plan → planning · swim → swimming',kind:'join',rules:R3,
 goal:'Learn the Three Ones test that tells you when to double the last letter before -ing, -ed, -er or -est, and why the double letter is there.',
 enc:{say:'Listen to each pair. The second word is the first one plus an ending. Look at the letters in the middle of the long word. What do you notice?',pairs:[['hop','hopping'],['plan','planning'],['swim','swimming'],['jump','jumping']]},
 notice:[
  mc('n1','notice','Which word has ONE vowel followed by ONE consonant at the end?',['hop','help','rain'],0,'hop = h-o-p: one vowel, one consonant. help ends in two consonants (lp) and rain has two vowels (ai).'),
  mc('n2','notice','Look at hop → hopping, plan → planning, swim → swimming. What happens to the last letter?',['It is doubled before -ing','It disappears','It changes to i'],0,'The last letter is written twice: p → pp, n → nn, m → mm.'),
  mc('n3','notice','Which word does NOT double its last letter before -ing?',['run','sit','help'],2,'help ends in two consonants (lp), so nothing doubles: helping. run → running and sit → sitting do double.'),
  mc('n4','notice','Which spelling is read with a SHORT o, like “hop”?',['hoping','hopping'],1,'hoping would be read hope-ing, with a long o. The double p keeps the o short: hop-ping.'),
  mc('d1','diag','Ravi wrote “runing”. What went wrong?',['He forgot to double the n, so the u could look long','He added an extra letter','He used the wrong ending'],0,'run is a Three Ones word and -ing starts with a vowel, so the n doubles: running.')],
 strat:{title:'The Doubling Charm: the Three Ones',
  steps:['Ask the Three Ones. Is it ONE syllable? Does it have ONE vowel? Does it end in ONE consonant?','If all three are yes, and the ending starts with a vowel (-ing, -ed, -er, -est), double the last letter.','The double letter works like a fence: it keeps the vowel short.'],
  ex:'swim + ing<br>One syllable ✓ · one vowel (i) ✓ · one consonant at the end (m) ✓<br>-ing starts with a vowel, so double the m: swim<b>m</b>ing.<br><br>help + ing<br>It ends in two consonants (lp) ✗ → helping.',
  exc:[{t:'Why do rain, help and open not double?',x:'rain has two vowels, help ends in two consonants, and open has two syllables with the stress on the first. The vowel is already protected, so no fence is needed.'},
   {t:'Why do fix, snow and play not double?',x:'The letter x already makes two sounds (k-s), and w and y behave like vowels at the end of a word, so they are never doubled: fixing, snowing, playing.'},
   {t:'What if the ending starts with a consonant?',x:'Doubling only happens before an ending that starts with a vowel. Before -ful, -ly or -ment the word stays the same: sadly, helpful, shipment.'},
   {t:'Longer words: begin and visit',x:'In a longer word, double the last letter only when the LAST syllable is stressed: beGIN → beginning, but VISit → visiting. In British spelling a final l after one vowel doubles even when it is not stressed: travel → travelled.'}],
  why:[mc('w1','why','Why do we write hopping, not hoping?',['hoping would be read hope-ing, with a long o; the double p keeps the o short','-ing always doubles the last letter','hop is a verb'],0,'The double letter keeps the vowel short. Without it, hoping looks like hope + ing (Lesson 2).'),
   mc('w2','why','Why does rain + ing stay raining?',['It has two vowels, so it fails the Three Ones','The ending -ing is different here','rain is a noun'],0,'The ai already gives the long sound, so no fence is needed. One of the Three Ones fails, so nothing doubles.')]},
 guided:joins(`hop+ing=hopping|dbl|The frog is {w} across the road.
plan+ing=planning|dbl|We are {w} a picnic for Saturday.
help+ing=helping|add|She is {w} her mother cook.
swim+ing=swimming|dbl|They are {w} in the pool.
rain+ing=raining|add|It is {w} heavily outside.
stop+ed=stopped|dbl|The bus {w} at the traffic light.`),
 recall:joins(`run+ing=running|dbl|The boys are {w} around the field.
sit+ing=sitting|dbl|The cat is {w} on the window ledge.
shop+ing=shopping|dbl|Mum is {w} at the market.
clap+ed=clapped|dbl|The audience {w} loudly.
drop+ed=dropped|dbl|She {w} her pencil case.
hot+er=hotter|dbl|Today is {w} than yesterday.
thin+er=thinner|dbl|This book is {w} than that one.
hug+ed=hugged|dbl|He {w} his little sister.
jog+ing=jogging|dbl|Grandpa goes {w} every morning.
mop+ed=mopped|dbl|She {w} the floor after dinner.
plan+ed=planned|dbl|We {w} a surprise party.
jump+ing=jumping|add|The kids are {w} on the trampoline.
help+ed=helped|add|He {w} me carry the bag.
fix+ing=fixing|add|Dad is {w} the bicycle.`),
 transfer:joins(`get+ing=getting|dbl|We are {w} off at the next stop.
win+ing=winning|dbl|Our team is {w} the match.
dig+ing=digging|dbl|The children are {w} in the sand.
zip+ed=zipped|dbl|She {w} up her jacket.
sad+er=sadder|dbl|He looked {w} than before.
camp+ing=camping|add|We went {w} at Pulau Ubin.
snow+ing=snowing|add|It is {w} in Japan.
clean+ing=cleaning|add|I am {w} my room.
big+est=biggest|dbl|That is the {w} tree in the park.
swim+er=swimmer|dbl|She is a fast {w}.`),
 hints:it=>{const r=R3[it.rule];return['Run the Three Ones test: one syllable? one vowel? one consonant at the end? And does the ending start with a vowel?',r.n+'. '+r.t,
  it.rule==='dbl'?`Try this: ${it.l} + ${it.l.slice(-1)} + ${it.r}`:`Try this: ${it.l} + ${it.r} (no extra letter)`]},
 diag:(it,a)=>{a=lc(a);const dbl=it.rule==='dbl';
  if(dbl&&a===it.l+it.r)return`You joined the pieces as they are. ${it.l} passes the Three Ones and ${it.r} starts with a vowel, so the last letter doubles: ${it.l} + ${it.l.slice(-1)} + ${it.r}.`;
  if(!dbl&&a===it.l+it.l.slice(-1)+it.r)return`No doubling here. ${it.l} fails the Three Ones (two consonants, two vowels, or it ends in w, x or y), so just add the ending.`;
  if(dbl&&a.startsWith(it.l)&&a.length>it.w.length)return'Too many letters: only the LAST letter of the root doubles, once.';
  return`Check it step by step: root + (double?) + ending. ${R3[it.rule].n}.`},
 match:w=>/([bcdfgklmnprstz])\1/.test(w),
 tag:w=>/([bcdfgklmnprstz])\1/.test(w)?'double letters':null});
// ---- Lesson 4: Suffixes and Spelling Changes (join items; a decision lesson that pulls Lessons 2 and 3 together) ----
const R4={drop:{n:'Drop the silent e',t:'A silent e is dropped before an ending that starts with a vowel (-ing, -ed, -er, -est).'},keepe:{n:'Keep the silent e',t:'A silent e is kept before an ending that starts with a consonant (-ful, -ly, -less, -ness).'},y2i:{n:'Change y to i',t:'After a consonant, y changes to i before an ending (but not before -ing).'},keepy:{n:'Keep the y',t:'The y stays before -ing, and after a vowel (play, enjoy, stay).'},dbl:{n:'Double the last letter',t:'A short word with one vowel and one consonant at the end doubles that letter before a vowel ending (the Three Ones, Lesson 3).'},add:{n:'Just add the ending',t:'Nothing changes. Join the root and the ending.'}};
const G4=joins(`hope+ing=hoping|drop|I am {w} for good weather.
hope+ful=hopeful|keepe|She felt {w} about the test.
happy+er=happier|y2i|He is {w} now that he has a puppy.
carry+ed=carried|y2i|She {w} the heavy bag home.
carry+ing=carrying|keepy|He is {w} a box of books.
bake+ed=baked|drop|Grandma {w} a delicious pie.`),
C4=joins(`make+ing=making|drop|We are {w} a poster for the fair.
use+ed=used|drop|He {w} a ruler to draw the line.
smile+ing=smiling|drop|The baby is {w} at her mother.
bake+er=baker|drop|The {w} gets up very early.
hope+less=hopeless|keepe|Without a map, we felt {w}.
care+ful=careful|keepe|Be {w} when you cross the road.
safe+ly=safely|keepe|The plane landed {w}.
lazy+ness=laziness|y2i|His {w} made him late again.
hurry+ed=hurried|y2i|They {w} to catch the bus.
try+ed=tried|y2i|She {w} the new dish.
funny+er=funnier|y2i|This joke is {w} than the last one.
cry+ing=crying|keepy|The baby is {w} again.
enjoy+ed=enjoyed|keepy|We {w} the show.
play+er=player|keepy|The best {w} scored a goal.`),
T4=joins(`write+ing=writing|drop|She is {w} a letter to her friend.
tiny+est=tiniest|y2i|That was the {w} kitten I have ever seen.
busy+ly=busily|y2i|The ants worked {w} all day.
copy+ed=copied|y2i|He {w} the notes from the board.
worry+ed=worried|y2i|Mum {w} when I was late.
enjoy+ing=enjoying|keepy|We are {w} the sunshine.
move+ing=moving|drop|They are {w} to a new house.
complete+ly=completely|keepe|The room was {w} dark.
excite+ed=excited|drop|The children were {w} about the trip.
run+er=runner|dbl|She is the fastest {w} in the school.`),
P4=new Set([...G4,...C4,...T4].map(x=>x.w));
LIST.push({id:'suffix',no:4,icon:'🔧',name:'The Shape-Shifting Suffix',sub:'happy → happier · carry → carried · hope → hoping',kind:'join',rules:R4,
 goal:'Learn to ask three quick questions about a root word so you know whether to drop the e, change the y, double the letter, or just add the ending.',
 enc:{say:'Each word below is a root plus an ending, but the root changes shape when they meet. Listen, then look at the end of the first word.',pairs:[['hope','hoping'],['hope','hopeful'],['happy','happier'],['carry','carried']]},
 notice:[
  mc('n1','notice','What happens to the y in happy → happier?',['It changes to i','It disappears','It doubles'],0,'After a consonant, the y changes to i: happ + i + er.'),
  mc('n2','notice','Which ending starts with a CONSONANT?',['-ing','-ful','-ed'],1,'-ful starts with f. -ing and -ed both start with a vowel.'),
  mc('n3','notice','In hope → hoping, what happens to the silent e?',['It is dropped','It is kept','It moves to the front'],0,'hop(e) + ing: the e is dropped before an ending that starts with a vowel.'),
  mc('n4','notice','Which word KEEPS its y?',['carried','carrying','happier'],1,'carrying keeps the y. Two i’s side by side (carriing) would look messy.'),
  mc('d1','diag','Leo wrote “hopeing”. What went wrong?',['He kept the silent e before an ending that starts with a vowel','He doubled the p','He forgot the e'],0,'The silent e is dropped before -ing: hoping.'),
  mc('d2','diag','Mia wrote “carryed”. Which rule did she miss?',['After a consonant, y changes to i before -ed','Always double the last letter','Drop the silent e'],0,'carry ends in consonant + y, so the y becomes i before -ed: carried.')],
 strat:{title:'The Ending Detective',
  steps:['Look at the end of the root word, and at the first letter of the ending (vowel or consonant?).','Ask three questions. Does it end in a silent e? Does it end in consonant + y? Is it a Three Ones word (Lesson 3)?','Silent e: drop it before a vowel ending (hoping), keep it before a consonant ending (hopeful). Consonant + y: change y to i (happier), but keep the y before -ing (carrying). Three Ones: double the letter. Otherwise: just add the ending.'],
  ex:'carry + ed<br>Ends in consonant + y → change y to i: carr<b>i</b>ed.<br>carry + ing<br>-ing would give two i’s, so the y stays: carrying.<br><br>hope + ing → hoping (drop the e)<br>hope + ful → hopeful (keep the e)',
  exc:[{t:'Why not “carriing”?',x:'Two i’s side by side look clumsy and are hard to read, so English keeps the y before -ing: carrying, crying, studying.'},
   {t:'Why keep the e in hopeful but drop it in hoping?',x:'The silent e is dropped only to stop two vowels clashing (hope + ing). -ful starts with a consonant, so nothing clashes and the e stays: hopeful, careful, safely.'},
   {t:'Why does play + ed stay played?',x:'A y after a vowel (play, enjoy, stay) is strong, so it stays: played, enjoyed. Only a y after a consonant changes to i.'},
   {t:'A few words drop the e anyway',x:'true → truly, whole → wholly and argue → argument break the keep-the-e idea. Learn them by heart.'}],
  why:[mc('w1','why','Why do we keep the e in hopeful but drop it in hoping?',['-ful starts with a consonant, so there is no vowel clash','-ful is a longer ending','hopeful is a noun'],0,'The e is only dropped to avoid two vowels meeting. With -ful there is no clash.'),
   mc('w2','why','Why is it carrying and not carriing?',['Two i’s together would look messy, so the y stays before -ing','The y changes to e before -ing','carry is a short word'],0,'The y changes to i before most endings, but not before -ing.')]},
 guided:G4,recall:C4,transfer:T4,
 hints:it=>{const r=R4[it.rule],l=it.l,e=it.r,m={drop:`${l.slice(0,-1)} + ${e}`,keepe:`${l} + ${e}`,keepy:`${l} + ${e}`,add:`${l} + ${e}`,y2i:`${l.slice(0,-1)} + i + ${e}`,dbl:`${l} + ${l.slice(-1)} + ${e}`}[it.rule];
  return['Check the root: does it end in a silent e, or in consonant + y, or is it a Three Ones word? And does the ending start with a vowel or a consonant?',r.n+'. '+r.t,'Try this: '+m]},
 diag:(it,a)=>{a=lc(a);const r=R4[it.rule],l=it.l,e=it.r;
  if(a===l+e&&!['keepe','keepy','add'].includes(it.rule))return`You joined the pieces without changing the root. This one needs a rule: ${r.n}. ${r.t}`;
  if(it.rule==='keepy'&&a===l.slice(0,-1)+'i'+e)return'Keep the y here. Two i’s together look messy (carrying, not carriing), and a y after a vowel always stays.';
  if(it.rule==='keepe'&&a===l.slice(0,-1)+e)return'Keep the silent e here. The ending starts with a consonant, so nothing clashes.';
  return`Check it step by step. ${r.n}: ${r.t}`},
 match:w=>P4.has(w)||/(ied|ier|iest|ily|iness)$/.test(w),
 tag:w=>P4.has(w)?'ending change':null});
// ---- Lesson 5: Prefixes, Roots and Word Families (join items built on roots from the word bank: happy, kind, necessary, obey, honest, please, build, play, care, thank, thought, wonder, peace) ----
const R5={un:{n:'The prefix un- (not)',t:'un- means “not”. Join it to the root and keep every letter: un + happy = unhappy. If two n’s meet, write both (unnecessary).'},
 re:{n:'The prefix re- (again)',t:'re- means “again”. Join it to the root without changing a letter: re + build = rebuild.'},
 dis:{n:'The prefix dis- (not, the opposite)',t:'dis- means “not” or “the opposite of”. Keep every letter of the root: dis + appear = disappear.'},
 mis:{n:'The prefix mis- (wrongly)',t:'mis- means “wrongly” or “badly”. Keep every letter of the root: mis + place = misplace. (If the root starts with s, both s’s stay: mis + spell = misspell.)'},
 pre:{n:'The prefix pre- (before)',t:'pre- means “before”: pre + heat = preheat. Keep every letter of the root. Some words with a vowel after pre- take a hyphen (pre-existing); either form is accepted here.'},
 ful:{n:'The ending -ful (full of)',t:'-ful means “full of”. It has only ONE l (the word full loses an l): care + ful = careful.'},
 less:{n:'The ending -less (without)',t:'-less means “without”. Join it to the root: care + less = careless.'}};
const P5=new Set();const J5=t=>{const a=joins(t);a.forEach(x=>P5.add(x.w));return a};
LIST.push({id:'prefix',no:5,icon:'🧱',name:'The Word-Builder’s Charm',sub:'happy → unhappy · place → misplace · heat → preheat',kind:'join',rules:R5,
 goal:'Build long words from small pieces: prefix + ROOT + ending. Learn what the pieces mean and why a root keeps all its letters.',
 enc:{say:'Each word is built from pieces. Listen, then look at the pieces: a prefix at the front, a root in the middle, an ending at the back.',pairs:[['happy','unhappy'],['build','rebuild'],['care','careful'],['care','careless']]},
 notice:[
  mc('n1','notice','What does the prefix un- mean?',['not','again','before'],0,'un- means “not”: unhappy = not happy, unkind = not kind.'),
  mc('n2','notice','Which word means “to build again”?',['rebuild','prebuild','misbuild'],0,'re- means “again”: rebuild = build again.'),
  mc('n3','notice','When un + necessary meet, what happens to the letters?',['Nothing changes, so you see two n’s: unnecessary','One n is dropped','The y changes to i'],0,'A prefix never changes the root. un keeps its n and necessary keeps its n.'),
  mc('n4','notice','In careful, how many l’s does the ending -ful have?',['One','Two','None'],0,'-ful has ONE l. It means “full of”: careful = full of care.'),
  mc('n5','notice','What does the prefix mis- mean?',['wrongly','again','before'],0,'mis- means “wrongly” or “badly”: misplace = put in the wrong place, misread = read wrongly.'),
  mc('n6','notice','Which word means “to heat before using”?',['preheat','reheat','misheat'],0,'pre- means “before”: preheat the oven before you bake.'),
  mc('d1','diag','Mei wrote “carefull”. What went wrong?',['She wrote -full, but the ending is -ful with one l','She forgot the silent e','She doubled the r'],0,'The ending is -ful, with one l. The word full loses an l when it becomes an ending.'),
  mc('d2','diag','Raj wrote “unecessary”. What went wrong?',['He dropped one n: un- and necessary both keep their n','He added an extra c','He forgot the y'],0,'un + necessary keeps both n’s: un-nec-ess-ary.')],
 strat:{title:'The Word-Builder’s Charm',
  steps:['Split the word into pieces: PREFIX (the front) + ROOT + ENDING (the back).','Learn what each piece means: un- = not · dis- = not, the opposite · re- = again · mis- = wrongly · pre- = before · -ful = full of · -less = without.','Join the pieces WITHOUT changing a letter. If two of the same letters meet, write both (un + necessary = unnecessary).'],
  ex:'unnecessary = <b>un</b> (not) + <b>necessary</b><br>The n of un and the n of necessary both stay: un<b>n</b>ecessary.<br><br>careful = <b>care</b> + <b>ful</b> (full of care). The ending has ONE l.',
  exc:[{t:'Why is -ful spelled with one l?',x:'The word full lost an l when it became an ending, so it is careful, not carefull. In carefully, -ful + -ly brings two l’s back together: careful-ly.'},
   {t:'Why does the root never change?',x:'A prefix is a separate piece sitting in front of the root. Because the root keeps all its letters, a family such as help, helpful, helpless, helping and helper is easy to spell once you know the root.'},
   {t:'What about mis- and pre-?',x:'They work the same way: mis + place = misplace and pre + heat = preheat. When the same letters meet, keep both: mis + spell = misspell.'},
   {t:'Why is predict made of pre + dict?',x:'Some roots are not words on their own. dict comes from a Latin word meaning “to say”, so predict means “say before”. In precede, cede means “to go”. Learn these roots as pieces.'},
   {t:'Why does pre-existing have a hyphen?',x:'A hyphen can keep two vowels apart so the word is easy to read. You will see pre-existing and preexisting, and prepay and pre-pay. Either form is accepted in this lesson.'}],
  why:[mc('w1','why','Why is unnecessary spelled with two n’s?',['un- and necessary each keep their n','nn is the rule for all long words','Because the e is silent'],0,'Nothing is dropped when a prefix joins a root.'),
   mc('w2','why','Why is it careful and not carefull?',['-ful is the ending form of full and has one l','care is a short word','-ful starts with a vowel'],0,'The ending has only one l.')]},
 guided:J5(`un+happy=unhappy|un|He was {w} when his team lost.
dis+appear=disappear|dis|The magician made the coin {w}.
re+build=rebuild|re|They will {w} the bridge after the storm.
care+ful=careful|ful|Be {w} when you cross the road.
mis+place=misplace|mis|I always {w} my keys.|(verb) To put something in the wrong place and lose it temporarily.
mis+lead=mislead|mis|A faded sign can {w} drivers.|(verb) To cause someone to believe something that is not true.
pre+heat=preheat|pre|Please {w} the oven before baking.|(verb) To heat an appliance (like an oven) before using it.
pre+view=preview|pre|We watched a {w} of the new film.|(noun/verb) An inspection or viewing of something before it is officially available or public.`),
 recall:J5(`un+necessary=unnecessary|un|It is {w} to bring a big umbrella today.
un+kind=unkind|un|It is {w} to laugh at someone who falls.
care+less=careless|less|A {w} mistake cost him a mark.
dis+obey=disobey|dis|Soldiers must never {w} an order.
dis+honest=dishonest|dis|It is {w} to copy someone else’s answers.
dis+please=displease|dis|He did not want to {w} his teacher.
re+play=replay|re|Let us {w} the match to see the goal again.
wonder+ful=wonderful|ful|We had a {w} time at the zoo.
peace+ful=peaceful|ful|The park is quiet and {w}.
thank+ful=thankful|ful|I am {w} for your help.
thought+ful=thoughtful|ful|It was {w} of you to bring me a drink.
thought+less=thoughtless|less|That was a {w} thing to say.
thank+less=thankless|less|Cleaning up after the party was a {w} job.
dis+cover=discover|dis|Scientists {w} new animals in the forest.
re+appear=reappear|re|The sun will {w} after the rain.
un+happily=unhappily|un|She {w} handed over her toy.
mis+behave=misbehave|mis|The teacher warned the class not to {w} on the trip.|(verb) To conduct oneself improperly or badly.
mis+pronounce=mispronounce|mis|Many people {w} that long word.|(verb) To pronounce a word incorrectly.
mis+read=misread|mis|It is easy to {w} the time on that clock.|(verb) To read or interpret something incorrectly.
mis+understand=misunderstand|mis|I hope you did not {w} my instructions.|(verb) To fail to interpret or understand something correctly.
mis+calculate=miscalculate|mis|If you {w} the cost, you may not have enough money.|(verb) To calculate incorrectly; to misjudge a situation.
pre+arrange=prearrange|pre|We will {w} a time to meet.|(verb) To arrange or organize something in advance.
pre+dict=predict|pre|Can you {w} who will win the match?|(verb) To estimate or state that an event will happen in the future.
pre+cede=precede|pre|A short speech will {w} the main performance.|(verb) To come before something in time, order, or position.
pre+school=preschool|pre|My little sister goes to {w}.|(noun) A school for children below the age of compulsory education.
pre+fix=prefix|pre|Add a {w} to the front of the word.|(noun) A word, letter, or number placed before another (such as “mis-” and “pre-”).`),
 transfer:J5(`re+built=rebuilt|re|The village was {w} after the flood.
re+played=replayed|re|The referee {w} the video of the goal.
dis+appeared=disappeared|dis|My pencil case {w} from my desk.
dis+obeyed=disobeyed|dis|The puppy {w} and ran off.
un+kindly=unkindly|un|He spoke {w} to his little brother.
un+necessarily=unnecessarily|un|She worried {w} about the quiz.
dis+pleased=displeased|dis|Mum was {w} with the mess.
dis+honestly=dishonestly|dis|He behaved {w} during the game.
re+building=rebuilding|re|The workers are {w} the old school hall.
peace+fully=peacefully|ful|The baby slept {w} all night.
mis+conception=misconception|mis|It is a common {w} that bats are blind.|(noun) A view or opinion that is incorrect because it is based on faulty thinking or understanding.
mis+direct=misdirect|mis|A wrong sign may {w} the visitors.|(verb) To send or direct someone or something to the wrong place or in the wrong direction.
mis+fire=misfire|mis|The old engine began to {w}.|(verb/noun) To fail to discharge, ignite, or go off correctly.
mis+guide=misguide|mis|Do not {w} your friends with wrong advice.|(verb) To lead someone in the wrong direction or give mistaken advice.
mis+interpret=misinterpret|mis|Please do not {w} my words.|(verb) To understand something incorrectly.
pre+cautions=precautions|pre|Take {w} before you swim in the sea.|(noun) Measures taken in advance to prevent something dangerous, unpleasant, or inconvenient from happening.
pre+existing=pre-existing|pre|The cracks in the wall were {w}, so the storm did not cause them.|(adjective) Existing before something else, especially before the present situation.
pre+judging=prejudging|pre|Stop {w} her before you have even met her.|(verb/noun) Forming an opinion about someone or something beforehand without adequate evidence.
pre+pay=pre-pay|pre|You can {w} for your lunch online.|(verb) To pay for something before it is received or used.
pre+requisite=pre-requisite|pre|A swimming badge is a {w} for the diving course.|(noun/adjective) A thing that is required as a prior condition before something else can happen.`),
 hints:it=>{const r=R5[it.rule],dbl=it.l.slice(-1)===it.r[0];return[it.def?'Think about the meaning: '+it.def+' Which piece is the prefix, and what does it mean?':'Split the word into pieces. What does the prefix or the ending mean?',r.n+'. '+r.t,`Try this: ${it.l} + ${it.r}${dbl?` (the pieces meet at a double ${it.r[0]}: keep both)`:''}`]},
 diag:(it,a)=>{a=lc(a);const w=it.w;
  if(w.endsWith('ful')&&a.endsWith('full'))return'The ending -ful has only ONE l (the word full loses an l when it becomes an ending).';
  if(it.l.slice(-1)===it.r[0]&&a.length===w.length-1)return`Both letters stay when the pieces meet: ${it.l} + ${it.r} gives a double ${it.r[0]}.`;
  if(a.length<w.length)return`A letter is missing. Join the pieces without changing any letter: ${it.l} + ${it.r}.`;
  return`Check the pieces: ${it.l} + ${it.r}. ${R5[it.rule].n}.`},
 match:w=>P5.has(w),tag:w=>P5.has(w)?'prefix & endings':null});
// ---- Lesson 6: Syllables and Longer Words ----
// item = word|sentence|chunks (hyphens between syllables)|tip.  Chunks are checked against the word at build time, and the bank's own sentences are used.
const SYL=(h,w)=>{const m=/^([A-Za-z]+(?:-[A-Za-z]+)+)(?=[^A-Za-z-]|$)/.exec(String(h||'').trim());return m&&m[1].replace(/-/g,'').toLowerCase()===lc(w)?m[1].toLowerCase():''}; // a trusted split taken from a bank clue such as im-me-di-ate-ly
const vcount=w=>{w=lc(w).replace(/[^a-z]/g,'');if(w.length<=3)return 1;w=w.replace(/(?:[^aeiouy]es|[^aeiouytd]ed|[^aeiouyl]e)$/,m=>m[0]);const g=w.match(/[aeiouy]+/g);return g?g.length:1}; // rough count of vowel groups; used only to pick words, never shown as a fact
const words6=t=>t.trim().split('\n').map(l=>{const[w,s,sy,hook]=l.split('|');return{w:w.trim(),s:s.trim(),sy,tr:'',hook:hook||''}});
const P6=new Set();
const W6=t=>{const a=words6(t);a.forEach(x=>P6.add(x.w));return a};
const FIRST6=sy=>sy.split('-')[0];
LIST.push({id:'chunks',no:6,icon:'✂️',name:'The Chunking Charm',sub:'won · der · ful · beat by beat',kind:'word',
 goal:'Learn to cut a long word into beats (syllables), spell one small chunk at a time, and join them up again.',
 hl:'Chunk it',
 enc:{say:'Clap the beats as you say each word. Every clap is one chunk, and every chunk has a vowel sound. Long words are just short chunks joined together.',items:[{w:'cat',sy:'cat',hook:'1 beat: cat'},{w:'happy',sy:'hap-py',hook:'2 beats: hap · py'},{w:'wonderful',sy:'won-der-ful',hook:'3 beats: won · der · ful'},{w:'vegetable',sy:'veg-e-ta-ble',hook:'4 beats: veg · e · ta · ble'}]},
 notice:[
  mc('n1','notice','Clap “banana”. How many beats (syllables) does it have?',['2','3','4'],1,'ba · na · na has three beats. Each beat is one chunk.'),
  mc('n2','notice','What does every syllable have at least one of?',['A vowel sound','A capital letter','A double letter'],0,'Every beat has a vowel sound. That is why you can count beats by counting vowel sounds.'),
  mc('n3','notice','Which is the best way to chunk “umbrella”?',['um · brel · la','u · mbr · ell · a','umb · re · lla'],0,'um · brel · la: three beats, and each chunk is easy to say and spell.'),
  mc('n4','notice','Which word has FOUR beats?',['banana','elephant','caterpillar'],2,'cat · er · pil · lar has four beats. banana and elephant have three.'),
  mc('d1','diag','Raj wrote “yestaday” for “yesterday”. Which chunk went wrong?',['The middle chunk: it is “ter”, not “ta”','The first chunk “yes”','The last chunk “day”'],0,'The middle beat sounds like “ta”, but it is spelled ter. Say it as written: yes · TER · day.')],
 strat:{title:'The Chunking Charm',
  steps:['Say the word slowly and clap each beat. One clap = one chunk.','Write the chunks with dots between them: won · der · ful.','Spell one chunk at a time, saying it as it is written. Then join the chunks and read the whole word back.'],
  ex:'chocolate → choc · o · late<br>choc: c-h-o-c. o: just o. late: l-a-t-e.<br>Spell each chunk, then join: choc + o + late.',
  exc:[{t:'Why do some chunks sound like “uh”?',x:'In long words the beats that are not stressed shrink to a lazy “uh” sound (hos-pi-tal sounds like “hos-pi-tl”). The sound cannot tell you the letter. So say the chunk as it is written, on purpose: hos · pi · TAL.'},
   {t:'What happens to double letters?',x:'A double letter is usually split across two chunks, one on each side of the break: dif · fer · ent, ex · cel · lent. When you chunk, you see both letters instead of losing one.'},
   {t:'Why do I clap three beats but write four chunks?',x:'We often squash a beat when we talk: veg-e-ta-ble sounds like “vej-ta-bl”. For spelling, say it the slow way as written, with every chunk.'}],
  why:[mc('w1','why','Why is it helpful to chunk a long word?',['Each small chunk is easier to spell than the whole word','Every word has exactly three chunks','Chunks are always spelled just as they sound'],0,'A long word is a few short chunks. Spell them one by one and the long word stops feeling long.'),
   mc('w2','why','What is a syllable (a beat)?',['A chunk of a word with one vowel sound','A single letter','Any two letters together'],0,'A syllable is one beat. Each has one vowel sound, even if the vowel sound is spelled with several letters.')]},
 guided:W6(`wonderful|We had a {w} time.|won-der-ful|won · der · ful. The middle chunk is “der”. ful has only one l.
umbrella|Take an {w} in case it rains.|um-brel-la|um · brel · la. The b sits in the middle chunk: um-BREL-la. Say it as written.
yesterday|I swam {w}.|yes-ter-day|yes · ter · day. The middle chunk sounds like “ta”, but it is spelled “ter”.
elephant|An {w} has a long trunk.|el-e-phant|el · e · phant. The ph says f. Three beats, three chunks.
vegetable|Eat a {w} every day.|veg-e-ta-ble|veg · e · ta · ble. You say three beats, but write four chunks. Say it slowly as written.
chocolate|I love hot {w}.|choc-o-late|choc · o · late. The middle o is easy to forget. Say it as written: choc-o-late.`),
 recall:W6(`adventure|They went on a jungle {w}.|ad-ven-ture|ad · ven · ture. The last chunk is “ture”, said “cher”.
different|The twins are {w}.|dif-fer-ent|dif · fer · ent. The double f is split across two chunks: dif · fer.
hospital|The nurse works in a {w}.|hos-pi-tal|hos · pi · tal. The last chunk sounds like “tl”, but it is spelled “tal”.
important|It is {w} to drink water.|im-por-tant|im · por · tant. The last chunk is “tant”, spelled with a.
delicious|The cake tastes {w}.|de-li-cious|de · li · cious. The last chunk “cious” says “shus”.
enormous|The elephant is {w}.|e-nor-mous|e · nor · mous. Norm hides in the middle: e-NORM-ous.
mosquito|A {w} bit my arm.|mos-qui-to|mos · qui · to. q is always followed by u: mos-QUI-to.
temperature|The {w} today is 33 degrees.|tem-per-a-ture|tem · per · a · ture. Four chunks. The third chunk is a single letter, a.
interesting|The story was very {w}.|in-ter-est-ing|in · ter · est · ing. Four chunks: in, ter, est, ing.
festival|The lantern {w} is in autumn.|fes-ti-val|fes · ti · val. Chunk it: fes, ti, val.
restaurant|We ate dinner at a {w}.|res-tau-rant|res · tau · rant. The middle chunk “tau” sounds like “tor”.
generous|He is {w} and shares his food.|gen-er-ous|gen · er · ous. Chunk it: gen, er, ous.
calendar|Circle the date of the test on the {w}.|cal-en-dar|cal · en · dar. The last chunk is “dar”, not “der”.
dictionary|Look up the meaning in the {w}.|dic-tion-ar-y|dic · tion · ar · y. Four chunks. The last two are “ar” and “y”.`),
 transfer:W6(`remember|Please {w} your homework.|re-mem-ber|re · mem · ber. The double-letter look is a trick: re · mem · ber.
excellent|You did an {w} job.|ex-cel-lent|ex · cel · lent. The double l is split across two chunks: cel · lent.
envelope|Put the letter in an {w}.|en-ve-lope|en · ve · lope. Chunk it: en, ve, lope.
familiar|The song sounds {w}.|fa-mil-iar|fa · mil · iar. The last chunk “iar” is easy to miss.
ambulance|An {w} rushed to the scene.|am-bu-lance|am · bu · lance. Chunk it: am, bu, lance.
hesitate|Do not {w} to ask for help.|hes-i-tate|hes · i · tate. The little middle chunk is a single i.
community|Our {w} helps one another.|com-mu-ni-ty|com · mu · ni · ty. The double m is split across two chunks: com · mu.
beginning|It is the {w} of the story.|be-gin-ning|be · gin · ning. The n doubles at the chunk border: gin · ning.
mysterious|The old house looks {w}.|mys-te-ri-ous|mys · te · ri · ous. Four chunks: mys, te, ri, ous.
opportunity|This is a great {w}.|op-por-tu-ni-ty|op · por · tu · ni · ty. Five chunks, with two double letters.`),
 bank:true,
 explain:[mc('x1','why','Which tip helps with the lazy “uh” sound in the middle of a long word?',['Say the chunk as it is written, on purpose (Wed · nes · day)','Leave that chunk out','Pick any vowel'],0,'Saying the chunk as it is written, even if it sounds silly, shows you the real letters.'),
  mc('x2','why','What do you do with a double letter in the middle of a long word?',['Split it: one letter ends a chunk and one starts the next','Write it once','Move it to the end'],0,'Chunk it as dif · fer · ent and you can see both f’s.')],
 hints:it=>{const c=(it.sy||'').split('-').filter(Boolean),n=c.length;return[
  n?`Clap the word as you say it. How many beats can you hear? This word has ${n} chunks.`:'Clap the word as you say it and count the beats.',
  n?`The first chunk is “${c[0]}”. Spell that chunk, then listen for the next one.`:`It starts with “${it.w.slice(0,2)}”.`,
  n?`All the chunks: ${c.join(' · ')}. Spell them one at a time, then join them.`:`It has ${it.w.length} letters.`]},
 diag:(it,a)=>{a=lc(a);const c=(it.sy||'').split('-').filter(Boolean);if(!c.length)return'Clap the beats, then spell one chunk at a time.';
  let p=0;for(const k of c){if(a.slice(p,p+k.length)===k)p+=k.length;else return`Check the chunk “${k}”. You wrote “${a.slice(p,p+k.length)||'…'}” there. Say it as it is written: ${k}.`}
  return p>=a.length?'Almost. Clap the beats again: is a chunk missing at the end?':'Your chunks match, but there are extra letters at the end. Stop after the last chunk.'},
 accept:x=>{const s=SYL(x.h,x.w);return !!s&&s.split('-').length>=3}, // extra words from the class bank only if their own clue gives a trusted split
 mk:x=>({sy:SYL(x.h,x.w),hook:(SYL(x.h,x.w)||'').split('-').join(' · ')}),
 match:w=>w.length>=7&&vcount(w)>=3,tag:w=>P6.has(w)?'chunk it':w.length>=7&&vcount(w)>=3?'long word':null});
// ---- Lesson 7: Easily Confused Words (twin words built around words already in the bank, plus their inflections) ----
// item = word|sentence|its twin|memory hook. The sentence decides: the pupil hears the word but must choose the spelling by meaning.
const P7=new Set();
const W7=(t)=>{const a=words(t);a.forEach(x=>P7.add(x.w));return a};
LIST.push({id:'confused',no:7,icon:'🔀',name:'The Twin-Word Test',sub:'their / there · quiet / quite · weather / whether',kind:'word',
 goal:'Some words sound alike or look alike but mean different things. Learn to ask what a word MEANS, and use a hook that belongs to only one twin.',
 enc:{say:'Each pair sounds the same or almost the same, but the spellings and meanings are different. Listen, and think about what each one means.',sep:'vs',pairs:[['there','their'],['quiet','quite'],['weather','whether'],['sea','see']]},
 notice:[
  mc('n1','notice','Which word means “belonging to them”?',['their','there'],0,'their = belonging to them. there = a place (it has “here” hiding inside).'),
  mc('n2','notice','Which word is about a PLACE?',['where','wear','were'],0,'where, there and here all tell you about a place, and all end in “here”.'),
  mc('n3','notice','Which word means “with no noise”?',['quiet','quite'],0,'quiet = no noise. quite = fairly or very (quite tall).'),
  mc('n4','notice','You put on a hat or a coat. Which word do you need?',['wear','where','were'],0,'wear is what you do with clothes. Think: you wear earrings (ear in wear).'),
  mc('d1','diag','Ana wrote “I did not know weather to go.” What went wrong?',['She used weather (the sky) when she needed whether (a choice)','She forgot the silent k','She used the wrong tense'],0,'whether introduces a choice: whether to go or stay. weather is about rain and sun.'),
  mc('d2','diag','Ben wrote “Let us sit over their.” What went wrong?',['He used their (belonging to them) when he meant there (a place)','He spelled it with two e’s','Nothing is wrong'],0,'He means a place, so the word is there (it has here hiding inside).')],
 strat:{title:'The Twin-Word Test',
  steps:['Spot a twin. Some words sound the same or look almost the same but mean different things, so the sound alone cannot help you.','Ask: what does this word MEAN in my sentence? A place? Belonging to someone? How loud? The sky? Having two eyes?','Use a hook that is true for only ONE twin: there, here and where are all places (they share “here”); see has two e’s like two eyes; sea has “ea” like beach.'],
  ex:'I left my bag over ___.<br>Meaning: a place → <b>there</b> (it has <b>here</b> inside).<br>It is ___ bag. Meaning: it belongs to them → <b>their</b>.',
  exc:[{t:'Why do twin words exist at all?',x:'English kept old spellings while the way we say words changed. When two words started to sound alike, the different spellings stayed, so the spelling now helps readers tell the meanings apart.'},
   {t:'Why is it son but sun?',x:'son has the same old-handwriting o as come, some and done (Lesson 2). sun is the star in the sky and has a plain u.'},
   {t:'Why does witch have a t, but which does not?',x:'tch comes after a short vowel (catch, watch, witch). which belongs to the question words that start with wh: what, when, where, which.'}],
  why:[mc('w1','why','What is the best way to choose between twin words?',['Ask what the word means in the sentence','Pick the one that looks nicer','Spell it the way it sounds'],0,'Meaning is the only thing that can separate twins that sound the same.'),
   mc('w2','why','Why does sound not help you choose between their and there?',['They sound exactly the same, so only meaning can decide','One of them is silent','They are the same word'],0,'Because they sound the same, you need a meaning hook, such as “there has here inside”.')]},
 guided:W7(`there|Please put your bag over {w}, next to the door.|their|there has “here” inside: it points to a place.
quiet|Please be {w} in the library.|quite|quiet has “iet” like “diet”: it is about noise, not amount.
weather|The {w} is hot and sunny today.|whether|weather has “eat” inside: we eat ice cream in hot weather.
wear|I {w} a jacket when it is cold.|where|You wear earrings: there is an “ear” in wear.
sea|We swam in the warm {w}.|see|sea has “ea” like beach: it is the water.
no|{w}, thank you, I have had enough.|know|no is the opposite of yes: just two letters.`),
 recall:W7(`their|The children packed {w} bags for camp.|there|their has “heir”: an heir owns things, so their is about belonging.
quite|The soup is {w} hot, so be careful.|quiet|quite ends in “ite” like “polite”: it tells you how much.
whether|I cannot decide {w} to go or stay.|weather|whether starts with “wh” like which and what: it asks about a choice.
where|{w} did you put my pencil case?|wear|where, there and here are all places: they end in “here”.
were|The boys {w} playing football.|where|were is the past of are: we were, they were.
know|I {w} the answer to that question.|no|know has a silent k, like knowledge. It is about knowing.
knew|She {w} the answer already.|new|knew is the past of know, so it keeps the silent k.
see|I can {w} a bird in the tree.|sea|see has two e’s, like two eyes.
sun|The {w} rises in the east.|son|sun is the star in the sky: s-u-n.
son|Their {w} is learning to swim.|sun|son has the old-handwriting o, like come and some.
which|{w} bag is yours, the red one or the blue one?|witch|which starts with wh like what, when and where: it asks a question.
witch|The {w} in the story stirred her pot.|which|witch has “tch” like catch and watch: a witch can catch you.
quietly|She tiptoed {w} into the room.||quiet + ly: the twin quite has no ly partner.
wearing|He is {w} his school uniform.||wear + ing: you wear earrings.`),
 transfer:W7(`new|I bought a {w} bag for school.|knew|new is the opposite of old: n-e-w.
quieter|The library is {w} than the canteen.||quiet + er: the e of quiet stays.
knowing|She smiled, {w} she had the right answer.||know + ing: it keeps the silent k.
seeing|I am {w} my cousins on Saturday.||see + ing: two e’s like two eyes, then ing.
witches|The three {w} in the play wore black hats.||witch + es: the tch stays, then es.
sons|Both of his {w} play the violin.||son + s: the old-handwriting o stays.
suns|Astronomers study other {w} very far away.||sun + s: a plain u.
seen|Have you {w} my umbrella?||see, saw, seen: two e’s like two eyes.
known|She is {w} for her kindness.||know, knew, known: the silent k stays.
theirs|The blue bag is mine, and the red one is {w}.||their + s: it is about belonging, so it starts with “their”.`),
 explain:[mc('x1','why','Which question helps you choose between twin words?',['What does it mean in my sentence?','Which one looks nicer?','Which one is shorter?'],0,'Meaning separates twins that sound alike.'),
  mc('x2','why','Which hook works for sea and see?',['see has two e’s, like two eyes','sea is short for seashell','They are the same word'],0,'A hook that belongs to only one twin is the best kind.')],
 hints:it=>['The word sounds like another word. Ask what it MEANS in this sentence.',it.hook||'Think of a hook that belongs to only this word.',`It has ${it.w.length} letters and starts with “${it.w[0]}”: ${it.w[0]}${'_'.repeat(it.w.length-1)}`],
 diag:(it,a)=>{a=lc(a);const h=it.hook?' Hook: '+it.hook:'';
  if(it.tr&&a===it.tr)return`“${a}” is a real word, but it is the twin: it means something different here.${h}`;
  if(it.tr&&a.length>0&&P7.has(a))return`“${a}” is another word with a different meaning.${h}`;
  return`Check each letter against the hook.${h}`},
 match:w=>P7.has(w),tag:w=>P7.has(w)?'twin word':null});
// ---- Lesson 8: Tricky and Irregular Words (word items: word|sentence|tricky part|memory hook) ----
const G8=words(`because|I stayed at home {w} it was raining.|au|Big Elephants Can Always Understand Small Elephants.
answer|Can you {w} the question?|w|A silent w hides in the middle: ans-W-er.
enough|We have {w} food for everyone.|ough|“ough” says “uff” here, like rough and tough: en-OUGH.
could|She {w} not find her bag.|ould|Oh U Lucky Duck: c-OULD.
sugar|Please do not add {w} to my tea.|ar|It sounds like “shugger” but ends in -ar: sug-AR.
said|Mum {w} we could go to the beach.|ai|Sally Ann Is Dancing: S-A-I-D.`),
C8=words(`necessary|It is {w} to wear a helmet.|ss|One collar, two sleeves: ne-c-e-ss-ary.
separate|Please {w} the red pencils from the blue ones.|a|There is “a rat” in sep-a-rat-e.
february|My birthday is in {w}.|ru|Say it in full: Feb-RU-ary. There is an r before the u.
library|We borrow books from the {w}.|br|li-BRAR-y: the r after the b is easy to forget.
knowledge|Reading gives you {w}.|kn|Silent k: know + ledge.
business|My aunt runs a small {w}.|i|busy + ness: the y changes to i.
favourite|Blue is my {w} colour.|our|fav-OUR-ite: “our” like colour and neighbour (British spelling).
different|Cats and dogs are {w}.|ffer|diff-er-ent: say all three chunks, with ff and er.
beautiful|The garden looks {w}.|eau|beau + ti + ful: “beau” is French for beautiful.
believe|I {w} you.|ie|Never believe a lie: “lie” is inside.
neighbour|Our {w} has a friendly dog.|eigh|neigh (like a horse) + bour.
receive|I hope to {w} a letter soon.|ei|i before e, except after c: rec-ei-ve.
height|The {w} of the tower is fifty metres.|eigh|Height has the same eigh as weight.
whole|I ate the {w} cake.|wh|A whole has a hole in the middle: w-hole.`),
T8=words(`government|The {w} makes laws for the country.|n|govern + ment: say the n.
language|Malay is a {w} spoken in Singapore.|gu|lan-GU-age: the gu is like in guard.
calendar|Check the {w} for the date.|end|cal-END-ar: the word end is hiding inside.
exercise|We do {w} in PE lessons.|cise|ex-er-CISE: ends in -cise, not -cize.
embarrass|He did not want to {w} his friend.|rr|Two r’s and two s’s: em-bar-rass.
guarantee|The shop will {w} the repair.|gu|gu + ar + an + tee: the gu is like in guard.
vegetable|Carrots are a {w}.|eta|veg-e-ta-ble: say the e in the middle.
interesting|That is an {w} story.|ter|in-ter-est-ing: interest + ing. Say all four chunks.
definitely|I will {w} be there on time.|ite|de-fi-nite-ly: “finite” is inside, not “finate”.
restaurant|We ate at a {w} near the station.|aur|rest + au + rant: you rest at a restaurant.`),
P8=new Set([...G8,...C8,...T8].map(x=>x.w));
LIST.push({id:'tricky',no:8,icon:'🧩',name:'Wild Words',sub:'said · island · necessary · Wednesday',kind:'word',
 goal:'Some words cannot be explained by a neat pattern. Learn to find the tricky bit, pin a memory hook to it, and check your own spelling.',
 enc:{say:'These four words do not spell the way they sound. Listen, then look at the highlighted tricky bit and the hook that goes with it.',items:[{w:'wednesday',tr:'d',hook:'Say it funny, the way it is written: Wed-nes-day.'},{w:'island',tr:'s',hook:'An island is land in water: is-LAND. The s is silent.'},{w:'friend',tr:'ie',hook:'A friend is there at the end: fri-END.'},{w:'people',tr:'eo',hook:'Say it funny: pee-oh-pull. The tricky bit is eo.'}]},
 notice:[
  mc('n1','notice','Which part of island is the tricky bit?',['the silent s','the double l','the final d'],0,'The s is not said at all. That is the bit to give a hook: is-LAND.'),
  mc('n2','notice','Which word does NOT sound the way it is spelled?',['cat','Wednesday','jump'],1,'Wednesday: we say “Wenz-day” but write a d. Saying it as Wed-nes-day helps your memory.'),
  mc('n3','notice','Which hook helps you spell friend?',['A friend is there at the end: fri-END','Friends are fun','fri + yend'],0,'A good hook is tied to the tricky bit. This one reminds you that friend ends with end.'),
  mc('n4','notice','Many people leave one letter out of February. Which one?',['The r before the u','The b','The y'],0,'Say it in full: Feb-RU-ary.'),
  mc('d1','diag','Dev wrote “wensday”. What did he miss?',['The d: say it as it is written, Wed-nes-day','The y at the end','A double s'],0,'The tricky bit is the d. Saying Wed-nes-day, just for spelling, puts it back.')],
 strat:{title:'Wild Words: find the tricky bit',
  steps:['Say the word slowly, the way it is written. Which part does NOT spell the way it sounds? That is the tricky bit.','Make a hook for the tricky bit: say it funny (Wed-nes-day), find a smaller word hiding inside (cal-END-ar), use its meaning or history, or make a short sentence.','Look, Say, Cover, Write, Check. Look at the word and its hook, say it in chunks, cover it, write it from memory, then check it against the real word.'],
  ex:'wednesday<br>The tricky bit is the <b>d</b>. Say it funny: <b>Wed-nes-day</b>.<br>Now cover it, write it, and check it.',
  exc:[{t:'Why does island have an s?',x:'It comes from an old word, igland, meaning land in water. In the 1500s some writers added an s because they wrongly thought it came from the Latin word for island, insula. The s was never said.'},
   {t:'Why does Wednesday have a d?',x:'It was once said out loud. The word means Woden’s day, after an old god. We stopped saying the d, but the spelling kept it.'},
   {t:'Why does knowledge have a k?',x:'The k comes from know, and long ago it was said. Words in the same family keep the same tricky letters, so know helps you spell knowledge.'},
   {t:'Why is business spelled with an i?',x:'It is busy + ness, with the y changed to i (Lesson 4). Your tongue may skip a sound, but the spelling remembers the whole word family.'},
   {t:'Words with no neat reason',x:'Some words (said, could, people) have no tidy explanation. For these, the hook does all the work: find the tricky bit and pin a memory to it.'}],
  why:[mc('w1','why','Why does island have an s that we do not say?',['It was added in the 1500s by mistake','Because it is a long word','To show that it is a place'],0,'The s crept in from a wrong guess about where the word came from. Knowing that makes it memorable.'),
   mc('w2','why','Why is a hook better than copying a word again and again?',['It pins the tricky part to something you can say or picture','It makes the word shorter','It changes the spelling to match the sound'],0,'Memory sticks to meaning, pictures and sounds. Copying with no thinking does not.')]},
 guided:G8,recall:C8,transfer:T8,
 explain:[mc('x1','why','Which of these is a good memory hook for a tricky word?',['Find a smaller word hiding inside, like END in calendar','Copy it five times without thinking','Guess the spelling from the sound'],0,'A hook gives the tricky bit a reason to stay in your head.'),
  mc('x2','why','What does Look, Say, Cover, Write, Check help you do?',['Check your own spelling against the real word and fix it yourself','Spell the word without ever seeing it','Hear the word spelled out'],0,'The check at the end is the key step. It turns a mistake into learning.'),
  mc('x3','why','What is the tricky bit in necessary?',['One c and two s’s (one collar, two sleeves)','The letter n','The ending -y'],0,'The double s and single c are what people mix up.')],
 hints:it=>{const t=it.tr,w=it.w;return[it.hook||'Look for the tricky bit in this word and make a hook for it.',t&&w.includes(t)?`The tricky bit is “${t}”. Say the word in chunks and find it.`:'Say the word in chunks and check each one.',t&&w.includes(t)?`Here is its shape: ${w.replace(t,'_'.repeat(t.length))}. The tricky bit is missing.`:`It starts with “${w.slice(0,Math.ceil(w.length/2))}…”`]},
 diag:(it,a)=>{a=lc(a);const t=it.tr,h=it.hook?' Hook: '+it.hook:'';
  if(t&&!a.includes(t))return`You are close, but the tricky bit is “${t}”.${h}`;
  if(a.length<it.w.length)return`A letter is missing. Say the word in chunks and check each chunk.${h}`;
  if(a.length>it.w.length)return`There is an extra letter. Say the word in chunks and check each chunk.${h}`;
  return`Check each chunk against the word.${h}`},
 match:w=>P8.has(w),
 tag:w=>P8.has(w)?'tricky word':null});
// ---- Lesson 9: Morphology and Meaning (words from the bank, their relatives and inflections; item = word|sentence|hidden letters|the relative that shows them) ----
const P9=new Set();const W9=t=>{const a=words(t);a.forEach(x=>P9.add(x.w));return a};
LIST.push({id:'family',no:9,icon:'🌳',name:'The Family-Tree Charm',sub:'sign → signal · magic → magician · decide → decision',kind:'word',
 goal:'Words in a family share a root, and the family keeps the root’s letters even when the sound changes. Use a relative you can HEAR to find the letters you cannot.',
 enc:{say:'These words are relatives. Listen to each pair. Which letters can you hear in one word but not in the other?',sep:'→',pairs:[['sign','signal'],['column','columnist'],['magic','magician'],['decide','decision']]},
 notice:[
  mc('n1','notice','Which word is a relative of sign?',['signal','single','silent'],0,'sign and signal share the root sign. In signal you can hear the g.'),
  mc('n2','notice','In sign you cannot hear the g. Where CAN you hear it?',['signal','signed','sign'],0,'signal. The relative shows the letter that is hiding in sign.'),
  mc('n3','notice','Which word belongs to the family of magic?',['magician','magnet','mattress'],0,'magic + ian = magician. The root magic keeps its c.'),
  mc('n4','notice','Which letter can you hear in columnist but not in column?',['n','m','u'],0,'columnist has an n you can hear, so column has a silent n at the end.'),
  mc('d1','diag','Tara wrote “dicision” for decision. How can the relative decide help her?',['decide shows the first part is de-c: decision','It shows the word has a silent k','It shows the word ends in -tion'],0,'decide begins de-c-, and decision keeps that root: de-c-i-sion.')],
 strat:{title:'The Family-Tree Charm',
  steps:['Ask: does this word have a relative? A shorter word, or the same root with a different ending.','Say the relative. A letter that is silent or blurred in one word is often clear in its relative (sign → signal, column → columnist).','Keep the root’s letters. The ending can change how the word sounds (magic → magician, decide → decision), but the root stays as close to the family as it can.'],
  ex:'sign → signal → signature<br>You cannot hear the g in sign, but you can in signal. So sign has a g.<br>muscle → muscular: the c you cannot hear in muscle is clear in muscular.',
  exc:[{t:'Why does the root change a little (decide → decision)?',x:'When the ending -ion joins the root, the last sounds blend together, and the d of decide becomes an s. Notice the same change in collide → collision and explode → explosion.'},
   {t:'Why does muscle have a silent c?',x:'The word comes from the Latin musculus. English stopped saying the c in muscle but kept it in muscular, so the family still remembers it.'},
   {t:'Why does autumn have an n we do not say?',x:'It comes from the Latin autumnus. The n is said in autumnal, so the family keeps the evidence.'},
   {t:'Does every family work?',x:'No. Some relatives change a lot: explain loses its i in explanation, and pronounce loses its o in pronunciation. Use the family to make a good guess, then check it.'}],
  why:[mc('w1','why','Why can a relative help you spell a word?',['Letters that are silent in one word are often clear in its relative','Relatives always sound the same','Relatives are always shorter'],0,'The relative shows the letters that the sound hides.'),
   mc('w2','why','Why is it muscular, with a c, even though muscle has a silent c?',['The c belongs to the root, and you can hear it in muscular','Because muscular is a long word','Because c replaces s'],0,'The root keeps its c, and the c is heard in muscular.')]},
 guided:W9(`signature|Please add your {w} at the bottom.|gn|Relative: signal. You cannot hear the g in sign, but you can in signal and signature: sig-na-ture.
knowledge|Reading builds {w}.|kn|Relative: know (and knew). The k is silent, but the family keeps it: know + ledge.
column|Add the numbers in the first {w}.|mn|Relative: columnist. You can hear the n in columnist, so column keeps its silent n.
muscle|He pulled a {w} in his leg.|c|Relative: muscular. You can hear the c in muscular, so muscle keeps its silent c: mus-c-le.
autumn|Leaves fall in {w}.|mn|Relative: autumnal. You can hear the n in autumnal, so autumn keeps its silent n.
decision|It was a hard {w} to make.|sion|Relative: decide. decide + ion: the d at the end of the root becomes s, so decision.`),
 recall:W9(`competition|She won the singing {w}.|ition|Relative: compete. compete + ition: the e of compete becomes i.
explanation|He gave a clear {w}.|ana|Relative: explain. explain loses its i: explan-ation.
pronunciation|Practise your {w} by reading aloud.|nun|Relative: pronounce. pronounce loses its o: pro-NUN-ciation.
inspiration|The teacher is my {w}.|ation|Relative: inspire. The e drops and ation joins: inspir-ation.
generation|Grandpa belongs to an older {w}.|ation|Relative: generate. generate + ion: gener-ation.
election|We held an {w} for class monitor.|ect|Relative: elect. elect + ion: elect-ion.
pollution|We must reduce {w}.|ut|Relative: pollute. pollute + ion: the e drops: pollut-ion.
frustration|He sighed in {w}.|ation|Relative: frustrate. frustrate + ion: frustr-ation.
occupation|Her {w} is teaching.|ccup|Relative: occupy. occupy changes to occup-ation: two c’s stay.
exhibition|We visited an art {w}.|hib|Relative: exhibit. exhibit + ion: exhib-it-ion.
advertisement|I saw an {w} on TV.|ise|Relative: advertise. advertise + ment: the e stays before a consonant ending.
possession|This toy is my {w}.|ss|Relative: possess. possess + ion: two s’s, then two more: pos-ses-sion.
attention|Please pay {w} in class.|tt|Relative: attend / attentive. The t of attentive shows the tt: at-ten-tion.
magician|The {w} pulled a rabbit out of his hat.|cian|Relative: magic. magic + ian: the root keeps its c.`),
 transfer:W9(`magical|The {w} garden was full of fireflies.|ic|Relative: magic. magic + al: the root keeps its c.
decided|She {w} to join the choir.|cid|Relative: decide. decide + ed: the silent e drops (Lesson 4).
deciding|We are {w} where to go for lunch.|cid|Relative: decide. decide + ing: the silent e drops (Lesson 4).
competing|Six schools are {w} in the quiz.|pet|Relative: compete. compete + ing: the silent e drops (Lesson 4).
signed|He {w} his name at the bottom of the page.|gn|Relative: signal. sign + ed: the g stays even though it is silent.
signing|She is {w} the card for her friend.|gn|Relative: signal. sign + ing: the g stays even though it is silent.
knowing|He smiled, {w} he had the right answer.|kn|Relative: know. know + ing: the silent k stays.
known|The singer is {w} all over Asia.|kn|Relative: know, knew. The silent k stays in the whole family.
columns|The tall {w} hold up the roof.|mn|Relative: columnist. column + s: the silent n stays.
muscles|Swimming strengthens your {w}.|c|Relative: muscular. muscle + s: the silent c stays.`),
 explain:[mc('x1','why','Which strategy helps you spell columnist and column?',['Hear the n in columnist, so column keeps its silent n','Spell it exactly as it sounds','Guess a letter'],0,'The family keeps the letters that the sound hides.'),
  mc('x2','why','What stays the same across a word family?',['The root’s spelling, as far as possible','The number of syllables','The sound of every letter'],0,'Sounds change, spellings stay close to the root.')],
 hints:it=>['This word has a relative that shows the hidden or changed letters. Which word is it related to?',it.hook||'Think of a relative.',it.tr&&it.w.includes(it.tr)?`Here is its shape: ${it.w.replace(it.tr,'_'.repeat(it.tr.length))}. The letters the family explains are missing.`:'Say the word in chunks and check each one.'],
 diag:(it,a)=>{a=lc(a);const t=it.tr,h=it.hook?' '+it.hook:'';
  if(t&&!a.includes(t))return`The family helps here.${h}`;
  if(a.length<it.w.length)return`A letter is missing. Say the word in chunks and check each chunk.${h}`;
  if(a.length>it.w.length)return`There is an extra letter. Check each chunk.${h}`;
  return`Check each chunk against the family.${h}`},
 match:w=>P9.has(w),tag:w=>P9.has(w)?'word family':null});
// ---- Lesson 10: Mnemonics and Visual Memory ----
// item = word|sentence|tricky part|memory hook.  The hooks are the bank's own clues (a few improved), so the class meets the clues that are already in its word lists.
const P10=new Set();
const W10=t=>{const a=words(t);a.forEach(x=>P10.add(x.w));return a};
const HOOKY=/inside|hiding|hidden|hides|find |Elephants|two [a-z]['’]s|double|e before i|i before e/i;
LIST.push({id:'hooks',no:10,icon:'🪝',name:'The Memory-Hook Charm',sub:'a rat in separate · a lie in believe',kind:'word',
 goal:'Some words cannot be explained by a rule. Learn to find the tricky part and make a memory hook that sticks to it: a small word inside, a silly sentence, a picture, or a funny way of saying it.',
 hl:'Memory hook',
 enc:{say:'These words have a tricky part that a rule cannot explain. Each one has a hook: a little trick that sticks to the tricky letters. Read the hook out loud and picture it.',items:[{w:'separate',tr:'rat',hook:'There is “a rat” in sep-a-rat-e.'},{w:'believe',tr:'lie',hook:'Never believe a lie: “lie” is inside.'},{w:'because',tr:'',hook:'Big Elephants Can Always Understand Small Elephants.'},{w:'necessary',tr:'cess',hook:'One collar (c), two sleeves (ss).'}]},
 notice:[
  mc('n1','notice','Which hook hides a small word INSIDE the big word?',['“a rat” in sep-a-rat-e','Say it three times fast','Write it in big letters'],0,'A little word hiding inside a big one is one of the strongest hooks: sep-a-RAT-e.'),
  mc('n2','notice','“Big Elephants Can Always Understand Small Elephants” is a hook for which word?',['because','beautiful','believe'],0,'The first letters spell B-E-C-A-U-S-E. A silly sentence like this is called an acronym hook.'),
  mc('n3','notice','Which hook is best for the tricky part of “friend”?',['fri-END: a friend is there at the end','Friends are fun','f-r-i-e-n-d is a long word'],0,'A good hook points at the tricky letters (the ie) and gives them a picture or a meaning.'),
  mc('n4','notice','“One collar, two sleeves” is a hook for “necessary”. Which letters does it point at?',['One c and two s','The last letter y','The first letter n'],0,'A shirt has one collar (c) and two sleeves (ss): ne-c-e-ss-ary.'),
  mc('d1','diag','Dev wrote “seperate”. Which hook would fix his mistake?',['There is a rat in sep-a-RAT-e','It sounds like sep-rit','Say sep-er-ate'],0,'The hook puts the a right where Dev wrote an e.')],
 strat:{title:'The Memory-Hook Charm',
  steps:['Find the tricky part: the letters you get wrong, or cannot hear.','Make a hook for JUST that part: a small word inside (a rat in separate), a silly sentence (BECAUSE), a picture (collar and sleeves), or a funny way of saying it (Wed-nes-day).','Test the hook: say it, write the word, then check the tricky part.'],
  ex:'separate<br>Tricky part: the middle a (many people write e).<br>Hook: there is <b>a rat</b> in sep-<b>a-rat</b>-e. Picture a rat in the middle of the word.',
  exc:[{t:'Does a hook work for every word?',x:'No. Use rules first (Lessons 2 to 5 and 9). A hook is for the tricky part of a word that no rule can explain, like the “c” and “ss” in necessary.'},
   {t:'Why are silly hooks better than sensible ones?',x:'Your brain remembers pictures and surprises much better than plain facts. A rat in the middle of a word, or elephants in a sentence, is odd enough to stay in your memory.'},
   {t:'Whose hook is the best one?',x:'The one you make yourself. A hook that is funny to YOU will stick. Use these as examples, then invent your own.'}],
  why:[mc('w1','why','What makes a good memory hook?',['It points at the tricky letters and is easy to picture','It is long and complicated','It has nothing to do with the word'],0,'A hook is only useful if it lands on the part you get wrong.'),
   mc('w2','why','When should you use a hook instead of a rule?',['When the tricky part cannot be explained by a rule','For every word, always','Never'],0,'Rules first. Hooks are for the leftovers: the tricky parts that have no rule.')]},
 guided:W10(`separate|Please {w} the plastic from the paper.|rat|There is “a rat” in sep-a-rat-e. Picture a rat hiding in the middle.
because|I stayed home {w} it was raining.||Big Elephants Can Always Understand Small Elephants: B-E-C-A-U-S-E.
friend|A true {w} will always help you.|end|fri-END: a friend is there at the end.
believe|I {w} you can win the spelling bee.|lie|Never believe a lie: “lie” is inside be-lie-ve.
necessary|It is {w} to wear a helmet when cycling.|cess|One collar (c) and two sleeves (ss): a shirt has one collar and two sleeves.
environment|We must protect our {w}.|iron|en-vi-RON-ment: “iron” is hiding inside.`),
 recall:W10(`rhythm|The drummer kept a steady {w}.|rhy|Rhythm Helps Your Two Hips Move: R-H-Y-T-H-M.
height|The {w} of the tower is fifty metres.|eight|Eight is hiding in h-EIGHT.
receive|Did you {w} my message?|ei|After c, e comes first: rec-ei-ve. (i before e, except after c.)
library|We borrow books from the {w}.|brar|li-BRAR-y: the r after the b. Say it as written: li-BRAR-y.
dessert|We had ice cream for {w}.|ss|Two s’s: you always want a second helping of dessert.
vacuum|Use the {w} to clean the carpet.|uu|One c, two u’s: a vacuum is “you, you”, and a vacuum cleaner needs only one c.
tomorrow|We will visit the zoo {w}.|rr|One m, two r’s: to-MOR-ROW. Say it as written.
embarrass|Do not {w} your friends.|rrass|Two r’s and two s’s: you go Really Red and Super Silly.
accommodate|The hotel can {w} all twenty pupils in one block.|ccomm|A big hotel has room for two c’s and two m’s: ac-com-mo-date.
definitely|I will {w} finish my homework before dinner.|finite|Find “finite” inside de-finite-ly. No “a”.
conscience|My {w} told me to return the lost wallet.|scien|con-SCI-ence: science hides inside.
parallel|The two lines are {w} to each other.|ll|Parallel has two l’s that look like parallel lines: para-ll-el.
neighbour|Our {w} waters the plants.|neigh|A neighbour might neigh over the fence like a horse: neigh-bour.
cemetery|The old {w} is quiet.|e|Three e’s, like a scream: c-E-m-E-t-E-ry. Eee! A cemetery!`),
 transfer:W10(`secretary|The club {w} wrote the minutes.|secret|A secretary keeps a secret: “secret” is hidden in secret-ary.
rehearsal|We have a {w} after school.|hear|You hear the others while you rehearse: “hear” is inside re-hear-sal.
weird|The {w} noise came from the attic.|ei|Weird is weird: it breaks the rule, so e comes before i.
foreign|She speaks a {w} language at home.|ei|The e comes before the i, but it sounds like “in”: for-eign.
island|Sentosa is an {w}.|s|An island is land in the water: is-LAND. The s is silent.
queue|We stood in a long {w} for chendol.|ueue|The q has four letters waiting in line behind it: q-ueue.
poisonous|That snake is {w}.|poison|You can find “poison” inside poison-ous.
ambiguous|The instructions were {w}.|big|am-BIG-uous: a big word with “big” inside.
demonstrate|The teacher will {w} the experiment.|demon|A demon is hiding inside demon-strate.
shepherd|The {w} looked after the sheep.|herd|A shepherd looks after a herd of sheep: shep-HERD.`),
 bank:true,
 explain:[mc('x1','why','Which of these is a memory hook for the word “height”?',['Eight is hiding in h-EIGHT','Height is a long word','It is the opposite of low'],0,'A hook sticks to the tricky letters (eight).'),
  mc('x2','why','What should a hook point at?',['The tricky part of the word','The first letter only','The number of letters'],0,'A hook that points somewhere else will not help you when you write the word.')],
 hints:it=>[
  'Find the tricky part of this word. Which letters could trip you up?',
  it.hook?'Remember the hook: '+it.hook:'Think of a hook for the tricky part.',
  `It has ${it.w.length} letters and starts with “${it.w[0]}”: ${it.w[0]}${'_'.repeat(it.w.length-1)}`],
 diag:(it,a)=>{a=lc(a);const h=it.hook?' Hook: '+it.hook:'';
  if(a.length<it.w.length)return'A letter is missing. Check the tricky part against the hook.'+h;
  if(a.length>it.w.length)return'There is an extra letter. Check the tricky part against the hook.'+h;
  return'The length is right, but one letter is wrong. Check the tricky part against the hook.'+h},
 accept:x=>!!x.h&&x.w.length>=6&&x.h.length>=18&&HOOKY.test(x.h)&&!/says/.test(x.h)&&!/^[a-z](-[a-z])+/.test(x.h)&&x.w===lc(x.w), // extra words from the class bank only if their own clue is a real hook
 mk:x=>({tr:'',hook:x.h}),
 match:w=>P10.has(w),tag:w=>P10.has(w)?'memory hook':null});
// ---- Lesson 11: Error Diagnosis ----
// item = word|sentence|a real misspelling of it|doctor's note.  The pupil sees the misspelling inside the sentence and writes the word correctly.
// At run time the Worker swaps in a wrong spelling that a pupil in the same class has really written whenever it has one (see lesItems in worker.js).
const FIX={doubling:['a double-letter slip','A letter that needed doubling was written once (or a single letter was doubled). Chunk the word, and check where the double letters sit.'],
 silente:['a missing silent e','The silent e was left off, so the vowel stays short. The Silent-e Charm adds it back (kit → kite).'],
 vowel:['a wrong vowel','A vowel is the wrong one, or a vowel pair is the wrong way round. A memory hook for the tricky vowel helps (a rat in sep-a-RAT-e).'],
 transposition:['two letters swapped','Two letters changed places. Say the letters in order and check them from left to right.'],
 phonetic:['spelling it as it sounds','The word was spelled the way it sounds, but English has other ways to spell that sound, or a silent letter. Learn the pattern, or the silent letter.'],
 omission:['a missing letter','A letter is missing. Chunk the word and check each chunk.'],
 insertion:['an extra letter','An extra letter crept in. Chunk the word and check each chunk.']};
const words11=t=>t.trim().split('\n').map(l=>{const[w,s,bad,hook]=l.split('|');return{w:w.trim(),s:s.trim(),bad:bad.trim(),tr:'',hook:hook||''}});
const sp=()=>g.Spelling||null;
LIST.push({id:'errors',no:11,icon:'🩺',name:'The Error-Doctor Charm',sub:'acommodate → accommodate · seperate → separate',kind:'word',
 goal:'Learn to read a misspelling like a doctor: find the slip, name what kind of slip it is, and cure it with the right strategy.',
 hl:'Doctor’s note',fix:true,
 enc:{say:'Every misspelling is a clue. It shows WHERE a speller went wrong and WHY. Look at each mistake, then at the cure.',fixes:[['acommodate','accommodate','The m and the c are doubled: two c’s and two m’s.'],['seperate','separate','The middle letter is an a: there is a rat in sep-a-rat-e.'],['recieve','receive','After c, e comes first.'],['kit','kite','The silent e was left off, so the i stayed short.']]},
 notice:[
  mc('n1','notice','Which word is misspelled?',['friend','freind','island'],1,'freind has the i and e the wrong way round. It is fri-END: friend.'),
  mc('n2','notice','Which is the correct spelling?',['neccessary','necessary','necesary'],1,'necessary has one c and two s: one collar, two sleeves.'),
  mc('n3','notice','Which spelling has an EXTRA letter?',['beautifull','beautiful','beutiful'],0,'ful has just one l: beauti-ful. beautifull has an extra l.'),
  mc('n4','notice','Which spelling has a letter MISSING?',['Febuary','February','Februrary'],0,'Febuary has lost the first r. It is Feb-RU-ary.'),
  mc('d1','diag','Maya wrote “seperate” for “separate”. What kind of slip is it?',['A wrong vowel: e instead of a','A missing letter','An extra letter'],0,'The a in the middle became an e. A hook helps: there is a rat in sep-a-RAT-e.')],
 strat:{title:'The Error-Doctor Charm',
  steps:['Look: read the misspelled word slowly, letter by letter, from left to right. Point at each letter.','Find the slip and name it: a wrong vowel, a missing letter, an extra letter, a double letter, swapped letters, or a silent letter.','Cure it with the matching strategy: a rule (Lessons 2 to 5), chunking (6), a twin check (7), a hook (10).','Check: write the word again from memory, and say how you know.'],
  ex:'seperate → separate<br>Look: s-e-p-e-r-a-t-e. The second e is the slip.<br>Name it: a wrong vowel (e instead of a).<br>Cure: a rat in sep-<b>a</b>-rat-e.',
  exc:[{t:'Why do the same words get misspelled again and again?',x:'The brain remembers the sound and the first spelling it saw. If nobody finds the exact slip and gives it a hook, the same slip keeps coming back. That is why naming the slip is worth it.'},
   {t:'What if I cannot find the slip?',x:'Put the right word under the wrong one and compare them letter by letter. Most slips hide in the middle of the word, in a vowel, a double letter or a silent letter.'},
   {t:'Is spelling it as it sounds a real mistake?',x:'It is a very sensible one! English has several ways to spell the same sound, so the sound alone cannot decide. That is why we use patterns, families and hooks too.'}],
  why:[mc('w1','why','What does an error doctor do first?',['Reads the word slowly, letter by letter','Rewrites it faster','Asks someone else'],0,'Slow, careful looking finds the slip. Guessing does not.'),
   mc('w2','why','Why is it useful to NAME the kind of slip?',['Each kind of slip has its own cure','It loses you a mark','It makes the word longer'],0,'A missing letter is cured by chunking, a wrong vowel by a hook, a missing e by the Silent-e Charm.')]},
 guided:words11(`separate|Please {w} the plastic from the paper.|seperate|There is a rat in sep-a-RAT-e, so the middle letter is an a.
necessary|It is {w} to wear a helmet when cycling.|neccessary|One collar (c), two sleeves (ss): ne-c-e-ss-ary.
library|We borrow books from the {w}.|libary|Chunk it: li · brar · y. The r after the b is easy to drop.
kite|We fly a {w} in the park.|kit|The silent e makes the i say its name (Lesson 2): kit becomes kite.
knife|Be careful with the {w}.|nife|The k is silent but still written. Learn it as a wild word: k-nife.
tragedy|The play was a {w}.|tradgedy|Chunk it: tra · ge · dy. The g sounds like j, and there is no d.`),
 recall:words11(`receive|Did you {w} my message?|recieve|After c, e comes first: rec-ei-ve.
definitely|I will {w} finish my homework before dinner.|definately|Find “finite” inside de-finite-ly.
tomorrow|We will visit the zoo {w}.|tommorow|One m, two r’s: to · mor · row.
embarrass|Do not {w} your friends.|embarass|Two r’s and two s’s: you go Really Red and Super Silly.
because|I stayed home {w} it was raining.|becuase|Big Elephants Can Always Understand Small Elephants.
friend|A true {w} will always help you.|freind|fri-END: a friend is there at the end.
island|Sentosa is an {w}.|iland|An is-LAND: the s is silent but it is written.
accommodate|The hotel can {w} all twenty pupils in one block.|acommodate|A big hotel has room for two c’s and two m’s.
weird|The {w} noise came from the attic.|wierd|Weird is weird: it breaks the rule, so e comes before i.
surprise|The party was a lovely {w}.|suprise|Chunk it: sur · prise. The sur has an r, and prise has another.
business|The family {w} sells kueh.|buisness|Say it as written: bus-i-ness. It is busy + ness.
leisure|She reads in her {w} time.|liesure|lei + sure: the ei is in the middle.`),
 transfer:words11(`neighbour|Our {w} waters the plants.|nieghbour|A neighbour might neigh over the fence: n-e-i-g-h.
calendar|Circle the date of the test on the {w}.|calender|The word ends with -ar, not -er.
government|The {w} built new parks.|goverment|govern + ment: the n is there before the ment.
disappear|The magician made the coin {w}.|dissapear|dis + appear: only one s, because dis- is a prefix (Lesson 5).
conscience|My {w} told me to return the lost wallet.|consience|con-SCI-ence: science hides inside.
scissors|I cut paper with {w}.|sissors|sc-i-ss-or-s: the sc is silent-ish, so learn it as a wild word.
independent|By Primary 6, many pupils travel to school as {w} learners.|independant|Ends in -ent, not -ant: independ-ent.
schedule|Check the bus {w} before you leave.|shedule|S-c-h at the start, like “school”.
language|Learning a new {w} is fun.|langauge|“gu” like in guard: lan-gu-age.
exercise|Daily {w} keeps you healthy.|exersise|ex-er-CISE: it ends in -cise.`),
 bank:true,
 explain:[mc('x1','why','Which step comes first when you check a misspelling?',['Read it slowly, letter by letter','Guess the answer','Cross it out'],0,'Slow looking comes first.'),
  mc('x2','why','“libary” is missing a letter. Which strategy helps most?',['Chunk it: li · brar · y','The Silent-e Charm','Doubling the last letter'],0,'Chunking shows every beat, so a dropped letter stands out.')],
 hints:it=>[
  'Look at the misspelled word letter by letter. Which part looks wrong?',
  it.hook?'Doctor’s note: '+it.hook:'Think of the strategy that fits the slip.',
  `Start by writing the first letters: “${it.w.slice(0,Math.max(2,Math.ceil(it.w.length/2)))}…”`],
 diag:(it,a)=>{a=lc(a);const S=sp();
  if(it.bad&&a===lc(it.bad))return'That is the misspelled version again. Compare it with the cure, letter by letter.';
  const t=S&&S.classify?S.classify(it.w,a):null;
  return t&&FIX[t]?`Your answer shows ${FIX[t][0]}. ${FIX[t][1]}`:'Read your answer slowly, letter by letter, and compare it with the doctor’s note.'},
 // After each fix, the pupil names the kind of slip that the original misspelling had (a card, kind diag).
 diagQ:it=>{const S=sp(),t=S&&it.bad&&S.classify?S.classify(it.w,lc(it.bad)):null;if(!t||!FIX[t])return null;
  const others=Object.keys(FIX).filter(k=>k!==t).sort(()=>Math.random()-.5).slice(0,2),o=[t,...others].map(k=>FIX[k][0]);
  return mc('dq_'+it.w,'diag',`A pupil wrote “${it.bad}” for “${it.w}”. What kind of slip is that?`,o,0,`That is ${FIX[t][0]}. ${FIX[t][1]}`)},
 accept:()=>false, // extra words for this lesson are built by the Worker from the class's real wrong spellings
 match:()=>false,tag:()=>null});
// ---- Lesson 12: Spelling Detectives ----
// item = word|sentence|strategy|why this strategy decides the spelling|other strategies that would also be right.
// Words are new to the pupil (not drilled in earlier lessons). After each word the pupil explains the decision: which clue decided the spelling?
const RU12={sound:{n:'Sound pattern',t:'Lesson 1: ask which letters make this sound, and where in the word it sits.'},
 silente:{n:'Silent-e Charm',t:'Lesson 2: vowel + one consonant + silent e makes the vowel say its name.'},
 double:{n:'Doubling Charm',t:'Lesson 3: one syllable, one vowel, one consonant at the end? Double it before an ending that starts with a vowel.'},
 suffix:{n:'Shape-Shifting Suffix',t:'Lesson 4: drop the silent e, or change y to i, before an ending.'},
 build:{n:'Word-Builder',t:'Lesson 5: prefix + root + ending. Every part keeps its own spelling.'},
 chunk:{n:'Chunking',t:'Lesson 6: cut the word into beats and spell each chunk.'},
 twin:{n:'Twin-word test',t:'Lesson 7: ask what the word MEANS, then pick the twin that fits.'},
 wild:{n:'Wild word',t:'Lesson 8: the word breaks the patterns, so learn its odd part by heart.'},
 family:{n:'Family tree',t:'Lesson 9: a relative you can hear shows the hidden letters.'},
 hook:{n:'Memory hook',t:'Lesson 10: a hook sticks to the tricky part.'}};
const words12=t=>t.trim().split('\n').map(l=>{const[w,s,rule,def,also]=l.split('|');return{w:w.trim(),s:s.trim(),rule,def,also:(also||'').split(',').filter(Boolean),tr:'',hook:''}});
LIST.push({id:'detectives',no:12,icon:'🕵️',name:'The Spelling Detectives',sub:'unfamiliar words · say how you know',kind:'word',
 goal:'Put every strategy together. Face words you have never practised, decide how to spell them with the best clue, and explain your decision like a detective.',
 rules:RU12,dl:'Why',
 enc:{say:'A Spelling Detective never just guesses. For every word, look for a clue, use it, and be ready to say how you know. Here are four cases solved.',items:[{w:'swimming',tr:'mm',hook:'Doubling Charm: swim + m + ing.'},{w:'unlucky',tr:'un',hook:'Word-Builder: un + lucky.'},{w:'musician',tr:'ci',hook:'Family tree: music → musician.'},{w:'together',tr:'',hook:'Memory hook: to + get + her.'}]},
 notice:[
  mc('n1','notice','You must spell “unhappy”. Which clue gives you the spelling?',['un + happy: a prefix joined to a root','It sounds like unhappy','It is a silent letter'],0,'The Word-Builder clue: un- joins whole and happy keeps its own spelling.'),
  mc('n2','notice','Which clue explains the double p in “stopped”?',['stop has one syllable, one vowel and one final consonant','p is always doubled','It sounds quick'],0,'This is the Doubling Charm: stop + p + ed.'),
  mc('n3','notice','Which word shows the Family-Tree clue?',['musician (from music)','kitten','banana'],0,'You can hear the c in music, so musician keeps it.'),
  mc('n4','notice','Which clue helps most with a long word like “astronaut”?',['Chunk it into beats: as · tro · naut','Skip the middle','Guess the vowels'],0,'Chunking turns a long word into short pieces.'),
  mc('d1','diag','Sam wrote “makeing”. Which clue did he forget?',['Drop the silent e before an ending that starts with a vowel','Double the k','Add another e'],0,'make + ing becomes making: the silent e drops (Lesson 4).')],
 strat:{title:'The Detective’s Method',
  steps:['LISTEN and CHUNK: say the word slowly and clap the beats.','LOOK for clues: is there a rule, a prefix or ending, a relative, a twin, a wild part, or a hook?','DECIDE: write the word using the best clue.','CHECK and EXPLAIN: does it look right? Say one sentence: “I wrote ___ because ___.”'],
  ex:'unlucky<br>Clue: Word-Builder. un + lucky.<br>“I wrote <b>unlucky</b> because the prefix un- joins whole, and lucky keeps its own spelling.”',
  exc:[{t:'What if two strategies fit?',x:'Wonderful: two clues that agree make you even more sure. For example, together is a hook (to + get + her) and a chunking job too.'},
   {t:'What if no strategy fits?',x:'Then it is probably a wild word. Find the odd part, make a memory hook for it, and learn it by heart.'},
   {t:'Can a detective be wrong?',x:'Of course. That is why the last step is CHECK. If a word looks wrong, try another clue, or look it up. A detective who checks is a detective who learns.'}],
  why:[mc('w1','why','Why does a detective say HOW they know a spelling?',['Explaining shows you understand the clue, so you can use it on new words','It makes the test slower','It is only for teachers'],0,'If you can explain the clue, you can use it again on a word you have never seen.'),
   mc('w2','why','A word does not fit any rule you know. What should a detective do?',['Treat it as a wild word and make a memory hook','Spell it as it sounds and move on','Give up'],0,'Wild words are learned by heart, and a hook helps the odd part stick.')]},
 guided:words12(`swimming|We are {w} in the pool this afternoon.|double|swim has one syllable, one vowel and one consonant at the end, so the m doubles before -ing: swim + m + ing.|
smiling|She was {w} from ear to ear.|suffix|smile ends in a silent e and -ing starts with a vowel, so the e drops: smil + ing.|silente
railway|The {w} runs all the way to the city.|sound|The long a sound is spelled ai in the middle of rail and ay at the end of way: rail + way.|build
unlucky|It was an {w} day for the team.|build|un + lucky: the prefix un- joins whole, and lucky keeps its own spelling.|
musician|My uncle is a talented {w}.|family|music is the relative you can hear: music + ian. The c is still there.|
butterfly|A {w} landed on the flower.|chunk|but · ter · fly: the double t sits at the chunk border, one t on each side.|`),
 recall:words12(`stopped|The bus {w} at the traffic light.|double|stop has one syllable, one vowel and one consonant at the end: stop + p + ed.|
babies|The two {w} were fast asleep.|suffix|baby ends in a consonant + y, so the y changes to i before es: bab + ies.|
toaster|Dad put bread into the {w}.|sound|The long o sound is spelled oa in the middle of a word: t-oa-st-er.|
careless|It was a {w} mistake.|build|care + less: both parts keep their own spelling, so the e of care stays.|
astronaut|The {w} floated in space.|chunk|as · tro · naut: three chunks, spelled one at a time.|
electricity|The storm cut off the {w}.|family|electric is the relative you can hear: electric + ity keeps the c.|
piece|May I have a {w} of cake?|twin|It means a part of something: a piece of pie. Its twin, peace, means calm.|
answer|Please write your {w} on the line.|wild|The w is silent, so answer is a wild word: learn the w by heart.|
together|We walked home {w}.|hook|to + get + her: a hook that splits the word into three small words.|chunk
winner|The {w} received a gold medal.|double|win has one syllable, one vowel and one consonant at the end: win + n + er.|
disagree|I {w} with that idea.|build|dis + agree: the prefix and the root both keep their own spelling.|
tonight|We are having pizza {w}.|sound|The long i sound is spelled igh in night: to + night.|build`),
 transfer:words12(`planning|We are {w} a surprise party.|double|plan has one syllable, one vowel and one consonant at the end: plan + n + ing.|
hurried|She {w} to catch the bus.|suffix|hurry ends in a consonant + y, so the y changes to i before ed: hurr + ied.|
rebuild|They will {w} the old bridge.|build|re + build: the prefix joins whole and build keeps its silent u.|
invention|The telephone was a great {w}.|family|invent is the relative you can hear: invent + ion shows the t.|
hear|I can {w} a bird singing.|twin|You do it with your ear, and hear has ear inside. Its twin, here, is a place.|
castle|The knight lived in a {w}.|wild|The t is silent, so castle is a wild word: learn the t by heart.|
sunshine|We enjoyed the warm {w}.|silente|shine is vowel + consonant + silent e: the e makes the i say its name.|build
explain|Can you {w} the rules to me?|sound|The long a sound is spelled ai in the middle of plain: ex + plain.|build
kangaroo|The {w} hopped across the field.|chunk|kan · ga · roo: three chunks, spelled one at a time.|hook
cheerful|The {w} baker greeted everyone.|build|cheer + ful: both parts keep their spelling, and ful has just one l.|`),
 explain:[],
 hints:it=>{const r=RU12[it.rule];return[
  'LISTEN and CHUNK: say the word slowly. How many beats do you hear?',
  r?`A clue to try: the ${r.n}. ${r.t}`:'Look for a clue: a rule, a prefix or ending, a relative, a twin, a wild part or a hook.',
  `It has ${it.w.length} letters and starts with “${it.w[0]}”: ${it.w[0]}${'_'.repeat(it.w.length-1)}`]},
 diag:(it,a)=>{const r=RU12[it.rule];return r?`Think about the ${r.n}. ${r.t}`:'Look for a clue: a rule, a prefix or ending, a relative, a twin, a wild part or a hook.'},
 // After each word (in guided practice, transfer and the memory check) the pupil explains the decision: which clue decided it? (card kind rule)
 decide:it=>{const r=it.rule;if(!r||!RU12[r])return null;const no=new Set([r,...(it.also||[])]),o=[r,...Object.keys(RU12).filter(k=>!no.has(k)).sort(()=>Math.random()-.5).slice(0,3)].map(k=>RU12[k].n);
  return mc('dq_'+it.w,'rule',`Detective’s report on “${it.w}”: which clue decided the spelling?`,o,0,`${RU12[r].n}. ${it.def}`)},
 match:()=>false,tag:()=>null});
// ---- Lower primary (v4.0): optional plain-language overrides per lesson. Anything missing falls back to the Upper text. Same ids, stages, scoring; only wording and (where given) easier word lists change. ----
const LO={};
LO.silente={name:'The Magic-e Wand',goal:'Learn how a magic e at the end of a word makes the letter say its name.',
 enc:{say:'Listen to each pair. Say them out loud. One word has an e on the end. What happens to the sound?'},
 notice:[
  mc('n1','notice','Which word says the letter name “ay”?',['tap','tape'],1,'tape says “ay”. The magic e at the end did it.'),
  mc('n2','notice','cap → cape. What did the e do?',['It made the a say its name','It made the word longer for fun','It made the word mean more than one'],0,'The e is quiet. Its wand makes the a say “ay”.'),
  mc('n3','notice','Where does the magic e go?',['At the end of the word','At the start of the word','In the middle of the word'],0,'It sits at the end, like a cape on the word.'),
  mc('n4','notice','Which word has a magic e?',['plan','plane','plain'],1,'plane ends with e. In plain, the letters “ai” make the sound.'),
  mc('d1','diag','Maya wrote “kit” for the toy in the sky. What went wrong?',['She forgot the magic e','She added a letter she did not need','She wrote the wrong first letter'],0,'Without the e, it says kit. Add the magic e and it says kite.')],
 strat:{title:'The Magic-e Wand',
  steps:['Say the word. Does the vowel say its name? (a = ay, e = ee, i = eye, o = oh, u = you)','If yes, add an e at the end.','The e is quiet. But its wand makes the vowel say its name.'],
  ex:'hop → hope<br>“hop” has a short o.<br>Wave the wand: h-o-p-<b>e</b>.<br>Now the o says its name: “hope”.',
  exc:[{t:'Why do have, give, live and love end in e?',x:'No English word ends in the letter v. So the word gets an e to hide the v. Here the e is a bodyguard, not a wand. That is why have does not say “hayv”.'},{t:'Why do come, some and love have an o?',x:'Long ago, the letter u looked messy next to m, n and v. So people wrote o. We still say “u”, but the o stayed.'},{t:'Words to remember',x:'are, were, there, where, one, move and lose are tricky. Look at them closely and learn them by heart.'}],
  why:[mc('w1','why','Why does have end with e?',['No word ends in v, so an e hides it','The e makes the a say its name','It is a mistake'],0,'The e is a bodyguard for the v. It is not the magic wand.'),
   mc('w2','why','What does the magic e do in kite?',['It makes the i say its name','You say it out loud','It means more than one'],0,'The e is quiet. It makes the i say “eye”.')]},
 guided:words(`kite|We flew a {w} at the park.\ncake|We ate {w} at the party.\nbike|I ride my {w} to school.\nrope|The boy held the {w} tightly.\nhome|It is time to go {w}.\nnose|I smell with my {w}.`),
 recall:words(`game|Let us play a {w}.\nlake|We saw ducks on the {w}.\ntime|What {w} is it?\nfive|She is {w} years old.\nnote|Please write me a {w}.\ngate|Close the {w}, please.\ntube|Squeeze the {w} of glue.\ncube|He drew a {w}.\nwave|I can {w} my hand.\nhole|The mole dug a {w}.\ntune|She hummed a happy {w}.\nface|Draw a smile on his {w}.`),
 transfer:words(`smile|She has a big {w}.\nride|Let us {w} the bus.\nhide|The cat likes to {w} in a box.\nsize|What {w} are your shoes?\nshake|Please {w} my hand.\nsnake|A {w} slid in the grass.`),
 explain:[mc('x1','why','What does the e do in shape, stone and flame?',['It makes the vowel say its name','It adds a beat','It means more than one'],0,'The quiet e is a wand. It makes the vowel say its name.'),
  mc('x2','why','Which word is a rule-breaker?',['save','have','wave'],1,'have does not say “hayv”. save and wave follow the magic e.'),
  mc('x3','diag','Someone wrote “hopeing”. What is wrong?',['The magic e goes away before -ing','The e must be doubled','It needs more letters'],0,'Take off the e before -ing: hoping. You will learn this soon!')],
 hints:it=>{const m=it.w.match(/([aeiou])([^aeiouwxy])e$/);return[
  'Say the word slowly. Does the vowel say its name? Then you need the magic e.',
  m?`Look for: “${m[1]}”, then “${m[2]}”, then the magic e.`:'Look for: a vowel, one letter, then the magic e.',
  `Here are the other letters: ${it.w.replace(/[aeiou]/g,'_')}. Fill in the gaps.`]},
 diag:(it,a)=>{const w=it.w;a=lc(a);
  if(w==='have'||w==='give'||w==='live'||w==='love')return'This word is tricky. No word ends in v, so it gets an e, even though the vowel is short.';
  if(EXC2.has(w))return'This word is tricky. Learn it by heart and see how it is different from kite.';
  if(a===w.slice(0,-1))return'You forgot the magic e. Add it at the end so the vowel says its name.';
  return'Look for the pattern: a vowel, one letter, then the magic e, like kite.'}};
const LR3={dbl:{n:'Give the last letter a twin',t:'Check the Three Ones: one beat, one vowel, one letter at the end. All yes? Then the last letter gets a twin before -ing or -ed.'},add:{n:'Just add the ending',t:'One of the Three Ones is a no. So there is no twin. Just stick the ending on.'}};
LO.double={name:'The Twin-Letter Charm',goal:'Learn when the last letter gets a twin: hop → hopping.',rules:LR3,
 enc:{say:'Listen to each pair. The long word is the short word plus an ending. Look at the middle of the long word. What do you see?'},
 notice:[
  mc('n1','notice','Which word has ONE vowel and ONE letter at the end?',['hop','help','rain'],0,'hop has one vowel (o) and one last letter (p). help ends in two letters (lp). rain has two vowels (ai).'),
  mc('n2','notice','hop → hopping. What happened to the p?',['It got a twin','It went away','It turned into i'],0,'The p is written twice: hopping.'),
  mc('n3','notice','Which word does NOT get a twin before -ing?',['run','sit','help'],2,'help ends in two letters (lp), so we just add -ing: helping.'),
  mc('n4','notice','Which word says a SHORT o, like “hop”?',['hoping','hopping'],1,'hoping looks like hope + ing. The twin p keeps the o short.'),
  mc('d1','diag','Ravi wrote “runing”. What went wrong?',['He forgot the twin n','He added a letter he did not need','He used the wrong ending'],0,'run passes the Three Ones, so the n gets a twin: running.')],
 strat:{title:'The Twin-Letter Charm: the Three Ones',
  steps:['Ask the Three Ones. One beat? One vowel (a, e, i, o, u)? One letter at the end?','All yes, and the ending is -ing, -ed or -er? Give the last letter a twin.','The twin is a bodyguard. It keeps the vowel short.'],
  ex:'swim + ing<br>One beat ✓ · one vowel (i) ✓ · one last letter (m) ✓<br>Give the m a twin: swim<b>m</b>ing.<br><br>help + ing<br>It ends in two letters (lp) ✗ → helping.',
  exc:[{t:'Why do rain, help and open not get a twin?',x:'rain has two vowels. help ends in two letters. The vowel is already safe, so it needs no bodyguard.'},
   {t:'Why do fix, snow and play not get a twin?',x:'The letters x, w and y never get a twin. So we write fixing, snowing and playing.'},
   {t:'What if the ending is -ful or -ly?',x:'Only -ing, -ed and -er start with a vowel. Before -ful or -ly, just add the ending: sadly, helpful.'}],
  why:[mc('w1','why','Why do we write hopping, not hoping?',['The twin p keeps the o short','-ing always needs a twin','hop is a doing word'],0,'Without the twin, hoping looks like hope + ing.'),
   mc('w2','why','Why is it raining and not rainning?',['rain has two vowels, so it needs no twin','-ing is different here','rain is a thing'],0,'The “ai” is already safe. No bodyguard is needed.')]},
 guided:joins(`hop+ing=hopping|dbl|The frog is {w} away.\nsit+ing=sitting|dbl|The cat is {w} on the mat.\nhelp+ing=helping|add|She is {w} her mum.\nswim+ing=swimming|dbl|They are {w} in the pool.\nrain+ing=raining|add|It is {w} outside.\nstop+ed=stopped|dbl|The bus {w} at the light.`),
 recall:joins(`run+ing=running|dbl|The boys are {w} fast.\nshop+ing=shopping|dbl|Mum is {w} at the market.\nclap+ed=clapped|dbl|Everyone {w} loudly.\ndrop+ed=dropped|dbl|She {w} her pencil.\nhug+ed=hugged|dbl|He {w} his sister.\njog+ing=jogging|dbl|Grandpa is {w} today.\nmop+ed=mopped|dbl|She {w} the floor.\nplan+ed=planned|dbl|We {w} a party.\njump+ing=jumping|add|The kids are {w} up and down.\nhelp+ed=helped|add|He {w} me with my bag.\nfix+ing=fixing|add|Dad is {w} my bike.\nbig+er=bigger|dbl|A cow is {w} than a dog.`),
 transfer:joins(`get+ing=getting|dbl|We are {w} on the bus.\ndig+ing=digging|dbl|They are {w} in the sand.\nzip+ed=zipped|dbl|She {w} her bag.\nsad+er=sadder|dbl|He looked {w} than before.\ncamp+ing=camping|add|We are {w} by the sea.\nplay+ing=playing|add|The kids are {w} outside.`),
 hints:it=>{const r=LR3[it.rule];return['Do the Three Ones. One beat? One vowel? One letter at the end? Is the ending -ing, -ed or -er?',r.n+'. '+r.t,
  it.rule==='dbl'?`Try this: ${it.l} + ${it.l.slice(-1)} + ${it.r}`:`Try this: ${it.l} + ${it.r} (no twin)`]},
 diag:(it,a)=>{a=lc(a);const dbl=it.rule==='dbl';
  if(dbl&&a===it.l+it.r)return`You stuck the pieces together. But ${it.l} passes the Three Ones, so the last letter needs a twin: ${it.l} + ${it.l.slice(-1)} + ${it.r}.`;
  if(!dbl&&a===it.l+it.l.slice(-1)+it.r)return`No twin here. ${it.l} fails the Three Ones, so just add the ending.`;
  if(dbl&&a.startsWith(it.l)&&a.length>it.w.length)return'Too many letters. Only the last letter gets a twin, just once.';
  return`Go step by step: short word, maybe a twin, then the ending. ${LR3[it.rule].n}.`}};

// ---- Lower primary: Lesson 1 (Sound Sorter) and Lesson 4 (Ending Detective) ----
const LG1={ai:{s:'“ay”',tip:'ai sits in the MIDDLE of a word: rain, paint, train.'},ay:{s:'“ay”',tip:'ay sits at the END of a word: play, day, away.'},ee:{s:'“ee”',tip:'ee is the most common. Think of two eyes: see, tree, green.'},ea:{s:'“ee”',tip:'ea is sneaky. Use the hook or think of a word in the same family.'},oa:{s:'“oh”',tip:'oa sits in the MIDDLE of a word: boat, road, soap.'},ow:{s:'“oh”',tip:'ow often sits at the END of a word: snow, yellow, window.'},igh:{s:'“eye”',tip:'igh is a trio that goes before t: night, light, fright.'}};
LO.sounds={goal:'One sound can be spelled in different ways. Learn the clues that help you pick the right spelling.',
 enc:{say:'Each pair has the SAME sound but different letters. Say them out loud. Which letters make the sound?'},
 notice:[
  mc('n1','notice','Rain and play sound the same. Which spelling comes at the END of a word?',['ay','ai'],0,'ay goes at the end: play, day, away. ai goes in the middle: rain, paint.'),
  mc('n2','notice','Which word has “oa” in it?',['boat','snow','yellow'],0,'boat: b-oa-t. In snow and yellow, the “oh” sound is spelled ow.'),
  mc('n3','notice','Tree and sea both say “ee”. How are they spelled?',['ee and ea','ai and ay','oa and ow'],0,'Both say “ee”. ee and ea are the two usual spellings.'),
  mc('n4','notice','Which letters say “eye” in night?',['igh','ie','y'],0,'igh: night, light, fright. Three letters travel together.'),
  mc('d1','diag','Zoe wrote “rane” for water from the sky. What went wrong?',['She used a-e, but this word uses ai','She forgot a double letter','She used the wrong first letter'],0,'Rain uses ai in the middle. The a-e trick is for words like cake.')],
 strat:{title:'The Sound Sorter',
  steps:['Say the word slowly. Find the vowel sound. Which letters can make it? (“ay”: ai, ay · “ee”: ee, ea · “oh”: oa, ow · “eye”: igh)','Use the clues. ay and ow go at the END. ai and oa go in the MIDDLE. For ee and ea, use a hook.','Write the word and LOOK at it. Does it look right? Good spellers always check.'],
  ex:'pl_ _ says “ay” at the end, so pl<b>ay</b>.<br>r_ _n says “ay” in the middle, so r<b>ai</b>n.<br>Same sound. The place in the word helps you choose.',
  exc:[{t:'Why does ea sometimes say “eh”, as in head?',x:'The letters ea can say “ee” (sea) or “eh” (bread). When you hear “eh”, learn the word by heart.'},
   {t:'Why does ow sometimes say “ow”, as in flower?',x:'ow can say “oh” (snow) or “ow” (flower, like ouch). Say the word and listen first.'},
   {t:'Why does said have ai?',x:'Some words do not follow a pattern. Make a hook for the tricky part: s-ai-d.'}],
  why:[mc('w1','why','Why can you not spell a word by sound alone?',['One sound can be spelled in different ways','Words never follow sounds','Vowels are silent'],0,'The sound gives you choices. The place in the word and your hook help you pick.'),
   mc('w2','why','You hear “ay” at the END of a word. What is a good first guess?',['ay','ai','a-e'],0,'ay is the usual spelling at the end: play, today.')]},
 recall:words(`paint|Let us {w} a picture.||\ntrain|The {w} stops at the station.||\ntoday|It is sunny {w}.||\naway|The bird flew {w}.||\ngreen|The grass is {w}.||\nsheep|The {w} has soft wool.||\nbeach|We play at the {w}.||\nplease|Say thank you and {w}.||\nyellow|The banana is {w}.||\nnight|The stars shine at {w}.||\ndream|I had a happy {w}.||\nroad|Look both ways on the {w}.||`),
 transfer:words(`rainbow|We saw a {w} after the rain.||\nleaf|A {w} fell from the tree.||\nsweet|The candy is {w}.||\nbirthday|It is my {w} today.||\ntoast|I ate {w} with jam.||\ntail|The dog wags its {w}.||`),
 explain:[mc('x1','why','Which clue helps you pick ai or ay?',['Where the sound is: ay at the end, ai in the middle','Which has fewer letters','Which comes first in the alphabet'],0,'Play and today end in ay. Rain and paint have ai in the middle.'),
  mc('x2','why','You are not sure about ee or ea. What can you do?',['Use a hook, then check how it looks','Always pick ee','Always pick ea'],0,'There is no strict rule. A hook and a good look will help.')],
 hints:it=>{const g=gr1(it.w),G=LG1[g];return G?[`Listen to the vowel sound. It says ${G.s}. Which letters can make it?`,G.tip,`Here is the shape: ${it.w.replace(g,'_'.repeat(g.length))}. The sound letters are missing.`]:['Listen to the vowel sound.','Is the sound in the middle or at the end?','Say the word slowly and write each sound.']},
 diag:(it,a)=>{a=lc(a);const g=gr1(it.w),G=LG1[g];if(!G)return'Say the word slowly and check each sound.';
  const alt=G1[g].alts.find(x=>a.includes(x)&&!it.w.includes(x));if(alt)return`You used “${alt}”. It can make the same sound, but this word uses “${g}”. ${G.tip}`;
  if(!a.includes(g))return`The ${G.s} sound is spelled “${g}” here. ${G.tip}`;return'The sound letters are right. Check the other letters one by one.'}};
const LR4={drop:{n:'Drop the silent e',t:'The quiet e waves goodbye before -ing, -ed, -er and -est.'},keepe:{n:'Keep the silent e',t:'The quiet e stays before -ful, -ly, -less and -ness.'},y2i:{n:'Change y to i',t:'A y after a plain letter turns into i before an ending. Not before -ing.'},keepy:{n:'Keep the y',t:'The y stays before -ing, and after a, e, i, o, u (play, enjoy).'},dbl:{n:'Give the last letter a twin',t:'A short word with one vowel and one last letter gets a twin before -ing, -ed or -er.'},add:{n:'Just add the ending',t:'Nothing changes. Stick the ending on.'}};
const in4=(a,s)=>a.filter(x=>s.includes(x.w));
LO.suffix={name:'The Ending Detective',goal:'Look at a word and its ending. Then decide: drop the e, change the y, give a twin, or just add the ending.',rules:LR4,
 enc:{say:'Each word is a short word plus an ending. But the short word can change! Listen, then look at the end of the first word.'},
 notice:[
  mc('n1','notice','happy → happier. What happens to the y?',['It turns into i','It goes away','It gets a twin'],0,'The y turns into i: happ + i + er.'),
  mc('n2','notice','Which ending starts with a plain letter (not a, e, i, o, u)?',['-ing','-ful','-ed'],1,'-ful starts with f. -ing and -ed start with a vowel letter.'),
  mc('n3','notice','hope → hoping. What happens to the silent e?',['It goes away','It stays','It moves to the front'],0,'The quiet e waves goodbye before -ing.'),
  mc('n4','notice','Which word KEEPS its y?',['carried','carrying','happier'],1,'carrying keeps the y. “carriing” would look messy.'),
  mc('d1','diag','Leo wrote “hopeing”. What went wrong?',['He kept the silent e before -ing','He gave the p a twin','He forgot the e'],0,'Take off the e before -ing: hoping.'),
  mc('d2','diag','Mia wrote “carryed”. What did she miss?',['The y turns into i before -ed','Always give a twin','Drop the silent e'],0,'carry ends in a plain letter + y, so the y turns into i: carried.')],
 strat:{title:'The Ending Detective',
  steps:['Look at the end of the short word. Then look at the first letter of the ending.','Ask: does it end in a silent e? In a plain letter + y? Is it a Three Ones word?','Silent e: drop it before -ing (hoping), keep it before -ful (hopeful). Plain letter + y: turn y into i (happier), but keep y before -ing. Three Ones: give a twin. Else: just add it.'],
  ex:'carry + ed<br>Plain letter + y → y turns into i: carr<b>i</b>ed.<br>carry + ing → carrying (the y stays).<br><br>hope + ing → hoping (e goes)<br>hope + ful → hopeful (e stays)',
  exc:[{t:'Why not “carriing”?',x:'Two i letters side by side look messy. So the y stays before -ing: carrying, crying.'},
   {t:'Why keep the e in hopeful but drop it in hoping?',x:'The e leaves so two vowels do not bump. -ful starts with a plain letter, so nothing bumps and the e stays.'},
   {t:'Why is it played, not plaied?',x:'A y after a, e, i, o, u is strong, so it stays: played, enjoyed.'}],
  why:[mc('w1','why','Why keep the e in hopeful but drop it in hoping?',['-ful starts with a plain letter, so nothing bumps','-ful is longer','hopeful is a naming word'],0,'The e only leaves when two vowels would bump.'),
   mc('w2','why','Why is it carrying, not carriing?',['Two i letters would look messy','The y turns into e','carry is short'],0,'The y turns into i before most endings, but not before -ing.')]},
 guided:G4,
 recall:in4(C4,['make','use','smile','care','safe','hurry','try','cry','enjoy','play','funny'].map(x=>({make:'making',use:'used',smile:'smiling',care:'careful',safe:'safely',hurry:'hurried',try:'tried',cry:'crying',enjoy:'enjoyed',play:'player',funny:'funnier'}[x]))),
 transfer:in4(T4,['writing','copied','enjoying','moving','excited','runner','worried']),
 hints:it=>{const r=LR4[it.rule],l=it.l,e=it.r,m={drop:`${l.slice(0,-1)} + ${e}`,keepe:`${l} + ${e}`,keepy:`${l} + ${e}`,add:`${l} + ${e}`,y2i:`${l.slice(0,-1)} + i + ${e}`,dbl:`${l} + ${l.slice(-1)} + ${e}`}[it.rule];
  return['Look at the end of the short word: silent e, plain letter + y, or Three Ones? Then look at the ending.',r.n+'. '+r.t,'Try this: '+m]},
 diag:(it,a)=>{a=lc(a);const r=LR4[it.rule],l=it.l,e=it.r;
  if(a===l+e&&!['keepe','keepy','add'].includes(it.rule))return`You stuck the pieces together. This word needs a change: ${r.n}. ${r.t}`;
  if(it.rule==='keepy'&&a===l.slice(0,-1)+'i'+e)return'Keep the y here. “carriing” looks messy, and a y after a, e, i, o, u always stays.';
  if(it.rule==='keepe'&&a===l.slice(0,-1)+e)return'Keep the silent e here. The ending starts with a plain letter, so the e stays.';
  return`Go step by step. ${r.n}: ${r.t}`}};
// ---- Lower primary: Lessons 7 (Twin-Word Test) and 8 (Wild Words). Word items reuse the Upper hooks, which are already plain; only a gentler subset of words is used. ----
const pk=(id,k,ws)=>LIST.find(l=>l.id===id)[k].filter(x=>ws.includes(x.w));
LO.confused={goal:'Some words sound the same but mean different things. Ask what the word MEANS, and use a hook that fits only one twin.',
 enc:{say:'Each pair sounds the same, or nearly. But the letters and meanings are different. Listen and think about what each one means.'},
 notice:[
  mc('n1','notice','Which word means “belonging to them”?',['their','there'],0,'their = belongs to them. there = a place (it has “here” hiding inside).'),
  mc('n2','notice','Which word is about a PLACE?',['where','wear','were'],0,'where, there and here all talk about a place. They all end in “here”.'),
  mc('n3','notice','Which word means “with no noise”?',['quiet','quite'],0,'quiet = no noise. quite = very or fairly (quite tall).'),
  mc('n4','notice','You put on a hat. Which word do you need?',['wear','where','were'],0,'You wear earrings. There is an “ear” in wear.'),
  mc('d1','diag','Ben wrote “Let us sit over their.” What went wrong?',['He used their (belongs to them) but meant there (a place)','He used two e letters','Nothing is wrong'],0,'He means a place, so it is there. Look for “here” inside.')],
 strat:{title:'The Twin-Word Test',
  steps:['Spot a twin. Two words sound the same, so your ears cannot help.','Ask: what does the word MEAN here? A place? Belongs to someone? No noise?','Use a hook for only ONE twin. there, here and where are all places. see has two e letters, like two eyes.'],
  ex:'I left my bag over ___.<br>It means a place → <b>there</b> (<b>here</b> is inside).<br>It is ___ bag. It belongs to them → <b>their</b>.',
  exc:[{t:'Why do twin words exist?',x:'Long ago, words were said differently. Then the sounds changed and became the same. The spellings stayed different, so they help readers tell the meanings apart.'},
   {t:'Why is it son but sun?',x:'son has the same o as come and some. sun is the star in the sky, with a plain u.'},
   {t:'Why does witch have a t but which does not?',x:'witch has “tch” like catch. which is a question word like what, when and where.'}],
  why:[mc('w1','why','What is the best way to pick between twin words?',['Ask what the word means in the sentence','Pick the one that looks nicer','Spell it the way it sounds'],0,'Only the meaning can tell twins apart.'),
   mc('w2','why','Why can sound not help with their and there?',['They sound the same, so meaning must decide','One of them is silent','They are the same word'],0,'They sound the same. A hook like “there has here inside” helps.')]},
 recall:pk('confused','recall',['their','quite','were','know','knew','see','sun','son','where','which']),
 transfer:pk('confused','transfer',['new','seeing','seen','known','sons','suns']),
 explain:[mc('x1','why','Which question helps you pick between twin words?',['What does it mean in my sentence?','Which one looks nicer?','Which one is shorter?'],0,'Meaning tells twins apart.'),
  mc('x2','why','Which hook works for sea and see?',['see has two e letters, like two eyes','sea is short for seashell','They are the same word'],0,'The best hook fits only one twin.')],
 hints:it=>['This word sounds like another word. Ask what it MEANS in this sentence.',it.hook||'Make a hook that fits only this word.',`It has ${it.w.length} letters and starts with “${it.w[0]}”: ${it.w[0]}${'_'.repeat(it.w.length-1)}`],
 diag:(it,a)=>{a=lc(a);const h=it.hook?' Hook: '+it.hook:'';
  if(it.tr&&a===it.tr)return`“${a}” is a real word, but it is the twin. It means something else here.${h}`;
  if(it.tr&&a.length>0&&P7.has(a))return`“${a}” is a different word with a different meaning.${h}`;
  return`Check each letter against the hook.${h}`}};
LO.tricky={goal:'Some words do not follow a pattern. Find the tricky bit, stick a hook on it, and check your own spelling.',
 enc:{say:'These words do not spell the way they sound. Listen, then look at the tricky bit and its hook.'},
 notice:[
  mc('n1','notice','Which part of island is tricky?',['the silent s','the double l','the last d'],0,'The s is never said. Make a hook: is-LAND.'),
  mc('n2','notice','Which word does NOT sound the way it is spelled?',['cat','Wednesday','jump'],1,'We say “Wenz-day” but write a d. Say Wed-nes-day to remember.'),
  mc('n3','notice','Which hook helps you spell friend?',['A friend is there at the end: fri-END','Friends are fun','fri + yend'],0,'A good hook sticks to the tricky bit. friend ends with end.'),
  mc('n4','notice','Many people leave a letter out of February. Which one?',['The r before the u','The b','The y'],0,'Say it in full: Feb-RU-ary.'),
  mc('d1','diag','Dev wrote “wensday”. What did he miss?',['The d: say Wed-nes-day','The y at the end','A double s'],0,'The tricky bit is the d. Say Wed-nes-day, only for spelling.')],
 strat:{title:'Wild Words: find the tricky bit',
  steps:['Say the word slowly, the way it is written. Which part does not sound right? That is the tricky bit.','Make a hook: say it funny (Wed-nes-day), find a small word inside (cal-END-ar), or make a short sentence.','Look, Say, Cover, Write, Check. Then fix any mistake yourself.'],
  ex:'wednesday<br>The tricky bit is the <b>d</b>. Say it funny: <b>Wed-nes-day</b>.<br>Now cover it, write it, and check it.',
  exc:[{t:'Why does island have an s?',x:'Long ago, the word had no s. Some writers added one by mistake. We never say it, but the s stayed.'},
   {t:'Why does Wednesday have a d?',x:'It means Woden’s day, after an old god. People used to say the d. We stopped, but the spelling stayed.'},
   {t:'What about words with no reason?',x:'Some words, like said and could, have no neat reason. A hook does all the work.'}],
  why:[mc('w1','why','Why does island have an s we do not say?',['Someone added it by mistake long ago','It is a long word','It shows a place'],0,'Knowing the story makes the s easy to remember.'),
   mc('w2','why','Why is a hook better than copying a word again and again?',['It sticks the tricky bit to something you can say or picture','It makes the word shorter','It changes the spelling'],0,'Your memory holds on to pictures and sounds, not to copying.')]},
 recall:pk('tricky','recall',['library','different','beautiful','believe','whole','favourite','february','knowledge']),
 transfer:pk('tricky','transfer',['vegetable','calendar','exercise','interesting','restaurant','language']),
 explain:[mc('x1','why','Which is a good hook for a tricky word?',['Find a small word hiding inside, like END in calendar','Copy it five times without thinking','Guess from the sound'],0,'A hook gives the tricky bit a reason to stay in your head.'),
  mc('x2','why','What does Look, Say, Cover, Write, Check help you do?',['Check your own spelling and fix it yourself','Spell without seeing the word','Hear the word spelled out'],0,'The check at the end turns a mistake into learning.'),
  mc('x3','why','What is tricky in necessary?',['One c and two s letters (one collar, two sleeves)','The letter n','The ending -y'],0,'People mix up the one c and the two s letters.')]};
// ---- Lower primary: Lesson 6 (Chunking Charm: "syllable" becomes "beat") and Lesson 9 (Family-Tree Charm: new cousin hooks, simpler words) ----
LO.chunks={goal:'Cut a long word into beats, spell one small chunk at a time, then join the chunks back up.',
 enc:{say:'Clap the beats as you say each word. One clap is one chunk. Long words are just short chunks stuck together.'},
 notice:[
  mc('n1','notice','Clap “banana”. How many beats does it have?',['2','3','4'],1,'ba · na · na has three beats. Each beat is one chunk.'),
  mc('n2','notice','What does every beat have?',['A vowel sound (a, e, i, o, u)','A capital letter','A twin letter'],0,'Every beat has a vowel sound. So you can count beats by counting vowel sounds.'),
  mc('n3','notice','Which is the best way to chunk “umbrella”?',['um · brel · la','u · mbr · ell · a','umb · re · lla'],0,'um · brel · la: three beats. Each chunk is easy to say and spell.'),
  mc('n4','notice','Which word has FOUR beats?',['banana','elephant','caterpillar'],2,'cat · er · pil · lar has four beats. banana and elephant have three.'),
  mc('d1','diag','Raj wrote “yestaday”. Which chunk went wrong?',['The middle chunk: it is “ter”, not “ta”','The first chunk “yes”','The last chunk “day”'],0,'The middle sounds like “ta” but is spelled ter. Say it as written: yes · TER · day.')],
 strat:{title:'The Chunking Charm',
  steps:['Say the word slowly and clap each beat. One clap is one chunk.','Write the chunks with dots: won · der · ful.','Spell one chunk at a time. Then join them and read the whole word back.'],
  ex:'chocolate → choc · o · late<br>choc: c-h-o-c. o: just o. late: l-a-t-e.<br>Spell each chunk, then stick them together.',
  exc:[{t:'Why do some chunks sound like “uh”?',x:'In long words, some beats go lazy and say “uh”. So the sound cannot tell you the letter. Say the chunk the way it is written, on purpose: hos · pi · TAL.'},
   {t:'What about twin letters in the middle?',x:'Split them: one letter ends a chunk and one starts the next. dif · fer · ent. Now you can see both f letters.'},
   {t:'Why do I clap three beats but write four chunks?',x:'When we talk, we squash a beat. veg-e-ta-ble sounds like “vej-ta-bl”. For spelling, say every chunk slowly.'}],
  why:[mc('w1','why','Why is chunking a long word helpful?',['Small chunks are easier to spell than one big word','Every word has three chunks','Chunks always spell just as they sound'],0,'A long word is a few short chunks. Spell them one by one.'),
   mc('w2','why','What is a beat in a word?',['A chunk with one vowel sound','A single letter','Any two letters'],0,'A beat is one chunk of sound. Each beat has a vowel sound.')]},
 recall:pk('chunks','recall',['adventure','hospital','important','delicious','enormous','festival','generous','calendar']),
 transfer:pk('chunks','transfer',['remember','envelope','ambulance','hesitate','beginning','excellent']),
 explain:[mc('x1','why','What helps with the lazy “uh” sound in a long word?',['Say the chunk as it is written, on purpose (Wed · nes · day)','Leave that chunk out','Pick any vowel'],0,'Say it the written way, even if it sounds funny. Then you see the real letters.'),
  mc('x2','why','What do you do with a twin letter in the middle of a long word?',['Split it: one ends a chunk, one starts the next','Write it once','Move it to the end'],0,'dif · fer · ent shows you both f letters.')]};
const W9L=t=>{const a=words(t);a.forEach(x=>P9.add(x.w));return a};
LO.family={goal:'Words in a family share a main part. Use a cousin word you can HEAR to find the letters you cannot hear.',
 enc:{say:'These words are cousins. Listen to each pair. Which letters can you hear in one word but not in the other?'},
 notice:[
  mc('n1','notice','Which word is a cousin of sign?',['signal','single','silent'],0,'sign and signal share the same main part. In signal you can hear the g.'),
  mc('n2','notice','You cannot hear the g in sign. Where CAN you hear it?',['signal','signed','sign'],0,'In signal. The cousin shows the hidden letter.'),
  mc('n3','notice','Which word is in the family of magic?',['magician','magnet','mattress'],0,'magic + ian = magician. The c stays.'),
  mc('n4','notice','Which letter can you hear in columnist but not in column?',['n','m','u'],0,'columnist has an n you can hear. So column has a silent n.'),
  mc('d1','diag','Tara wrote “dicision”. How does the cousin decide help?',['decide starts with de-c, so decision does too','It shows a silent k','It shows the ending -tion'],0,'decide starts de-c, and decision keeps that: de-c-ision.')],
 strat:{title:'The Family-Tree Charm',
  steps:['Ask: does this word have a cousin? A shorter word, or one with the same main part.','Say the cousin. A letter you cannot hear in one word is often clear in its cousin.','Keep the main part. The ending can change the sound, but the letters stay close to the family.'],
  ex:'sign → signal<br>You cannot hear the g in sign. You can hear it in signal. So sign has a g.<br>know → knew → known: the silent k stays in the whole family.',
  exc:[{t:'Why does decide change to decision?',x:'When -ion joins, the last sound blends and the d turns into s. Same with explode → explosion.'},
   {t:'Why does know have a k we do not say?',x:'Long ago, people said the k. We stopped, but the whole family kept it: know, knew, known.'},
   {t:'Does every cousin work?',x:'Not always. Use the cousin for a good guess, then check it.'}],
  why:[mc('w1','why','Why can a cousin help you spell a word?',['A letter that is quiet in one word is often clear in its cousin','Cousins always sound the same','Cousins are always shorter'],0,'The cousin shows the letter the sound hides.'),
   mc('w2','why','Why is it knew, with a k?',['It is in the family of know, and the k stays','Because it is a long word','Because k sounds like n'],0,'The whole family keeps the silent k.')]},
 guided:W9L(`sign|Please {w} your name here.|gn|Cousin: signal. You can hear the g in signal, so sign has a g too.\nsignal|The traffic light gave a {w}.|gn|Cousin: sign. Say sig-nal: the g is clear here.\nmagician|The {w} pulled a rabbit out of his hat.|cian|Cousin: magic. magic + ian. The c stays.\nmusician|The {w} played the piano.|cian|Cousin: music. music + ian. The c stays.\ndecision|It was a hard {w} to make.|sion|Cousin: decide. The d at the end turns into s: decision.\nknew|She {w} the answer already.|kn|Cousin: know. know has a silent k, and knew keeps it.`),
 recall:W9L(`known|The singer is {w} all over Asia.|kn|Cousin: know. The silent k stays.\nsigned|He {w} his name at the bottom.|gn|Cousin: signal. The g stays, even if it is quiet.\nmagical|The {w} garden was full of fireflies.|ic|Cousin: magic. magic + al. The c stays.\nmusical|She plays a {w} instrument.|ic|Cousin: music. music + al. The c stays.\ndecided|She {w} to join the choir.|cid|Cousin: decide. The e goes before -ed: decided.\ndeciding|We are {w} where to eat lunch.|cid|Cousin: decide. The e goes before -ing: deciding.\nsigning|She is {w} the card for her friend.|gn|Cousin: signal. The g stays.\nknowing|He smiled, {w} he had the right answer.|kn|Cousin: know. The silent k stays.`),
 transfer:W9L(`music|We sing and play {w} in class.|ic|Cousin: musician. You can hear the c in musician, so music has a c.\nmagic|The trick was pure {w}.|ic|Cousin: magician. You can hear the c in magician.\nsigns|The road has many {w}.|gn|Cousin: signal. sign + s: the g stays.\nsignals|The {w} are red and green.|gn|Cousin: sign. signal + s: the g stays.\nmusicians|The {w} tuned their violins.|cian|Cousin: music. music + ians: the c stays.\nmagicians|The {w} showed us a trick.|cian|Cousin: magic. magic + ians: the c stays.`),
 explain:[mc('x1','why','How can you spell column using columnist?',['Hear the n in columnist, so column has a silent n','Spell it just as it sounds','Guess a letter'],0,'The family keeps the letters the sound hides.'),
  mc('x2','why','What stays the same in a word family?',['The main part’s letters, as far as possible','The number of beats','The sound of every letter'],0,'Sounds change. Spellings stay close to the family.')],
 hints:it=>['This word has a cousin that shows the hidden letters. Which word is it a cousin of?',it.hook||'Think of a cousin word.',it.tr&&it.w.includes(it.tr)?`Here is its shape: ${it.w.replace(it.tr,'_'.repeat(it.tr.length))}. The cousin helps with the missing letters.`:'Say the word in chunks and check each one.']};
// ---- Lower primary: Lesson 5 (Word-Builder: prefix/ending/root become word-start/word-end/main word) and Lesson 10 (Memory-Hook) ----
const LR5={un:{n:'The word-start un- (not)',t:'un- means “not”. Stick it on the main word. Keep every letter: un + happy = unhappy. If two n letters meet, write both (unnecessary).'},
 re:{n:'The word-start re- (again)',t:'re- means “again”. Stick it on without changing a letter: re + build = rebuild.'},
 dis:{n:'The word-start dis- (not, the opposite)',t:'dis- means “not”. Keep every letter: dis + appear = disappear.'},
 mis:{n:'The word-start mis- (wrongly)',t:'mis- means “wrongly”. Keep every letter: mis + place = misplace.'},
 pre:{n:'The word-start pre- (before)',t:'pre- means “before”: pre + heat = preheat. Keep every letter.'},
 ful:{n:'The word-end -ful (full of)',t:'-ful means “full of”. It has only ONE l: care + ful = careful.'},
 less:{n:'The word-end -less (without)',t:'-less means “without”: care + less = careless.'}};
LO.prefix={goal:'Build long words from small pieces: word-start + MAIN WORD + word-end. Learn what each piece means. The main word keeps all its letters.',rules:LR5,
 enc:{say:'Each long word is built from pieces. Listen, then look at the pieces: a word-start at the front, the main word, and a word-end at the back.'},
 notice:[
  mc('n1','notice','What does the word-start un- mean?',['not','again','before'],0,'un- means “not”: unhappy = not happy.'),
  mc('n2','notice','Which word means “build again”?',['rebuild','prebuild','misbuild'],0,'re- means “again”: rebuild = build again.'),
  mc('n3','notice','un + necessary: what happens to the letters?',['Nothing changes, so you see two n letters','One n is dropped','The y turns into i'],0,'Nothing is dropped. un keeps its n and necessary keeps its n.'),
  mc('n4','notice','In careful, how many l letters are in -ful?',['One','Two','None'],0,'-ful has ONE l. careful = full of care.'),
  mc('n5','notice','What does the word-start mis- mean?',['wrongly','again','before'],0,'mis- means “wrongly”: misplace = put in the wrong place.'),
  mc('d1','diag','Mei wrote “carefull”. What went wrong?',['She wrote two l letters, but -ful has one','She forgot the silent e','She doubled the r'],0,'The word-end is -ful with one l.')],
 strat:{title:'The Word-Builder’s Charm',
  steps:['Split the word into pieces: word-start + main word + word-end.','Learn what the pieces mean: un- = not · re- = again · dis- = not · mis- = wrongly · pre- = before · -ful = full of · -less = without.','Stick the pieces together WITHOUT changing a letter. If two same letters meet, write both.'],
  ex:'unnecessary = <b>un</b> (not) + <b>necessary</b><br>Both n letters stay: un<b>n</b>ecessary.<br><br>careful = <b>care</b> + <b>ful</b> (full of care). Only ONE l.',
  exc:[{t:'Why is -ful spelled with one l?',x:'The word full lost an l when it became a word-end. So it is careful, not carefull.'},
   {t:'Why does the main word never change?',x:'A word-start is a separate piece at the front. The main word keeps all its letters. So help, helpful, helpless and helping are all easy once you know help.'},
   {t:'What about mis- and pre-?',x:'They work the same way: mis + place = misplace. If same letters meet, keep both: mis + spell = misspell.'}],
  why:[mc('w1','why','Why does unnecessary have two n letters?',['un- and necessary each keep their n','Long words always have nn','The e is silent'],0,'Nothing is dropped when a word-start joins a main word.'),
   mc('w2','why','Why is it careful, not carefull?',['-ful is the short word-end form of full','care is a short word','-ful starts with a vowel'],0,'The word-end has only one l.')]},
 guided:[...pk('prefix','guided',['unhappy','disappear','rebuild','careful','preheat']),...joins('mis+place=misplace|mis|I always {w} my keys.|to put something in the wrong place')],
 recall:pk('prefix','recall',['unkind','careless','disobey','replay','wonderful','peaceful','thankful','thoughtless']),
 transfer:pk('prefix','transfer',['rebuilt','replayed','unkindly','peacefully','disappeared','displeased']),
 hints:it=>{const r=LR5[it.rule],dbl=it.l.slice(-1)===it.r[0];return[it.def?'Think about the meaning: '+it.def+'. Which piece is the word-start?':'Split the word into pieces. What does the word-start or word-end mean?',r.n+'. '+r.t,`Try this: ${it.l} + ${it.r}${dbl?` (two ${it.r[0]} letters meet: keep both)`:''}`]},
 diag:(it,a)=>{a=lc(a);const w=it.w;
  if(w.endsWith('ful')&&a.endsWith('full'))return'-ful has only ONE l.';
  if(it.l.slice(-1)===it.r[0]&&a.length===w.length-1)return`Keep both letters when the pieces meet: ${it.l} + ${it.r} makes two ${it.r[0]} letters.`;
  if(a.length<w.length)return`A letter is missing. Stick the pieces together without changing any letter: ${it.l} + ${it.r}.`;
  return`Check the pieces: ${it.l} + ${it.r}. ${LR5[it.rule].n}.`}};
LO.hooks={goal:'Some words have no rule. Find the tricky part and make a memory hook that sticks to it: a small word inside, a silly sentence, a picture, or a funny way to say it.',
 enc:{say:'These words have a tricky part. Each has a hook: a little trick that sticks to the tricky letters. Read the hook out loud and picture it.'},
 notice:[
  mc('n1','notice','Which hook hides a small word INSIDE the big word?',['“a rat” in sep-a-rat-e','Say it three times fast','Write it in big letters'],0,'A little word hiding inside a big one is a strong hook: sep-a-RAT-e.'),
  mc('n2','notice','“Big Elephants Can Always Understand Small Elephants” helps you spell which word?',['because','beautiful','believe'],0,'The first letters spell B-E-C-A-U-S-E. A silly sentence like this is a first-letters hook.'),
  mc('n3','notice','Which hook is best for “friend”?',['fri-END: a friend is there at the end','Friends are fun','f-r-i-e-n-d is a long word'],0,'A good hook points at the tricky letters and gives them a picture.'),
  mc('n4','notice','“One collar, two sleeves” helps with necessary. Which letters?',['One c and two s','The last letter y','The first letter n'],0,'A shirt has one collar (c) and two sleeves (ss).'),
  mc('d1','diag','Dev wrote “seperate”. Which hook fixes his mistake?',['There is a rat in sep-a-RAT-e','It sounds like sep-rit','Say sep-er-ate'],0,'The hook puts the a where Dev wrote an e.')],
 strat:{title:'The Memory-Hook Charm',
  steps:['Find the tricky part: the letters you get wrong.','Make a hook for JUST that part: a small word inside, a silly sentence, a picture, or a funny way to say it.','Test it: say the hook, write the word, then check the tricky part.'],
  ex:'separate<br>Tricky part: the middle a (many people write e).<br>Hook: there is <b>a rat</b> in sep-<b>a-rat</b>-e. Picture a rat in the middle!',
  exc:[{t:'Does a hook work for every word?',x:'No. Use the tricks from Lessons 2 to 5 first. A hook is for the tricky part that has no trick, like the c and ss in necessary.'},
   {t:'Why are silly hooks better?',x:'Your brain remembers pictures and surprises. A rat in the middle of a word is odd enough to stay in your head.'},
   {t:'Whose hook is best?',x:'The one you make yourself. If it makes YOU smile, it will stick.'}],
  why:[mc('w1','why','What makes a good hook?',['It points at the tricky letters and is easy to picture','It is long and tricky','It has nothing to do with the word'],0,'A hook only helps if it lands on the part you get wrong.'),
   mc('w2','why','When do you use a hook?',['When the tricky part has no rule','For every word','Never'],0,'Use the tricks first. A hook is for the leftovers.')]},
 guided:pk('hooks','guided',['separate','because','friend','believe','necessary']),
 recall:pk('hooks','recall',['height','library','dessert','tomorrow','neighbour','receive','vacuum']),
 transfer:pk('hooks','transfer',['island','queue','shepherd','poisonous','secretary','weird']),
 explain:[mc('x1','why','Which is a hook for the word “height”?',['Eight is hiding in h-EIGHT','Height is a long word','It is the opposite of low'],0,'A hook sticks to the tricky letters (eight).'),
  mc('x2','why','What should a hook point at?',['The tricky part of the word','The first letter only','How many letters it has'],0,'A hook that points somewhere else will not help.')]};
// ---- Lower primary: Lesson 11 (Error Doctor: slip names in plain words) and Lesson 12 (Detectives: clue names and plain "why" notes) ----
const FXL={doubling:['a twin-letter slip','A letter that needed a twin was written once (or got a twin it did not need). Chunk the word and check the twin letters.'],
 silente:['a missing quiet e','The quiet e was left off, so the vowel stays short. The Magic-e Wand puts it back (kit → kite).'],
 vowel:['a wrong vowel','A vowel is wrong, or two vowels are the wrong way round. A hook helps (a rat in sep-a-RAT-e).'],
 transposition:['two letters swapped','Two letters swapped places. Check the letters in order, left to right.'],
 phonetic:['spelling it as it sounds','The word was spelled the way it sounds. But English can spell a sound in different ways, or hide a letter. Learn the trick.'],
 omission:['a missing letter','A letter is missing. Chunk the word and check each chunk.'],
 insertion:['an extra letter','An extra letter crept in. Chunk the word and check each chunk.']};
LO.errors={goal:'Read a misspelling like a doctor: find the slip, say what kind of slip it is, and fix it with the right trick.',
 enc:{say:'Every misspelling is a clue. It shows WHERE the speller went wrong and WHY. Look at each mistake, then at the cure.',fixes:[['acommodate','accommodate','There are two c letters and two m letters.'],['seperate','separate','The middle letter is an a: there is a rat in sep-a-rat-e.'],['recieve','receive','After c, e comes first.'],['kit','kite','The quiet e was left off, so the i stayed short.']]},
 notice:[
  mc('n1','notice','Which word is misspelled?',['friend','freind','island'],1,'freind has the i and e the wrong way round. It is fri-END: friend.'),
  mc('n2','notice','Which is the right spelling?',['neccessary','necessary','necesary'],1,'necessary has one c and two s: one collar, two sleeves.'),
  mc('n3','notice','Which spelling has an EXTRA letter?',['beautifull','beautiful','beutiful'],0,'-ful has just one l. beautifull has an extra l.'),
  mc('n4','notice','Which spelling has a letter MISSING?',['Febuary','February','Februrary'],0,'Febuary lost the first r. It is Feb-RU-ary.'),
  mc('d1','diag','Maya wrote “seperate” for “separate”. What kind of slip is it?',['A wrong vowel: e instead of a','A missing letter','An extra letter'],0,'The a in the middle became an e. A hook helps: a rat in sep-a-RAT-e.')],
 strat:{title:'The Error-Doctor Charm',
  steps:['Look: read the wrong word slowly, one letter at a time. Point at each letter.','Find the slip and name it: a wrong vowel, a missing letter, an extra letter, a twin letter, swapped letters, or a quiet letter.','Fix it with the right trick: a rule, chunking, a twin-word check, or a hook.','Check: write the word again from memory and say how you know.'],
  ex:'seperate → separate<br>Look: s-e-p-e-r-a-t-e. The second e is the slip.<br>Name it: a wrong vowel (e instead of a).<br>Fix it: a rat in sep-<b>a</b>-rat-e.',
  exc:[{t:'Why do the same words go wrong again and again?',x:'The brain remembers the sound and the first spelling it saw. If nobody finds the exact slip, the same slip comes back. Naming the slip helps it stop.'},
   {t:'What if I cannot find the slip?',x:'Put the right word under the wrong one. Compare them letter by letter. Slips like to hide in the middle.'},
   {t:'Is spelling it as it sounds a real mistake?',x:'It is a very sensible one! English can spell the same sound in many ways. That is why we use tricks and hooks too.'}],
  why:[mc('w1','why','What does an error doctor do first?',['Reads the word slowly, one letter at a time','Rewrites it faster','Asks someone else'],0,'Slow, careful looking finds the slip. Guessing does not.'),
   mc('w2','why','Why is it useful to NAME the slip?',['Each kind of slip has its own fix','It loses you a mark','It makes the word longer'],0,'A missing letter is fixed by chunking. A wrong vowel is fixed by a hook.')]},
 guided:[...pk('errors','guided',['kite','knife','library','separate']),...pk('errors','recall',['friend'])],
 recall:pk('errors','recall',['because','island','tomorrow','surprise','weird','business']),
 transfer:pk('errors','transfer',['calendar','exercise','language','schedule','neighbour','scissors']),
 explain:[mc('x1','why','What do you do first when you check a misspelling?',['Read it slowly, one letter at a time','Guess the answer','Cross it out'],0,'Slow looking comes first.'),
  mc('x2','why','“libary” is missing a letter. Which trick helps most?',['Chunk it: li · brar · y','The Magic-e Wand','Give the last letter a twin'],0,'Chunking shows every beat, so a missing letter stands out.')],
 hints:it=>['Look at the wrong word one letter at a time. Which part looks wrong?',it.hook?'Doctor’s note: '+it.hook:'Think of the trick that fits the slip.',`Start by writing the first letters: “${it.w.slice(0,Math.max(2,Math.ceil(it.w.length/2)))}…”`],
 diag:(it,a)=>{a=lc(a);const S=sp();
  if(it.bad&&a===lc(it.bad))return'That is the wrong spelling again. Compare it with the right one, letter by letter.';
  const t=S&&S.classify?S.classify(it.w,a):null;
  return t&&FXL[t]?`Your answer shows ${FXL[t][0]}. ${FXL[t][1]}`:'Read your answer slowly, one letter at a time, and compare it with the doctor’s note.'},
 diagQ:it=>{const S=sp(),t=S&&it.bad&&S.classify?S.classify(it.w,lc(it.bad)):null;if(!t||!FXL[t])return null;
  const others=Object.keys(FXL).filter(k=>k!==t).sort(()=>Math.random()-.5).slice(0,2),o=[t,...others].map(k=>FXL[k][0]);
  return mc('dq_'+it.w,'diag',`A pupil wrote “${it.bad}” for “${it.w}”. What kind of slip is that?`,o,0,`That is ${FXL[t][0]}. ${FXL[t][1]}`)}};
const RUL={sound:{n:'Sound clue',t:'Which letters make this sound? Where is it in the word?'},
 silente:{n:'Magic-e Wand',t:'A vowel, one letter, then a quiet e makes the vowel say its name.'},
 double:{n:'Twin-Letter Charm',t:'One beat, one vowel, one last letter? Give the last letter a twin before -ing, -ed or -er.'},
 suffix:{n:'Ending Detective',t:'Drop the quiet e, or turn y into i, before an ending.'},
 build:{n:'Word-Builder',t:'Word-start + main word + word-end. Every piece keeps its own spelling.'},
 chunk:{n:'Chunking',t:'Cut the word into beats and spell each chunk.'},
 twin:{n:'Twin-word test',t:'Ask what the word MEANS. Then pick the twin that fits.'},
 wild:{n:'Wild word',t:'The word breaks the patterns. Learn its odd part by heart.'},
 family:{n:'Cousin words',t:'A cousin word you can hear shows the hidden letters.'},
 hook:{n:'Memory hook',t:'A hook sticks to the tricky part.'}};
LO.detectives={goal:'Use every trick together. Meet words you have never practised, pick the best clue to spell them, and say how you know, like a detective.',rules:RUL,dl:'Why',
 enc:{say:'A Spelling Detective never just guesses. For each word, look for a clue, use it, and say how you know. Here are four cases solved.',items:[{w:'swimming',tr:'mm',hook:'Twin-Letter Charm: swim + m + ing.'},{w:'unlucky',tr:'un',hook:'Word-Builder: un + lucky.'},{w:'musician',tr:'ci',hook:'Cousin words: music → musician.'},{w:'together',tr:'',hook:'Memory hook: to + get + her.'}]},
 notice:[
  mc('n1','notice','You must spell “unhappy”. Which clue helps?',['un + happy: a word-start stuck on a main word','It sounds like unhappy','It has a quiet letter'],0,'Word-Builder clue: un- is stuck on happy, and happy keeps its own spelling.'),
  mc('n2','notice','Which clue explains the twin p in “stopped”?',['stop has one beat, one vowel and one last letter','p always gets a twin','It sounds quick'],0,'Twin-Letter Charm: stop + p + ed.'),
  mc('n3','notice','Which word shows the cousin clue?',['musician (from music)','kitten','banana'],0,'You can hear the c in music, so musician keeps it.'),
  mc('n4','notice','Which clue helps with a long word like “astronaut”?',['Chunk it into beats: as · tro · naut','Skip the middle','Guess the vowels'],0,'Chunking turns a long word into short pieces.'),
  mc('d1','diag','Sam wrote “makeing”. Which clue did he forget?',['The quiet e goes away before -ing','Give the k a twin','Add another e'],0,'make + ing makes making. The quiet e waves goodbye.')],
 strat:{title:'The Detective’s Method',
  steps:['LISTEN and CHUNK: say the word slowly and clap the beats.','LOOK for clues: a trick, a word-start or word-end, a cousin word, a twin, a wild part, or a hook?','DECIDE: write the word with the best clue.','CHECK and SAY: does it look right? Say: “I wrote ___ because ___.”'],
  ex:'unlucky<br>Clue: Word-Builder. un + lucky.<br>“I wrote <b>unlucky</b> because un- is stuck on lucky, and lucky keeps its own spelling.”',
  exc:[{t:'What if two clues fit?',x:'Wonderful! Two clues that agree make you even more sure.'},
   {t:'What if no clue fits?',x:'Then it is probably a wild word. Find the odd part and make a hook for it.'},
   {t:'Can a detective be wrong?',x:'Yes! That is why the last step is CHECK. If a word looks wrong, try another clue or look it up.'}],
  why:[mc('w1','why','Why does a detective say HOW they know?',['Saying it shows you understand the clue, so you can use it again','It makes the test slower','It is only for teachers'],0,'If you can explain a clue, you can use it on a new word.'),
   mc('w2','why','A word fits no trick you know. What should a detective do?',['Treat it as a wild word and make a hook','Spell it as it sounds and move on','Give up'],0,'Wild words are learned by heart. A hook helps the odd part stick.')]},
 guided:words12(`swimming|We are {w} in the pool.|double|swim has one beat, one vowel and one last letter. So the m gets a twin: swim + m + ing.|\nsmiling|She was {w} from ear to ear.|suffix|smile ends in a quiet e. The e goes away before -ing: smil + ing.|silente\nrailway|The {w} goes to the city.|sound|The “ay” sound is spelled ai in rail and ay in way: rail + way.|build\nunlucky|It was an {w} day for the team.|build|un + lucky: un- is stuck on lucky, and lucky keeps its spelling.|\nmusician|My uncle is a talented {w}.|family|Cousin: music. You can hear the c in music: music + ian.|\nbutterfly|A {w} landed on the flower.|chunk|but · ter · fly: the twin t is split, one t on each side.|`),
 recall:words12(`stopped|The bus {w} at the light.|double|stop has one beat, one vowel and one last letter: stop + p + ed.|\nbabies|The two {w} were asleep.|suffix|baby ends in a plain letter + y. The y turns into i: bab + ies.|\ntoaster|Dad put bread in the {w}.|sound|The “oh” sound is spelled oa in the middle of a word: t-oa-st-er.|\ncareless|It was a {w} mistake.|build|care + less: both pieces keep their spelling, so the e stays.|\nanswer|Please write your {w} on the line.|wild|The w is quiet, so answer is a wild word. Learn the w by heart.|\npiece|May I have a {w} of cake?|twin|It means a part of something. Its twin, peace, means calm.|\ntogether|We walked home {w}.|hook|to + get + her: a hook that splits the word into three small words.|chunk\nwinner|The {w} got a gold medal.|double|win has one beat, one vowel and one last letter: win + n + er.|`),
 transfer:words12(`planning|We are {w} a surprise party.|double|plan has one beat, one vowel and one last letter: plan + n + ing.|\nhurried|She {w} to catch the bus.|suffix|hurry ends in a plain letter + y. The y turns into i: hurr + ied.|\nrebuild|They will {w} the old bridge.|build|re + build: re- is stuck on build, and build keeps its u.|\nhear|I can {w} a bird singing.|twin|You do it with your ear, and hear has ear inside. Its twin, here, is a place.|\ncastle|The knight lived in a {w}.|wild|The t is quiet, so castle is a wild word. Learn the t by heart.|\ncheerful|The {w} baker greeted everyone.|build|cheer + ful: both pieces keep their spelling, and -ful has one l.|`),
 explain:[],
 hints:it=>{const r=RUL[it.rule];return['LISTEN and CHUNK: say the word slowly. How many beats do you hear?',r?`A clue to try: the ${r.n}. ${r.t}`:'Look for a clue: a trick, a word-start or word-end, a cousin word, a twin, a wild part or a hook.',`It has ${it.w.length} letters and starts with “${it.w[0]}”: ${it.w[0]}${'_'.repeat(it.w.length-1)}`]},
 diag:(it,a)=>{const r=RUL[it.rule];return r?`Think about the ${r.n}. ${r.t}`:'Look for a clue: a trick, a word-start or word-end, a cousin word, a twin, a wild part or a hook.'},
 decide:it=>{const r=it.rule;if(!r||!RUL[r])return null;const no=new Set([r,...(it.also||[])]),o=[r,...Object.keys(RUL).filter(k=>!no.has(k)).sort(()=>Math.random()-.5).slice(0,3)].map(k=>RUL[k].n);
  return mc('dq_'+it.w,'rule',`Detective’s report on “${it.w}”: which clue decided the spelling?`,o,0,`${RUL[r].n}. ${it.def}`)}};
// ---- Lower primary (v4.3.1): Spellbook chip labels. Same lesson ids; only the label text changes. ----
const TAGLO={'silent e':'magic e','e rule-breaker':'tricky e word','double letters':'twin letters','ending change':'word-end change','prefix & endings':'word-start & end','chunk it':'clap the beats','twin word':'sound-alike word','word family':'cousin words'};
const pools=l=>[...(l.guided||[]),...(l.recall||[]),...(l.transfer||[])];
const VC=new Map(),view=l=>{let m=VC.get(l.id);if(!m){const o=LO[l.id];m={...l,...o,lower:true};for(const k of['strat','enc'])if(o[k])m[k]={...l[k],...o[k]};VC.set(l.id,m)}return m}; // Lower primary: the lesson with its plain-language overrides merged over the Upper text
const get=(id,lo)=>{const l=LIST.find(x=>x.id===id);return l&&LO[id]&&(lo===undefined?API.low:lo)?view(l):l},list=lo=>LIST.map(l=>get(l.id,lo)); // lo: true = Lower, false = Upper, omitted = the browser's current setting (Lessons.low). The Worker always passes it, so nothing is shared between requests
const find=(id,w)=>{const l=get(id);return l?pools(l).find(x=>x.w===w)||null:null};
const tag=(w,lo)=>{w=lc(w);const out=[],low=lo===undefined?API.low:lo;for(const l of LIST){const t=l.tag&&l.tag(w);if(t)out.push({l:l.id,t:low&&TAGLO[t]||t})}return out}; // chip labels: plain wording for Lower classes
const match=(id,w)=>{const l=get(id);return !!(l&&l.match&&l.match(lc(w)))};
const API=g.Lessons={LIST,PLAN,STAGES,BIT,get,list,find,tag,match,pools,low:false,HAS_LOWER:id=>!!LO[id]};
if(typeof module!=='undefined')module.exports=g.Lessons;
})(typeof self!=='undefined'?self:globalThis);
