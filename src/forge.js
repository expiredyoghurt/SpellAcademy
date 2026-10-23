// Word Forge data: roots + endings (or prefixes + roots) and the spelling rule that joins them.
// Item format per line:  left+right=result|rule|level|sentence with {w}
//   A left part ending in "-" is a prefix (un-+happy=unhappy); otherwise it is a root and the right part is an ending.
//   level = the lowest primary level (3 to 6) at which the item is used.
// Each rule has a name (n), the rule in words (t), a worked example (ex), and a checker (f) that rebuilds the result.
// f is used by the tests to prove every item in the table follows its rule. Rules marked x are rule-breakers (listed, not computed).
const pre=s=>s.replace(/-$/,'');
export const RULES={
 add:{n:'Just join them',t:'Nothing changes. Join the root and the ending, or the prefix and the root.',ex:'play + ing = playing',f:(l,r)=>pre(l)+r},
 'drop-e':{n:'Drop the silent e',t:'Drop a silent e before an ending that starts with a vowel (-ing, -ed, -er, -est, -able, -ion, -ous).',ex:'hope + ing = hoping',f:(l,r)=>l.slice(0,-1)+r},
 'keep-e':{n:'Keep the silent e',t:'Keep the silent e before an ending that starts with a consonant (-ful, -ly, -ment, -ness, -less).',ex:'hope + ful = hopeful',f:(l,r)=>l+r},
 'keep-e-x':{n:'Silent e rule-breakers',t:'A few words drop the silent e even before a consonant ending. Learn them by heart.',ex:'true + ly = truly',x:1},
 'soft-ce':{n:'Soft c and g keep the e',t:'After a soft c or g, keep the e before -able and -ous. The e keeps the sound soft.',ex:'notice + able = noticeable',f:(l,r)=>l+r},
 'ee-keep':{n:'-ee, -ye and -ie words',t:'Words ending in -ee or -ye keep their e before -ing. Words ending in -ie change ie to y before -ing.',ex:'see + ing = seeing',f:(l,r)=>l+r},
 'ie-y':{n:'ie changes to y',t:'Before -ing, a word ending in -ie changes the ie to y.',ex:'die + ing = dying',f:(l,r)=>l.slice(0,-2)+'y'+r},
 double:{n:'Double the last letter',t:'A short word with one vowel and one consonant at the end doubles the last letter before an ending that starts with a vowel.',ex:'stop + ing = stopping',f:(l,r)=>l+l.slice(-1)+r},
 double2:{n:'Double when the stress is at the end',t:'In a longer word, double the last letter only if the last syllable is stressed (be-GIN, pre-FER).',ex:'begin + ing = beginning',f:(l,r)=>l+l.slice(-1)+r},
 'no-double':{n:'Do not double',t:'Do not double when the word ends in w, x or y, in two consonants, or has two vowels before the last letter, or when the stress is not on the last syllable (VIS-it).',ex:'visit + ing = visiting',f:(l,r)=>l+r},
 'y-to-i':{n:'Change y to i',t:'After a consonant, change y to i before an ending, but not before -ing.',ex:'happy + ness = happiness',f:(l,r)=>l.slice(0,-1)+'i'+r},
 'y-keep':{n:'Keep the y',t:'Keep the y before -ing, and after a vowel (play, enjoy, obey).',ex:'carry + ing = carrying',f:(l,r)=>l+r},
 'plural-es':{n:'Add -es',t:'Add -es to words ending in s, x, z, ch or sh. You can hear the extra syllable.',ex:'box + es = boxes',f:(l,r)=>l+r},
 'f-to-v':{n:'f or fe changes to ves',t:'Many words ending in f or fe change to -ves in the plural.',ex:'leaf + s = leaves',f:(l,r)=>l.replace(/fe?$/,'ves')},
 'f-keep':{n:'Some f words just add -s',t:'Some words ending in f or ff do not change. They simply add -s. Learn them by heart.',ex:'roof + s = roofs',x:1},
 'o-es':{n:'Words ending in -o',t:'Many words ending in a consonant + o add -es (potatoes, heroes). Short forms and words with a vowel before the o, such as photos, pianos and zoos, add -s.',ex:'potato + es = potatoes',x:1},
 'le-ly':{n:'-le becomes -ly',t:'When a word ends in -le, drop the le and add ly. Do not write -lely.',ex:'gentle + ly = gently',f:(l,r)=>l.slice(0,-2)+r},
 'ly-ful-al':{n:'-ful and -al + ly',t:'Keep both l letters when you add -ly to a word ending in -ful or -al.',ex:'careful + ly = carefully',f:(l,r)=>l+r},
 'ic-ally':{n:'-ic + ly = -ically',t:'Words ending in -ic add -ally, not just -ly.',ex:'basic + ly = basically',f:(l,r)=>l+'al'+r},
 'c-k':{n:'Add k after c',t:'A word ending in -c adds a k before -ed or -ing so the c stays hard.',ex:'panic + ed = panicked',f:(l,r)=>l+'k'+r},
 'prefix-meet':{n:'Keep both letters at the join',t:'A prefix never loses a letter. When the last letter of the prefix meets the same letter, you get a double.',ex:'mis + spell = misspell',f:(l,r)=>pre(l)+r},
 'prefix-in':{n:'in- changes to il-, im-, ir-',t:'The prefix in- becomes il- before l, ir- before r, and im- before m, p or b.',ex:'in + legal = illegal',f:(l,r)=>(/^l/.test(r)?'il':/^r/.test(r)?'ir':/^[mpb]/.test(r)?'im':'in')+r}};
const DATA=`play+ing=playing|add|3|The children are {w} in the park.
help+ful=helpful|add|3|She is a very {w} girl.
kind+ness=kindness|add|3|Thank you for your {w}.
jump+ed=jumped|add|3|The frog {w} into the pond.
thank+ful=thankful|add|3|We are {w} for your help.
sad+ness=sadness|add|3|I could see the {w} in her eyes.
quick+ly=quickly|add|3|He ran {w} to the bus stop.
slow+ly=slowly|add|3|The snail moved {w}.
teach+er=teacher|add|3|Our {w} reads us a story every day.
un-+happy=unhappy|add|3|He felt {w} when it rained.
re-+turn=return|add|3|Please {w} the book on Friday.
fear+less=fearless|add|4|The {w} knight faced the dragon.
dis-+appear=disappear|add|4|The magician made the coin {w}.
pre-+heat=preheat|add|4|Please {w} the oven.
mis-+behave=misbehave|add|4|Do not {w} in class.
hope+ing=hoping|drop-e|3|We are {w} for sunny weather.
make+ing=making|drop-e|3|Mum is {w} dinner.
bake+ed=baked|drop-e|3|Grandma {w} a cake.
nice+er=nicer|drop-e|3|Today the weather is {w} than yesterday.
use+ed=used|drop-e|3|I {w} a ruler to draw the line.
smile+ing=smiling|drop-e|3|The baby is {w} at me.
close+ed=closed|drop-e|3|The shop {w} early.
write+ing=writing|drop-e|3|I am {w} a story.
excite+ing=exciting|drop-e|4|The match was very {w}.
create+ion=creation|drop-e|5|The {w} of the bridge took two years.
celebrate+ion=celebration|drop-e|5|There was a big {w} on National Day.
decorate+ion=decoration|drop-e|5|The {w} on the tree sparkled.
educate+ion=education|drop-e|5|{w} is important for everyone.
fame+ous=famous|drop-e|5|She is a {w} singer.
adventure+ous=adventurous|drop-e|5|The {w} boy climbed the tallest tree.
love+able=lovable|drop-e|5|The puppy is {w}.
hope+ful=hopeful|keep-e|3|We feel {w} about the match.
care+ful=careful|keep-e|3|Be {w} when you cross the road.
safe+ly=safely|keep-e|3|The bus arrived {w}.
lone+ly=lonely|keep-e|3|The old man felt {w}.
use+ful=useful|keep-e|3|A map is {w} on a trip.
care+less=careless|keep-e|5|It was {w} to leave the door open.
move+ment=movement|keep-e|5|I saw a {w} in the bushes.
entire+ly=entirely|keep-e|5|I agree {w} with you.
sincere+ly=sincerely|keep-e|5|He {w} wanted to help.
excite+ment=excitement|keep-e|5|The children screamed with {w}.
manage+ment=management|keep-e|5|The {w} of the mall made a new rule.
arrange+ment=arrangement|keep-e|5|The flower {w} smelled lovely.
advertise+ment=advertisement|keep-e|5|I saw an {w} for a new game.
true+ly=truly|keep-e-x|5|I am {w} sorry.
argue+ment=argument|keep-e-x|5|They had an {w} about the game.
whole+ly=wholly|keep-e-x|6|I do not {w} agree.
nine+th=ninth|keep-e-x|6|She came {w} in the race.
due+ly=duly|keep-e-x|6|The winner was {w} rewarded.
notice+able=noticeable|soft-ce|5|The change was {w}.
courage+ous=courageous|soft-ce|5|The {w} firefighter ran inside.
manage+able=manageable|soft-ce|5|The task was {w}.
change+able=changeable|soft-ce|5|The weather is {w}.
outrage+ous=outrageous|soft-ce|6|The price was {w}.
service+able=serviceable|soft-ce|6|The old bicycle is still {w}.
peace+able=peaceable|soft-ce|6|They are a {w} people.
see+ing=seeing|ee-keep|4|I am {w} a rainbow.
agree+ing=agreeing|ee-keep|5|We are all {w} on the plan.
free+ing=freeing|ee-keep|5|The vet is {w} the trapped bird.
flee+ing=fleeing|ee-keep|5|The deer are {w} from the fire.
dye+ing=dyeing|ee-keep|6|Mum is {w} the cloth blue.
die+ing=dying|ie-y|5|The flowers are {w} without water.
lie+ing=lying|ie-y|5|He is {w} on the grass.
tie+ing=tying|ie-y|5|She is {w} her shoelaces.
stop+ing=stopping|double|3|The bus is {w} at the gate.
run+er=runner|double|3|She is the fastest {w} in class.
big+er=bigger|double|3|An elephant is {w} than a dog.
hop+ed=hopped|double|3|The rabbit {w} away.
plan+ing=planning|double|3|We are {w} a party.
swim+ing=swimming|double|3|They went {w} at the pool.
sit+ing=sitting|double|3|The cat is {w} on the mat.
hot+er=hotter|double|3|Noon is {w} than morning.
sad+er=sadder|double|4|The ending was {w} than the beginning.
thin+est=thinnest|double|4|This is the {w} book on the shelf.
wet+er=wetter|double|4|The grass is {w} today.
fat+er=fatter|double|4|The cat grew {w} every week.
begin+ing=beginning|double2|5|This is the {w} of the story.
forget+ing=forgetting|double2|5|I keep {w} my umbrella.
prefer+ed=preferred|double2|5|She {w} tea to coffee.
admit+ed=admitted|double2|5|He {w} that he was wrong.
regret+ing=regretting|double2|5|He is {w} his choice.
occur+ed=occurred|double2|5|The accident {w} at noon.
permit+ed=permitted|double2|5|Phones are not {w} in class.
control+ed=controlled|double2|5|The toy car was {w} by a remote.
refer+ed=referred|double2|6|The teacher {w} us to the library.
equip+ed=equipped|double2|6|The lab is well {w}.
submit+ed=submitted|double2|6|I {w} my work on time.
help+ing=helping|no-double|4|She is {w} her mum.
jump+ing=jumping|no-double|4|The kids are {w} rope.
rain+ed=rained|no-double|4|It {w} all day.
fix+ed=fixed|no-double|4|Dad {w} the bicycle.
snow+y=snowy|no-double|4|It was a {w} day in the mountains.
keep+ing=keeping|no-double|4|We are {w} the puppy.
visit+ing=visiting|no-double|4|We are {w} Grandma today.
listen+ing=listening|no-double|4|I am {w} to music.
open+ed=opened|no-double|4|She {w} the window.
offer+ing=offering|no-double|5|The shop is {w} a discount.
develop+ing=developing|no-double|5|The company is {w} a new game.
enter+ed=entered|no-double|5|He {w} the room quietly.
limit+ed=limited|no-double|5|Seats are {w}.
happen+ing=happening|no-double|5|What is {w} outside?
benefit+ed=benefited|no-double|6|The whole class {w} from the extra help.
happy+ness=happiness|y-to-i|4|Her {w} was clear to see.
carry+ed=carried|y-to-i|4|He {w} the heavy bag.
easy+ly=easily|y-to-i|4|She solved the puzzle {w}.
lazy+ness=laziness|y-to-i|4|Do not give in to {w}.
hurry+ed=hurried|y-to-i|4|We {w} to catch the bus.
tidy+er=tidier|y-to-i|4|My desk is {w} than yours.
cry+es=cries|y-to-i|4|The baby {w} at night.
baby+es=babies|y-to-i|4|The nurse looked after the {w}.
angry+ly=angrily|y-to-i|4|He shouted {w}.
heavy+est=heaviest|y-to-i|4|This is the {w} box in the room.
story+es=stories|y-to-i|4|Grandpa tells us funny {w}.
carry+ing=carrying|y-keep|4|The ants are {w} crumbs.
try+ing=trying|y-keep|4|I am {w} my best.
play+ed=played|y-keep|4|We {w} football after school.
enjoy+ment=enjoyment|y-keep|4|The children shouted with {w}.
stay+ing=staying|y-keep|4|We are {w} at a hotel.
employ+er=employer|y-keep|4|The {w} paid us on Friday.
obey+ed=obeyed|y-keep|4|The dog {w} its owner.
hurry+ing=hurrying|y-keep|4|Everyone is {w} to the hall.
box+es=boxes|plural-es|3|We packed the books into three {w}.
watch+es=watches|plural-es|3|The shop sells many {w}.
wish+es=wishes|plural-es|3|Make three {w}.
bus+es=buses|plural-es|3|Many {w} stop here.
class+es=classes|plural-es|3|There are six {w} in our school.
dish+es=dishes|plural-es|3|I washed the {w}.
leaf+s=leaves|f-to-v|4|The {w} fall in autumn.
knife+s=knives|f-to-v|4|Be careful with sharp {w}.
shelf+s=shelves|f-to-v|4|The books are on the {w}.
wolf+s=wolves|f-to-v|4|The {w} howled at the moon.
thief+s=thieves|f-to-v|4|The police caught two {w}.
half+s=halves|f-to-v|4|Cut the apple into two {w}.
life+s=lives|f-to-v|4|Cats are said to have nine {w}.
loaf+s=loaves|f-to-v|4|Mum bought two {w} of bread.
roof+s=roofs|f-keep|5|The {w} of the houses are red.
chief+s=chiefs|f-keep|5|The {w} met in the hall.
cliff+s=cliffs|f-keep|5|Seabirds nest on the {w}.
belief+s=beliefs|f-keep|6|People hold different {w}.
potato+es=potatoes|o-es|5|We fried the {w}.
tomato+es=tomatoes|o-es|5|She grows {w} in her garden.
hero+es=heroes|o-es|5|The firefighters are {w}.
echo+es=echoes|o-es|5|We heard {w} in the cave.
photo+s=photos|o-es|5|We took many {w} on the trip.
piano+s=pianos|o-es|5|The music room has two {w}.
zoo+s=zoos|o-es|5|There are two {w} in Singapore.
gentle+ly=gently|le-ly|5|She {w} stroked the kitten.
simple+ly=simply|le-ly|5|He {w} did not know.
terrible+ly=terribly|le-ly|5|I am {w} sorry.
possible+ly=possibly|le-ly|5|It could {w} rain.
probable+ly=probably|le-ly|5|It will {w} rain tomorrow.
comfortable+ly=comfortably|le-ly|6|She sat {w} in the armchair.
humble+ly=humbly|le-ly|6|He {w} accepted the prize.
incredible+ly=incredibly|le-ly|6|The view was {w} beautiful.
careful+ly=carefully|ly-ful-al|5|Walk {w} on the wet floor.
hopeful+ly=hopefully|ly-ful-al|5|{w} it will not rain.
beautiful+ly=beautifully|ly-ful-al|5|She sang {w}.
usual+ly=usually|ly-ful-al|5|We {w} eat at six.
final+ly=finally|ly-ful-al|5|The bus {w} arrived.
special+ly=specially|ly-ful-al|5|This cake was {w} made for you.
accidental+ly=accidentally|ly-ful-al|6|He {w} knocked over the vase.
basic+ly=basically|ic-ally|6|{w}, the plan is simple.
magic+ly=magically|ic-ally|6|The door opened {w}.
tragic+ly=tragically|ic-ally|6|The story ended {w}.
enthusiastic+ly=enthusiastically|ic-ally|6|The crowd cheered {w}.
panic+ed=panicked|c-k|6|The crowd {w} when the lights went out.
picnic+ing=picnicking|c-k|6|We are {w} by the lake.
mimic+ed=mimicked|c-k|6|The parrot {w} her voice.
mis-+spell=misspell|prefix-meet|5|Do not {w} the word.
un-+natural=unnatural|prefix-meet|5|The silence felt {w}.
un-+necessary=unnecessary|prefix-meet|5|It is {w} to shout.
dis-+satisfied=dissatisfied|prefix-meet|6|The customer was {w}.
dis-+similar=dissimilar|prefix-meet|6|The twins are {w} in character.
over-+rule=overrule|prefix-meet|6|The referee can {w} the decision.
in-+legal=illegal|prefix-in|5|It is {w} to park here.
in-+regular=irregular|prefix-in|5|The bus comes at {w} times.
in-+possible=impossible|prefix-in|5|The task seems {w}.
in-+mature=immature|prefix-in|5|It was an {w} thing to do.
in-+polite=impolite|prefix-in|5|It is {w} to interrupt.
in-+logical=illogical|prefix-in|6|His answer was {w}.
in-+responsible=irresponsible|prefix-in|6|It was {w} to leave the gate open.
in-+movable=immovable|prefix-in|6|The rock was {w}.
in-+perfect=imperfect|prefix-in|6|The work is {w}.
in-+patient=impatient|prefix-in|6|She grew {w} in the queue.`;
export const FORGE=DATA.split('\n').map(l=>{const[eq,rule,lv,s]=l.split('|'),[lr,w]=eq.split('='),i=lr.indexOf('+',1),L=lr.slice(0,i),R=lr.slice(i+1);return{w,l:L,r:R,pre:L.endsWith('-'),rule,lv:+lv,s}});
export const forgeBy=new Map(FORGE.map(x=>[x.w,x]));
// what the pupil needs to see (the answer is included because the server also needs it; the client never sees it before answering for "fix" items except as the rule card)
export const forgeRules=()=>Object.fromEntries(Object.entries(RULES).map(([k,v])=>[k,{n:v.n,t:v.t,ex:v.ex}]));
