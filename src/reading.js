// Say It! "Learn to read" (v4.5): the Worker side. Sessions are composed here, mastery is kept here, and what was heard is judged here.
// Nothing in this file touches XP: the reading path pays stars and mastery, not points.
import {sayCfg,engines,runEngine,SAY_DAILY,SAY_GAP,SAY_MAXBYTES} from './sayit.js';
import RD from '../public/sayit-read.js';

const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});
const dayNo=now=>Math.floor((now+28800)/86400); // Singapore days
export const AVATARS=['🦊','🐼','🐯','🐸','🦁','🐰','🐧','🦄'];
const ACTS=new Set(['teach','safari','say','blend','tricky','build','trace','assist']);

async function prof(D,id){let p=await D.prepare('select * from rd_prof where student_id=?').bind(id).first();
 if(!p){await D.prepare('insert or ignore into rd_prof(student_id) values(?)').bind(id).run();p=await D.prepare('select * from rd_prof where student_id=?').bind(id).first()}return p}
async function states(D,id){const m=new Map();for(const r of (await D.prepare('select * from rd_state where student_id=?').bind(id).all()).results)m.set(r.kind+':'+r.key,{h:JSON.parse(r.h),d:JSON.parse(r.d),box:r.box,due:r.due});return m}
const putState=(D,id,kind,key,st,now)=>D.prepare('insert into rd_state(student_id,kind,key,h,d,box,due,upd) values(?,?,?,?,?,?,?,?) on conflict(student_id,kind,key) do update set h=excluded.h,d=excluded.d,box=excluded.box,due=excluded.due,upd=excluded.upd').bind(id,kind,key,JSON.stringify(st.h),JSON.stringify(st.d),st.box,st.due,now);
// Record one result. A correct word also counts for the sounds in it (blending is evidence); a miss only counts against the sound that differed.
async function record(D,id,pf,act,kind,key,ok,assist,hintPos){
 const now=Math.floor(Date.now()/1000),day=dayNo(now),stm=[D.prepare('insert into rd_log(student_id,act,kind,key,ok,assist,day) values(?,?,?,?,?,?,?)').bind(id,act,kind,key,ok?1:0,assist?1:0,day)];
 if(!assist){const sm=await states(D,id),seq=pf.seq;
  stm.push(putState(D,id,kind,key,RD.update(sm.get(kind+':'+key),ok,day),now));
  if(kind==='w'){const o=RD.BYW[key],ok6=new Set(RD.takenFor(seq,pf.taught));
   o&&o.toks.forEach((t,i)=>{const sid=RD.tokId(t,seq);if(!ok6.has(sid))return;if(ok||i===hintPos)stm.push(putState(D,id,'g',sid,RD.update(sm.get('g:'+sid),ok,day),now))})}}
 await D.batch(stm)}
async function claim(D,a,tag){ // one slot per submission, checked after claiming so a burst cannot get through (same rule as Say It! read-aloud)
 const now=Math.floor(Date.now()/1000),ins=await D.prepare("insert into speech_attempts(student_id,word,engine,accuracy,xp,ts) values(?,?,'',0,0,?)").bind(a.id,tag,now).run(),rid=ins.meta.last_row_id;
 const lim=await D.prepare('select count(*) n,coalesce(sum(ts>=? and id<?),0) near from speech_attempts where student_id=? and ts>?').bind(now-SAY_GAP,rid,a.id,now-86400).first();
 if(lim.near>0||lim.n>SAY_DAILY){await D.prepare('delete from speech_attempts where id=?').bind(rid).run();return J({error:lim.near>0?'Wait a moment, then try again.':'That is all the reading practice for today. See you tomorrow!'},429)}
 return rid}
const hintName=(pos,len)=>pos==null?'':pos===0?'first':pos>=len-1?'last':'middle';

// Listening: shared by the recorded-audio routes and the browser-recognition routes. get(tag) -> async [heardTexts[], engineName]
async function listen(env,a,cs,kind,key,get){
 const D=env.DB,set=await cs(a.code),c0=sayCfg(set);if(!c0.read)return J({error:'off',off:1},403);if(!c0.voice)return J({error:'Voice practice is switched off for your class.',off:1},403);
 const pf=await prof(D,a.id);if(!pf.consent)return J({error:'A grown-up needs to say yes to voice practice first.',consent:0},403);
 const n=pf.taught,seq=pf.seq;
 if(kind==='w'){if(!RD.BYW[key]||!(RD.decodable(key,seq,n)))return J({error:'That word has not been taught yet.'},400)}
 else{const s=RD.SENT[+key];if(s==null||RD.sentenceNeeds(s,seq)<0||RD.sentenceNeeds(s,seq)>n)return J({error:'That sentence has not been taught yet.'},400)}
 const rid=await claim(D,a,kind+key);if(rid instanceof Response)return rid;
 let heard,eng;try{[heard,eng]=await get()}catch{await D.prepare('delete from speech_attempts where id=?').bind(rid).run();return J({error:'The speech checker could not be reached. Please try again.'},502)}
 let out;
 if(kind==='w'){out=RD.judge(key,heard);const ok=out.result==='correct';
  await record(D,a.id,pf,'read','w',key,ok,false,out.hintPosition);
  out.hint=hintName(out.hintPosition,RD.BYW[key].toks.length);if(ok)delete out.hintPosition}
 else{const al=RD.alignSentence(RD.SENT[+key],heard.join(' '));out={result:al.ok?'correct':'try',words:al.words};await record(D,a.id,pf,'read','s',String(key),al.ok,false)}
 await D.prepare('update speech_attempts set engine=?,accuracy=? where id=?').bind(eng||'browser',out.result==='correct'?100:out.result==='near'?60:0,rid).run();
 out.heard=heard[0]?String(heard[0]).slice(0,40):'';
 return J(out)}

// Recorded audio (the body is a WAV file, so this runs before the JSON parse in worker.js)
export async function rdBin(env,req,a,p,u,cs){
 const eng=engines(env)[0];if(!eng)return J({error:'No speech checker is set up.'},400);
 if((+req.headers.get('content-length')||0)>SAY_MAXBYTES)return J({error:'Recording too long'},413);
 const audio=await req.arrayBuffer();if(audio.byteLength>SAY_MAXBYTES||audio.byteLength<1000)return J({error:'Bad recording'},400);
 const kind=p==='/api/rd/read'?'w':'s',key=kind==='w'?String(u.searchParams.get('word')||'').toLowerCase():String(u.searchParams.get('i')||'');
 const target=kind==='w'?key:(RD.SENT[+key]||'').replace(/[.!?,]/g,'');
 return listen(env,a,cs,kind,key,async()=>{const r=await runEngine(eng,audio,target,env);return[[r.heard||''],eng]})}

export async function rdJson(env,a,p,b,u,cs){
 const D=env.DB,set=await cs(a.code),cfg=sayCfg(set);
 if(!cfg.on||!cfg.read)return J({error:'off',off:1},403);
 if(p==='/api/rd/heard'||p==='/api/rd/sentheard'){const kind=p==='/api/rd/heard'?'w':'s',key=kind==='w'?String(b.word||'').toLowerCase():String(b.i);
  return listen(env,a,cs,kind,key,async()=>[(Array.isArray(b.alts)?b.alts:[]).slice(0,5).map(x=>String((x&&x.transcript)||'').slice(0,80)),null])}
 const pf=await prof(D,a.id),now=Math.floor(Date.now()/1000),today=dayNo(now),fl=RD.flat(pf.seq);
 if(p==='/api/rd/setup'){const stm=[];let {avatar,seq,consent}=pf;
  if(typeof b.avatar==='string'&&AVATARS.includes(b.avatar))avatar=b.avatar;
  let taught=pf.taught;
  if(typeof b.seq==='string'&&RD.SEQ[b.seq]&&b.seq!==pf.seq){seq=b.seq;taught=0}
  if(b.grp!=null){const gs=RD.SEQ[seq].slice(0,-1),g=Math.max(0,Math.min(gs.length,b.grp|0));taught=gs.slice(0,g).reduce((t,x)=>t+x.length,0);}
  if(b.consent!=null)consent=b.consent?1:0;
  await D.prepare('update rd_prof set avatar=?,seq=?,taught=?,consent=?,newday=case when ?<>taught or ?<>seq then 0 else newday end,upd=? where student_id=?').bind(avatar,seq,taught,consent,taught,seq,now,a.id).run();
  return J({ok:1})}
 if(p==='/api/rd/me'){const sm=await states(D,a.id),lg=(await D.prepare('select day,count(*) n from rd_log where student_id=? and act=\'session\' group by day order by day desc limit 60').bind(a.id).all()).results,
   wr=(await D.prepare("select count(distinct key) n from rd_log where student_id=? and act='read' and kind='w' and ok=1").bind(a.id).first()).n,
   days=new Set(lg.map(x=>x.day));let streak=0;for(let d=days.has(today)?today:today-1;days.has(d);d--)streak++;
  return J({prof:{avatar:pf.avatar,seq:pf.seq,taught:pf.taught,consent:pf.consent,sessions:pf.sessions},voice:cfg.voice,avatars:AVATARS,total:fl.length,
   map:fl.map((id,i)=>({id,text:RD.GR[id].text,type:RD.GR[id].type,group:RD.groupOf(pf.seq,id),taught:i<pf.taught,level:i<pf.taught?RD.level(sm.get('g:'+id)):0})),
   wordsRead:wr,days:lg.map(x=>x.day),today,streak,tricky:RD.trickyFor(pf.taught)})}
 if(p==='/api/rd/session'){
  const sm=await states(D,a.id);let n=pf.taught,newId=null;
  if(pf.newday===today&&pf.newid)newId=pf.newid; // the same day: replaying today's session keeps today's sound
  else if(n<fl.length&&(n===0||RD.level(sm.get('g:'+fl[n-1]))===2)){newId=fl[n];n++;await D.prepare('update rd_prof set taught=?,newday=?,newid=?,upd=? where student_id=?').bind(n,today,newId,now,a.id).run()}
  else if(pf.newday!==today)await D.prepare("update rd_prof set newid='',upd=? where student_id=?").bind(now,a.id).run();
  const taught=fl.slice(0,n),dueS=taught.filter(id=>id!==newId&&(!sm.get('g:'+id)||sm.get('g:'+id).due<=today)).sort((x,y)=>(sm.get('g:'+x)?1:0)-(sm.get('g:'+y)?1:0)).slice(0,3),
   dueW=[...sm].filter(([k,v])=>k[0]==='w'&&v.due<=today).map(([k])=>k.slice(2)).slice(0,3),
   voice=cfg.voice&&!!pf.consent&&b.mic!==false,plan=RD.compose({seq:pf.seq,n,newId,dueSounds:dueS,dueWords:dueW,voice,seed:Math.floor(Math.random()*1e9)});
  return J({steps:plan.steps,secs:plan.secs,n,newId,voice,seq:pf.seq,tricky:RD.trickyFor(n),first:n===1&&!!newId})}
 if(p==='/api/rd/log'){const act=String(b.act||''),kind=String(b.kind||''),key=String(b.key||''),n=pf.taught;
  if(!ACTS.has(act))return J({error:'Bad activity'},400);
  if(kind==='g'){if(!RD.takenFor(pf.seq,n).includes(key))return J({error:'That sound has not been taught yet.'},400)}
  else if(kind==='w'){if(!RD.BYW[key]||!RD.decodable(key,pf.seq,n))return J({error:'That word has not been taught yet.'},400)}
  else if(kind==='t'){if(!RD.trickyFor(n).map(x=>x.toLowerCase()).includes(key.toLowerCase()))return J({error:'That word has not been taught yet.'},400)}
  else return J({error:'Bad kind'},400);
  await record(D,a.id,pf,act,kind,kind==='t'?key.toLowerCase():key,!!b.ok,act==='assist'||!!b.assist);return J({ok:1})}
 if(p==='/api/rd/done'){await D.batch([D.prepare("insert into rd_log(student_id,act,kind,key,ok,day) values(?,'session','-','-',1,?)").bind(a.id,today),D.prepare('update rd_prof set sessions=sessions+1,upd=? where student_id=?').bind(now,a.id)]);return J({ok:1})}
 return J({error:'Not found'},404)}
