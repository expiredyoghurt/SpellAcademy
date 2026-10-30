// Say It! content tables (ported from Say It! v0.5). Shared by the browser (public/sayit.js) and the Worker (eligible words).
(function(g){
const WORDS=[
["cat","/kæt/",1],["ship","/ʃɪp/",1],["thin","/θɪn/",1],["chair","/tʃeə/",1],["bread","/bred/",1],["light","/laɪt/",1],
["school","/skuːl/",2],["phone","/fəʊn/",2],["bridge","/brɪdʒ/",2],["night","/naɪt/",2],["water","/ˈwɔːtə/",2],["rabbit","/ˈræbɪt/",2],
["banana","/bəˈnɑːnə/",3],["teacher","/ˈtiːtʃə/",3],["elephant","/ˈelɪfənt/",3],["vegetable","/ˈvedʒtəbəl/",3],["Wednesday","/ˈwenzdeɪ/",3],["February","/ˈfebruəri/",3]];
const PA=[["cat",["k","æ","t"]],["ship",["ʃ","ɪ","p"]],["frog",["f","r","ɒ","g"]],["chair",["tʃ","eə"]],["thin",["θ","ɪ","n"]],["sun",["s","ʌ","n"]],["bed",["b","e","d"]],["dog",["d","ɒ","g"]],["fish",["f","ɪ","ʃ"]],["moon",["m","uː","n"]],["light",["l","aɪ","t"]],["rain",["r","eɪ","n"]],["coin",["k","ɔɪ","n"]],["box",["b","ɒ","k","s"]],["stop",["s","t","ɒ","p"]],["plate",["p","l","eɪ","t"]],["jump",["dʒ","ʌ","m","p"]],["bridge",["b","r","ɪ","dʒ"]]];
const ODD=[[["ship","shop","chip"],"chip"],[["cat","cup","sun"],"sun"],[["bed","bus","fish"],"fish"],[["dog","dig","moon"],"moon"],[["frog","fish","thin"],"thin"],[["rain","run","coin"],"coin"],[["stop","step","plate"],"plate"],[["jump","jam","cat"],"cat"]];
const DEL=[["stop","top"],["plate","late"],["clap","lap"],["snail","nail"],["slip","lip"],["spin","pin"]];
const CHG=[["cat","c","b","bat"],["hat","h","m","mat"],["pin","p","w","win"],["dog","d","l","log"],["sun","s","f","fun"],["red","r","b","bed"]];
const POOL=["p","b","t","d","k","g","f","s","m","n","l","r","h","w","ʃ","tʃ","æ","e","ɪ","ɒ","ʌ"];
const STRAT=[["Sound it out","Say each sound, then slide them together: sh… i… p… ship.","ship",["sh","i","p"]],
["Onset and rime","Split before the vowel. The ending gives you a word family: og in frog, dog, log.","frog",["fr","og"]],
["Chunk into syllables","Clap the beats. Split between double consonants: rab-bit. Each chunk has one vowel sound.","rabbit",["rab","bit"]],
["Peel prefixes and suffixes","Take off un-, re-, -ing, -ful or -ed, read the base word, then put it back.","unhappy",["un","happy"]],
["Flip the vowel","Try the short sound, then the long sound, and keep the one that makes a real word: ro-bot.","robot",["ro","bot"]],
["Use clues","Look at the picture and the sentence around the word. Skip it, read on, then come back.","",[]],
["Compare with a word you know","If you can read light, you can read night: swap the first sound.","night",["n","ight"]],
["Check yourself","Ask: Does it look right? Does it sound right? Does it make sense? If not, try another strategy.","",[]]];
const L=[["ship",["sh","i","p"],0],["frog",["fr","og"],1],["rabbit",["rab","bit"],2],["unhappy",["un","happy"],3],["robot",["ro","bot"],4],["night",["n","ight"],6],["playing",["play","ing"],3],["banana",["ba","na","na"],2]];
const SK=[["count","Count the sounds"],["first","First sound"],["last","Last sound"],["odd","Odd one out"],["del","Take away"],["chg","Change a sound"],["spell","Spell it"],["mix","Mixed"]];
const LT=[["s","Sounds 101"],["d","Sound games"],["t","Strategies"],["w","Word lab"],["p","Spelling"],["y","Syllables"],["x","Split it"]];
const SP=[["rain","rain",["rane","rayn"],"ai in the middle of a word, ay at the end."],["day","day",["dai","dae"],"ay at the end of a word."],
["duck","duck",["duk","duc"],"ck after a short vowel at the end of a word."],["catch","catch",["cach","katch"],"tch after a short vowel."],
["bridge","bridge",["brij","bridje"],"dge after a short vowel."],["city","city",["sity","kity"],"c says /s/ before i, e or y."],
["kite","kite",["cite","kyte"],"/k/ is spelled k before i and e."],["bell","bell",["bel","bele"],"Double l after a short vowel at the end of a short word."],
["jumped","jumped",["jumpt","jumpd"],"Past tense is always -ed, even when it sounds like /t/."],
["hopping","hopping",["hoping","hopeing"],"hop has one short vowel, so double the p before -ing. (hoping is hope + ing.)"]];
const SY=[["rabbit",[3],"VC/CV: two consonants between vowels, so split between them. The double b keeps the first vowel short."],
["robot",[2],"V/CV: one consonant, so try splitting before it. The open syllable ro has a long o."],
["cabin",[3],"VC/V: ca-bin sounds wrong, so split after the consonant. The closed syllable cab has a short a."],
["table",[2],"Consonant-le: ble stays together as the last syllable."],["cupboard",[3],"Compound word: split between the two words."],
["unkind",[2],"Prefix: un is its own syllable."],["playing",[4],"Suffix: ing is its own syllable."],["napkin",[3],"VC/CV: split between the two consonants."],
["music",[2],"V/CV: the open syllable mu has a long u."],["father",[2],"V/CV, and the digraph th stays together: fa-ther."],
["banana",[2,4],"Three beats: ba-na-na. Each syllable has one vowel sound."],["elephant",[2,3],"Three beats: el-e-phant. The digraph ph stays together."],
["hospital",[3,5],"Three beats: hos-pi-tal."]];
const PH={
cons:[["p","p",["pig","pen","cup"]],["b","b",["ball","bat","crab"]],["t","t",["top","tent","cat"]],["d","d",["dog","dad","bed"]],
["k","c, k, ck",["cat","kit","duck"]],["g","g",["go","gum","bag"]],["f","f, ph",["fish","phone","leaf"]],["v","v",["van","vet","five"]],
["θ","th",["thin","thumb","bath"]],["ð","th",["this","that","mother"]],["s","s, c",["sun","city","bus"]],["z","z, s",["zip","buzz","nose"]],
["ʃ","sh",["ship","shop","fish"]],["ʒ","s, si",["vision","measure","treasure"]],["h","h",["hat","hen","hop"]],["tʃ","ch",["chair","chip","lunch"]],
["dʒ","j, g, dge",["jam","giant","bridge"]],["m","m",["mum","map","jam"]],["n","n",["net","nut","sun"]],["ŋ","ng",["ring","song","king"]],
["l","l",["leg","lip","ball"]],["r","r",["red","run","rain"]],["j","y",["yes","yell","yellow"]],["w","w",["wet","win","window"]]],
short:[["æ","a",["cat","map","hat"]],["e","e",["bed","pen","red"]],["ɪ","i",["sit","pin","big"]],["ɒ","o",["hot","dog","box"]],
["ʌ","u",["cup","bus","sun"]],["ʊ","oo, u",["book","foot","put"]],["ə","a, e, er",["about","banana","teacher"]]],
long:[["eɪ","a_e, ai, ay",["cake","rain","day"]],["iː","ee, ea",["feet","tea","green"]],["aɪ","i_e, igh, y",["bike","light","sky"]],
["əʊ","o_e, oa, ow",["home","boat","snow"]],["uː","oo, ue, u_e",["moon","blue","flute"]],["ɑː","ar",["car","star","farm"]],
["ɔː","or, aw",["fork","saw","horse"]],["ɜː","er, ir, ur",["her","bird","turn"]],["ɔɪ","oi, oy",["coin","boy","toy"]],
["aʊ","ow, ou",["cow","house","out"]],["ɪə","ear, eer",["ear","deer","here"]],["eə","air, are",["chair","hair","bear"]],["ʊə","ure",["pure","cure","tour"]]]};
const TABS=[["cons","Consonants"],["short","Short vowels"],["long","Long vowels"]];
g.SayData={WORDS,PA,ODD,DEL,CHG,POOL,STRAT,L,SK,LT,SP,SY,PH,TABS};if(typeof module!=='undefined')module.exports=g.SayData;
})(typeof self!=='undefined'?self:globalThis);
