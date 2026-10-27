// Spellcraft Lessons (v3.0+): lesson content and pattern tools, shared by the browser (classic script) and the Worker (import).
//   Lessons.LIST            the lessons that are built (each is plain data plus a few small functions)
//   Lessons.PLAN            all 12 planned lessons (the ones not built yet show as "coming next")
//   Lessons.get(id)         one lesson
//   Lessons.tag(w)          [{l: lesson id, t: short label}] pattern chips for a word (Spellbook, review scheduling)
//   Lessons.find(id,w)      the lesson item (sentence, hook...) for a word, if the lesson has it in a pool
// To add a lesson: push one object onto LIST (see the comments in the existing lessons). Nothing else needs to change.
(function(g){
// word items:  word|sentence with {w}|tricky part|memory hook          join items:  root+ending=result|rule|sentence with {w}
const words=t=>t.trim().split('\n').map(l=>{const[w,s,tr,hook]=l.split('|');return{w:w.trim(),s:s.trim(),tr:tr||'',hook:hook||''}});
const joins=t=>t.trim().split('\n').map(l=>{const[eq,rule,s]=l.split('|'),[lr,w]=eq.split('='),[a,b]=lr.split('+');return{l:a,r:b,w,rule,s:s.trim()}});
const STAGES=['learn','guided','recall','transfer','retain'],BIT={learn:1,guided:2,recall:4,transfer:8,retain:16};
const PLAN=[[1,'Sound-to-Spelling Patterns','Common sounds, alternative letter patterns and grapheme choices.'],[2,'Silent-e and Vowel Changes','cap/cape, kit/kite, hop/hope.'],[3,'Double Consonants','hop/hopping, plan/planning, swim/swimming.'],[4,'Suffixes and Spelling Changes','happy/happier, carry/carried, hope/hoping.'],[5,'Prefixes, Roots and Word Families','help/helpful/helpless; sign/signal/signature.'],[6,'Syllables and Longer Words','Breaking words into manageable chunks.'],[7,'Easily Confused Words','their/there, quiet/quite, lose/loose.'],[8,'Tricky and Irregular Words','Learning words that cannot be fully explained by familiar patterns.'],[9,'Morphology and Meaning','magic/magician, compete/competition, decide/decision.'],[10,'Mnemonics and Visual Memory','Memorable spelling clues, such as necessary and accommodate.'],[11,'Error Diagnosis','Identify, explain and correct misspellings such as acommodate and seperate.'],[12,'Spelling Detectives','Apply the strategies to unfamiliar words and explain spelling decisions.']];
const LIST=[];
// A question card: k = notice (pattern recognition) | diag (error diagnosis) | why (strategy knowledge); o = options; a = index of the right option; x = explanation shown afterwards
const mc=(id,k,q,o,a,x)=>({id,k,q,o,a,x});
const lc=s=>String(s||'').toLowerCase();
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
const pools=l=>[...(l.guided||[]),...(l.recall||[]),...(l.transfer||[])];
const get=id=>LIST.find(l=>l.id===id);
const find=(id,w)=>{const l=get(id);return l?pools(l).find(x=>x.w===w)||null:null};
const tag=w=>{w=lc(w);const out=[];for(const l of LIST){const t=l.tag&&l.tag(w);if(t)out.push({l:l.id,t})}return out};
const match=(id,w)=>{const l=get(id);return !!(l&&l.match&&l.match(lc(w)))};
g.Lessons={LIST,PLAN,STAGES,BIT,get,find,tag,match,pools};
if(typeof module!=='undefined')module.exports=g.Lessons;
})(typeof self!=='undefined'?self:globalThis);
