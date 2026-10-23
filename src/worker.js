import {LISTS} from './words.js';
import Spelling from '../public/spelling.js'; // shared with the browser: misspelling generator and error classifier
const {mis,classify}=Spelling;
import {FORGE,RULES,forgeBy,forgeRules} from './forge.js'; // Word Forge: roots, endings and the rules that join them
const PARSED=Object.fromEntries(Object.entries(LISTS).map(([k,v])=>[k,v.w.split('\n').filter(Boolean).map(l=>l.split('|')).map(x=>({w:x[0].toLowerCase(),s:x[1],h:x[2]}))]));
const flagsFor=(ws,lv,sh,id)=>{const seen=new Set(),out=[];for(const x of ws){const why=[];if(seen.has(x.w))why.push('repeated in this list');seen.add(x.w);lv.forEach(v=>{if((PARSED[v]||[]).some(y=>y.w==x.w))why.push('already in '+v.toUpperCase())});sh.forEach(o=>{if(o.id!=id&&o.v.some(v=>lv.includes(v))&&o.s.has(x.w))why.push('in shared list "'+o.name+'"')});if(why.length)out.push({w:x.w,why:why.join('; ')})}return out};
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});
const enc=new TextEncoder(),b64=b=>btoa(String.fromCharCode(...new Uint8Array(b)));
async function hmac(k,m){const key=await crypto.subtle.importKey('raw',enc.encode(k),{name:'HMAC',hash:'SHA-256'},false,['sign']);return b64(await crypto.subtle.sign('HMAC',key,enc.encode(m)))}
const sign=async(env,p)=>{const m=btoa(JSON.stringify(p));return m+'.'+await hmac(env.SECRET,m)};
async function verify(env,t){try{const[m,s]=t.split('.');return s===await hmac(env.SECRET,m)?JSON.parse(atob(m)):null}catch{return null}}
async function hash(pw,salt){const k=await crypto.subtle.importKey('raw',enc.encode(pw),'PBKDF2',false,['deriveBits']);return b64(await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:100000,hash:'SHA-256'},k,256))}
const lvl=x=>Math.floor(x/150)+1;
const HEAL_MAX=3,EV_MAX=6,RUN_XP_CAP=1500; // per dungeon run: max heals, max random events, max XP
const START_HEARTS=3,FLOOR=10; // dungeon: hearts at the start (each fall returns the pupil to the last checkpoint with one fewer; the run ends after START_HEARTS falls) and correct answers per floor/checkpoint (the app has 10 story chapters, so keep FLOOR=10 unless you add chapters)
const GATE={1:1,2:10,3:20,4:5,d:1,f:1},MM={1:'1',2:'2',spot1:'3',spot2:'3',duel:'d',f:'f'};
const un=(s,m,xp)=>{const v=(s.modes||{})[m]||'auto';return v==='open'||(v==='auto'&&lvl(xp)>=GATE[m])};
const ms=(s,xp)=>Object.fromEntries(Object.keys(GATE).map(m=>[m,un(s,m,xp)||((s.modes||{})[m]==='locked'?'L':GATE[m])]));
const gain=(ok,tries,ms,focus)=>{if(!ok)return 1;const base=[0,10,6,3][tries]||3;return Math.round(base+Math.max(0,1-ms/20000)*(focus=='spd'?15:5))};

async function classSettings(D,c){const r=await D.prepare('select settings from classes where code=?').bind(c).first();try{return JSON.parse((r&&r.settings)||'{}')}catch{return{}}}
async function bankForD(D,code){const r=await D.prepare('select list from class_lists where code=?').bind(code).all(),c=await D.prepare('select teacher_id from classes where code=?').bind(code).first();let ids=r.results.map(x=>x.list);if(!ids.length)ids=['default'];let out=[];
 for(const id of ids){if(PARSED[id]){out=out.concat(PARSED[id]);if(/^p[1-6]$/.test(id)&&c){const t=await D.prepare('select words from lists where (owner=? and levels like ?) or shared like ?').bind(c.teacher_id,'%"'+id+'"%','%"'+id+'"%').all();t.results.forEach(x=>{out=out.concat(JSON.parse(x.words))})}}
  else if(/^c\d+$/.test(id)){const l=await D.prepare('select words from lists where id=?').bind(+id.slice(1)).first();if(l)out=out.concat(JSON.parse(l.words))}}
 return[...new Map(out.map(x=>[x.w,x])).values()]}
const clean=x=>String(x||'').toLowerCase().replace(/[^a-z' -]/g,'').slice(0,40)||null; // wrong spellings kept for teacher analytics

// ---- Review queue shared by the word rooms and the Word Forge ----
// Due items first (most overdue first), then new ones, then ones not yet due. When there is a backlog a third of the round is kept for new items.
// sm maps an item's key to its due day; hit(item) optionally floats items up (used to target a pupil's recurring kind of slip).
function queue(items,key,sm,today,n,hit){const due=[],fresh=[],ahead=[];
 for(const o of items){const d=sm.get(key(o)),h=hit?hit(o):false;if(d===undefined)fresh.push([o,(h?0:1)+Math.random()*.9]);else if(d<=today)due.push([o,d-(h?.5:0)+Math.random()*.4]);else ahead.push([o,d+Math.random()*.4])}
 const by=l=>l.sort((x,y)=>x[1]-y[1]).map(x=>x[0]),D1=by(due),F1=by(fresh),A1=by(ahead),nn=Math.min(F1.length,D1.length>=n?Math.floor(n/3):n-D1.length),dd=Math.min(D1.length,n-nn);
 const out=[...D1.slice(0,dd).map(o=>({o,r:'due'})),...F1.slice(0,nn).map(o=>({o,r:'new'}))];
 for(const[l,r]of[[D1.slice(dd),'due'],[F1.slice(nn),'new'],[A1,'ahead']])for(const o of l){if(out.length>=n)break;out.push({o,r})}
 return out.sort(()=>Math.random()-.5)}
// Which Word Forge items a class gets: a teacher setting (p3 to p6, or all), or by default the highest level among the class's ticked word lists.
async function forgePool(D,code){const set=await classSettings(D,code),v=set.forge||'auto';let mx;
 if(/^p[3-6]$/.test(v))mx=+v[1];else if(v==='all')mx=6;else{const ids=(await D.prepare('select list from class_lists where code=?').bind(code).all()).results.map(x=>x.list).filter(x=>/^p[1-6]$/.test(x)).map(x=>+x[1]);mx=ids.length?Math.max(...ids):6}
 return FORGE.filter(x=>x.lv<=Math.max(3,mx))}
const pubForge=x=>({w:x.w,l:x.l,r:x.r,pre:x.pre,rule:x.rule,s:x.s});
const forgeFallback=w=>{const f=forgeBy.get(w);return f?{s:f.s,h:RULES[f.rule].n+': '+RULES[f.rule].ex}:null};
// Accuracy by Word Forge rule, from attempts rows {word,n,k}
const forgeStats=rows=>{const m={};for(const x of rows){const f=forgeBy.get(x.word);if(!f)continue;const o=m[f.rule]=m[f.rule]||{rule:f.rule,name:RULES[f.rule].n,att:0,k:0};o.att+=x.n;o.k+=x.k}return Object.values(m).sort((a,b)=>a.k/a.att-b.k/b.att)};

// ---- Progress: daily streak, mastery and badges (all derived from the attempts table) ----
const GOAL=5,SGT=28800; // daily goal = 5 answers; days are counted in Singapore time
const dayNo=ts=>Math.floor((ts+SGT)/86400),wkNo=d=>Math.floor((d-4)/7); // weeks start on Monday
// ---- Spaced review (v2.3): one Leitner box per pupil per word ----
// Box 0 = new or just missed. A word moves up one box only when it is answered right FIRST TIME on a day it is due, so repeating a word within one
// sitting cannot "master" it. Days until the word is due again, by box:
const BOX_GAP=[0,1,3,7,14,30],MASTER_BOX=3; // box 3 = Mastered = right first time on 3 different days, with growing gaps (1 day, then 3 days)
function nextState(row,ok,tries,today){let box=row?row.box:0,due=row?row.due:0,lapses=row?row.lapses:0;
 if(ok&&tries==1){if(due<=today){box=Math.min(box+1,5);due=today+BOX_GAP[box]}} // right first time: only counts when the word was due
 else if(ok)due=today+1;                                                          // right but needed hints: no promotion, see it again tomorrow
 else{lapses++;box=Math.max(0,box-2);due=box?today+1:today}                       // missed: slide back two boxes
 return{box,due,lapses}}
// Existing pupils have attempts but no word_state yet: replay their history once (oldest first), the first time anything needs it.
async function ensureState(D,id){
 if(await D.prepare('select 1 x from word_state where student_id=? limit 1').bind(id).first())return;
 const h=(await D.prepare("select word,ok,tries,ts from attempts where student_id=? and mode!='spot1' order by id").bind(id).all()).results;if(!h.length)return;
 const m=new Map();for(const x of h){const w=String(x.word).toLowerCase(),o=m.get(w),s=nextState(o,x.ok==1,x.tries|0,dayNo(x.ts));m.set(w,{...s,n:(o?o.n:0)+1,upd:x.ts})}
 const st=D.prepare('insert or replace into word_state(student_id,word,box,due,lapses,n,upd) values(?,?,?,?,?,?,?)'),rows=[...m].map(([w,s])=>st.bind(id,w,s.box,s.due,s.lapses,s.n,s.upd));
 for(let i=0;i<rows.length;i+=50)await D.batch(rows.slice(i,i+50))}
// The statement that records one answer in word_state (add it to the same batch as the attempts insert). Call ensureState first.
async function stateStmt(D,id,word,ok,tries){const w=String(word).toLowerCase().slice(0,60),now=Math.floor(Date.now()/1000),row=await D.prepare('select box,due,lapses,n from word_state where student_id=? and word=?').bind(id,w).first(),s=nextState(row,ok,tries,dayNo(now));
 return D.prepare('insert or replace into word_state(student_id,word,box,due,lapses,n,upd) values(?,?,?,?,?,?,?)').bind(id,w,s.box,s.due,s.lapses,(row?row.n:0)+1,now)}
// Wrong-answer analytics. etype is stored from v2.3; older rows are classified here from the wrong spelling itself.
const ETYPES=['vowel','doubling','phonetic','omission','insertion','transposition','other'];
const errMix=rows=>{const m={};let tot=0;for(const x of rows){const t=x.et||classify(x.word,x.ans);if(t){m[t]=(m[t]||0)+x.c;tot+=x.c}}return{tot,types:ETYPES.filter(t=>m[t]).map(t=>({t,c:m[t],pct:Math.round(100*m[t]/tot)})).sort((a,b)=>b.c-a.c)}};
// A pupil's recurring kinds of slip over the last 60 days (needs 5+ classified errors; a kind must be 30%+ of them). The scheduler favours words where those slips are likely.
async function weakTypes(D,id){const r=(await D.prepare("select word,ans,max(etype) et,count(*) c from attempts where student_id=? and ok=0 and ans is not null and ans!='' and ts>=? group by word,ans").bind(id,Math.floor(Date.now()/1000)-60*86400).all()).results,{tot,types}=errMix(r);
 return tot>=5?types.filter(x=>x.t!=='other'&&x.c>=Math.max(3,tot*.3)).slice(0,2).map(x=>x.t):[]}
// Real wrong spellings pupils in a class have written (2+ different pupils, close to the word). Used as extra distractors in Mending Workshop, Curse-Breaking Tower, Dungeon and Duels.
const EB=new Map();
async function errBank(D,code){const hit=EB.get(code);if(hit&&Date.now()-hit.t<3e5)return hit.m;
 const r=(await D.prepare("select a.word,a.ans,count(distinct a.student_id) p,count(*) c from attempts a join students s on s.id=a.student_id where s.code=? and a.ok=0 and a.ans is not null and a.ans!='' and a.mode!='spot1' group by a.word,a.ans having p>=2 order by p desc,c desc limit 600").bind(code).all()).results,m=new Map();
 for(const x of r){if(!Spelling.plausible(x.word,x.ans))continue;const l=m.get(x.word)||[];if(l.length<3){l.push(x.ans);m.set(x.word,l)}}
 EB.set(code,{t:Date.now(),m});return m}
// One missed day per Monday-Sunday week is forgiven (a free 'streak freeze'), if the day before it was a goal day.
function streakOf(rows,today){const days=new Set(rows.filter(r=>r.c>=GOAL).map(r=>r.d)),used={};let n=0,d=today-1;const hit=days.has(today);if(hit)n=1;
 for(;;){if(days.has(d)){n++;d--;continue}const w=wkNo(d);if(!used[w]&&days.has(d-1)){used[w]=1;d--;continue}break}
 return{n,hit,free:!used[wkNo(today)]}}
async function progress(D,st){const id=st.id,now=Math.floor(Date.now()/1000),today=dayNo(now);await ensureState(D,id);
 const r=await D.batch([
  D.prepare("select count(*) n,coalesce(sum(ok),0) k from attempts where student_id=? and mode!='spot1'").bind(id),
  D.prepare("select ok,tries from attempts where student_id=? and mode!='spot1' order by id desc limit 10").bind(id),
  D.prepare("select (ts+28800)/86400 d,count(*) c from attempts where student_id=? and mode!='spot1' group by d").bind(id),
  D.prepare("select count(*) n from word_state where student_id=? and box>=?").bind(id,MASTER_BOX),
  D.prepare("select count(*) n from attempts where student_id=? and mode='spot2' and ok=1").bind(id),
  D.prepare("select 1 x from runs where student_id=? and status='won' limit 1").bind(id),
  D.prepare('select badge,ts from badges where student_id=?').bind(id),
  D.prepare('select count(*) n from duel_wins where student_id=?').bind(id),
  D.prepare("select count(*) n from attempts where student_id=? and mode='f' and ok=1").bind(id)]);
 const tot=r[0].results[0],last=r[1].results,days=r[2].results,mas=r[3].results[0].n,sp2=r[4].results[0].n,won=r[5].results.length>0,have=r[6].results,wins=r[7].results[0].n,fg=r[8].results[0].n;
 const s=streakOf(days,today),k=tot.k,l=lvl(st.xp);
 const earned={first_spell:k>=1,hundred:k>=100,five_hundred:k>=500,flawless10:last.length==10&&last.every(x=>x.ok&&x.tries==1),streak3:s.n>=3,streak7:s.n>=7,streak30:s.n>=30,mastered10:mas>=10,mastered50:mas>=50,rank_novice:l>=5,rank_adept:l>=10,rank_sorcerer:l>=15,rank_archmage:l>=20,dungeon_clear:won,curse_breaker:sp2>=10,duel_winner:wins>=1,forge50:fg>=50};
 const owned=new Set(have.map(x=>x.badge)),fresh=Object.keys(earned).filter(b=>earned[b]&&!owned.has(b));
 if(fresh.length)await D.batch(fresh.map(b=>D.prepare('insert or ignore into badges(student_id,badge) values(?,?)').bind(id,b)));
 const t=days.find(x=>x.d==today);
 return{fresh,streak:{n:s.n,hit:s.hit,free:s.free,today:t?t.c:0,goal:GOAL},mastered:mas,have:[...have,...fresh.map(b=>({badge:b,ts:now}))]}}

export default{async fetch(req,env){
const u=new URL(req.url),p=u.pathname;
if(p==='/ws/duel'){const room=(u.searchParams.get('room')||'X').toUpperCase().slice(0,20),tk=u.searchParams.get('tok');let sid=0,name='Guest'+(100+Math.floor(Math.random()*900)),code='';
 if(tk){const v=await verify(env,tk);const s=v&&v.r==='s'?await env.DB.prepare('select name from students where id=?').bind(v.id).first():null;if(!s)return new Response('Not signed in',{status:401});sid=v.id;name=s.name;code=v.code}
 const h=new Headers(req.headers);['x-sid','x-name','x-code'].forEach(k=>h.delete(k));h.set('x-sid',String(sid));h.set('x-name',name);h.set('x-code',code); // identity comes from the signed token, never from the client
 return env.DUEL.get(env.DUEL.idFromName(room)).fetch(new Request(req,{headers:h}))}
if(p==='/api/guest-words')return J(PARSED.default);
if(p==='/api/guest-forge'){const n=Math.max(1,Math.min(12,+u.searchParams.get('n')||6));return J({rules:forgeRules(),items:FORGE.filter(x=>x.lv<=4).sort(()=>Math.random()-.5).slice(0,n).map(pubForge)})}
const b=req.method==='POST'?await req.json().catch(()=>({})):{};
const a=await verify(env,(req.headers.get('authorization')||'').slice(7)),D=env.DB;
const T=a&&a.r==='t',St=a&&a.r==='s';
const cs=c=>classSettings(D,c);
const lv6=a=>[...new Set(Array.isArray(a)?a:[])].filter(x=>/^p[1-6]$/.test(x));
const bankFor=code=>bankForD(D,code);
const mkch=async a=>{const bank=await bankFor(a.code),eb=await errBank(D,a.code),mw=(await D.prepare('select word from attempts where student_id=? and ok=0 group by word order by count(*) desc limit 10').bind(a.id).all()).results.map(x=>x.word),miss=bank.filter(w=>mw.includes(w.w)),arr=miss.length&&Math.random()<.4?miss:bank,w=arr[Math.floor(Math.random()*arr.length)],k=Math.random()<.5?'ear':'fix';
 return{cur:{k,w:w.w,s:w.s,h:w.h,t:Date.now(),n:0},pub:k=='ear'?{k,w:w.w,sn:w.s.replace('{w}',w.w)}:{k,s:w.s,sh:mis(w.w,eb.get(w.w))}}};
const own=c=>D.prepare('select 1 from classes where code=? and teacher_id=?').bind((c||'').toUpperCase(),a.id).first();
if(p==='/api/login'){const name=(b.name||'').trim().slice(0,30),code=(b.code||'').trim().toUpperCase();
 if(!name||!await D.prepare('select 1 from classes where code=?').bind(code).first())return J({error:'Unknown class code or name'},400);
 let s=await D.prepare('select * from students where name=? and code=?').bind(name,code).first();
 if(!s){if((await cs(code)).enrol==='closed')return J({error:'No account yet. Ask your teacher.'},400);const r=await D.prepare('insert into students(name,code) values(?,?)').bind(name,code).run();s={id:r.meta.last_row_id,name,xp:0}}
 return J({tok:await sign(env,{r:'s',id:s.id,code}),name:s.name,code,xp:s.xp,modes:ms(await cs(code),s.xp)})}
if(p==='/api/teacher/login'){const t=await D.prepare('select * from teachers where user=?').bind(b.user||'').first();
 if(!t||await hash(b.pass||'',t.salt)!==t.hash)return J({error:'Wrong username or password'},401);
 return J({tok:await sign(env,{r:'t',id:t.id})})}
if(p==='/api/admin/teacher'){if(!env.ADMIN_KEY||b.key!==env.ADMIN_KEY)return J({error:'Bad admin key'},403);
  b.user=String(b.user||'').trim();b.pass=String(b.pass||'');if(b.user.length<3||b.user.length>30)return J({error:'Username must be 3 to 30 characters'},400);if(b.pass.length<6)return J({error:'Password must be at least 6 characters'},400);
 const salt=crypto.randomUUID();try{await D.prepare('insert into teachers(user,salt,hash) values(?,?,?)').bind(b.user,salt,await hash(b.pass,salt)).run()}catch{return J({error:'Username taken'},400)}return J({ok:1})}
if(['/api/admin/teachers','/api/admin/classes','/api/admin/roster','/api/admin/resetpass'].includes(p)){if(!env.ADMIN_KEY||b.key!==env.ADMIN_KEY)return J({error:'Bad admin key'},403);
 if(p==='/api/admin/teachers'){const t=(await D.prepare('select t.id,t.user,(select count(*) from classes c where c.teacher_id=t.id) classes,(select count(*) from students s join classes c on c.code=s.code where c.teacher_id=t.id) pupils from teachers t order by t.user collate nocase').all()).results;
  return J({teachers:t,totals:{teachers:t.length,classes:t.reduce((n,x)=>n+x.classes,0),pupils:t.reduce((n,x)=>n+x.pupils,0)}})}
 if(p==='/api/admin/classes')return J((await D.prepare('select c.code,c.name,c.teacher_id,t.user teacher,(select count(*) from students s where s.code=c.code) pupils from classes c left join teachers t on t.id=c.teacher_id order by t.user collate nocase,c.name collate nocase').all()).results);
 if(p==='/api/admin/roster'){const c=String(b.code||'').toUpperCase(),cl=await D.prepare('select c.code,c.name,t.user teacher from classes c left join teachers t on t.id=c.teacher_id where c.code=?').bind(c).first();if(!cl)return J({error:'Class not found'},404);
  return J({cls:cl,pupils:(await D.prepare("select s.id,s.name,s.xp,count(a.id) n,max(a.ts) last from students s left join attempts a on a.student_id=s.id and a.mode!='spot1' where s.code=? group by s.id order by s.name").bind(c).all()).results.map(x=>({...x,lv:lvl(x.xp)}))})}
 const pw=String(b.pass||'');if(pw.length<6)return J({error:'Password must be at least 6 characters'},400);const t=await D.prepare('select id from teachers where id=?').bind(+b.id).first();if(!t)return J({error:'Teacher not found'},404);
 const salt=crypto.randomUUID();await D.prepare('update teachers set salt=?,hash=? where id=?').bind(salt,await hash(pw,salt),t.id).run();return J({ok:1})}
if(p==='/api/admin/pending'||p==='/api/admin/review'||p==='/api/admin/dedupe'){if(!env.ADMIN_KEY||b.key!==env.ADMIN_KEY)return J({error:'Bad admin key'},403);
 if(p==='/api/admin/pending'){const all=(await D.prepare("select l.*,t.user owner_name from lists l left join teachers t on t.id=l.owner where l.levels!='[]'").all()).results,sh=all.filter(x=>x.shared!=='[]').map(o=>({id:o.id,name:o.name,v:JSON.parse(o.shared),s:new Set(JSON.parse(o.words).map(y=>y.w))}));
  return J({lists:all.map(l=>{const lv=JSON.parse(l.levels||'[]'),ok=JSON.parse(l.shared||'[]'),dec=JSON.parse(l.declined||'[]'),ws=JSON.parse(l.words);return{id:l.id,name:l.name,owner:l.owner_name,count:ws.length,words:ws.map(x=>x.w),pending:lv.filter(v=>!ok.includes(v)&&!dec.includes(v)),flags:flagsFor(ws,lv,sh,l.id)}}).filter(l=>l.pending.length)})}
 if(p==='/api/admin/review'){const l=await D.prepare('select * from lists where id=?').bind(+b.id).first();if(!l||!/^p[1-6]$/.test(b.level||''))return J({error:'Not found'},404);
  const ok=JSON.parse(l.shared||'[]').filter(v=>v!==b.level),dec=JSON.parse(l.declined||'[]').filter(v=>v!==b.level);(b.approve?ok:dec).push(b.level);
  await D.prepare('update lists set shared=?,declined=? where id=?').bind(JSON.stringify(ok),JSON.stringify(dec),l.id).run();return J({ok:1})}
 const ls=(await D.prepare("select id,words,shared from lists where shared!='[]' order by id").all()).results,seen={};let removed=0;
 for(const l of ls){const v=JSON.parse(l.shared),ws=JSON.parse(l.words),keep=[],loc=new Set();for(const x of ws){if(loc.has(x.w))continue;loc.add(x.w);if(v.some(k=>(PARSED[k]||[]).some(y=>y.w==x.w)||(seen[k]||new Set()).has(x.w)))continue;keep.push(x)}
  v.forEach(k=>{seen[k]=seen[k]||new Set();keep.forEach(x=>seen[k].add(x.w))});
  if(keep.length&&keep.length!==ws.length){removed+=ws.length-keep.length;await D.prepare('update lists set words=? where id=?').bind(JSON.stringify(keep),l.id).run()}}
 return J({removed})}
if(St&&p==='/api/me'){const m=await D.prepare('select xp from students where id=?').bind(a.id).first();return J({xp:m.xp,modes:ms(await cs(a.code),m.xp)})}
if(St&&p==='/api/run/start'){const x0=await D.prepare('select xp from students where id=?').bind(a.id).first();if(!un(await cs(a.code),'4',x0.xp))return J({error:'locked'},403);
 await D.prepare("update runs set status='abandoned' where student_id=? and status='active'").bind(a.id).run();
 const ch=await mkch(a),r=await D.prepare('insert into runs(student_id,hearts,correct,peak,deaths,cur) values(?,?,0,0,0,?)').bind(a.id,START_HEARTS,JSON.stringify(ch.cur)).run();
 return J({run:r.meta.last_row_id,hearts:START_HEARTS,correct:0,deaths:0,ch:ch.pub})}
if(St&&p==='/api/run/ready'){await D.prepare("update runs set cur=json_set(cur,'$.t',?) where id=? and student_id=? and status='active'").bind(Date.now(),b.run|0,a.id).run();return J({ok:1})} // restarts the answer timer after a story screen, so reading never costs the speed bonus
if(St&&p==='/api/run/answer'){const r=await D.prepare("select * from runs where id=? and student_id=? and status='active'").bind(b.run|0,a.id).first();if(!r)return J({error:'No active run'},400);
 const cur=JSON.parse(r.cur);cur.n++;const ok=String(b.a||'').trim().toLowerCase()===cur.w;
 if(!ok&&cur.n<3){await D.prepare('update runs set cur=? where id=?').bind(JSON.stringify(cur),r.id).run();return J({res:'retry',hint:cur.n==1?`It starts with "${cur.w[0]}" and has ${cur.w.length} letters.`:`${cur.h} It begins "${cur.w.slice(0,Math.ceil(cur.w.length/2))}…"`})}
 const t=Date.now()-cur.t;let hearts=r.hearts,correct=r.correct,deaths=r.deaths|0,peak=Math.max(r.peak|0,r.correct),old=peak,g=gain(ok,cur.n,t,b.focus),event=null;
 if(ok){correct++;peak=Math.max(peak,correct);const e=Math.random();if((cur.e|0)<EV_MAX){if(e<.12){if(hearts<5&&(cur.hl|0)<HEAL_MAX){hearts++;cur.hl=(cur.hl|0)+1;cur.e=(cur.e|0)+1;event='🧪 A healing fountain restores a heart!'}}else if(e<.2){g+=15;cur.e=(cur.e|0)+1;event='💎 You find a crystal cache: +15 XP!'}}}else hearts--;
 let end=null,back=null;
 if(hearts<=0){deaths++;if(deaths>=START_HEARTS)end='dead';else{correct=Math.floor(correct/FLOOR)*FLOOR;hearts=START_HEARTS-deaths;back={to:correct,hearts}}} // a fall: back to the last checkpoint with one heart fewer (XP already earned is kept)
 else if(correct>=100)end='win';
 const cp=ok&&!end&&correct%FLOOR==0?{n:correct,fresh:correct>old}:null; // checkpoint reached (fresh = first time this run, so the story is only told once)
 if(end==='win')g+=100;
 const room=Math.max(0,RUN_XP_CAP-(cur.x|0)),capped=g>room;g=Math.min(g,room);cur.x=(cur.x|0)+g;
 const ch=end?null:await mkch(a);if(ch){ch.cur.hl=cur.hl|0;ch.cur.e=cur.e|0;ch.cur.x=cur.x|0}
 await ensureState(D,a.id);const ans=ok?null:clean(b.a),ws=await stateStmt(D,a.id,cur.w,ok,cur.n);
 await D.batch([D.prepare('insert into attempts(student_id,mode,word,ok,tries,ms,xp,ans,etype) values(?,?,?,?,?,?,?,?,?)').bind(a.id,'dun-'+cur.k,cur.w,ok?1:0,cur.n,t,g,ans,ans?classify(cur.w,ans):null),ws,D.prepare('update students set xp=xp+? where id=?').bind(g,a.id),D.prepare('update runs set hearts=?,correct=?,cur=?,status=?,peak=?,deaths=? where id=?').bind(hearts,correct,ch?JSON.stringify(ch.cur):r.cur,end?(end=='win'?'won':'dead'):'active',peak,deaths,r.id)]);
 const s=await D.prepare('select xp from students where id=?').bind(a.id).first();
 const pg=await progress(D,{id:a.id,xp:s.xp});return J({res:ok?'ok':'fail',word:ok?undefined:cur.w,tip:cur.h,gain:g,capped,event,hearts,correct,deaths,peak,back,cp,end,ch:ch&&ch.pub,xp:s.xp,modes:ms(await cs(a.code),s.xp),badges:pg.fresh,goal:pg.streak.today===GOAL?pg.streak.n:0})}
if(St&&p==='/api/lists'){const eb=await errBank(D,a.code);return J((await bankFor(a.code)).map(w=>({...w,x:eb.get(w.w)||[]})))}
// The review queue: words due for review first (most overdue first), then new words. Up to a third of a round is kept for new words when there is a backlog.
if(St&&p==='/api/due'){const n=Math.max(1,Math.min(12,+u.searchParams.get('n')||6)),today=dayNo(Math.floor(Date.now()/1000));await ensureState(D,a.id);
 const [bank,eb,wk,st]=await Promise.all([bankFor(a.code),errBank(D,a.code),weakTypes(D,a.id),D.prepare('select word,due from word_state where student_id=?').bind(a.id).all()]),sm=new Map(st.results.map(x=>[x.word,x.due])),W=new Set(wk);
 const hit=w=>W.size&&[...Spelling.types(w.w)].some(t=>W.has(t));
 return J(queue(bank.map(w=>({...w,x:eb.get(w.w)||[]})),w=>w.w,sm,today,n,hit).map(x=>({...x.o,r:x.r})))}
// Word Forge: a round of root + ending items, chosen by the same review queue (due first, then new).
if(St&&p==='/api/forge'){const n=Math.max(1,Math.min(12,+u.searchParams.get('n')||6)),today=dayNo(Math.floor(Date.now()/1000));await ensureState(D,a.id);
 const [pool,st]=await Promise.all([forgePool(D,a.code),D.prepare('select word,due from word_state where student_id=?').bind(a.id).all()]);
 return J({rules:forgeRules(),items:queue(pool,x=>x.w,new Map(st.results.map(x=>[x.word,x.due])),today,n).map(x=>pubForge(x.o))})}
if(St&&p==='/api/attempt'){const x0=await D.prepare('select xp from students where id=?').bind(a.id).first(),set=await cs(a.code);if(!un(set,MM[b.mode],x0.xp))return J({error:'locked'},403);const g=gain(b.ok,b.tries,b.ms,b.focus),ans=b.ok?null:clean(b.ans),spot=b.mode==='spot1'; // spot1 only tests recognising a wrong spelling, so it never touches the review schedule
 if(!spot)await ensureState(D,a.id);
 await D.batch([D.prepare('insert into attempts(student_id,mode,word,ok,tries,ms,xp,ans,etype) values(?,?,?,?,?,?,?,?,?)').bind(a.id,String(b.mode),String(b.word),b.ok?1:0,b.tries|0,b.ms|0,g,ans,ans?classify(String(b.word),ans):null),D.prepare('update students set xp=xp+? where id=?').bind(g,a.id),...(spot?[]:[await stateStmt(D,a.id,b.word,!!b.ok,b.tries|0)])]);
 const s=await D.prepare('select xp from students where id=?').bind(a.id).first(),pg=b.mode==='spot1'?null:await progress(D,{id:a.id,xp:s.xp});
 return J({gain:g,xp:s.xp,level:lvl(s.xp),modes:ms(set,s.xp),badges:pg?pg.fresh:[],goal:pg&&pg.streak.today===GOAL?pg.streak.n:0})}
if(St&&p==='/api/progress'){const m=await D.prepare('select xp from students where id=?').bind(a.id).first();if(!m)return J({error:'Not found or not signed in'},404);const pg=await progress(D,{id:a.id,xp:m.xp});
 const bw=new Set((await bankFor(a.code)).map(x=>x.w)),dn=(await D.prepare('select word from word_state where student_id=? and due<=?').bind(a.id,dayNo(Math.floor(Date.now()/1000))).all()).results.filter(x=>bw.has(x.word)).length;
 return J({xp:m.xp,streak:pg.streak,mastered:pg.mastered,due:dn,badges:pg.have,fresh:pg.fresh,modes:ms(await cs(a.code),m.xp)})}
if(St&&p==='/api/spellbook'){await ensureState(D,a.id);const bank=new Map((await bankFor(a.code)).map(x=>[x.w,x])),today=dayNo(Math.floor(Date.now()/1000));
 const [rows,st]=(await D.batch([D.prepare("select word,count(*) n,sum(ok) k from attempts where student_id=? and mode!='spot1' group by word order by max(id) desc limit 500").bind(a.id),D.prepare('select word,box,due from word_state where student_id=?').bind(a.id)])).map(x=>x.results),sm=new Map(st.map(x=>[x.word,x])),met=new Set(st.map(x=>x.word));
 return J({today,words:rows.map(x=>{const b=bank.get(x.word)||forgeFallback(x.word)||{},q=sm.get(x.word)||{box:0,due:today};return{w:x.word,n:x.n,k:x.k,m:q.box>=MASTER_BOX?1:0,b:q.box,d:q.due,s:b.s,h:b.h}}),unseen:[...bank.keys()].filter(w=>!met.has(w)).length})}
if(T){
 if(p==='/api/teacher/wordlists'){const mine=(await D.prepare('select id,name,words,levels,shared,declined from lists where owner=?').bind(a.id).all()).results,sh=(await D.prepare("select words,shared from lists where shared!='[]'").all()).results;return J({builtin:Object.entries(LISTS).map(([id,v])=>({id,name:v.n,count:new Set([...PARSED[id].map(w=>w.w),...mine.filter(x=>(x.levels||'').includes('"'+id+'"')).flatMap(x=>JSON.parse(x.words).map(w=>w.w)),...sh.filter(x=>(x.shared||'').includes('"'+id+'"')).flatMap(x=>JSON.parse(x.words).map(w=>w.w))]).size})),custom:mine.map(x=>({id:'c'+x.id,name:x.name,count:JSON.parse(x.words).length,levels:JSON.parse(x.levels||'[]'),shared:JSON.parse(x.shared||'[]'),declined:JSON.parse(x.declined||'[]')}))})}
 if(p==='/api/teacher/listtags'){const l=await D.prepare('select * from lists where id=? and owner=?').bind(+String(b.id||'').slice(1),a.id).first();if(!l)return J({ok:false});const lv=lv6(b.levels),keep=x=>JSON.parse(x||'[]').filter(v=>lv.includes(v));
  await D.prepare('update lists set levels=?,shared=?,declined=? where id=?').bind(JSON.stringify(lv),JSON.stringify(keep(l.shared)),JSON.stringify(keep(l.declined)),l.id).run();return J({ok:true})}
 if(p==='/api/teacher/listflags'){const l=await D.prepare('select * from lists where id=? and owner=?').bind(+String(b.id||'').slice(1),a.id).first();if(!l)return J({error:'Not found'},404);
  const sh=(await D.prepare("select id,name,words,shared from lists where shared!='[]'").all()).results.map(o=>({id:o.id,name:o.name,v:JSON.parse(o.shared),s:new Set(JSON.parse(o.words).map(y=>y.w))}));return J({flags:flagsFor(JSON.parse(l.words),JSON.parse(l.levels||'[]'),sh,l.id)})}
 if(p==='/api/teacher/dedupe'){const l=await D.prepare('select * from lists where id=? and owner=?').bind(+String(b.id||'').slice(1),a.id).first();if(!l)return J({error:'Not found'},404);
  const all=JSON.parse(l.words),seen=new Set(JSON.parse(l.levels||'[]').flatMap(v=>(PARSED[v]||[]).map(x=>x.w))),keep=[];for(const x of all){if(seen.has(x.w))continue;seen.add(x.w);keep.push(x)}
  if(!keep.length)return J({error:'Every word is already in the built-in lists, so nothing was changed.'},400);
  await D.prepare('update lists set words=? where id=?').bind(JSON.stringify(keep),l.id).run();return J({removed:all.length-keep.length})}
 if(p==='/api/teacher/assign'){const c=(b.code||'').toUpperCase();if(!await own(c))return J({error:'Not your class'},403);
  const mine=(await D.prepare('select id from lists where owner=?').bind(a.id).all()).results.map(x=>'c'+x.id),ids=[...new Set(b.lists||[])].filter(i=>LISTS[i]||mine.includes(i));
  await D.batch([D.prepare('delete from class_lists where code=?').bind(c),...ids.map(i=>D.prepare('insert into class_lists(code,list) values(?,?)').bind(c,i))]);return J({ok:1,lists:ids})}
 if(p==='/api/teacher/modes'){if(!await own(b.code))return J({error:'Not your class'},403);const c=b.code.toUpperCase(),set=await cs(c);set.modes={};for(const k of Object.keys(GATE))set.modes[k]=['auto','open','locked'].includes((b.modes||{})[k])?b.modes[k]:'auto';set.enrol=b.enrol==='closed'?'closed':'open';set.forge=/^(auto|all|p[3-6])$/.test(b.forge||'')?b.forge:'auto';await D.prepare('update classes set settings=? where code=?').bind(JSON.stringify(set),c).run();return J({ok:1})}
 if(p==='/api/teacher/students'){const c=(b.code||u.searchParams.get('code')||'').toUpperCase();if(!await own(c))return J({error:'Not your class'},403);
  if(req.method==='POST'){const n=[...new Set((b.text||'').split('\n').map(x=>x.trim().slice(0,30)).filter(Boolean))].slice(0,200);if(!n.length)return J({added:0,total:0});
   const r=await D.batch(n.map(x=>D.prepare('insert or ignore into students(name,code) values(?,?)').bind(x,c)));return J({added:r.reduce((t,x)=>t+x.meta.changes,0),total:n.length})}
  return J((await D.prepare('select name,xp from students where code=? order by name').bind(c).all()).results)}
 if(p==='/api/classes'){const cl=(await D.prepare('select c.*,(select count(*) from students s where s.code=c.code) n from classes c where c.teacher_id=?').bind(a.id).all()).results,al=(await D.prepare('select code,list from class_lists where code in (select code from classes where teacher_id=?)').bind(a.id).all()).results;cl.forEach(c=>c.lists=al.filter(x=>x.code==c.code).map(x=>x.list));return J(cl)}
 if(p==='/api/teacher/class'){const code=Math.random().toString(36).slice(2,8).toUpperCase();await D.prepare('insert into classes(code,name,teacher_id) values(?,?,?)').bind(code,b.name||'Class',a.id).run();return J({code})}
 const pwords=t=>(t||'').split('\n').map(l=>l.split('|').map(x=>x.trim())).filter(x=>/^[a-zA-Z'-]{3,}$/.test(x[0]||'')).map(x=>({w:x[0].toLowerCase(),s:(x[1]||'').includes('{w}')?x[1]:'Spell the word: {w}.',h:x[2]||'Sound it out slowly.'}));
  const ownP=id=>D.prepare('select s.id,s.name,s.code from students s join classes c on c.code=s.code where s.id=? and c.teacher_id=?').bind(+id,a.id).first();
  const ownL=id=>D.prepare('select * from lists where id=? and owner=?').bind(+String(id||'').slice(1),a.id).first();
  const wipe=where=>['attempts','runs','badges','duel_wins'].map(t=>D.prepare('delete from '+t+' where student_id in (select id from students where '+where+')'));
  if(p==='/api/teacher/me'){const u=await D.prepare('select user from teachers where id=?').bind(a.id).first();return J({user:u&&u.user,classes:(await D.prepare('select count(*) n from classes where teacher_id=?').bind(a.id).first()).n,pupils:(await D.prepare('select count(*) n from students s join classes c on c.code=s.code where c.teacher_id=?').bind(a.id).first()).n})}
  if(p==='/api/teacher/password'){const t=await D.prepare('select * from teachers where id=?').bind(a.id).first(),np=String(b.new||'');if(!t||await hash(String(b.old||''),t.salt)!==t.hash)return J({error:'Your current password is not correct'},400);if(np.length<6)return J({error:'New password must be at least 6 characters'},400);if(np===String(b.old))return J({error:'Choose a password different from the current one'},400);
   const salt=crypto.randomUUID();await D.prepare('update teachers set salt=?,hash=? where id=?').bind(salt,await hash(np,salt),a.id).run();return J({ok:1})}
  if(p==='/api/teacher/pupilrename'){const s=await ownP(b.id);if(!s)return J({error:'Pupil not found'},404);const n=String(b.name||'').trim().slice(0,30);if(!n)return J({error:'Enter a name'},400);
   if(await D.prepare('select 1 from students where code=? and name=? and id!=?').bind(s.code,n,s.id).first())return J({error:'Another pupil in this class already has that name'},400);
   await D.prepare('update students set name=? where id=?').bind(n,s.id).run();return J({ok:1,name:n})}
  if(p==='/api/teacher/pupilremove'){const s=await ownP(b.id);if(!s)return J({error:'Pupil not found'},404);
   await D.batch([...wipe('id='+(s.id|0)),D.prepare('delete from students where id=?').bind(s.id)]);return J({ok:1})}
  if(p==='/api/teacher/classrename'){const c=(b.code||'').toUpperCase();if(!await own(c))return J({error:'Not your class'},403);const n=String(b.name||'').trim().slice(0,60);if(!n)return J({error:'Enter a class name'},400);
   await D.prepare('update classes set name=? where code=?').bind(n,c).run();return J({ok:1,name:n})}
  if(p==='/api/teacher/classdelete'){const c=(b.code||'').toUpperCase(),cl=await D.prepare('select name from classes where code=? and teacher_id=?').bind(c,a.id).first();if(!cl)return J({error:'Not your class'},403);
   if(String(b.confirm||'').trim().toLowerCase()!==String(cl.name||'').trim().toLowerCase())return J({error:'Type the class name to confirm'},400);
   const n=(await D.prepare('select count(*) n from students where code=?').bind(c).first()).n;
   await D.batch([...wipe("code='"+c.replace(/[^A-Z0-9]/g,'')+"'"),D.prepare('delete from students where code=?').bind(c),D.prepare('delete from class_lists where code=?').bind(c),D.prepare('delete from classes where code=?').bind(c)]);return J({ok:1,pupils:n})}
  if(p==='/api/teacher/listget'){const l=await ownL(b.id);if(!l)return J({error:'Not found'},404);const ws=JSON.parse(l.words);
   return J({id:b.id,name:l.name,count:ws.length,text:ws.map(x=>[x.w,x.s,x.h].join('|')).join('\n'),shared:JSON.parse(l.shared||'[]')})}
  if(p==='/api/teacher/listedit'){const l=await ownL(b.id);if(!l)return J({error:'Not found'},404);const w0=pwords(b.text);if(!w0.length)return J({error:'No valid words found (3+ letters each)'},400);
   const sw=new Set(),ws=w0.filter(x=>!sw.has(x.w)&&sw.add(x.w)),name=String(b.name||'').trim().slice(0,60)||l.name,changed=JSON.stringify(ws)!==l.words,reshare=changed&&JSON.parse(l.shared||'[]').length>0;
   await D.prepare('update lists set name=?,words=?,shared=?,declined=? where id=?').bind(name,JSON.stringify(ws),reshare?'[]':l.shared,reshare?'[]':l.declined,l.id).run();return J({ok:1,added:ws.length,dupes:w0.length-ws.length,reshare})}
  if(p==='/api/teacher/list'){const w=pwords(b.text);
  if(!w.length)return J({error:'No valid words found (3+ letters each)'},400);
  const sw=new Set(),w2=w.filter(x=>!sw.has(x.w)&&sw.add(x.w));
  const r=await D.prepare('insert into lists(owner,name,words,levels) values(?,?,?,?)').bind(a.id,(b.name||'My list').slice(0,60),JSON.stringify(w2),JSON.stringify(lv6(b.levels))).run();return J({added:w2.length,dupes:w.length-w2.length,id:'c'+r.meta.last_row_id})}
 if(p==='/api/teacher/overview'){const c=(u.searchParams.get('code')||'').toUpperCase();if(!await own(c))return J({error:'Not your class'},403);
  const now=Math.floor(Date.now()/1000),today=dayNo(now),c1=now-7*86400,c2=now-14*86400;
  const r=await D.batch([
   D.prepare("select s.id,s.name,s.xp,count(a.id) n,coalesce(sum(a.ok),0) ok,max(a.ts) last,coalesce(sum(case when a.ts>=? then 1 else 0 end),0) w1,coalesce(sum(case when a.ts>=? then a.ok else 0 end),0) w1ok,coalesce(sum(case when a.ts>=? and a.ts<? then 1 else 0 end),0) w0,coalesce(sum(case when a.ts>=? and a.ts<? then a.ok else 0 end),0) w0ok from students s left join attempts a on a.student_id=s.id and a.mode!='spot1' where s.code=? group by s.id order by s.name").bind(c1,c1,c2,c1,c2,c1,c),
   D.prepare("select a.student_id sid,(a.ts+28800)/86400 d,count(*) c from attempts a join students s on s.id=a.student_id where s.code=? and a.mode!='spot1' and a.ts>=? group by a.student_id,d").bind(c,now-60*86400),
   D.prepare("select a.word,count(*) n,sum(1-a.ok) miss from attempts a join students s on s.id=a.student_id where s.code=? and a.mode!='spot1' group by a.word having count(*)>=3 and sum(1-a.ok)>0 order by sum(1-a.ok)*1.0/count(*) desc,sum(1-a.ok) desc limit 10").bind(c),
   D.prepare("select a.word,a.ans,max(a.etype) et,count(*) c from attempts a join students s on s.id=a.student_id where s.code=? and a.ok=0 and a.ans is not null and a.ans!='' group by a.word,a.ans order by c desc").bind(c),
   D.prepare("select a.word,count(*) n,coalesce(sum(a.ok),0) k from attempts a join students s on s.id=a.student_id where s.code=? and a.mode='f' group by a.word").bind(c)]);
  const dm={};r[1].results.forEach(x=>(dm[x.sid]=dm[x.sid]||[]).push({d:x.d,c:x.c}));const wr={};r[3].results.forEach(x=>(wr[x.word]=wr[x.word]||[]).push({a:x.ans,c:x.c,et:x.et||classify(x.word,x.ans)}));
  const pupils=r[0].results.map(s=>{const rows=dm[s.id]||[],cnt=d=>(rows.find(x=>x.d==d)||{c:0}).c,a1=s.w1?s.w1ok/s.w1:null,a0=s.w0?s.w0ok/s.w0:null,flags=[];
   if(!s.n)flags.push('Not started');else if(s.last<now-7*86400)flags.push('Inactive 7+ days');
   if(s.w1>=10&&a1<.6)flags.push('Accuracy under 60%');if(s.w1>=8&&s.w0>=8&&a1<=a0-.15)flags.push('Accuracy dropping');
   return{id:s.id,name:s.name,xp:s.xp,lv:lvl(s.xp),n:s.n,acc:s.n?s.ok/s.n:null,last:s.last,w1:s.w1,a1,streak:streakOf(rows,today).n,days:Array.from({length:14},(_,i)=>cnt(today-13+i)),flags,goal:cnt(today)>=GOAL}});
  const t=r[0].results.reduce((o,s)=>({w1:o.w1+s.w1,k1:o.k1+s.w1ok,w0:o.w0+s.w0,k0:o.k0+s.w0ok}),{w1:0,k1:0,w0:0,k0:0});
  return J({today,goal:GOAL,pupils,sum:{pupils:pupils.length,active:pupils.filter(x=>x.w1>0).length,words7:t.w1,acc1:t.w1?t.k1/t.w1:null,acc0:t.w0?t.k0/t.w0:null,goalToday:pupils.filter(x=>x.goal).length},errs:errMix(r[3].results),forge:forgeStats(r[4].results),words:r[2].results.map(w=>({w:w.word,n:w.n,miss:w.miss,wrong:(wr[w.word]||[]).slice(0,3)}))})}
 if(p==='/api/teacher/pupil'){const id=+u.searchParams.get('id'),s=await D.prepare('select s.id,s.name,s.xp,s.code from students s join classes c on c.code=s.code where s.id=? and c.teacher_id=?').bind(id,a.id).first();if(!s)return J({error:'Not found'},404);
  const now=Math.floor(Date.now()/1000),today=dayNo(now);await ensureState(D,id);const r=await D.batch([
   D.prepare("select count(*) n,coalesce(sum(ok),0) k,max(ts) last from attempts where student_id=? and mode!='spot1'").bind(id),
   D.prepare("select (ts+28800)/86400 d,count(*) c from attempts where student_id=? and mode!='spot1' and ts>=? group by d").bind(id,now-60*86400),
   D.prepare("select word,count(*) n,sum(1-ok) miss from attempts where student_id=? and mode!='spot1' group by word having sum(1-ok)>0 order by sum(1-ok) desc,count(*) desc limit 10").bind(id),
   D.prepare("select word,ans,max(etype) et,count(*) c from attempts where student_id=? and ok=0 and ans is not null and ans!='' group by word,ans order by c desc").bind(id),
   D.prepare("select mode,count(*) n,coalesce(sum(ok),0) k from attempts where student_id=? and mode!='spot1' group by mode").bind(id),
   D.prepare("select coalesce(max(max(correct,coalesce(peak,0))),0) best,count(*) runs from runs where student_id=?").bind(id),
   D.prepare("select count(*) n from badges where student_id=?").bind(id),
   D.prepare("select count(*) n from word_state where student_id=? and box>=?").bind(id,MASTER_BOX),
   D.prepare("select word,count(*) n,coalesce(sum(ok),0) k from attempts where student_id=? and mode='f' group by word").bind(id)]);
  const rows=r[1].results,wr={};r[3].results.forEach(x=>(wr[x.word]=wr[x.word]||[]).push({a:x.ans,c:x.c,et:x.et||classify(x.word,x.ans)}));const t=r[0].results[0];
  return J({id:s.id,name:s.name,xp:s.xp,lv:lvl(s.xp),n:t.n,acc:t.n?t.k/t.n:null,last:t.last,streak:streakOf(rows,today).n,days:Array.from({length:14},(_,i)=>(rows.find(x=>x.d==today-13+i)||{c:0}).c),weak:r[2].results.map(w=>({w:w.word,n:w.n,miss:w.miss,wrong:(wr[w.word]||[]).slice(0,3)})),modes:r[4].results,dungeon:r[5].results[0],badges:r[6].results[0].n,mastered:r[7].results[0].n,errs:errMix(r[3].results),forge:forgeStats(r[8].results)})}
 if(p==='/api/analytics'){const c=(u.searchParams.get('code')||'').toUpperCase();if(!await D.prepare('select 1 from classes where code=? and teacher_id=?').bind(c,a.id).first())return J({error:'Not your class'},403);
  const st=await D.prepare('select s.name,s.xp,count(a.id) n,coalesce(sum(a.ok),0) ok,coalesce(avg(a.ms),0) ms from students s left join attempts a on a.student_id=s.id where s.code=? group by s.id').bind(c).all();
  const wd=await D.prepare('select a.word,count(*) n,sum(1-a.ok) miss from attempts a join students s on s.id=a.student_id where s.code=? group by a.word order by miss desc limit 10').bind(c).all();
  const dg=await D.prepare('select s.name,max(max(r.correct,coalesce(r.peak,0))) best,count(r.id) runs from runs r join students s on s.id=r.student_id where s.code=? group by s.id').bind(c).all();
  return J({students:st.results,words:wd.results,dungeon:dg.results})}}
return J({error:'Not found or not signed in'},404)}};

// ---- Duel arena: the server deals the words, checks every spelling, awards the XP and records wins ----
const DUEL_XP_CAP=300,MIN_ANS_MS=1200,FIZZLE_MS=2500; // per connection; fastest believable answer; pause after a fizzle
export class DuelRoom{constructor(st,env){this.env=env;this.p=new Map();this.over=false;this.room='X';this.n=0}
async fetch(req){const[c,s]=Object.values(new WebSocketPair());s.accept();const id=crypto.randomUUID(),h=req.headers;this.room=(new URL(req.url).searchParams.get('room')||'X').toUpperCase().slice(0,20);
 const me={ws:s,seq:++this.n,sid:+(h.get('x-sid')||0),name:(h.get('x-name')||'Wizard').slice(0,30),code:h.get('x-code')||'',hp:100,pend:null,hand:[],tries:[0,0,0],t0:0,earned:0,lock:false,in:false,set:{},bank:[]};
 this.p.set(id,me);me.ready=this.init(id,me).catch(()=>this.drop(id));
 s.addEventListener('message',e=>{me.ready.then(()=>this.msg(id,JSON.parse(e.data))).catch(()=>{})});
 s.addEventListener('close',()=>{this.p.delete(id);this.all({})});
 return new Response(null,{status:101,webSocket:c})}
send(me,m){try{me.ws.send(JSON.stringify(m))}catch{}}
drop(id,m){const me=this.p.get(id);if(me){if(m)this.send(me,m);try{me.ws.close()}catch{}}this.p.delete(id)}
all(m){m.pl=[...this.p.values()].filter(x=>x.in).map(x=>({n:x.name,hp:x.hp}));const t=JSON.stringify(m);this.p.forEach(x=>{if(x.in)try{x.ws.send(t)}catch{}})}
async init(id,me){const D=this.env.DB;
 if(me.sid){if([...this.p.values()].some(x=>x!==me&&x.sid===me.sid&&x.seq<me.seq))return this.drop(id,{t:'dup'});
  const st=await D.prepare('select xp from students where id=?').bind(me.sid).first();if(!st)return this.drop(id,{t:'locked'});
  me.set=await classSettings(D,me.code);if(!un(me.set,'d',st.xp))return this.drop(id,{t:'locked'});
  me.bank=await bankForD(D,me.code);me.eb=await errBank(D,me.code)}
 if(me.bank.length<3)me.bank=PARSED.default;
 me.in=true;this.send(me,{t:'you',n:me.name,xp:!!me.sid});this.deal(me);this.all({log:'🧙 '+me.name+' entered the arena.'})}
deal(me){me.hand=[...me.bank].sort(()=>Math.random()-.5).slice(0,3);me.tries=[0,0,0];me.t0=Date.now();me.lock=false;this.send(me,{t:'hand',c:me.hand.map(x=>x.w)})}
async award(me,w,ok,tries,t,ans){if(!me.sid)return;try{const D=this.env.DB,g=Math.min(gain(ok,tries,t,'acc'),Math.max(0,DUEL_XP_CAP-me.earned)),ca=ok?null:clean(ans);me.earned+=g;
 await ensureState(D,me.sid);
 await D.batch([D.prepare('insert into attempts(student_id,mode,word,ok,tries,ms,xp,ans,etype) values(?,?,?,?,?,?,?,?,?)').bind(me.sid,'duel',w.w,ok?1:0,tries,t,g,ca,ca?classify(w.w,ca):null),await stateStmt(D,me.sid,w.w,ok,tries),D.prepare('update students set xp=xp+? where id=?').bind(g,me.sid)]);
 const s=await D.prepare('select xp from students where id=?').bind(me.sid).first(),pg=await progress(D,{id:me.sid,xp:s.xp});
 this.send(me,{t:'fx',gain:g,xp:s.xp,modes:ms(me.set,s.xp),badges:pg.fresh,goal:pg.streak.today===GOAL?pg.streak.n:0})}catch{}}
async win(me){try{const D=this.env.DB;await D.prepare('insert into duel_wins(student_id,room) values(?,?)').bind(me.sid,this.room).run();
 const s=await D.prepare('select xp from students where id=?').bind(me.sid).first(),pg=await progress(D,{id:me.sid,xp:s.xp});
 if(pg.fresh.length)this.send(me,{t:'fx',gain:0,xp:s.xp,modes:ms(me.set,s.xp),badges:pg.fresh,goal:0})}catch{}}
async msg(id,m){const me=this.p.get(id);if(!me||!me.in)return;
 if(m.t==='again'){if(!this.over)return;this.over=false;this.p.forEach(x=>{x.hp=100;x.pend=null;if(x.in)this.deal(x)});return this.all({t:'again',log:'⚔️ Rematch! Everyone is back at full health.'})}
 if(this.over||me.hp<=0)return;
 if(m.t==='cast'){const foes=[...this.p.entries()].filter(([k,x])=>k!==id&&x.in&&x.hp>0);if(!foes.length)return this.send(me,{t:'wait'});
  const i=m.i|0,w=me.hand[i];if(!w||me.lock)return;if(Date.now()-me.t0<MIN_ANS_MS)return this.send(me,{t:'res',ok:false,slow:1});
  const a=String(m.a||'').trim().toLowerCase().slice(0,60),t=Date.now()-me.t0,n=++me.tries[i];
  if(a===w.w){const f=foes[Math.floor(Math.random()*foes.length)][1],ix=w.s.indexOf('{w}');f.pend={w:w.w,from:id};
   this.send(f,{t:'incoming',from:me.name,pre:ix<0?'Fix the word: ':w.s.slice(0,ix),bad:mis(w.w,(f.eb&&f.eb.get(w.w))||(me.eb&&me.eb.get(w.w))),post:ix<0?'':w.s.slice(ix+3)});
   this.send(me,{t:'res',ok:true});await this.award(me,w,true,n,t,'');this.deal(me)}
  else if(n<3)this.send(me,{t:'res',ok:false,left:3-n,hint:n==1?`It starts with "${w.w[0]}" and has ${w.w.length} letters.`:`${w.h} It begins "${w.w.slice(0,Math.ceil(w.w.length/2))}…"`});
  else{me.lock=true;this.send(me,{t:'res',ok:false,fizzled:1,word:w.w,hint:w.h});await this.award(me,w,false,3,t,a);setTimeout(()=>{if(this.p.get(id)===me)this.deal(me)},FIZZLE_MS)}}
 if(m.t==='deflect'&&me.pend){const pd=me.pend,c=this.p.get(pd.from);me.pend=null;let log,ok=String(m.a||'').trim().toLowerCase()===pd.w;
  if(ok){if(c)c.hp-=10;log=me.name+' deflected the curse! It rebounds on '+(c?c.name:'the caster')+'.'}else{me.hp-=15;log=me.name+' failed to deflect and took 15 damage!'}
  this.all({log,who:me.name,ok});const alive=[...this.p.values()].filter(x=>x.in&&x.hp>0);
  if(alive.length===1){this.over=true;this.all({t:'win',n:alive[0].name});if(alive[0].sid)await this.win(alive[0])}}}}
