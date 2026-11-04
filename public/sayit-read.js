// Say It! reading path (v1.0): curriculum data and the rules that decide what a child may be shown. Shared by the browser, the Worker and the tests.
// Rules baked in here: sounds not letter names; one new sound at a time; a word or sentence is offered only if every sound in it has been taught
// (apart from taught tricky words); mastery needs about 85% over the last 6 tries on 2 different days; reviews come back after 1, 2, 4 and 7 days.
// Original wording and actions throughout. This is NOT Jolly Phonics material: the sequence "jolly" only follows the common order of sound groups.
(function(g){
// ---- Sounds. id | text shown | IPA (parent view only; never shown to children) | spoken fallback | type | picture words (emoji:word) | original action
// type: c consonant, v vowel, d consonant digraph, w vowel digraph, e word ending
const GR_SRC=`
s|s|s|sss|c|☀️:sun,🐌:snail,🧦:sock|Sizzle your fingers like sausages in a pan.
a|a|æ|ah|v|🍎:apple,🐜:ant,🪓:axe|Take a big pretend bite of an apple.
t|t|t|tuh|c|⛺:tent,👔:tie,🌳:tree|Tap your toes quickly.
i|i|ɪ|ih|v|🖋️:ink,🐛:insect|Wriggle an inky finger on your palm.
p|p|p|puh|c|🐷:pig,🍳:pan,🥧:pie|Pop a pretend bubble with your lips.
n|n|n|nnn|c|🥜:nut,👃:nose,🥅:net|Nod your head and hum.
ck|ck|k|kuh|d|🐱:cat,🪁:kite,🔑:key,🦆:duck|Click your fingers.
e|e|e|eh|v|🥚:egg,🐘:elephant,🧝:elf|Crack a pretend egg into a bowl.
h|h|h|huh|c|🎩:hat,🐔:hen,🏠:house|Pant like a hot puppy.
r|r|r|rrr|c|🐀:rat,💍:ring,🌧️:rain|Shake your arms like a robot.
m|m|m|mmm|c|🗺️:map,🌙:moon,🐭:mouse|Stir a big pretend pot.
d|d|d|duh|c|🐶:dog,🥁:drum,🦆:duck|Dig a pretend hole.
g|g|g|guh|c|🐐:goat,🎁:gift,🍇:grapes|Gulp pretend water.
o|o|ɒ|oh|v|🍊:orange,🐙:octopus,🫒:olive|Make a round O with your arms.
u|u|ʌ|uh|v|☂️:umbrella,🆙:up|Open a pretend umbrella above your head.
l|l|l|lll|c|🦁:lion,🍃:leaf,🍋:lemon|Lick a pretend lollipop.
f|f|f|fff|c|🐟:fish,🦊:fox,🐸:frog|Let the air out of a flat tyre.
b|b|b|buh|c|⚽:ball,🐝:bee,🚌:bus|Bounce a pretend ball.
ai|ai|eɪ|ay|w|🌧️:rain,🐌:snail,🚆:train|Wiggle your fingers down like raindrops.
j|j|dʒ|juh|c|✈️:jet,👖:jeans,🧃:juice|Jump up like jelly on a plate.
oa|oa|əʊ|oh|w|⛵:boat,🧥:coat,🧼:soap|Row a pretend boat.
ie|ie|aɪ|eye|w|🥧:pie,👔:tie,🪁:kite|Fly a pretend kite.
ee|ee|iː|ee|w|🐝:bee,🌳:tree,🐑:sheep|Squeak like a mouse.
or|or|ɔː|or|w|🍴:fork,🐴:horse,🌽:corn|Hold up a pretend fork.
z|z|z|zzz|c|🦓:zebra,🤐:zip,0️⃣:zero|Buzz like a bee.
w|w|w|wuh|c|🕸️:web,⌚:watch,🐺:wolf|Wave both hands wide.
ng|ng|ŋ|ng|d|💍:ring,👑:king,🎵:song|Swing a pretend gong.
v|v|v|vvv|c|🚐:van,🌋:volcano,🎻:violin|Hum like a vacuum cleaner.
oo|oo|uː|oo|w|🌙:moon,🥄:spoon,🥾:boot|Point up at the moon.
oo_s|oo|ʊ|uh|w|📖:book,🦶:foot,🧑‍🍳:cook|Hold a pretend book open.
y|y|j|yuh|c|🪀:yo-yo,🍠:yam,🛥️:yacht|Stretch and yawn.
x|x|ks|ks|c|📦:box,🦊:fox,6️⃣:six|Cross your arms in a big X.
ch|ch|tʃ|chuh|d|🍟:chip,🧀:cheese,🪑:chair|Chug like a little train.
sh|sh|ʃ|shh|d|🚢:ship,🐑:sheep,🐚:shell,👟:shoe|Put a finger on your lips.
th|th|θ|thh|d|👍:thumb,3️⃣:three,🧵:thread|Poke out your tongue tip and blow.
th_v|th|ð|thuh|d|🪶:feather,👨:father,👩:mother|Tongue between your teeth, and buzz.
qu|qu|kw|kwuh|d|👸:queen,🦆:quack,❓:question|Quack with your hand like a beak.
ou|ou|aʊ|ow|w|🐭:mouse,🏠:house,☁️:cloud|Shake a hand as if it got pricked: ouch!
oi|oi|ɔɪ|oy|w|🪙:coin,🛢️:oil|Spin a pretend coin.
ue|ue|uː|oo|w|🔵:blue,🔍:clue|Point at the blue sky.
er|er|ə|er|w|👧:sister,🐯:tiger,🌸:flower|Shiver: brrr, er, er.
ar|ar|ɑː|ar|w|🚗:car,⭐:star,🦈:shark,🚜:farm|Open wide as if at the doctor.
c|c|k|kuh|c|🐱:cat,🥤:cup,🐄:cow|Curl your fingers like cat claws.
k|k|k|kuh|c|🪁:kite,🔑:key,🦘:kangaroo|Kick a pretend ball.
ff|ff|f|fff|c|💨:puff,🧗:cliff,👃:sniff|Puff out your cheeks.
ll|ll|l|lll|c|🔔:bell,🐚:shell,🪆:doll|Ring a pretend bell.
ss|ss|s|sss|c|💋:kiss,👗:dress,🌿:grass|Hiss softly like a leaking tyre.
zz|zz|z|zzz|c|🐝:buzz,🎷:jazz,🥤:fizz|Buzz and fizz your fingers.
igh|igh|aɪ|eye|w|💡:light,🌃:night,🛩️:flight|Twinkle your fingers like a light.
ur|ur|ɜː|er|w|🍔:burger,🟣:purple,🧑‍⚕️:nurse|Spin a pretend purple top.
ow|ow|aʊ|ow|w|🐄:cow,🦉:owl,🤡:clown|Moo like a cow.
ear|ear|ɪə|eer|w|👂:ear,🦌:deer,🧔:beard|Cup your hand behind your ear.
air|air|eə|air|w|🪑:chair,💇:hair,🪜:stairs|Sweep your hand through your hair.
ure|ure|ʊə|oor|w|🧳:tour|Hold a pretend trophy up.
+s|s|z|sss|e|🐱:cats,🐶:dogs,🐷:pigs|Add a tail: one more, so add s.
+ed|ed|d|duh|e|🦘:jumped,🆘:helped,💋:kissed|Turn back time: it happened already.
+ing|ing|ɪŋ|ing|e|🏃:running,🦘:jumping,🎵:singing|Keep it going: ing.
`.trim().split('\n');
const GR={};const ALL=[];
for(const l of GR_SRC){const[id,text,ipa,tts,type,pics,act]=l.split('|');
 GR[id]={id,text,ipa,tts,type,act,pics:pics.split(',').map(x=>{const i=x.indexOf(':');return{e:x.slice(0,i),w:x.slice(i+1)}})};ALL.push(id)}

// ---- Sequences: groups of sound ids. "jolly" follows the common 7-group order (42 sounds); "ls" follows the Letters-and-Sounds style order.
// The three endings come last in both, so a word with -s, -ed or -ing is offered only at the end.
const SEQ={
 jolly:[['s','a','t','i','p','n'],['ck','e','h','r','m','d'],['g','o','u','l','f','b'],['ai','j','oa','ie','ee','or'],['z','w','ng','v','oo','oo_s'],['y','x','ch','sh','th','th_v'],['qu','ou','oi','ue','er','ar'],['+s','+ed','+ing']],
 ls:[['s','a','t','p'],['i','n','m','d'],['g','o','c','k'],['ck','e','u','r'],['h','b','f','ff','l','ll','ss'],['j','v','w','x'],['y','z','zz','qu'],['ch','sh','th','th_v','ng'],['ai','ee','igh','oa'],['oo','oo_s','ar','or','ur','ow','oi','ear','air','ure','er'],['+s','+ed','+ing']]};
// In "jolly" some spellings share a sound id (c, k and ck are one sound; doubled letters belong to the single letter; ow is ou; ur is er).
const ALIAS={jolly:{c:'ck',k:'ck',ff:'f',ll:'l',ss:'s',zz:'z',ow:'ou',ur:'er'},ls:{}};
const flat=seq=>SEQ[seq].flat();
const tokId=(t,seq)=>(ALIAS[seq]||{})[t]||t;
const groupOf=(seq,id)=>SEQ[seq].findIndex(gr=>gr.includes(id));
const takenFor=(seq,n)=>flat(seq).slice(0,n); // the first n sounds in order

// ---- Tricky words, by tier (taught with the sounds: tier 1 from the start, 2 after 18 sounds, 3 after 30)
const TRICKY=[['the','to','I','no','go','a'],['he','she','we','me','be','is','his','has','was','you','my','are'],['they','said','have','like','so','do','all','come','some','little','one']];
const trickyTier=n=>n>=30?3:n>=18?2:1;
const trickyFor=n=>TRICKY.slice(0,trickyTier(n)).flat();

// ---- Words. Written as sound-by-sound splits: "s-a-t". ":" adds a picture, "|" marks a syllable break.
const BANK_SRC=`
s-a-t s-i-t s-i-p s-a-p t-a-p t-i-p p-i-t p-i-n:📌 p-a-n:🍳 n-a-p n-i-p t-a-n t-i-n a-n-t:🐜 p-a-t p-i-p a-t i-t i-n a-n a-n-d o-n u-p u-s i-f
s-i-ck p-i-ck t-i-ck n-e-ck p-e-ck d-e-ck h-e-n:🐔 p-e-n:🖊️ t-e-n:🔟 m-e-n r-e-d:🟥 r-i-d r-i-p r-a-m:🐏 r-a-t:🐀 r-a-n r-i-m h-a-m:🍖 h-i-m h-i-p h-i-t h-a-t:🎩 h-a-d d-a-d:👨 d-i-d d-i-p d-i-g d-e-n m-a-d m-a-p:🗺️ m-a-t m-e-t m-u-m n-e-t:🥅 p-e-t s-e-t s-a-d r-a-ck s-a-ck t-a-ck k-i-t c-a-t:🐱 c-a-p:🧢 c-a-n:🥫
g-o-t d-o-g:🐶 p-i-g:🐷 b-i-g b-a-g:👜 b-u-g:🐛 b-u-n:🍞 b-u-s:🚌 b-u-t c-u-t c-u-p:🥤 s-u-n:☀️ r-u-n m-u-d h-u-g h-u-t n-u-t:🥜 l-i-p:👄 l-a-p l-e-t l-e-g:🦵 l-o-g:🪵 l-o-t f-a-n f-i-t f-i-g f-o-g b-e-d:🛏️ b-a-d b-a-t:🦇 b-i-t b-i-n b-u-d b-e-g b-i-b r-u-b r-u-g r-o-b r-o-t t-o-p p-o-p p-o-t:🍲 h-o-t h-o-p m-o-p:🧹 d-o-t g-a-p g-u-m s-u-m f-u-n p-u-p m-e-n-d p-o-n-d w-e-n-t
r-ai-n:🌧️ t-ai-l s-ai-l p-ai-l m-ai-l:✉️ n-ai-l w-ai-t j-a-m j-e-t:✈️ j-u-g j-o-g j-u-m-p b-oa-t:⛵ c-oa-t:🧥 g-oa-t:🐐 r-oa-d:🛣️ s-oa-p:🧼 t-oa-d p-ie:🥧 t-ie:👔 l-ie b-ee:🐝 s-ee f-ee-t:🦶 s-ee-d t-r-ee:🌳 f-ee-l d-ee-p w-ee-k n-ee-d k-ee-p s-l-ee-p f-or f-or-k:🍴 c-or-n:🌽 h-or-n:📯 b-or-n s-or-t p-or-t c-or-d s-t-or-m
z-i-p z-a-p z-oo:🦓 w-e-b:🕸️ w-i-n w-e-t w-a-g w-i-g w-i-ll r-i-ng:💍 s-i-ng s-o-ng l-o-ng k-i-ng:👑 h-a-ng r-a-ng s-a-ng v-a-n:🚐 v-e-t v-e-s-t m-oo-n:🌙 s-oo-n f-oo-d p-oo-l r-oo-m s-p-oo-n:🥄 b-oo-t:🥾 r-oo-t b-oo_s-k:📖 l-oo_s-k f-oo_s-t g-oo_s-d w-oo_s-d c-oo_s-k:🧑‍🍳 h-oo_s-k
y-e-s y-a-p y-e-t y-e-ll y-u-m f-o-x:🦊 b-o-x:📦 s-i-x:6️⃣ m-i-x f-i-x w-a-x t-a-x n-e-x-t ch-i-p:🍟 ch-i-n ch-o-p ch-a-t:💬 m-u-ch s-u-ch r-i-ch l-u-n-ch:🍱 b-e-n-ch sh-i-p:🚢 sh-o-p:🏪 sh-e-d f-i-sh:🐟 d-i-sh:🍽️ w-i-sh r-u-sh c-a-sh sh-e-ll:🐚 sh-ee-p:🐑
th_v-i-s th_v-a-t th_v-e-m th_v-e-n th-i-n th-i-ck p-a-th b-a-th:🛁 qu-i-t qu-i-ck qu-i-z:❓ qu-a-ck qu-ee-n:👸 ou-t sh-ou-t c-l-ou-d:☁️ l-ou-d s-ou-n-d r-ou-n-d f-ou-n-d c-oi-n:🪙 oi-l:🛢️ s-oi-l b-oi-l j-oi-n b-l-ue:🔵 g-l-ue t-r-ue c-l-ue h-er s-i-s-t-er:👧 l-e-t-t-er b-e-t-t-er f-ar-m-er c-ar:🚗 s-t-ar:⭐ f-ar-m:🚜 p-ar-k:🏞️ d-ar-k sh-ar-k:🦈 j-ar b-ar-n c-ar-d ar-m:💪
f-r-o-g:🐸 s-t-o-p s-t-e-p s-n-a-p s-p-i-n s-p-o-t s-w-i-m f-l-a-g:🚩 f-l-i-p c-l-a-p p-l-a-n p-l-u-m d-r-i-p d-r-u-m:🥁 c-r-a-b:🦀 c-r-i-b g-r-a-b g-r-i-n t-r-i-p t-r-a-p t-r-i-ck b-r-i-ck:🧱 b-l-a-ck c-l-o-ck:🕐 b-l-o-ck s-t-i-ck t-r-u-ck:🚚 s-n-a-ck s-p-e-ll s-m-e-ll s-t-a-m-p t-e-n-t:⛺ h-a-n-d:✋ s-a-n-d l-a-m-p p-u-m-p n-e-s-t b-e-s-t m-i-l-k:🥛 g-i-f-t:🎁 s-o-f-t h-e-l-p b-e-ll:🔔 b-e-l-t d-e-s-k t-u-s-k m-a-s-k s-o-ck:🧦 d-u-ck:🦆 s-n-ai-l:🐌 g-r-ee-n s-l-i-p s-l-e-d f-l-a-t s-k-i-p
c-a-t-+s:🐱 d-o-g-+s:🐶 h-e-n-+s:🐔 p-i-g-+s:🐷 b-u-g-+s:🐛 h-a-t-+s:🎩 c-u-p-+s:🥤 m-a-p-+s:🗺️ j-u-m-p-+ed h-e-l-p-+ed l-i-ck-+ed p-i-ck-+ed j-u-m-p-+ing h-u-n-t-+ing h-e-l-p-+ing c-a-m-p-+ing p-a-ck-+ing
s-u-n|s-e-t:🌇 h-o-t|d-o-g:🌭 c-a-t|n-a-p b-e-d|b-u-g l-a-p|t-o-p:💻 p-i-g|p-e-n c-o-b|w-e-b:🕸️ h-a-n-d|b-a-g b-a-ck|p-a-ck d-e-s-k|t-o-p
`.trim().split(/\s+/);
const tokText=t=>t[0]==='+'?t.slice(1):(GR[t]?GR[t].text:t);
const WORDS=[],BYW={};
for(const it of BANK_SRC){const[sp,e]=it.split(':'),sy=sp.split('|'),toks=sy.join('-').split('-'),w=toks.map(tokText).join('');
 if(BYW[w])continue;const o={w,toks,syl:sy.map(s=>s.split('-').map(tokText).join('')),e:e||'',split:sp};WORDS.push(o);BYW[w]=o}
// Words that are close in spelling (one letter different). Used to call a near miss "near", and to choose wrong picture choices.
function lev(a,b){const d=Array.from({length:a.length+1},(_,i)=>[i,...Array(b.length).fill(0)]);for(let j=1;j<=b.length;j++)d[0][j]=j;
 for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[a.length][b.length]}
for(const o of WORDS)o.conf=WORDS.filter(x=>x!==o&&Math.abs(x.w.length-o.w.length)<=1&&lev(x.w,o.w)===1).map(x=>x.w).slice(0,8);
// Accepted variants: other ways the same word can sound in Singapore English or when a child is still learning. Extend after pilots.
const VARIANTS={thin:['tin','fin'],this:['dis','dese'],that:['dat'],them:['dem'],then:['den'],thick:['tick','fick'],path:['pat','paf'],bath:['bat','baf']};
for(const k in VARIANTS)if(BYW[k])BYW[k].variants=VARIANTS[k];

// ---- Sentences (decodable). Checked by the unit test: every word must be a bank word or a tricky word.
const SENT=`
The cat sat.|I can see a hen.|The dog got a bag.|A big bug is in the mud.|Tap the pin in.|I can hop on the log.|The sun is hot.|Dad has a red cap.|The pup sat on the rug.|Go to the shop.|We can sit in the van.|The fish is in the dish.|I see a boat and a goat.|The king has a ring.|Look at the moon.|The frog can jump.|Dad will mend the van.|The duck is on the block.|She can run and jump.|The cat and the dog ran.|We can zip it up.|The queen has a quick cat.|Mum has the milk.|The shark is in the dark.|Look at the car in the park.|The sheep sleep in the barn.|A cat jumped on the bed.|He is helping Dad.|The dogs ran to the pond.|We went to the shed.
`.trim().split('|').map(s=>s.trim());

// ---- Decodability ----
const normW=s=>String(s||'').toLowerCase().replace(/[^a-z'+ ]/g,'').trim();
// A word is decodable if every sound in it has been taught. n = how many sounds in this pupil's sequence are taught.
function decodable(word,seq,n){const o=typeof word==='string'?BYW[normW(word)]:word;if(!o)return false;const ok=new Set(takenFor(seq,n));
 return o.toks.every(t=>{const id=tokId(t,seq);return ok.has(id)})}
const wordsFor=(seq,n)=>WORDS.filter(o=>decodable(o,seq,n));
function sentenceNeeds(s,seq){ // minimum number of taught sounds that makes the sentence decodable, or -1 if it cannot be
 const fl=flat(seq);let need=0;const tr=new Set(TRICKY.flat().map(x=>x.toLowerCase()));
 for(const raw of s.replace(/[.!?,]/g,'').split(/\s+/)){const w=raw.toLowerCase();if(tr.has(w)){const tier=TRICKY.findIndex(t=>t.map(x=>x.toLowerCase()).includes(w))+1;need=Math.max(need,tier===1?0:tier===2?18:30);continue}
  const o=BYW[w];if(!o)return -1;for(const t of o.toks){const i=fl.indexOf(tokId(t,seq));if(i<0)return -1;need=Math.max(need,i+1)}}
 return need}
const sentencesFor=(seq,n)=>SENT.map((s,i)=>({i,s,need:sentenceNeeds(s,seq)})).filter(x=>x.need>=0&&x.need<=n);

// ---- Judging what was heard (used by the Worker, never the browser)
function judge(word,heardTexts){ // heardTexts: array of transcripts, best first
 const o=BYW[normW(word)];if(!o)return{result:'try'};
 const toks=[...new Set((heardTexts||[]).flatMap(t=>normW(t).split(/\s+/)).filter(Boolean))];
 const accept=new Set([o.w,...(o.variants||[])]);
 if(toks.some(t=>accept.has(t)))return{result:'correct',heard:o.w};
 const near=toks.filter(t=>o.conf.includes(t));
 const pick=near[0]||toks.find(t=>BYW[t])||toks[0]||'';
 const r={result:near.length?'near':'try',heard:pick};
 const h=BYW[pick];if(h){const a=o.toks,b=h.toks;let i=0;while(i<a.length&&i<b.length&&a[i]===b[i])i++;if(i<a.length||i<b.length)r.hintPosition=Math.min(i,a.length-1)}
 return r}
// Sentence reading: which written words were heard, in order. No timestamps needed.
function alignSentence(sentence,heardText){
 const tw=sentence.replace(/[.!?,]/g,'').split(/\s+/).map(normW),hw=normW(heardText).split(/\s+/).filter(Boolean),m=tw.length,n=hw.length;
 const L=Array.from({length:m+1},()=>Array(n+1).fill(0));
 for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)L[i][j]=tw[i-1]===hw[j-1]?L[i-1][j-1]+1:Math.max(L[i-1][j],L[i][j-1]);
 const hit=Array(m).fill(false);let i=m,j=n;while(i>0&&j>0){if(tw[i-1]===hw[j-1]){hit[i-1]=true;i--;j--}else if(L[i-1][j]>=L[i][j-1])i--;else j--}
 const k=hit.filter(Boolean).length;return{words:hit,ok:m<=4?k===m:k>=m-1}}

// ---- Mastery: one small record per sound / word / sentence ----
const BOXES=[1,2,4,7];
const blank=()=>({h:[],d:[],box:0,due:0});
function update(st,ok,day){const s=st?{h:[...st.h],d:[...st.d],box:st.box|0,due:st.due|0}:blank();
 s.h.push(ok?1:0);if(s.h.length>6)s.h.shift();if(!s.d.includes(day))s.d.push(day);if(s.d.length>20)s.d.shift();
 s.box=ok?Math.min(s.box+1,BOXES.length-1):0;s.due=day+BOXES[s.box];return s}
const mastered=st=>!!st&&st.h.length>=6&&st.h.reduce((a,b)=>a+b,0)>=5&&new Set(st.d).size>=2; // about 85% of the last 6, on 2 different days
const level=st=>!st||!st.h.length?0:mastered(st)?2:1; // 0 not met, 1 learning, 2 mastered

// ---- Session composer: about 3 min review, 5 min new sound, 5 min reading, never over 12 minutes ----
const SECS={teach:30,safari:20,say:20,blend:35,read:30,tricky:15,build:40,trace:40,sent:50};
function compose(o){ // {seq, n (sounds taught), newId, dueSounds:[ids], dueWords:[w], voice:bool, seed}
 const seq=o.seq,n=o.n,rng=mulberry(o.seed|0),steps=[],pic=x=>WORDS.filter(w=>w.e&&decodable(w,seq,n)&&(!x||w.toks.some(t=>tokId(t,seq)===x)));
 const wf=wordsFor(seq,n),pool=wf.filter(w=>w.syl.length===1),shuffle=a=>[...a].sort(()=>rng()-.5);
 const review=[];for(const id of (o.dueSounds||[]).slice(0,3))review.push({blk:'review',t:'safari',id});
 for(const w of (o.dueWords||[]).filter(w=>decodable(w,seq,n)).slice(0,3))review.push({blk:'review',t:o.voice?'read':'blend',w});
 steps.push(...review);
 if(o.newId){const id=o.newId,g=GR[id],withNew=shuffle(pool.filter(w=>w.toks.some(t=>tokId(t,seq)===id)));
  steps.push({blk:'new',t:'teach',id});
  if(g.type!=='e'){steps.push({blk:'new',t:'safari',id},{blk:'new',t:'safari',id},{blk:'new',t:'say',id});}
  for(const w of withNew.filter(w=>w.e).slice(0,2))steps.push({blk:'new',t:'blend',w:w.w});
  if(g.type!=='e')steps.push({blk:'new',t:'trace',id});
 }
 const used=new Set(steps.filter(s=>s.w).map(s=>s.w)),tr=trickyFor(n);
 const want=shuffle(pool.filter(w=>!used.has(w.w))),pri=o.newId?want.filter(w=>w.toks.some(t=>tokId(t,seq)===o.newId)):[],rest=want.filter(w=>!pri.includes(w));
 for(const w of [...pri,...rest].slice(0,5))steps.push({blk:'read',t:o.voice?'read':'blend',w:w.w});
 steps.push({blk:'read',t:'tricky',w:shuffle(tr)[0]});
 if(n>=12&&wf.length>=8)steps.push({blk:'read',t:'build',w:shuffle(pool)[0].w});
 const ss=sentencesFor(seq,n);if(o.voice&&ss.length)steps.push({blk:'read',t:'sent',i:shuffle(ss)[0].i});
 // trim to the time cap, dropping from the end of the reading block first
 const cap=720;let tot=0;const out=[];for(const s of steps){tot+=SECS[s.t]||30;if(tot>cap)break;out.push(s)}
 return{steps:out,secs:out.reduce((a,s)=>a+(SECS[s.t]||30),0)}}
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

// ---- Voice-over lines. key -> text. Record each in Admin > Audio (or as public/audio/vo/<key>.mp3; see docs/RECORDING_CHECKLIST.md); until then the browser voice reads the text.
const VO={
 tap_start:'Tap to start!',welcome:'Hello! Let us learn some sounds.',mic_check:'Say hello to me!',mic_ok:'I can hear you!',mic_no:'I cannot hear you, but that is okay. We can still play.',
 safari_first:'Which picture starts with the sound?',safari_mid:'Which picture has the sound?',safari_end:'Which picture ends with the sound?',teach_it:'This is the sound. Do the action with me.',
 say_sound:'Listen. Now you say it.',say_with:'Say the sound out loud, then tap the button.',say_good:'Great saying!',
 blend_tap:'Tap each letter to hear its sound.',blend_slide:'Now slide the sounds together.',blend_which:'Which word did we make?',blend_say:'Now say the word.',
 read_it:'Can you read this word?',read_good:'You read it!',read_try:'Good try! Let us look again.',read_near:'Nearly! Listen to each sound.',
 hint_first:'Check the first sound.',hint_middle:'Check the middle sound.',hint_last:'Check the last sound.',assist:'Let us blend it together.',
 tricky_find:'Find the word.',build_hear:'Listen to the word. Build it with the letters.',build_good:'You built it!',build_try:'Good try! Let us look again.',
 trace_it:'Trace the letter with your finger.',trace_good:'Lovely tracing!',trace_again:'Good try! Let us trace again.',
 sent_read:'Read the whole sentence.',sent_good:'You read the sentence!',sent_try:'Good try! Let us read it again.',
 rhyme_q:'Which word rhymes?',same_start:'Which word starts the same?',beats_q:'Clap the beats. Tap once for each beat.',
 good1:'Well done!',good2:'Lovely!',good3:'You did it!',retry:'Good try! Let us look again.',all_done:'All done for today. See you tomorrow!',stop_ask:'Do you want to stop now?',
 ask_adult:'Please ask a grown-up to help.'};
g.ReadData={GR,ALL,SEQ,ALIAS,TRICKY,WORDS,BYW,SENT,VO,SECS,BOXES,flat,tokId,groupOf,takenFor,trickyTier,trickyFor,tokText,normW,decodable,wordsFor,sentencesFor,sentenceNeeds,judge,alignSentence,blank,update,mastered,level,compose,lev,mulberry};
if(typeof module!=='undefined')module.exports=g.ReadData;
})(typeof self!=='undefined'?self:globalThis);
