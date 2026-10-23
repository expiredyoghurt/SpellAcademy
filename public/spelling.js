// Spelling helpers shared by the browser (classic script) and the Worker (import).
//   Spelling.mis(word, bank)   a realistic misspelling of word; bank = real wrong spellings pupils have written
//   Spelling.classify(w, ans)  why a wrong answer is wrong: doubling | vowel | transposition | phonetic | omission | insertion | other
//   Spelling.types(word)       which of those error types are plausible for this word
//   Spelling.plausible(w, ans) true if ans looks like a genuine attempt at w (used to filter the real-error bank)
(function(g){
const isV=c=>'aeiou'.includes(c),isL=c=>c>='a'&&c<='z',rnd=n=>Math.floor(Math.random()*n);
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z]/g,'');

// ---- 1. Error classifier ----
const skel=s=>s.replace(/(?!^)[aeiouy]/g,'').replace(/^[aeiou]/,'a');   // consonant skeleton (vowels and non-initial y ignored)
const squash=s=>s.replace(/([^aeiou])\1+/g,'$1');                        // single/double consonants look the same
// Rough "how does it sound" form: two spellings that match here are phonetically plausible for each other.
const snd=s=>squash(s.replace(/ight/g,'ite').replace(/tion|sion|cian|tian|sian|cion/g,'shun').replace(/ous$/,'us').replace(/ture/g,'cher')
 .replace(/ph/g,'f').replace(/ck/g,'k').replace(/^kn/,'n').replace(/^wr/,'r').replace(/^gn/,'n').replace(/mb$/,'m').replace(/wh/g,'w').replace(/tch/g,'ch')
 .replace(/dge/g,'j').replace(/g(?=[eiy])/g,'j').replace(/c(?=[eiy])/g,'s').replace(/qu/g,'kw').replace(/c/g,'k').replace(/q/g,'k').replace(/x/g,'ks').replace(/z/g,'s').replace(/y$/,'i'));
const subseq=(a,t)=>{let i=0;for(const c of t)if(i<a.length&&a[i]===c)i++;return i===a.length};
function classify(word,ans){const t=norm(word),a=norm(ans);if(!a||a===t)return null;
 if(squash(a)===squash(t))return 'doubling';                    // neccessary, embarass, tommorow
 if(a.length===t.length){let i=0;while(a[i]===t[i])i++;if(a[i]===t[i+1]&&a[i+1]===t[i]&&a.slice(i+2)===t.slice(i+2))return isV(a[i])&&isV(a[i+1])?'vowel':'transposition'} // form/from (swapped vowels such as ie/ei count as vowel errors)
 if(skel(a)===skel(t))return 'vowel';                           // recieve, seperate, definately, freind
 if(snd(a)===snd(t))return 'phonetic';                          // foto, reseive, lite, nife
 if(a.length<t.length&&t.length-a.length<=2&&subseq(a,t))return 'omission';    // libary, Febuary
 if(a.length>t.length&&a.length-t.length<=2&&subseq(t,a))return 'insertion';   // extra letters
 return 'other'}

// ---- 2. Misspelling generator ----
// Each rule: [regex, replacement(s), weight]. Every match of every rule becomes one candidate.
const RULES=[
 // vowel patterns
 [/ie/,['ei'],3],[/ei/,['ie'],3],[/ea/,['ee'],2],[/ee/,['ea'],2],[/ai/,['ay'],2],[/ay/,['ai'],2],[/ou/,['ow'],2],[/ow/,['ou'],2],[/oa/,['ow'],2],
 [/au/,['aw'],2],[/aw/,['au'],2],[/oi/,['oy'],2],[/oy/,['oi'],2],[/oo/,['ou'],1],[/ue/,['ew'],1],[/ew/,['ue'],1],
 // silent letters
 [/^kn/,['n'],3],[/^wr/,['r'],3],[/^gn/,['n'],3],[/mb$/,['m'],3],[/gh/,[''],2],[/^wh/,['w'],2],[/gu(?=[aeiy])/,['g'],3],[/sc(?=[ei])/,['s'],3],
 [/stle$/,['sle'],3],[/(s|f)ten$/,['$1en'],3],[/bt/,['t'],2],
 // sounds
 [/ph/,['f'],3],[/ck/,['k'],2],[/c(?=[eiy])/,['s'],3],[/(?<=[aeiou])s(?=[ei])/,['c'],1.5],[/dge/,['ge'],2],[/g(?=[ei])/,['j'],2],[/tch/,['ch'],2],
 [/tion/,['shun','sion'],3],[/sion/,['tion'],2],[/cian/,['tian'],2],[/tial/,['cial'],2],[/cial/,['tial'],2],[/cious/,['tious'],2],[/tious/,['cious'],2],
 [/ight/,['ite'],3],[/ous$/,['us'],2],[/y$/,['i'],2],[/z/,['s'],1.5],[/ture/,['cher'],2],
 // endings
 [/ant(?=$|ly$|s$)/,['ent'],3],[/ent(?=$|ly$|s$)/,['ant'],3],[/ance$/,['ence'],3],[/ence$/,['ance'],3],[/able$/,['ible'],3],[/ible$/,['able'],3],
 [/ary$/,['ery'],2],[/ery$/,['ary'],2],[/ful$/,['full'],3],[/less$/,['les'],2],[/ness$/,['nes'],2],[/le$/,['el'],2],[/el$/,['le'],2],[/er$/,['ar','or'],1]];
const VOW={a:['e','i'],e:['a','i'],i:['e','a'],o:['u','a'],u:['o','a']};
function cands(w){const m=new Map(),n=w.length;
 const add=(s,wt)=>{if(s&&s!==w&&s.length>=2&&/^[a-z]+$/.test(s))m.set(s,(m.get(s)||0)+wt)};
 const sub=(i,len,r)=>w.slice(0,i)+r+w.slice(i+len);
 for(const[re,reps,wt]of RULES){const g2=new RegExp(re.source,'g');let x;while((x=g2.exec(w))){if(!x[0].length){g2.lastIndex++;continue}reps.forEach(r=>add(w.slice(0,x.index)+x[0].replace(new RegExp(re.source),r)+w.slice(x.index+x[0].length),wt/reps.length))}}
 for(let i=0;i<n-1;i++)if(w[i]===w[i+1]&&isL(w[i])&&!isV(w[i]))add(sub(i,2,w[i]),3);                                   // undouble
 for(let i=1;i<n-1;i++){const c=w[i];if(isL(c)&&!isV(c)&&!'hwxyqj'.includes(c)&&isV(w[i-1])&&isV(w[i+1]))add(sub(i,1,c+c),2)} // double
 for(let i=1;i<n;i++){const c=w[i];if(isV(c)&&!isV(w[i-1])&&!isV(w[i+1]||'')&&VOW[c])VOW[c].forEach(v=>add(sub(i,1,v),1.5))}  // lone vowel swapped (seperate, definate)
 if(n>3&&w.endsWith('e')&&!isV(w[n-2]))add(w.slice(0,-1),2);                                                            // silent e forgotten
 if(n>=4){const k=1.5/(n-2);for(let i=1;i<n-1;i++)add(sub(i,1,''),k)}                                                   // one letter missed
 if(n>=3){const k=1/(n-1);for(let i=0;i<n-1;i++)if(w[i]!==w[i+1])add(sub(i,2,w[i+1]+w[i]),k)}                           // swapped letters
 return m}
const TW={vowel:30,doubling:25,phonetic:25,omission:12,transposition:3,insertion:1}; // how often each kind of slip is chosen (when the word allows it)
function byType(w){const by={};for(const[s,wt]of cands(w)){const t=classify(w,s);if(t&&t!=='other')(by[t]=by[t]||[]).push([s,wt])}return by}
const wpick=(L,f)=>{let r=L.reduce((x,y)=>x+f(y),0)*Math.random();for(const y of L){r-=f(y);if(r<=0)return y}return L[0]};
function types(word){return new Set(Object.keys(byType(norm(word))))}
function mis(word,bank){const raw=String(word),w=raw.toLowerCase(),cap=raw[0]!==w[0],fix=s=>cap?s[0].toUpperCase()+s.slice(1):s;
 const b=(bank||[]).filter(x=>typeof x==='string'&&x!==w&&x.length>=2);
 if(b.length&&Math.random()<.5)return fix(b[rnd(b.length)]);                    // a mistake real pupils in this class have made
 const by=byType(w),ks=Object.keys(by);
 if(!ks.length){const i=Math.max(1,w.length-1);return fix(w.slice(0,i)+w[i-1]+w.slice(i))}
 const k=wpick(ks,x=>TW[x]||1);return fix(wpick(by[k],x=>x[1])[0])}   // pick the kind of slip first, so one common kind (vowels) cannot crowd out the rest

// ---- 3. Is this wrong answer a real attempt at the word? (filters junk out of the real-error bank) ----
function lev(a,b){const d=Array.from({length:a.length+1},(_,i)=>[i,...Array(b.length).fill(0)]);for(let j=1;j<=b.length;j++)d[0][j]=j;
 for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[a.length][b.length]}
function plausible(word,ans){const w=norm(word),a=String(ans||'').toLowerCase();return /^[a-z]{2,40}$/.test(a)&&a!==w&&lev(a,w)<=(w.length>=9?3:2)}

g.Spelling={mis,classify,types,plausible};if(typeof module!=='undefined')module.exports=g.Spelling;
})(typeof self!=='undefined'?self:globalThis);
