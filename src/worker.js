import {W} from './words.js';
const BANK=W.split('\n').map(l=>l.split('|')).map(x=>({w:x[0].toLowerCase(),s:x[1],h:x[2]}));
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});
const enc=new TextEncoder(),b64=b=>btoa(String.fromCharCode(...new Uint8Array(b)));
async function hmac(k,m){const key=await crypto.subtle.importKey('raw',enc.encode(k),{name:'HMAC',hash:'SHA-256'},false,['sign']);return b64(await crypto.subtle.sign('HMAC',key,enc.encode(m)))}
const sign=async(env,p)=>{const m=btoa(JSON.stringify(p));return m+'.'+await hmac(env.SECRET,m)};
async function verify(env,t){try{const[m,s]=t.split('.');return s===await hmac(env.SECRET,m)?JSON.parse(atob(m)):null}catch{return null}}
async function hash(pw,salt){const k=await crypto.subtle.importKey('raw',enc.encode(pw),'PBKDF2',false,['deriveBits']);return b64(await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:100000,hash:'SHA-256'},k,256))}
const lvl=x=>Math.floor(x/150)+1;
const HEAL_MAX=3,EV_MAX=6,RUN_XP_CAP=1500; // per dungeon run: max heals, max random events, max XP
const GATE={1:1,2:10,3:20,4:5,d:1},MM={1:'1',2:'2',spot1:'3',spot2:'3',duel:'d'};
const un=(s,m,xp)=>{const v=(s.modes||{})[m]||'auto';return v==='open'||(v==='auto'&&lvl(xp)>=GATE[m])};
const ms=(s,xp)=>Object.fromEntries(Object.keys(GATE).map(m=>[m,un(s,m,xp)||((s.modes||{})[m]==='locked'?'L':GATE[m])]));
const gain=(ok,tries,ms,focus)=>{if(!ok)return 1;const base=[0,10,6,3][tries]||3;return Math.round(base+Math.max(0,1-ms/20000)*(focus=='spd'?15:5))};
const mis=w=>{const i=1+Math.floor(Math.random()*(w.length-2));const r=w.slice(0,i)+w[i+1]+w[i]+w.slice(i+2);return r===w?w.slice(0,i)+w[i]+w.slice(i):r};

export default{async fetch(req,env){
const u=new URL(req.url),p=u.pathname;
if(p==='/ws/duel')return env.DUEL.get(env.DUEL.idFromName((u.searchParams.get('room')||'X').toUpperCase())).fetch(req);
const b=req.method==='POST'?await req.json().catch(()=>({})):{};
const a=await verify(env,(req.headers.get('authorization')||'').slice(7)),D=env.DB;
const T=a&&a.r==='t',St=a&&a.r==='s';
const cs=async c=>{const r=await D.prepare('select settings from classes where code=?').bind(c).first();try{return JSON.parse((r&&r.settings)||'{}')}catch{return{}}};
const mkch=async a=>{const c=await D.prepare('select words from lists where code=?').bind(a.code).all(),bank=BANK.concat(c.results.flatMap(x=>JSON.parse(x.words))),mw=(await D.prepare('select word from attempts where student_id=? and ok=0 group by word order by count(*) desc limit 10').bind(a.id).all()).results.map(x=>x.word),miss=bank.filter(w=>mw.includes(w.w)),arr=miss.length&&Math.random()<.4?miss:bank,w=arr[Math.floor(Math.random()*arr.length)],k=Math.random()<.5?'ear':'fix';
 return{cur:{k,w:w.w,s:w.s,h:w.h,t:Date.now(),n:0},pub:k=='ear'?{k,w:w.w,sn:w.s.replace('{w}',w.w)}:{k,s:w.s,sh:mis(w.w)}}};
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
 const salt=crypto.randomUUID();try{await D.prepare('insert into teachers(user,salt,hash) values(?,?,?)').bind(b.user,salt,await hash(b.pass,salt)).run()}catch{return J({error:'Username taken'},400)}return J({ok:1})}
if(St&&p==='/api/me'){const m=await D.prepare('select xp from students where id=?').bind(a.id).first();return J({xp:m.xp,modes:ms(await cs(a.code),m.xp)})}
if(St&&p==='/api/run/start'){const x0=await D.prepare('select xp from students where id=?').bind(a.id).first();if(!un(await cs(a.code),'4',x0.xp))return J({error:'locked'},403);
 await D.prepare("update runs set status='abandoned' where student_id=? and status='active'").bind(a.id).run();
 const ch=await mkch(a),r=await D.prepare('insert into runs(student_id,hearts,correct,cur) values(?,3,0,?)').bind(a.id,JSON.stringify(ch.cur)).run();
 return J({run:r.meta.last_row_id,hearts:3,correct:0,ch:ch.pub})}
if(St&&p==='/api/run/answer'){const r=await D.prepare("select * from runs where id=? and student_id=? and status='active'").bind(b.run|0,a.id).first();if(!r)return J({error:'No active run'},400);
 const cur=JSON.parse(r.cur);cur.n++;const ok=String(b.a||'').trim().toLowerCase()===cur.w;
 if(!ok&&cur.n<3){await D.prepare('update runs set cur=? where id=?').bind(JSON.stringify(cur),r.id).run();return J({res:'retry',hint:cur.n==1?`It starts with "${cur.w[0]}" and has ${cur.w.length} letters.`:`${cur.h} It begins "${cur.w.slice(0,Math.ceil(cur.w.length/2))}…"`})}
 const t=Date.now()-cur.t;let hearts=r.hearts,correct=r.correct,g=gain(ok,cur.n,t,b.focus),event=null;
 if(ok){correct++;const e=Math.random();if((cur.e|0)<EV_MAX){if(e<.12){if(hearts<5&&(cur.h|0)<HEAL_MAX){hearts++;cur.h=(cur.h|0)+1;cur.e=(cur.e|0)+1;event='🧪 A healing fountain restores a heart!'}}else if(e<.2){g+=15;cur.e=(cur.e|0)+1;event='💎 You find a crystal cache: +15 XP!'}}}else hearts--;
 const end=hearts<=0?'dead':correct>=100?'win':null;if(end==='win')g+=100;
 const room=Math.max(0,RUN_XP_CAP-(cur.x|0)),capped=g>room;g=Math.min(g,room);cur.x=(cur.x|0)+g;
 const ch=end?null:await mkch(a);if(ch){ch.cur.h=cur.h|0;ch.cur.e=cur.e|0;ch.cur.x=cur.x|0}
 await D.batch([D.prepare('insert into attempts(student_id,mode,word,ok,tries,ms,xp) values(?,?,?,?,?,?,?)').bind(a.id,'dun-'+cur.k,cur.w,ok?1:0,cur.n,t,g),D.prepare('update students set xp=xp+? where id=?').bind(g,a.id),D.prepare('update runs set hearts=?,correct=?,cur=?,status=? where id=?').bind(hearts,correct,ch?JSON.stringify(ch.cur):r.cur,end?(end=='win'?'won':'dead'):'active',r.id)]);
 const s=await D.prepare('select xp from students where id=?').bind(a.id).first();
 return J({res:ok?'ok':'fail',word:ok?undefined:cur.w,tip:cur.h,gain:g,capped,event,hearts,correct,end,ch:ch&&ch.pub,xp:s.xp,modes:ms(await cs(a.code),s.xp)})}
if(St&&p==='/api/lists'){const r=await D.prepare('select words from lists where code=?').bind(a.code).all();return J(r.results.flatMap(x=>JSON.parse(x.words)))}
if(St&&p==='/api/attempt'){const x0=await D.prepare('select xp from students where id=?').bind(a.id).first(),set=await cs(a.code);if(!un(set,MM[b.mode],x0.xp))return J({error:'locked'},403);const g=gain(b.ok,b.tries,b.ms,b.focus);
 await D.batch([D.prepare('insert into attempts(student_id,mode,word,ok,tries,ms,xp) values(?,?,?,?,?,?,?)').bind(a.id,String(b.mode),String(b.word),b.ok?1:0,b.tries|0,b.ms|0,g),D.prepare('update students set xp=xp+? where id=?').bind(g,a.id)]);
 const s=await D.prepare('select xp from students where id=?').bind(a.id).first();return J({gain:g,xp:s.xp,level:lvl(s.xp),modes:ms(set,s.xp)})}
if(T){
 if(p==='/api/teacher/modes'){if(!await own(b.code))return J({error:'Not your class'},403);const c=b.code.toUpperCase(),set=await cs(c);set.modes={};for(const k of Object.keys(GATE))set.modes[k]=['auto','open','locked'].includes((b.modes||{})[k])?b.modes[k]:'auto';set.enrol=b.enrol==='closed'?'closed':'open';await D.prepare('update classes set settings=? where code=?').bind(JSON.stringify(set),c).run();return J({ok:1})}
 if(p==='/api/teacher/students'){const c=(b.code||u.searchParams.get('code')||'').toUpperCase();if(!await own(c))return J({error:'Not your class'},403);
  if(req.method==='POST'){const n=[...new Set((b.text||'').split('\n').map(x=>x.trim().slice(0,30)).filter(Boolean))].slice(0,200);if(!n.length)return J({added:0,total:0});
   const r=await D.batch(n.map(x=>D.prepare('insert or ignore into students(name,code) values(?,?)').bind(x,c)));return J({added:r.reduce((t,x)=>t+x.meta.changes,0),total:n.length})}
  return J((await D.prepare('select name,xp from students where code=? order by name').bind(c).all()).results)}
 if(p==='/api/classes'){return J((await D.prepare('select * from classes where teacher_id=?').bind(a.id).all()).results)}
 if(p==='/api/teacher/class'){const code=Math.random().toString(36).slice(2,8).toUpperCase();await D.prepare('insert into classes values(?,?,?)').bind(code,b.name||'Class',a.id).run();return J({code})}
 if(p==='/api/teacher/list'){if(!await D.prepare('select 1 from classes where code=? and teacher_id=?').bind((b.code||'').toUpperCase(),a.id).first())return J({error:'Not your class'},403);
  const w=(b.text||'').split('\n').map(l=>l.split('|').map(x=>x.trim())).filter(x=>/^[a-zA-Z'-]+$/.test(x[0]||'')).map(x=>({w:x[0].toLowerCase(),s:(x[1]||'').includes('{w}')?x[1]:'Spell the word: {w}.',h:x[2]||'Sound it out slowly.'}));
  await D.prepare('insert into lists(code,name,words) values(?,?,?)').bind(b.code.toUpperCase(),b.name||'List',JSON.stringify(w)).run();return J({added:w.length})}
 if(p==='/api/analytics'){const c=(u.searchParams.get('code')||'').toUpperCase();if(!await D.prepare('select 1 from classes where code=? and teacher_id=?').bind(c,a.id).first())return J({error:'Not your class'},403);
  const st=await D.prepare('select s.name,s.xp,count(a.id) n,coalesce(sum(a.ok),0) ok,coalesce(avg(a.ms),0) ms from students s left join attempts a on a.student_id=s.id where s.code=? group by s.id').bind(c).all();
  const wd=await D.prepare('select a.word,count(*) n,sum(1-a.ok) miss from attempts a join students s on s.id=a.student_id where s.code=? group by a.word order by miss desc limit 10').bind(c).all();
  const dg=await D.prepare('select s.name,max(r.correct) best,count(r.id) runs from runs r join students s on s.id=r.student_id where s.code=? group by s.id').bind(c).all();
  return J({students:st.results,words:wd.results,dungeon:dg.results})}}
return J({error:'Not found or not signed in'},404)}};

export class DuelRoom{constructor(){this.p=new Map()}
async fetch(req){const[c,s]=Object.values(new WebSocketPair());s.accept();const id=crypto.randomUUID();
 this.p.set(id,{ws:s,name:new URL(req.url).searchParams.get('name')||'Wizard',hp:100,pend:null});this.all({});
 s.addEventListener('message',e=>{try{this.msg(id,JSON.parse(e.data))}catch{}});
 s.addEventListener('close',()=>{this.p.delete(id);this.all({})});
 return new Response(null,{status:101,webSocket:c})}
all(m){m.pl=[...this.p.values()].map(x=>({n:x.name,hp:x.hp}));const t=JSON.stringify(m);this.p.forEach(x=>{try{x.ws.send(t)}catch{}})}
msg(id,m){const me=this.p.get(id);if(!me||me.hp<=0)return;
 if(m.t==='cast'){const foes=[...this.p.entries()].filter(([k,x])=>k!==id&&x.hp>0);if(!foes.length)return;
  const[k,f]=foes[Math.floor(Math.random()*foes.length)],w=String(m.w).toLowerCase();f.pend={w,from:id};
  f.ws.send(JSON.stringify({t:'incoming',from:me.name,s:String(m.s).replace('{w}','<b>'+mis(w)+'</b>')}))}
 if(m.t==='deflect'&&me.pend){const pd=me.pend,c=this.p.get(pd.from);me.pend=null;let log;
  if(String(m.a).trim().toLowerCase()===pd.w){if(c)c.hp-=10;log=me.name+' deflected the curse! It rebounds on '+(c?c.name:'the caster')+'.'}else{me.hp-=15;log=me.name+' failed to deflect and took 15 damage!'}
  const alive=[...this.p.values()].filter(x=>x.hp>0);this.all({log,who:me.name});if(alive.length===1&&this.p.size>1)this.all({t:'win',n:alive[0].name})}}}
