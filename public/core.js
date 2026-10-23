// Core helpers: state, api, sound, toasts, sprites, badges
const $=s=>document.querySelector(s),app=$('#app'),nav=$('#nav');
const NAVT=[['home','🏰','Home'],['rooms','🚪','Rooms'],['book','📖','Spellbook'],['me','🧙','Me']];
const R=(h,tab,tabs=NAVT)=>{app.innerHTML=h;nav.className=tab?'on':'';if(tab)nav.innerHTML=tabs.map(([k,i,n])=>`<button class="${k==tab?'on':''}" onclick="tabGo('${k}')"><i>${i}</i>${n}</button>`).join('')};
let S=JSON.parse(localStorage.S||'{}'),words=[],focus='acc',timer,cur,hand,ws,P=null,combo=0;
const save=()=>localStorage.S=JSON.stringify(S);
const api=(p,b)=>fetch('/api/'+p,{method:b?'POST':'GET',headers:{'content-type':'application/json',authorization:'Bearer '+S.tok},body:b&&JSON.stringify(b)}).then(r=>r.json()).catch(()=>({error:'Connection problem. Please try again.'}));
// Enter-key helper: must NOT return a value (returning false from an on* handler cancels the keystroke)
const onEnter=fn=>e=>{if(e.key=='Enter')fn()};
const esc=t=>String(t).replace(/[&<>"]/g,c=>'&#'+c.charCodeAt(0)+';');
const say=(t,r=.8)=>{try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='en-GB';u.rate=r;speechSynthesis.speak(u)}catch{}};
const sayS=()=>say(cur.s.replace('{w}',cur.w));
const mis=(w,bank)=>Spelling.mis(w,bank); // realistic misspelling (public/spelling.js); bank = wrong spellings real pupils in the class have written
const pick=n=>[...words].sort(()=>Math.random()-.5).slice(0,n);
// Words for a round: the review queue from the server (due words first, then new ones). Guests, or a failed request, get random words.
async function sched(n){if(!S.guest){const r=await api('due?n='+n);if(Array.isArray(r)&&r.length)return r}return pick(n)}
// No predictive text / autocorrect / spellcheck / grammar helpers / password-manager prompts on any text field
const NOAID={autocomplete:'off',autocapitalize:'none',autocorrect:'off',spellcheck:'false',writingsuggestions:'false','data-gramm':'false','data-gramm_editor':'false','data-enable-grammarly':'false','data-lpignore':'true','data-1p-ignore':'true','data-form-type':'other'};
const AI=' autocomplete=off autocapitalize=none autocorrect=off spellcheck=false writingsuggestions=false data-gramm=false data-gramm_editor=false data-enable-grammarly=false data-lpignore=true data-1p-ignore=true data-form-type=other enterkeyhint=go';
const noAid=el=>{if(el.matches&&el.matches('input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=button]):not([type=password]),textarea'))for(const k in NOAID)if(!el.hasAttribute(k))el.setAttribute(k,NOAID[k])};
const noAidAll=r=>{noAid(r);r.querySelectorAll&&r.querySelectorAll('input,textarea').forEach(noAid)};
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>n.nodeType==1&&noAidAll(n)))).observe(document.documentElement,{childList:true,subtree:true});
const TT=['Apprentice','Novice','Adept','Sorcerer','Archmage'],TH=['','ember','frost','gold','gold'],lv=x=>Math.floor(x/150)+1,rk=x=>Math.min(4,Math.floor(lv(x)/5));
const UN=[[5,'Ember wand theme'],[5,'Wraith Dungeon'],[10,'Frost wand theme'],[10,'Mending Workshop'],[15,'Gold wand theme'],[20,'Curse-Breaking Tower']];
const RC=['#7c3aed','#ea580c','#0891b2','#ca8a04','#be123c'],rob=()=>{const c=RC[rk(S.xp||0)];return{h:c,r:c}};
// Sound (Web Audio, no files) and haptics
let AC;const muted=()=>localStorage.sa_mute==='1';
addEventListener('pointerdown',()=>{try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();AC.resume()}catch{}},{once:true});
function tone(f,t,d,ty='sine',g=.15){if(muted()||!AC)return;try{const o=AC.createOscillator(),v=AC.createGain(),s=AC.currentTime+t;o.type=ty;o.frequency.value=f;v.gain.setValueAtTime(.0001,s);v.gain.exponentialRampToValueAtTime(g,s+.02);v.gain.exponentialRampToValueAtTime(.0001,s+d);o.connect(v);v.connect(AC.destination);o.start(s);o.stop(s+d+.05)}catch{}}
const SFX={ok:[[523,0,.1],[659,.09,.1],[784,.18,.2]],no:[[196,0,.18,'sawtooth',.07],[147,.16,.3,'sawtooth',.07]],lvl:[[523,0,.12],[659,.12,.12],[784,.24,.12],[1047,.36,.35]],badge:[[784,0,.1],[988,.1,.1],[1175,.2,.1],[1568,.3,.35]],goal:[[659,0,.1],[880,.1,.1],[1319,.2,.3]]};
const sfx=k=>(SFX[k]||[]).forEach(a=>tone(a[0],a[1],a[2],a[3]||'sine',a[4]||.15));
const buzz=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch{}};
const calm=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
// Toasts, confetti, count-up
const toast=(h,ms=2800)=>{const e=document.createElement('div');e.className='tt';e.innerHTML=h;$('#toast').append(e);setTimeout(()=>e.remove(),ms)};
const confetti=()=>{if(calm())return;for(let i=0;i<28;i++){const e=document.createElement('span');e.className='cf';e.textContent=['✨','⭐','🔮','💜'][i%4];e.style.left=Math.random()*100+'vw';e.style.animationDelay=Math.random()*.5+'s';document.body.append(e);setTimeout(()=>e.remove(),2600)}};
const countUp=(el,to)=>{if(calm()){el.textContent='+'+to;return}const t0=performance.now(),f=t=>{const p=Math.min(1,(t-t0)/800);el.textContent='+'+Math.round(to*p);if(p<1)requestAnimationFrame(f)};requestAnimationFrame(f)};
// Badges (ids must match src/worker.js)
const BD=[['first_spell','✨','First Spell','Get your first word right.'],['hundred','💯','Century Caster','Answer 100 words correctly.'],['five_hundred','📚','Grimoire Guardian','Answer 500 words correctly.'],['flawless10','🎯','Flawless 10','10 right in a row, each on the first try.'],['streak3','🔥','3-Day Flame','Reach your daily goal 3 days in a row.'],['streak7','🔥','7-Day Streak','Reach your daily goal 7 days in a row.'],['streak30','☄️','Eternal Flame','Reach your daily goal 30 days in a row.'],['forge50','🔨','Forgemaster','Build 50 words correctly in the Word Forge.'],['mastered10','📘','Word Smith','Master 10 words: spell each right first time on 3 different days.'],['mastered50','🏛️','Lexicon Keeper','Master 50 words (right first time on 3 different days).'],['rank_novice','🟠','Novice','Reach Lv5.'],['rank_adept','🔵','Adept','Reach Lv10.'],['rank_sorcerer','🟡','Sorcerer','Reach Lv15.'],['rank_archmage','👑','Archmage','Reach Lv20.'],['dungeon_clear','🏆','Dungeon Cleared','Clear the Wraith Dungeon.'],['curse_breaker','🔍','Curse Breaker','Break 10 curses in the Tower.'],['duel_winner','⚔️','Duel Winner','Win a duel against another apprentice.']];
function fx(r){(r.badges||[]).forEach((b,i)=>{const d=BD.find(x=>x[0]==b);if(d)setTimeout(()=>{toast(`${d[1]} New badge: <b>${d[2]}</b>`);sfx('badge');confetti()},i*900)});if(r.goal)setTimeout(()=>{toast(`🔥 Daily goal done! ${r.goal}-day streak`);sfx('goal')},300)}
const PAL={f:'#f5c9a0',e:'#222',b:'#432',w:'#fff',k:'#111',m:'#3b0764',c:'#38bdf8',p:'#a855f7'};
const SP={wiz:['...hhhh...','..hhhhhh..','.hhhhhhhh.','...ffff...','...fefe...','...ffff...','..rrrrrr..','.rrrrrrrr.','.rrrrrrrr.','.rrrrrrrr.','.rr....rr.','.bb....bb.'],
wr:['...gggg...','..gggggg..','.gwkggwkg.','.gwwggwwg.','.gggggggg.','.gggmmggg.','.gggggggg.','.gg.gg.gg.','.g..gg..g.'],
wizc:['...hhhh...','..hhhhhh..','.hhhhhhhh.','...ffff...','...fefe...','...ffff...','..rrrrrr..','.rrrrrrrff','.rrrrrrrr.','.rrrrrrrr.','.rr....rr.','.bb....bb.'],
wrh:['...gggg...','..gggggg..','.gkkggkkg.','.gggggggg.','.gggggggg.','.ggmmmmgg.','.gggggggg.','.gg.gg.gg.','.g..gg..g.'],
heart:['.rr.rr.','rrrrrrr','rrrrrrr','.rrrrr.','..rrr..','...r...'],potion:['..cc..','..cc..','.pppp.','pppppp','pppppp','.pppp.']},_c={};
function spr(n,pal={},sc=5){const g=SP[n],P={...PAL,...pal},k=n+JSON.stringify(pal);if(!_c[k]){const c=document.createElement('canvas');c.width=g[0].length;c.height=g.length;const x=c.getContext('2d');g.forEach((row,y)=>[...row].forEach((ch,i)=>{if(ch!='.'){x.fillStyle=P[ch];x.fillRect(i,y,1,1)}}));_c[k]=c.toDataURL()}return `<img src="${_c[k]}" style="width:${g[0].length*sc}px;image-rendering:pixelated">`}
