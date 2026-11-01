// Say It! "Learn to read" (v1.0): the child's screens. Loaded on demand from the Say It! room, after sayit-read.js (ReadData).
// Rules: the child never has to read an instruction (every prompt is spoken, icon-first); big targets; no pop-ups; no red crosses ("Good try!");
// sounds, not letter names; IPA is never shown here. The Worker decides what was heard. Nothing on this page talks to a third party.
const SayPlay=(()=>{
const RD=ReadData,GR=RD.GR;
let cfg={voice:false,engines:[]},M=null,H={},pend=null,stopped=false,fast=false,mic=null,vox=true;
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
try{vox=localStorage.rd_vo!=='0'}catch{}
const rnd=a=>a[Math.floor(Math.random()*a.length)],shuf=a=>[...a].sort(()=>Math.random()-.5),sleep=ms=>new Promise(r=>setTimeout(r,fast?4:ms));
const e$=esc;
// ---------- audio: recorded file if it exists, otherwise the browser voice ----------
const miss=new Set();let cur=null;
function tts(text,rate=.8){return new Promise(res=>{let d=false;const fin=()=>{if(!d){d=true;res()}};try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-GB';u.rate=rate;u.onend=fin;u.onerror=fin;speechSynthesis.speak(u)}catch{fin()}setTimeout(fin,fast?4:Math.max(900,String(text).length*110))})}
function file(url,text,rate){return new Promise(res=>{if(miss.has(url))return tts(text,rate).then(res);let d=false;const bad=()=>{if(d)return;d=true;miss.add(url);tts(text,rate).then(res)};
 try{const a=new Audio(url);cur=a;a.onended=()=>{if(!d){d=true;res()}};a.onerror=bad;a.play().catch(bad)}catch{bad()}})}
const stopAudio=()=>{try{cur&&cur.pause()}catch{}try{speechSynthesis.cancel()}catch{}};
const vo=k=>vox&&RD.VO[k]?file('/audio/vo/'+k+'.mp3',RD.VO[k]):Promise.resolve();
const snd=id=>file('/audio/sounds/'+id+'.mp3',GR[id].tts,.7);
const wordSay=w=>file('/audio/words/'+w+'.mp3',w,.8);
async function slide(toks){for(const t of toks){const id=RD.tokId(t,M.prof.seq);GR[id]&&await snd(id);await sleep(120)}await sleep(150)} // each sound, then the word
// ---------- screens ----------
const draw=(h,top)=>{R(`<div class=rd id=rd>${top===false?'':bar()}${h}</div>`,'');$('#rd').onclick=e=>{const b=e.target.closest('[data-a]');if(!b||b.disabled)return;const a=b.dataset.a;
 if(a==='stop')return askStop();if(a==='vo'){vox=!vox;try{localStorage.rd_vo=vox?'1':'0'}catch{}stopAudio();b.textContent=vox?'🔊':'🔇';b.setAttribute('aria-pressed',vox);return}if(H[a])H[a](b.dataset,b)}};
let dots='',draw0=()=>{};
const bar=()=>`<div class=rdbar><button class=rdsm data-a=stop aria-label="Stop and go back">🏠</button><div class=rddots aria-hidden=true>${dots}</div><button class=rdsm data-a=vo aria-label="${vox?'Turn the spoken help off':'Turn the spoken help on'}" aria-pressed="${vox}">${vox?'🔊':'🔇'}</button></div>`;
const inp=h=>new Promise(r=>{pend=r;H=Object.fromEntries(Object.entries(h).map(([k,f])=>[k,(d,b)=>f(d,b,r)]))});
const live=t=>{const l=$('#rdlive');if(l)l.textContent=t};
const tiles=(toks,hl=-1,cls='')=>`<div class="rdtiles ${cls}">${toks.map((t,i)=>{const id=RD.tokId(t,M.prof.seq);return `<button class="tk c${i%4}${i===hl?' hl':''}" data-a=tile data-i="${i}" aria-label="sound ${e$(RD.tokText(t))}">${e$(RD.tokText(t))}</button>`}).join('')}</div>`;
const cheer=async()=>{try{sfx('ok')}catch{}if(typeof confetti==='function'&&Math.random()<.4)confetti();await vo(rnd(['good1','good2','good3']))};
const gentle=()=>vo('retry');
async function askStop(){stopAudio();const keep=document.getElementById('rd').innerHTML,old=H;
 R(`<div class=rd id=rd><div class="rdmid"><div class=rdbig aria-hidden=true>🏠</div><p class=rdsay>Do you want to stop now?</p><div class=rdrow><button class="rdb" data-a=yes aria-label="Yes, stop">👋 Yes</button><button class="rdb alt" data-a=no aria-label="No, keep playing">▶ No</button></div></div></div>`,'');vo('stop_ask');
 $('#rd').onclick=e=>{const b=e.target.closest('[data-a]');if(!b)return;if(b.dataset.a==='yes'){stopped=true;stopAudio();pend&&pend('stop');home()}else{document.getElementById('app').innerHTML='<div class=rd id=rd>'+keep+'</div>';H=old;$('#rd').onclick=e2=>{const c=e2.target.closest('[data-a]');if(!c||c.disabled)return;const a=c.dataset.a;if(a==='stop')return askStop();if(a==='vo'){vox=!vox;try{localStorage.rd_vo=vox?'1':'0'}catch{}return}if(H[a])H[a](c.dataset,c)}}}}
// ---------- the microphone ----------
function micReady(){return cfg.voice&&M&&M.prof.consent&&(cfg.engines.length>0||!!SR)}
async function openMic(){const st=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true}});return st}
// Records until the child stops talking (about 0.9 s of quiet after speech), at most max ms. Returns {wav,peak}. Local only: nothing is sent here.
async function listenOnce({max=5000,quiet=900,min=500}={}){
 if(fast){max=Math.min(max,1200);quiet=250;min=250} // test mode only
 const st=await openMic(),ctx=new(window.AudioContext||window.webkitAudioContext)(),chunks=[];let node,loudAt=0,started=false,t0=0,peak=0;
 try{await ctx.resume();const src=ctx.createMediaStreamSource(st),mute=ctx.createGain();mute.gain.value=0;
  const on=f=>{let s=0;for(let i=0;i<f.length;i++)s+=f[i]*f[i];const r=Math.sqrt(s/f.length);peak=Math.max(peak,r);const t=performance.now();if(r>.015){started=true;loudAt=t}chunks.push(f)};
  if(ctx.audioWorklet&&window.AudioWorkletNode){const url=URL.createObjectURL(new Blob(['class R extends AudioWorkletProcessor{process(i){const c=i[0]&&i[0][0];if(c)this.port.postMessage(new Float32Array(c));return true}}registerProcessor("rd-rec",R)'],{type:'text/javascript'}));
   try{await ctx.audioWorklet.addModule(url)}finally{URL.revokeObjectURL(url)}node=new AudioWorkletNode(ctx,'rd-rec');node.port.onmessage=e=>on(e.data)}
  else{node=ctx.createScriptProcessor(4096,1,1);node.onaudioprocess=e=>on(new Float32Array(e.inputBuffer.getChannelData(0)))}
  src.connect(node);node.connect(mute);mute.connect(ctx.destination);t0=performance.now();
  while(true){await new Promise(r=>setTimeout(r,60));const t=performance.now();if(t-t0>=max)break;if(started&&t-t0>=min&&t-loudAt>=quiet)break}
 }finally{try{node&&node.disconnect()}catch{}st.getTracks().forEach(t=>t.stop());var rate=ctx.sampleRate;await ctx.close().catch(()=>{})}
 return{peak,wav:peak>=.012?toWav(chunks,rate):null}}
function toWav(ch,rate){const n=ch.reduce((a,c)=>a+c.length,0),f=new Float32Array(n);let o=0;for(const c of ch){f.set(c,o);o+=c.length}
 const k=rate/16000,m=Math.floor(n/k),b=new DataView(new ArrayBuffer(44+m*2)),w=(p,s)=>[...s].forEach((c,j)=>b.setUint8(p+j,c.charCodeAt(0)));
 w(0,'RIFF');b.setUint32(4,36+m*2,true);w(8,'WAVEfmt ');b.setUint32(16,16,true);b.setUint16(20,1,true);b.setUint16(22,1,true);b.setUint32(24,16000,true);b.setUint32(28,32000,true);b.setUint16(32,2,true);b.setUint16(34,16,true);w(36,'data');b.setUint32(40,m*2,true);
 for(let j=0;j<m;j++){const a=Math.floor(j*k),z=Math.max(a+1,Math.floor((j+1)*k));let s=0;for(let i=a;i<z&&i<n;i++)s+=f[i];s/=(z-a);s=Math.max(-1,Math.min(1,s));b.setInt16(44+j*2,s<0?s*32768:s*32767,true)}return b.buffer}
function browserHear(ms=5000){return new Promise((res,rej)=>{const r=new SR(),alts=[];r.lang='en-GB';r.maxAlternatives=5;r.interimResults=false;
 r.onresult=e=>{const x=e.results[0];for(let i=0;i<x.length;i++)alts.push({transcript:x[i].transcript,confidence:x[i].confidence})};
 r.onerror=ev=>ev.error==='no-speech'?res([]):rej({name:ev.error==='not-allowed'?'NotAllowedError':'Err'});r.onend=()=>res(alts);try{r.start()}catch(e){return rej(e)}setTimeout(()=>{try{r.stop()}catch{}},ms)})}
// Ask the Worker to judge a spoken word or sentence. kind 'w' with key = word, kind 's' with key = sentence index.
async function hear(kind,key){
 let j;
 if(cfg.engines.length){const l=await listenOnce();if(!l.wav)return{result:'quiet'};
  const q=kind==='w'?'read?word='+encodeURIComponent(key):'sent?i='+encodeURIComponent(key);
  const r=await fetch('/api/rd/'+q,{method:'POST',headers:{authorization:'Bearer '+S.tok},body:l.wav});j=await r.json().catch(()=>({error:'Connection problem.'}))}
 else{const alts=await browserHear();if(!alts.length)return{result:'quiet'};j=await api(kind==='w'?'rd/heard':'rd/sentheard',kind==='w'?{word:key,alts}:{i:key,alts})}
 if(j.error){if(j.off||j.consent===0){M.prof.consent=j.consent===0?0:M.prof.consent;if(j.off)cfg.voice=false}throw{msg:j.error,off:!!j.off,consent:j.consent===0}}
 return j}
const lg=(act,kind,key,ok,assist)=>{api('rd/log',{act,kind,key,ok:!!ok,assist:!!assist}).catch?.(()=>{})};
// ---------- pictures ----------
const allPics=()=>RD.ALL.flatMap(id=>GR[id].pics.map(p=>({...p,id})));
const FAM={ck:['ck','c','k'],c:['ck','c','k'],k:['ck','c','k']};
const txts=id=>FAM[id]||[GR[id].text];
const pos=(w,id)=>{const t=txts(id);return t.some(x=>w.startsWith(x))?'first':t.some(x=>w.endsWith(x))?'end':'mid'};
const picBtn=(p,i)=>`<button class=rdpic data-a=pick data-i="${i}" aria-label="${e$(p.w)}"><span aria-hidden=true>${p.e}</span></button>`;
// ---------- activities ----------
const ACT={};
ACT.teach=async s=>{const g=GR[s.id];
 draw(`<div class=rdmid><div class=rdglyph aria-label="the sound ${e$(g.text)}">${e$(g.text)}</div><div class=rdpics aria-hidden=true>${g.pics.slice(0,3).map(p=>`<span title="${e$(p.w)}">${p.e}</span>`).join('')}</div>
 <p class=rdact>👐 ${e$(g.act)}</p><div class=rdrow><button class="rdb alt" data-a=again aria-label="Hear the sound again">🔊</button><button class=rdb data-a=go aria-label="Next">▶</button></div></div><div id=rdlive class=sr aria-live=polite></div>`);
 await vo('teach_it');await snd(s.id);
 await inp({again:()=>snd(s.id),go:(d,b,r)=>r(1)});if(stopped)return;lg('teach','g',s.id,1)};
ACT.safari=async s=>{const g=GR[s.id],pool=g.pics.filter(p=>p.w&&!p.w.includes('-')),t=rnd(pool),tx=txts(s.id),w=pos(t.w,s.id);
 const dis=shuf([...new Map(allPics().filter(p=>p.id!==s.id&&!tx.some(x=>p.w.includes(x))&&!p.w.includes('-')).map(p=>[p.w,p])).values()]).slice(0,2),opts=shuf([t,...dis]);
 draw(`<div class=rdmid><button class="rdb alt rdsnd" data-a=again aria-label="Hear the sound">🔊 <b>${e$(g.text)}</b></button><div class=rdpics3>${opts.map(picBtn.bind(null)).join('')}</div></div><div id=rdlive class=sr aria-live=polite></div>`);
 await vo('safari_'+w);await snd(s.id);
 let tries=0,first=true;while(true){const i=await inp({again:()=>snd(s.id),pick:(d,b,r)=>r(+d.i)});if(stopped)return;
  if(opts[i]===t){document.querySelectorAll('.rdpic')[i].classList.add('good');live('Yes');lg('safari','g',s.id,first);await cheer();return}
  first=false;tries++;document.querySelectorAll('.rdpic')[i].classList.add('soft');await gentle();
  if(tries>=2){document.querySelectorAll('.rdpic')[opts.indexOf(t)].classList.add('good');await sleep(900);lg('safari','g',s.id,false);return}}};
ACT.say=async s=>{const g=GR[s.id],m=micReady();
 draw(`<div class=rdmid><div class=rdglyph>${e$(g.text)}</div>${m?`<button class="rdb rdmicb" data-a=mic aria-label="Say the sound">🎤</button>`:`<button class="rdb rdmicb" data-a=done aria-label="I said it">👍</button>`}<div class=rdrow><button class="rdb alt" data-a=again aria-label="Hear the sound again">🔊</button></div></div><div id=rdlive class=sr aria-live=polite></div>`);
 await vo('say_sound');await snd(s.id);await vo(m?'say_with':'say_sound');
 await inp({again:()=>snd(s.id),done:(d,b,r)=>r(1),mic:async(d,b,r)=>{b.disabled=true;b.classList.add('rec');try{await listenOnce({max:2500,quiet:600,min:400})}catch{}r(1)}}); // participation only: whatever was heard (or not), the child is praised
 if(stopped)return;lg('say','g',s.id,1);await cheer()};
const wrongWords=(w,n=2)=>{const o=RD.BYW[w],pool=RD.wordsFor(M.prof.seq,M.n).filter(x=>x.w!==w&&x.syl.length===1);const near=o.conf.filter(x=>RD.BYW[x]&&RD.decodable(x,M.prof.seq,M.n));return shuf([...new Set([...near,...shuf(pool).map(x=>x.w)])]).slice(0,n)};
ACT.blend=async s=>{const o=RD.BYW[s.w];let heardAll=new Set();
 draw(`<div class=rdmid>${o.e?`<div class=rdbig aria-hidden=true>${o.e}</div>`:''}${tiles(o.toks)}<div class=rdrow><button class="rdb" data-a=slide id=sl aria-label="Slide the sounds together" disabled>🚤</button></div></div><div id=rdlive class=sr aria-live=polite></div>`);
 await vo('blend_tap');
 await inp({tile:(d,b,r)=>{const t=o.toks[+d.i];snd(RD.tokId(t,M.prof.seq));b.classList.add('on');heardAll.add(+d.i);if(heardAll.size>=o.toks.length)$('#sl').disabled=false},slide:async(d,b,r)=>{b.disabled=true;await slide(o.toks);await wordSay(o.w);r(1)}});if(stopped)return;
 const opts=shuf([o.w,...wrongWords(o.w)]);
 draw(`<div class=rdmid><div class=rdglyph2 aria-hidden=true>${o.e||'❓'}</div><div class=rdwords>${opts.map((w,i)=>`<button class="rdb wd" data-a=pick data-i="${i}">${e$(w)}</button>`).join('')}</div></div><div id=rdlive class=sr aria-live=polite></div>`);
 await vo('blend_which');let first=true,tries=0;
 while(true){const i=await inp({pick:(d,b,r)=>r(+d.i)});if(stopped)return;
  if(opts[i]===o.w){document.querySelectorAll('.wd')[i].classList.add('good');lg('blend','w',o.w,first);await cheer();return}
  first=false;tries++;document.querySelectorAll('.wd')[i].classList.add('soft');await gentle();if(tries>=2){document.querySelectorAll('.wd')[opts.indexOf(o.w)].classList.add('good');await sleep(900);lg('blend','w',o.w,false);return}}};
ACT.read=async s=>{const o=RD.BYW[s.w];let tries=0,hl=-1;
 const show=msg=>draw(`<div class=rdmid>${o.e?`<div class=rdbig aria-hidden=true>${o.e}</div>`:''}${tiles(o.toks,hl,'rdread')}<button class="rdb rdmicb" data-a=mic aria-label="Read the word">🎤</button><div class=rdrow><button class="rdb alt" data-a=help aria-label="Hear the sounds">🎧</button></div><p class=rdsay id=rdmsg>${msg||''}</p></div><div id=rdlive class=sr aria-live=polite></div>`);
 show('');await vo('read_it');
 while(true){
  const act=await inp({tile:(d)=>snd(RD.tokId(o.toks[+d.i],M.prof.seq)),help:(d,b,r)=>r('help'),mic:(d,b,r)=>r('mic')});if(stopped)return;
  if(act==='help'){await slide(o.toks);await wordSay(o.w);lg('assist','w',o.w,0,true);return}
  const b=$('.rdmicb');b.disabled=true;b.classList.add('rec');let j;
  try{j=await hear('w',o.w)}catch(e){if(e.off||e.consent){$('#rdmsg').textContent=e.msg;await sleep(1600);return}if(e&&(e.name==='NotAllowedError'||e.name==='NotFoundError')){await vo('mic_no');await slide(o.toks);await wordSay(o.w);lg('assist','w',o.w,0,true);return}b.disabled=false;b.classList.remove('rec');$('#rdmsg').textContent='Let us try again.';continue}
  b.classList.remove('rec');
  if(j.result==='correct'){document.querySelectorAll('.tk').forEach(x=>x.classList.add('good'));live('You read it');await cheer();return}
  if(j.result==='quiet'){b.disabled=false;$('#rdmsg').textContent='🎤';await vo('say_with');continue}
  tries++;hl=j.result==='near'&&j.hint?(j.hint==='first'?0:j.hint==='last'?o.toks.length-1:Math.min(1,o.toks.length-1)):-1;
  if(tries>=2){await vo('assist');await slide(o.toks);await wordSay(o.w);lg('assist','w',o.w,0,true);return}
  show('');await vo(j.result==='near'?'read_near':'read_try');if(hl>=0){await vo('hint_'+j.hint);await snd(RD.tokId(o.toks[hl],M.prof.seq))}}};
ACT.tricky=async s=>{const tr=RD.trickyFor(M.n),w=s.w,opts=shuf([w,...shuf(tr.filter(x=>x.toLowerCase()!==w.toLowerCase())).slice(0,2)]);
 draw(`<div class=rdmid><button class="rdb alt" data-a=again aria-label="Hear the word">🔊</button><div class=rdwords>${opts.map((x,i)=>`<button class="rdb wd" data-a=pick data-i="${i}">${e$(x)}</button>`).join('')}</div></div><div id=rdlive class=sr aria-live=polite></div>`);
 await vo('tricky_find');await wordSay(w);let first=true,tries=0;
 while(true){const i=await inp({again:()=>wordSay(w),pick:(d,b,r)=>r(+d.i)});if(stopped)return;
  if(opts[i]===w){document.querySelectorAll('.wd')[i].classList.add('good');lg('tricky','t',w.toLowerCase(),first);await cheer();return}
  first=false;tries++;document.querySelectorAll('.wd')[i].classList.add('soft');await gentle();if(tries>=2){document.querySelectorAll('.wd')[opts.indexOf(w)].classList.add('good');await sleep(900);lg('tricky','t',w.toLowerCase(),false);return}}};
ACT.build=async s=>{const o=RD.BYW[s.w],seq=M.prof.seq,fl=RD.takenFor(seq,M.n);
 const trayIds=shuf([...o.toks.map(t=>RD.tokId(t,seq)),...shuf(fl.filter(x=>!o.toks.map(t=>RD.tokId(t,seq)).includes(x)&&GR[x].type!=='e')).slice(0,2)]).map((id,i)=>({id,k:i}));
 let boxes=Array(o.toks.length).fill(null),used=new Set(),tries=0,firstOk=true;
 const paint=bad=>draw(`<div class=rdmid>${o.e?`<div class=rdbig aria-hidden=true>${o.e}</div>`:''}<div class=rdboxes>${boxes.map((b,i)=>`<button class="rdbox${b?' full':''}${bad&&bad.includes(i)?' soft':''}" data-a=unput data-i="${i}" aria-label="${b?'sound '+e$(GR[b.id].text)+', tap to take back':'empty box'}">${b?e$(GR[b.id].text):''}</button>`).join('')}</div>
  <div class=rdtray>${trayIds.map(t=>`<button class="tk c${t.k%4}" data-a=put data-k="${t.k}" ${used.has(t.k)?'disabled':''} aria-label="sound ${e$(GR[t.id].text)}">${e$(GR[t.id].text)}</button>`).join('')}</div><div class=rdrow><button class="rdb alt" data-a=again aria-label="Hear the word">🔊</button></div></div><div id=rdlive class=sr aria-live=polite></div>`);
 paint();await vo('build_hear');await wordSay(o.w);
 while(true){
  const r=await inp({again:()=>wordSay(o.w),put:(d,b,r)=>{const t=trayIds[+d.k],at=boxes.findIndex(x=>!x);if(at<0)return;boxes[at]={id:t.id,k:t.k};used.add(t.k);snd(t.id);if(boxes.every(Boolean))r('full');else paint0()},unput:(d,b,r)=>{const i=+d.i;if(boxes[i]){used.delete(boxes[i].k);boxes[i]=null;paint0()}}});
  if(stopped)return;
  if(r==='full'){const bad=boxes.map((b,i)=>b.id===RD.tokId(o.toks[i],seq)?-1:i).filter(i=>i>=0);
   if(!bad.length){paint();document.querySelectorAll('.rdbox').forEach(x=>x.classList.add('good'));lg('build','w',o.w,firstOk);await vo('build_good');await cheer();return}
   firstOk=false;tries++;paint(bad);await vo('build_try');
   if(tries>=2){boxes=o.toks.map((t,i)=>({id:RD.tokId(t,seq),k:-1}));paint();await slide(o.toks);await wordSay(o.w);lg('build','w',o.w,false);return}
   bad.forEach(i=>{used.delete(boxes[i].k);boxes[i]=null});paint()}}
 function paint0(){paint()}};
ACT.trace=async s=>{const g=GR[s.id],txt=g.text;
 draw(`<div class=rdmid><div class=rdcanvas><canvas id=cv width=300 height=300 aria-label="Trace the letters with your finger"></canvas></div><div class=rdrow><button class="rdb alt" data-a=clear aria-label="Clear and start again">🧽</button><button class="rdb alt" data-a=again aria-label="Hear the sound">🔊</button><button class="rdb alt" data-a=skip aria-label="Skip">⏭</button></div></div><div id=rdlive class=sr aria-live=polite></div>`);
 const cv=$('#cv'),c=cv.getContext('2d'),mk=document.createElement('canvas');mk.width=mk.height=300;const m=mk.getContext('2d');
 const FONT='"Andika","Century Gothic","Comic Sans MS","Trebuchet MS",system-ui,sans-serif',fs=txt.length>1?170:230;
 const guide=()=>{c.clearRect(0,0,300,300);c.font='800 '+fs+'px '+FONT;c.textAlign='center';c.textBaseline='middle';c.fillStyle='rgba(255,255,255,.28)';c.fillText(txt,150,160);c.setLineDash([8,10]);c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=2;c.strokeText(txt,150,160);c.setLineDash([])};
 m.font=c.font='800 '+fs+'px '+FONT;m.textAlign='center';m.textBaseline='middle';m.fillStyle='#000';m.fillText(txt,150,160);
 const mask=m.getImageData(0,0,300,300).data;let ink=document.createElement('canvas');ink.width=ink.height=300;const ic=ink.getContext('2d');ic.lineCap=ic.lineJoin='round';ic.lineWidth=30;ic.strokeStyle='#fff';
 const redraw=()=>{guide();c.drawImage(ink,0,0)};guide();let down=false,lx=0,ly=0,drew=false;
 const pt=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*300/r.width,(e.clientY-r.top)*300/r.height]};
 cv.style.touchAction='none';
 cv.onpointerdown=e=>{down=true;[lx,ly]=pt(e);cv.setPointerCapture&&cv.setPointerCapture(e.pointerId);ic.beginPath();ic.moveTo(lx,ly);ic.lineTo(lx+.1,ly);ic.stroke();drew=true;redraw()};
 cv.onpointermove=e=>{if(!down)return;const[x,y]=pt(e);ic.beginPath();ic.moveTo(lx,ly);ic.lineTo(x,y);ic.stroke();lx=x;ly=y;redraw()};
 const cover=()=>{const d=ic.getImageData(0,0,300,300).data;let on=0,hit=0;for(let i=3;i<mask.length;i+=16){if(mask[i]>128){on++;if(d[i]>128)hit++}}return on?hit/on:0};
 await vo('trace_it');await snd(s.id);
 let tries=0;
 return new Promise(res=>{pend=res;
  cv.onpointerup=cv.onpointercancel=async()=>{if(!down)return;down=false;if(cover()>=.55){H={};live('Lovely tracing');lg('trace','g',s.id,1);await vo('trace_good');await cheer();res(1)}};
  H={clear:()=>{ic.clearRect(0,0,300,300);guide();tries++},again:()=>snd(s.id),skip:()=>{lg('trace','g',s.id,0);res(0)}}})};
ACT.sent=async s=>{const sentence=RD.SENT[s.i],ws=sentence.split(' ');let tries=0,lit=[];
 const show=()=>draw(`<div class=rdmid><div class=rdsent>${ws.map((w,i)=>`<span class="sw${lit[i]?' lit':''}">${e$(w)}</span>`).join(' ')}</div><button class="rdb rdmicb" data-a=mic aria-label="Read the sentence">🎤</button><div class=rdrow><button class="rdb alt" data-a=help aria-label="Hear it">🎧</button></div></div><div id=rdlive class=sr aria-live=polite></div>`);
 show();await vo('sent_read');
 while(true){const a=await inp({mic:(d,b,r)=>r('mic'),help:(d,b,r)=>r('help')});if(stopped)return;
  if(a==='help'){for(let i=0;i<ws.length;i++){lit=ws.map((_,k)=>k<=i);show();await wordSay(ws[i].replace(/[.,!?]/g,''))}return}
  const b=$('.rdmicb');b.disabled=true;b.classList.add('rec');let j;
  try{j=await hear('s',String(s.i))}catch(e){if(e.off||e.consent)return;if(e&&(e.name==='NotAllowedError'||e.name==='NotFoundError')){await vo('mic_no');return}b.disabled=false;b.classList.remove('rec');continue}
  if(j.result==='quiet'){show();await vo('say_with');continue}
  lit=j.words||[];show();
  if(j.result==='correct'){document.querySelectorAll('.sw').forEach(x=>x.classList.add('lit'));await vo('sent_good');await cheer();return}
  tries++;await vo('sent_try');if(tries>=2){for(let i=0;i<ws.length;i++){lit=ws.map((_,k)=>k<=i);show();await wordSay(ws[i].replace(/[.,!?]/g,''))}return}lit=[];show()}};
// ---------- the session ----------
const BL={review:'🔁',new:'⭐',read:'📖'};
async function runSteps(steps,o={}){stopped=false;let n=0;const total=steps.length;
 for(const s of steps){if(stopped)return false;n++;dots=steps.map((x,i)=>`<i class="${i<n-1?'d':i===n-1?'c':''}"></i>`).join('');draw0=()=>{};
  const f=ACT[s.t];if(!f)continue;try{await f(s)}catch(e){if(stopped)return false}
  await sleep(250)}
 return !stopped}
async function session(){
 R('<div class=rd><div class=rdmid><div class=rdbig>⏳</div></div></div>','');
 const r=await api('rd/session',{mic:micReady()});if(r.error){toast(r.error);return home()}
 M.n=r.n;M.newId=r.newId;M.prof.taught=r.n;
 if(r.first||(r.voice&&!M.micChecked&&M.prof.sessions===0)){await welcome(r)}
 const ok=await runSteps(r.steps);if(!ok)return;
 await api('rd/done',{});M.prof.sessions++;
 const blocks=new Set(r.steps.map(s=>s.blk)).size;
 draw(`<div class=rdmid><div class=rdbig aria-hidden=true>${'⭐'.repeat(Math.max(1,blocks))}</div><p class=rdsay>See you tomorrow!</p><div class=rdrow><button class=rdb data-a=home aria-label="Home">🏠</button></div></div>`,false);vo('all_done');
 H={home:()=>home()}}
async function welcome(r){
 draw(`<div class=rdmid><div class=rdbig>${M.prof.avatar}</div><p class=rdsay>Hello!</p>${r.voice?`<button class="rdb rdmicb" data-a=mic aria-label="Say hello">🎤</button>`:''}<div class=rdrow><button class="rdb alt" data-a=go aria-label="Next">▶</button></div></div>`);
 vo('welcome');if(r.voice)vo('mic_check');
 await inp({go:(d,b,r2)=>r2(1),mic:async(d,b,r2)=>{b.disabled=true;let h=false;try{h=!!(await listenOnce({max:2500,quiet:600,min:300})).wav}catch{}M.micChecked=true;await vo(h?'mic_ok':'mic_no');r2(1)}})}
// ---------- home, listening games, parent area ----------
async function home(){
 stopAudio();stopped=true;
 const r=await api('rd/me');if(r.error){toast(r.error);return SayIt.home()}M=Object.assign(M||{},r);M.n=r.prof.taught;
 draw(`<div class=rdmid><div class=rdbig aria-hidden=true>${r.prof.avatar}</div>
 <button class="rdb rdplay" data-a=play aria-label="Play">▶</button>
 <div class=rdrow><button class="rdb alt" data-a=games aria-label="Listening games">👂</button><button class="rdb alt" data-a=parent aria-label="Grown-ups">👪</button><button class="rdb alt" data-a=out aria-label="Back to Say It">⬅</button></div>
 <div class=rdmeter aria-label="Sounds mastered: ${r.map.filter(x=>x.level===2).length} of ${r.total}"><i style="width:${100*r.map.filter(x=>x.level===2).length/r.total}%"></i></div></div>`,false);
 H={play:()=>session(),games:()=>games(),parent:()=>gate(),out:()=>{stopAudio();SayIt.home()}}}
async function games(){
 draw(`<div class=rdmid><div class=rdrow><button class="rdb big3" data-a=rhyme aria-label="Rhyme game">🎵</button><button class="rdb big3" data-a=odd aria-label="Odd one out">🧩</button><button class="rdb big3" data-a=beats aria-label="Clap the beats">🥁</button></div><button class="rdb alt" data-a=back aria-label="Back">⬅</button></div>`,false);
 H={rhyme:async()=>{await playRound(rhyme,5);games()},odd:async()=>{await playRound(odd,5);games()},beats:async()=>{await playRound(beats,5);games()},back:()=>home()}}
async function playRound(f,n){stopped=false;dots=Array(n).fill('<i></i>').join('');for(let i=0;i<n&&!stopped;i++){dots=Array.from({length:n},(_,k)=>`<i class="${k<i?'d':k===i?'c':''}"></i>`).join('');try{await f()}catch{}}}
const RH=[['cat','hat','bat','🐱','🎩','🦇'],['dog','log','frog','🐶','🪵','🐸'],['sun','bun','run','☀️','🍞','🏃'],['bee','tree','knee','🐝','🌳','🦵'],['boat','goat','coat','⛵','🐐','🧥'],['house','mouse','blouse','🏠','🐭','👚'],['moon','spoon','balloon','🌙','🥄','🎈'],['car','star','jar','🚗','⭐','🫙'],['pin','bin','fin','📌','🗑️','🦈'],['bed','red','sled','🛏️','🟥','🛷']];
async function rhyme(){const g=rnd(RH),t=[0,1,2].sort(()=>Math.random()-.5),a=g[t[0]],b=g[t[1]],eA=g[3+t[0]],eB=g[3+t[1]],other=rnd(RH.filter(x=>x!==g)),oi=Math.floor(Math.random()*3),o=other[oi],eo=other[3+oi],opts=shuf([[b,eB,1],[o,eo,0],...[other[(oi+1)%3]].map((w,k)=>[w,other[3+(oi+1)%3],0])]);
 draw(`<div class=rdmid><div class=rdbig aria-label="${a}">${eA}</div><div class=rdpics3>${opts.map((p,i)=>`<button class=rdpic data-a=pick data-i="${i}" aria-label="${p[0]}">${p[1]}</button>`).join('')}</div></div>`);
 await vo('rhyme_q');await wordSay(a);let tries=0;
 while(true){const i=await inp({pick:(d,b2,r)=>r(+d.i)});if(stopped)return;if(opts[i][2]){document.querySelectorAll('.rdpic')[i].classList.add('good');await cheer();return}tries++;document.querySelectorAll('.rdpic')[i].classList.add('soft');await gentle();if(tries>=2)return}}
async function odd(){const ids=shuf(RD.ALL.filter(x=>GR[x].type!=='e'&&GR[x].pics.filter(p=>p.w.startsWith(GR[x].text)&&!p.w.includes('-')).length>=2)),A=ids[0],B=ids[1],pa=shuf(GR[A].pics.filter(p=>p.w.startsWith(GR[A].text)&&!p.w.includes('-'))).slice(0,2),pb=shuf(GR[B].pics.filter(p=>p.w.startsWith(GR[B].text)&&!p.w.includes('-')))[0],opts=shuf([...pa.map(p=>({p,ok:0})),{p:pb,ok:1}]);
 draw(`<div class=rdmid><div class=rdpics3>${opts.map((o2,i)=>picBtn(o2.p,i)).join('')}</div></div>`);await vo('same_start');for(const o2 of opts)await wordSay(o2.p.w);let tries=0;
 while(true){const i=await inp({pick:(d,b,r)=>r(+d.i)});if(stopped)return;if(opts[i].ok){document.querySelectorAll('.rdpic')[i].classList.add('good');await cheer();return}tries++;document.querySelectorAll('.rdpic')[i].classList.add('soft');await gentle();if(tries>=2)return}}
const BT=[['cat',1,'🐱'],['dog',1,'🐶'],['pig',1,'🐷'],['rabbit',2,'🐰'],['spider',2,'🕷️'],['apple',2,'🍎'],['monkey',2,'🐵'],['banana',3,'🍌'],['elephant',3,'🐘'],['umbrella',3,'☂️'],['dinosaur',3,'🦕'],['butterfly',3,'🦋']];
async function beats(){const[w,n,e]=rnd(BT);let k=0;
 draw(`<div class=rdmid><div class=rdbig aria-hidden=true>${e}</div><button class="rdb rdmicb" data-a=clap aria-label="Clap once for each beat">🥁</button><div class=rdrow id=bd aria-hidden=true></div><button class="rdb alt" data-a=done aria-label="Done">✔</button></div><div id=rdlive class=sr aria-live=polite></div>`);
 await vo('beats_q');await wordSay(w);
 let tries=0;while(true){const r=await inp({clap:(d)=>{k++;$('#bd').textContent='👏'.repeat(k);try{sfx('ok')}catch{}},done:(d,b,r2)=>r2('done')});if(stopped)return;
  if(k===n){await cheer();return}tries++;k=0;$('#bd').textContent='';await gentle();if(tries>=2){$('#bd').textContent='👏'.repeat(n);await wordSay(w);await sleep(800);return}}}
// ---------- parent area (behind a small arithmetic gate) ----------
function gate(){const a=6+Math.floor(Math.random()*4),b=6+Math.floor(Math.random()*4);
 draw(`<div class=rdmid><p class=rdsay>Grown-ups: what is ${a} × ${b}?</p><input id=gin inputmode=numeric autocomplete=off aria-label="Answer" class=rdin><div class=rdrow><button class=rdb data-a=ok aria-label="Check">✔</button><button class="rdb alt" data-a=back aria-label="Back">⬅</button></div><p id=gerr class=rdsay></p></div>`,false);
 H={ok:()=>{if(+$('#gin').value===a*b)parent();else{$('#gerr').textContent='Not quite. Ask a grown-up.';$('#gin').value=''}},back:()=>home()}}
async function parent(){
 const r=await api('rd/me');if(r.error){toast(r.error);return home()}M=Object.assign(M||{},r);
 const gs=['Starting out','Group 1','Group 2','Group 3','Group 4','Group 5','Group 6','Group 7'],ml=r.map.filter(x=>x.level===2).length,lr=r.map.filter(x=>x.taught&&x.level<2).length;
 R(`<div class="rd rdpar" id=rd><div class=rdpr><h2>${r.prof.avatar} Reading summary</h2>
  <p><b>${ml}</b> of ${r.total} sounds mastered · <b>${lr}</b> being learned · <b>${r.wordsRead}</b> different words read · <b>${r.streak}</b> day${r.streak===1?'':'s'} in a row · <b>${r.prof.sessions}</b> sessions</p>
  <div class=rdmap role=list aria-label="Sound map">${r.map.map(x=>`<span role=listitem class="mp l${x.level}${x.taught?'':' off'}" title="${e$(x.text)}: ${x.taught?['not seen','learning','mastered'][x.level]:'not taught yet'}">${x.taught?['·','◐','✓'][x.level]:'🔒'} ${e$(x.text)}</span>`).join('')}</div>
  <small>✓ mastered (5 of the last 6 tries right, on 2 different days) · ◐ learning · 🔒 not taught yet. Practise 10 minutes a day: the app suggests what to do next.</small></div>
  <div class=rdset><h3>Settings</h3>
  <label>Avatar <select id=sav>${r.avatars.map(a=>`<option ${a===r.prof.avatar?'selected':''}>${a}</option>`).join('')}</select></label>
  <label>Sound order <select id=ssq><option value=jolly ${r.prof.seq==='jolly'?'selected':''}>Groups 1 to 7 (common 42-sound order)</option><option value=ls ${r.prof.seq==='ls'?'selected':''}>Letters and Sounds style order</option></select></label>
  <label>Which group is your child's school on? <select id=sgr><option value="">Keep following the app</option>${gs.slice(0,8).map((n,i)=>`<option value=${i}>${n}${i?' done':''}</option>`).join('')}</select></label>
  <small>Choose the group the school has finished. The app then starts with the next sound. Check with the teacher: schools differ.</small>
  ${r.voice?`<label class=rdchk><input type=checkbox id=scn ${r.prof.consent?'checked':''}> <span><b>Allow voice reading.</b> When your child reads a word aloud, the sound is sent to a speech-checking service (Cloudflare Workers AI, Microsoft Azure or Google, depending on how the school set it up, or the browser's own service) so the word can be checked. Spell Academy does not keep the recording or what was heard. It keeps only whether the word was read correctly. You can turn this off at any time.</span></label>`:`<p><small>🔇 Voice reading is switched off by your child's teacher. Everything else works.</small></p>`}
  <div class=rdrow><button class=rdb data-a=save>Save</button><button class="rdb alt" data-a=print>🖨 Print summary</button><button class="rdb alt" data-a=back>⬅ Back</button></div></div></div>`,'');
 H={save:async()=>{const g=$('#sgr').value;await api('rd/setup',{avatar:$('#sav').value,seq:$('#ssq').value,...(g!==''?{grp:+g}:{}),...($('#scn')?{consent:$('#scn').checked}:{})});toast('Saved');parent()},print:()=>window.print(),back:()=>home()};
 $('#rd').onclick=e=>{const b=e.target.closest('[data-a]');if(b&&H[b.dataset.a])H[b.dataset.a]()}}
function open(c){cfg={voice:!!c.voice,engines:c.engines||[]};stopped=false;M=null;home()}
return{open,runSteps,ACT,test:{fast:f=>{fast=!!f},micReady}};
})();
