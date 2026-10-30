// Say It! (v4.4): pupil screens. Loaded on demand by sayit() in player.js, so a class with Say It! switched off never downloads it.
// Content tables come from sayit-data.js (SayData). Scoring and XP live in the Worker (src/sayit.js): this file never decides a score.
// XP rule: each word pays at most 10 XP in total. A recording pays 2/4/6/8/10 by accuracy, and a better one pays only the difference.
const SayIt=(()=>{
const {PA,ODD,DEL,CHG,POOL,STRAT,L,SK,LT,SP,SY,PH,TABS}=SayData;
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let cfg={on:true,voice:false,engines:[],cap:10},lt='s',li=0,DG=null,yi=0,ys=new Set(),yans=false,yfb='',ptab='cons',rd=null,busy=false;
const rnd=a=>a[Math.floor(Math.random()*a.length)],shuf=a=>[...a].sort(()=>Math.random()-.5),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const canTalk=()=>cfg.voice&&(cfg.engines.length>0||!!SR);
const LABEL={10:'Perfect!',8:'Great!',6:'Good job!',4:'Almost there',2:'Keep trying',0:'Try that one again'};
const draw=(h,after)=>{R(hdr()+'<div class=si id=si>'+h+'</div>','rooms');$('#si').onclick=click;after&&after()};
const hdrSync=()=>{const x=document.querySelector('#app .top .xp'),b=document.querySelector('#app .bar i');if(x)x.textContent=S.xp+' XP';if(b)b.style.width=S.xp%150/1.5+'%'};
const meter=(got,cap)=>`<div class=bar aria-hidden=true><i style="width:${Math.min(100,100*got/cap)}%"></i></div>`;
const tiles=ph=>(ph||[]).map(p=>`<div class="tile ${p.score>=80?'t-good':p.score>=55?'t-mid':'t-bad'}">${esc(p.ipa)}<small>${p.score|0}</small></div>`).join('');
const sayList=a=>{try{speechSynthesis.cancel();a.forEach(w=>{const u=new SpeechSynthesisUtterance(w);u.lang='en-GB';u.rate=.75;speechSynthesis.speak(u)})}catch{}};

// ---- Entry ----
async function open(){
 R(hdr()+'<div class=card><small>Opening Say It!…</small></div>','rooms');
 const c=await api('say/config');
 if(c.error||!c.on){S.say={on:false,voice:false};save();toast('Say It! is not open for your class right now.');return rooms()}
 cfg={...cfg,...c};S.say={on:c.on,voice:c.voice};save();home();
}
function home(){
 DG=null;rd=null;
 const low=!!S.lower,v=cfg.voice,ok=canTalk();
 draw(`<h2>🗣️ Say It!</h2>
 <div class=card><small>${low?'Say words out loud. Learn the sounds that make up words.':'Read words aloud and earn XP for how clearly you say them. Explore every sound in English, then learn word-attack strategies.'}</small></div>
 ${ok?`<div class="card room"><span class=ic>🎤</span><div><b>Read aloud</b><br><small>Say each word. Up to <b>${cfg.cap} XP</b> for each word. Say it better later to top up your XP.</small></div><button data-a=start>Start</button></div>
  <div class=card><small>🔒 When you tap Say it, your voice is sent to a speech-checking service to be scored. Spell Academy does not keep the recording.</small></div>`
 :v?`<div class=card><b>🎤 Read aloud</b><br><small>This device cannot listen to you. Try another device or browser.</small></div>`
 :`<div class=card><b>🔇 Speaking practice is off</b><br><small>${low?'Your teacher has not turned on speaking.':'Your teacher has not switched on speaking practice for your class.'} Everything else here still works.</small></div>`}
 <div class="card room"><span class=ic>🔤</span><div><b>Sound chart</b><br><small>Tap a sound to hear it in a word.</small></div><button data-a=chart>Open</button></div>
 <div class="card room"><span class=ic>🧠</span><div><b>Word attack</b><br><small>Sound games, strategies, syllables and more.</small></div><button data-a=learn>Open</button></div>
 ${v?`<div class="card room"><span class=ic>📊</span><div><b>My words</b><br><small>See how you did on every word.</small></div><button data-a=stats>Open</button></div>`:''}
 <button class="ghost wide" data-a=back>Back to Rooms</button>`);
}

// ---- Scoring: one path for the Read-aloud game and the Word lab ----
async function record(ms,tick){
 const st=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true}});
 const ctx=new(window.AudioContext||window.webkitAudioContext)(),chunks=[];let node;
 try{
  await ctx.resume();const src=ctx.createMediaStreamSource(st),mute=ctx.createGain();mute.gain.value=0;
  if(ctx.audioWorklet&&window.AudioWorkletNode){
   const url=URL.createObjectURL(new Blob(['class R extends AudioWorkletProcessor{process(i){const c=i[0]&&i[0][0];if(c)this.port.postMessage(new Float32Array(c));return true}}registerProcessor("si-rec",R)'],{type:'text/javascript'}));
   try{await ctx.audioWorklet.addModule(url)}finally{URL.revokeObjectURL(url)}
   node=new AudioWorkletNode(ctx,'si-rec');node.port.onmessage=e=>chunks.push(e.data);
  }else{node=ctx.createScriptProcessor(4096,1,1);node.onaudioprocess=e=>chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)))}
  src.connect(node);node.connect(mute);mute.connect(ctx.destination);
  for(let t=Math.ceil(ms/1000);t>0;t--){tick&&tick(t);await sleep(Math.min(1000,ms-(Math.ceil(ms/1000)-t)*1000))}
 }finally{try{node&&node.disconnect()}catch{}st.getTracks().forEach(t=>t.stop());const rate=ctx.sampleRate;await ctx.close().catch(()=>{});record.rate=rate}
 return wav(chunks,record.rate);
}
// Box-filter down to 16 kHz mono 16-bit PCM (what the scoring services expect). Throws if the room was silent, so quiet takes never use a slot.
function wav(ch,rate){
 const n=ch.reduce((a,c)=>a+c.length,0),f=new Float32Array(n);let o=0,pk=0;for(const c of ch){f.set(c,o);o+=c.length}
 for(let i=0;i<n;i++)pk=Math.max(pk,Math.abs(f[i]));
 if(pk<.01)throw{quiet:1};
 const k=rate/16000,m=Math.floor(n/k),b=new DataView(new ArrayBuffer(44+m*2)),w=(p,s)=>[...s].forEach((c,j)=>b.setUint8(p+j,c.charCodeAt(0)));
 w(0,'RIFF');b.setUint32(4,36+m*2,true);w(8,'WAVEfmt ');b.setUint32(16,16,true);b.setUint16(20,1,true);b.setUint16(22,1,true);b.setUint32(24,16000,true);b.setUint32(28,32000,true);b.setUint16(32,2,true);b.setUint16(34,16,true);w(36,'data');b.setUint32(40,m*2,true);
 for(let j=0;j<m;j++){const a=Math.floor(j*k),z=Math.max(a+1,Math.floor((j+1)*k));let s=0;for(let i=a;i<z&&i<n;i++)s+=f[i];s/=(z-a);s=Math.max(-1,Math.min(1,s));b.setInt16(44+j*2,s<0?s*32768:s*32767,true)}
 return b.buffer;
}
function browserListen(ms,tick){return new Promise((res,rej)=>{
 const r=new SR(),alts=[];r.lang='en-GB';r.maxAlternatives=5;r.interimResults=false;
 r.onresult=e=>{const x=e.results[0];for(let i=0;i<x.length;i++)alts.push({transcript:x[i].transcript,confidence:x[i].confidence})};
 r.onerror=ev=>ev.error==='no-speech'?res([]):rej({name:ev.error==='not-allowed'?'NotAllowedError':'Err',msg:ev.error});r.onend=()=>res(alts);
 try{r.start()}catch(e){return rej(e)}
 let t=Math.ceil(ms/1000);tick&&tick(t);const iv=setInterval(()=>{t--;if(t>0)tick&&tick(t)},1000);setTimeout(()=>{clearInterval(iv);try{r.stop()}catch{}},ms)})}
// Returns the Worker's answer {accuracy, pts, gain, got, cap, phonemes, heard, xp, ...}. Throws {msg} with something kind to show.
async function score(word,tick,checking){
 let j;
 try{
  if(cfg.engines.length){
   const body=await record(3000,tick);checking&&checking();
   const r=await fetch('/api/say/score?word='+encodeURIComponent(word),{method:'POST',headers:{authorization:'Bearer '+S.tok},body});
   j=await r.json().catch(()=>({error:'Connection problem. Please try again.'}));
  }else{
   const alts=await browserListen(4000,tick);checking&&checking();
   j=await api('say/heard',{word,alts});
  }
 }catch(e){
  if(e&&e.quiet)throw{msg:'I could not hear anything. Check your microphone and speak up a little.'};
  if(e&&(e.name==='NotAllowedError'||e.name==='SecurityError'))throw{msg:'Please allow the microphone, then try again.'};
  if(e&&e.name==='NotFoundError')throw{msg:'No microphone found on this device.'};
  throw{msg:'I could not listen just now. Check the microphone and try again.'};
 }
 if(j.error){if(j.off){cfg.voice=false;S.say={on:cfg.on,voice:false};save();throw{msg:j.error,off:1}}throw{msg:j.error}}
 S.xp=j.xp;S.modes=j.modes;save();hdrSync();return j;
}
// Wording under a result. XP already earned from a word is never lost, and never earned twice.
function xpLine(j){
 if(j.gain>0){sfx('ok');return `<b class=ok>+${j.gain} XP</b>${j.got>=j.cap?' ⭐ Full XP for this word!':` · ${j.got}/${j.cap} XP from this word`}`}
 if(j.got>=j.cap)return 'Full XP already earned for this word ⭐';
 return `No new XP: you have ${j.got}/${j.cap} from this word. Beat that to earn more.`;
}
const heardLine=j=>j.heard?'I heard "'+esc(j.heard)+'"':'I did not catch a word';

// ---- Read-aloud round ----
async function start(){
 R(hdr()+'<div class=card><small>Choosing your words…</small></div>','rooms');
 const r=await api('say/words?n=10');
 if(r.error||!r.words||!r.words.length){toast(r.error||'No words to read yet.');return home()}
 rd={words:r.words,i:0,gain:0,cap:r.cap||cfg.cap};word();
}
function word(){
 const c=rd.words[rd.i];
 draw(`<div class=prog><span>Word ${rd.i+1} of ${rd.words.length}</span><span class=cmb id=rg>+${rd.gain} XP</span></div>
 <div class="card stage"><div class=siw style="font-size:min(4.5rem,${(130/Math.max(c.w.length,5)).toFixed(1)}vw)">${esc(c.w)}</div>${c.ipa?`<div class="ipa sub">${esc(c.ipa)}</div>`:''}
 <div class=sub style="margin-top:8px">XP from this word: <b id=sgot>${c.got}</b>/${rd.cap}</div>${meter(c.got,rd.cap)}</div>
 <div class=row><button class=ghost data-a=hear>🔊 Listen</button><button id=rec data-a=rec>🎤 Say it</button></div>
 <div class=msg id=msg aria-live=polite></div><div class="sub" id=hd style="min-height:1.4em"></div><div class="tiles ipa" id=tl></div>
 <div class=row><button id=nx class=ghost data-a=next>${rd.i+1<rd.words.length?'Next word ▶':'Finish'}</button></div>
 <button class="ghost wide" data-a=home>Stop for now</button>`);
 $('#nx').style.display='none';
}
async function rec(){
 if(busy)return;busy=true;const c=rd.words[rd.i],b=$('#rec');b.disabled=true;$('#msg').textContent='';
 try{
  const j=await score(c.w,t=>{b.textContent='🎙️ Listening… '+t},()=>{b.textContent='Checking…'});
  c.got=j.got;rd.gain+=j.gain;
  $('#msg').innerHTML=`${LABEL[j.pts]} ${j.accuracy}%<br><small>${xpLine(j)}</small>`;
  $('#hd').textContent=j.heard?'I heard "'+j.heard+'"':'I did not catch a word';
  $('#tl').innerHTML=tiles(j.phonemes);$('#sgot').textContent=j.got;document.querySelector('#si .stage .bar i').style.width=100*j.got/rd.cap+'%';$('#rg').textContent='+'+rd.gain+' XP';
  b.textContent='🎤 Try again';$('#nx').style.display='';
 }catch(e){
  if(e.off){busy=false;toast(e.msg);return home()}
  $('#msg').textContent=e.msg;b.textContent='🎤 Say it';$('#nx').style.display='';
 }
 b.disabled=false;busy=false;
}
function next(){rd.i++;if(rd.i<rd.words.length)return word();
 draw(`<div class="card stage"><h2>Round complete!</h2><div class=big>+${rd.gain} XP</div><p>${rd.gain?'Words you say better later can top up their XP.':'Try the words again to earn XP. Say each word slowly and clearly.'}</p></div>
 <button class="wide big" data-a=start>Play again</button><button class="ghost wide" data-a=stats>My words</button><button class="ghost wide" data-a=home>Back</button>`)}

// ---- My words ----
async function stats(){
 R(hdr()+'<div class=card><small>Loading your words…</small></div>','rooms');
 const r=await api('say/progress');if(r.error){toast(r.error);return home()}
 draw(`<h2>📊 My words</h2><div class=card>${r.words.length?`<table><tr><th align=left>Word</th><th>Best</th><th>XP</th><th>Tries</th></tr>${r.words.map(w=>`<tr><td>${esc(w.word)}</td><td align=center>${w.best}%</td><td align=center>${w.xp}/${r.cap}</td><td align=center>${w.tries}</td></tr>`).join('')}</table><small>Weakest words are first. Say them again to top up your XP.</small>`:'<small>No words yet. Try Read aloud first.</small>'}</div><button class="ghost wide" data-a=home>Back</button>`);
}

// ---- Word attack ----
const sym=x=>{for(const g of['cons','short','long'])for(const y of PH[g])if(y[0]===x)return y;return[x,x,[]]};
const chunkHtml=c=>c.map((x,n)=>`<span class="ck c${n%4}">${esc(x)}</span>`).join('');
const wb=w=>`<button class=ghost data-a=say data-w="${w}">${w}</button>`;
function mk(k){
 if(k==='count'){const[w,p]=rnd(PA);return{say:[w],q:`How many sounds are in "${w}"?`,o:[2,3,4,5].map(n=>({l:String(n),ok:n===p.length})),ex:`${w} = ${p.map(x=>'/'+x+'/').join(' ')}, so ${p.length} sounds.`}}
 if(k==='first'||k==='last'){const[w,p]=rnd(PA),a=k==='first'?p[0]:p[p.length-1];
  return{say:[w],q:`What is the ${k} sound in "${w}"?`,o:shuf([a,...shuf(POOL.filter(x=>x!==a)).slice(0,2)]).map(x=>({l:`<b>${sym(x)[1].split(',')[0]}</b> <span class=ipa>/${x}/</span>`,ok:x===a})),ex:`"${w}" ${k==='first'?'starts':'ends'} with /${a}/.`}}
 if(k==='odd'){const[ws,od]=rnd(ODD);return{say:ws,q:'Which word does NOT start with the same sound as the others?',o:shuf(ws).map(w=>({l:w,ok:w===od})),ex:`"${od}" starts with a different sound.`}}
 if(k==='del'){const[w,a]=rnd(DEL);return{say:[w],q:`Say "${w}". Now take away the first sound. What is left?`,o:shuf([a,...shuf(DEL.map(x=>x[1]).filter(x=>x!==a)).slice(0,2)]).map(x=>({l:x,ok:x===a})),ex:`${w} without its first sound is ${a}.`}}
 if(k==='spell'){const[w,a,ws,why]=rnd(SP);return{say:[w],q:'Which is the correct spelling of the word you hear?',o:shuf([a,...ws]).map(x=>({l:x,ok:x===a})),ex:a+': '+why}}
 const[w,f,t,a]=rnd(CHG);return{say:[w],q:`Say "${w}". Change the ${f} sound to a ${t} sound. What is the new word?`,o:shuf([a,...shuf(CHG.map(x=>x[3]).filter(x=>x!==a)).slice(0,2)]).map(x=>({l:x,ok:x===a})),ex:`${w} with ${t} instead of ${f} is ${a}.`}}
function nextQ(){DG.n++;if(DG.n>6){DG.end=true;return learn()}DG.q=mk(DG.skill==='mix'?rnd(['count','first','last','odd','del','chg']):DG.skill);DG.ans=false;learn()}
function pickAns(i){if(DG.ans)return;DG.ans=true;const q=DG.q,ok=q.o[i].ok;if(ok){DG.score++;sfx('ok')}else sfx('no');
 document.querySelectorAll('#si .opt').forEach((b,n)=>{if(q.o[n].ok)b.classList.add('ok');else if(n===i)b.classList.add('no')});
 $('#fb').textContent=(ok?'Yes! ':'Not quite. ')+q.ex;$('#dnext').style.display='';$('#dnext').textContent=DG.n<6?'Next':'Finish'}
const menuHtml=()=>`<p>Listen to the word, then choose the answer. 6 questions each.</p>`+SK.map(([k,n])=>`<button class="opt" data-a=skill data-k="${k}">${n}</button>`).join('');
const qHtml=()=>`<div class=prog><span>Question ${DG.n} of 6</span><button class=ghost data-a=menu>Skills</button></div>
<div class=card><p><b>${DG.q.q}</b></p><button class=ghost data-a=hear2>🔊 Hear it</button></div>
${DG.q.o.map((o,n)=>`<button class="opt" data-a=pick data-i="${n}">${o.l}</button>`).join('')}
<div class=msg id=fb aria-live=polite></div><div class=row><button id=dnext data-a=dnext style="display:none">Next</button></div>`;
const endHtml=()=>`<div class=card><h3>Nice work!</h3><p>You got ${DG.score} of 6.</p></div><div class=row><button data-a=again>Play again</button><button class=ghost data-a=menu>Pick a skill</button></div>`;
const stratHtml=()=>STRAT.map(([n,d,w,c],k)=>`<div class=card><h3>${k+1}. ${n}</h3><p>${d}</p>${c.length?`<div>${chunkHtml(c)}</div><button class=ghost data-a=lab data-w="${w}">Practise in Word lab</button>`:''}</div>`).join('');
const labHtml=()=>`<div class=prog><span>Word ${li+1} of ${L.length}</span></div><div class="card stage"><div class=siw style="font-size:min(4.5rem,${(130/Math.max(L[li][0].length,5)).toFixed(1)}vw)">${L[li][0]}</div><div class=sub>Look for parts you know, pick a strategy, then say the word.</div></div>
<div class=row><button class=ghost data-a=chunks>Show chunks</button>${canTalk()?'<button id=lrec data-a=lsay>🎤 Say it</button>':''}<button class=ghost data-a=lhear>🔊 Hear it</button></div>
${canTalk()?'':'<div class=card><small>🔇 Speaking practice is off for your class, so you can look and listen only.</small></div>'}
<div id=lch class=center></div><div class=msg id=lmsg aria-live=polite></div><div class="tiles ipa" id=ltl></div>
<div class=row><button class=ghost data-a=lprev>◀ Previous</button><button data-a=lnext>Next word ▶</button></div>`;
async function labSay(){
 if(busy)return;busy=true;const b=$('#lrec');b.disabled=true;$('#lmsg').textContent='';
 try{const j=await score(L[li][0],t=>{b.textContent='🎙️ Listening… '+t},()=>{b.textContent='Checking…'});
  $('#lmsg').innerHTML=`${LABEL[j.pts]} ${j.accuracy}% · ${heardLine(j)}<br><small>${xpLine(j)}</small>`;$('#ltl').innerHTML=tiles(j.phonemes)}
 catch(e){if(e.off){busy=false;toast(e.msg);return home()}$('#lmsg').textContent=e.msg}
 b.disabled=false;b.textContent='🎤 Say it';busy=false;
}
const soundsHtml=()=>`<div class=card><h3>Phone</h3><p>Any real speech sound you can make or hear. Every small difference in how you say a sound is a different phone.</p></div>
<div class=card><h3>Phoneme</h3><p>The smallest sound that changes a word. Swap /p/ for /b/ and <i>pin</i> becomes <i>bin</i>. Phonemes go between slashes, like /p/.</p></div>
<div class=card><h3>One phoneme, many phones</h3><p>The /p/ in <i>pin</i> has a puff of air, but the /p/ in <i>spin</i> does not. They are two phones but one phoneme, because swapping them never changes a word. Accents work the same way: a speaker who says /θ/ as /t/ or /f/ is often still understood.</p></div>
<div class=card><h3>Letters are not sounds</h3><p>A <b>grapheme</b> is the letter or letters that spell one phoneme. Tap a word to hear it.</p>
<table><tr><th align=left>Word</th><th>Letters</th><th align=left>Sounds</th></tr><tr><td>${wb('cat')}</td><td align=center>3</td><td>3</td></tr><tr><td>${wb('ship')}</td><td align=center>4</td><td>3 (sh, i, p)</td></tr><tr><td>${wb('box')}</td><td align=center>3</td><td>4 (b, o, k, s)</td></tr><tr><td>${wb('chair')}</td><td align=center>5</td><td>2 (ch, air)</td></tr><tr><td>${wb('light')}</td><td align=center>5</td><td>3 (l, igh, t)</td></tr></table></div>
<div class=card><h3>Phonemic awareness</h3><p>Hearing and playing with the sounds in spoken words, with no letters needed. Phonics then links those sounds to letters. Practise counting, first and last sounds, odd one out, taking away and changing sounds in <b>Sound games</b>, and blending and segmenting in the <b>Word lab</b>.</p></div>
<div class=card><small>British English has about 44 phonemes: 24 consonants and 20 vowels. They are all in the Sound chart.</small></div>`;
const spellHtml=()=>`<div class=card><h3>How it all connects</h3><p>1. <b>Phonemic awareness:</b> hear the separate sounds in a word.<br>2. <b>Phonics:</b> match sounds to letters. Reading turns letters into sounds (decoding). Spelling turns sounds into letters (encoding).<br>3. <b>Syllables:</b> chunk the word into beats, each built around one vowel sound.<br>4. <b>Meaning parts:</b> prefixes, base words and suffixes keep spelling steady.<br>5. <b>Check:</b> does it look right?</p></div>
<div class=card style="overflow-x:auto"><h3>One word, four layers</h3><table><tr><th align=left>Word</th><th align=left>Sounds</th><th align=left>Letters per sound</th><th align=left>Syllables</th><th align=left>Meaning parts</th></tr>
<tr><td>${wb('rabbits')}</td><td>/r æ b ɪ t s/ (6)</td><td>r a bb i t s</td><td>rab-bits</td><td>rabbit + s</td></tr>
<tr><td>${wb('unkind')}</td><td>/ʌ n k aɪ n d/ (6)</td><td>u n k i n d</td><td>un-kind</td><td>un + kind</td></tr>
<tr><td>${wb('jumped')}</td><td>/dʒ ʌ m p t/ (5)</td><td>j u m p ed</td><td>jumped</td><td>jump + ed</td></tr>
<tr><td>${wb('light')}</td><td>/l aɪ t/ (3)</td><td>l igh t</td><td>light</td><td>light</td></tr></table></div>
<div class=card><h3>Spell by sound first</h3><p>You can't spell a sound you can't hear. Say the word slowly, count the sounds, write one grapheme for each, then check the pattern and the meaning parts.</p></div>
<div class=card><h3>Why English is tricky</h3><p>About 44 sounds share 26 letters. One sound has many spellings (/eɪ/ in <i>cake, rain, day, eight</i>) and one spelling has many sounds (<i>ea</i> in <i>eat, bread, great</i>). Many words were borrowed from French, Latin and Greek, and spellings were fixed by printing while pronunciation kept changing. The k in <i>knight</i> was once said aloud.</p></div>
<div class=card><h3>Patterns that help</h3><p>These are strong defaults, not laws, and each has exceptions.<br>
• <b>ai</b> in the middle, <b>ay</b> at the end: rain, day<br>
• <b>ck, tch, dge</b> after a short vowel; <b>k, ch, ge</b> after a long vowel or consonant: duck, catch, bridge / milk, lunch, page<br>
• <b>c</b> says /s/ before e, i, y (city); use <b>k</b> for /k/ before e and i (kit, kite)<br>
• Double <b>f, l, s, z</b> after a short vowel in a short word: stuff, bell, miss, buzz<br>
• Silent <b>e</b> makes the vowel long: cap, cape<br>
• Adding endings: <b>double</b> the last consonant for one short vowel (hop, hopping), <b>drop</b> the e (make, making), change <b>y to i</b> (happy, happiness)</p></div>
<div class=card><h3>Meaning beats sound</h3><p>The past-tense ending sounds like /t/, /d/ or /ɪd/ (<i>jumped, played, wanted</i>) but is always spelled <b>-ed</b>. The plural sounds like /s/ or /z/ (<i>cats, dogs</i>) but is spelled <b>-s</b>.</p></div>
<button class=wide data-a=squiz>Try the spelling quiz</button>`;
const sylHtml=()=>`<div class=card><h3>What is a syllable?</h3><p>A beat of speech built around <b>one vowel sound</b>. Clap it: rab-bit (2), ba-na-na (3). Count vowel <i>sounds</i>, not vowel letters: <i>cake</i> has two vowel letters but one beat. Syllable awareness sits above phonemic awareness: sentences, words, syllables, onset and rime, then single phonemes.</p></div>
<div class=card><h3>Inside a syllable</h3><p>Take <i>strap</i>: <span class="ck c0">str</span><span class="ck c1">a</span><span class="ck c2">p</span><br><b>Onset</b> = consonants before the vowel. <b>Nucleus</b> = the vowel sound. <b>Coda</b> = consonants after. <b>Rime</b> = nucleus + coda, which is the word family (-ap: cap, map, strap).</p></div>
<div class=card style="overflow-x:auto"><h3>Six syllable types</h3><table><tr><th align=left>Type</th><th align=left>Clue</th><th align=left>Examples</th></tr>
<tr><td>Closed</td><td>ends in a consonant, short vowel</td><td>${wb('cat')} rab-bit</td></tr>
<tr><td>Open</td><td>ends in a vowel, long vowel</td><td>${wb('go')} ro-bot</td></tr>
<tr><td>Vowel-consonant-e</td><td>silent e, long vowel</td><td>${wb('cake')} com-plete</td></tr>
<tr><td>Vowel team</td><td>two letters, one sound</td><td>${wb('rain')} ${wb('boat')}</td></tr>
<tr><td>R-controlled</td><td>r changes the vowel</td><td>${wb('car')} ${wb('bird')}</td></tr>
<tr><td>Consonant-le</td><td>a final stable chunk</td><td>ta-ble lit-tle</td></tr></table></div>
<div class=card><h3>Where to split</h3><p>• <b>VC/CV</b>: split between two consonants: rab|bit, nap|kin<br>• <b>V/CV</b>: one consonant, split before it (open, long vowel): ro|bot, mu|sic<br>• <b>VC/V</b>: if that sounds wrong, split after it (closed, short vowel): cab|in, lem|on<br>• <b>Consonant-le</b> stays together: ta|ble<br>• Keep digraphs together (sh, ch, th, ph, ck): fa|ther<br>• Split compounds, prefixes and suffixes: cup|board, un|kind, play|ing</p></div>
<div class=card><h3>Syllables and spelling</h3><p>• <b>Double letters mark a short vowel:</b> <i>diner</i> (di-ner, long i) vs <i>dinner</i> (din-ner, short i); <i>later</i> vs <i>latter</i>; <i>hoping</i> vs <i>hopping</i>.<br>• <b>Unstressed syllables shrink to the schwa /ə/:</b> the last sounds of <i>banana</i> and <i>teacher</i> are the same sound with different spellings, so use meaning parts and memory.<br>• Dictionary breaks are for printing and can differ from these reading rules.</p></div>
<button class=wide data-a=ygo>Try Split it</button>`;
const chunksOf=(w,sp)=>{const r=[];let a=0;for(const b of[...sp,w.length]){r.push(w.slice(a,b));a=b}return r};
function ycheck(){const[w,sp,why]=SY[yi],ok=[...ys].sort((a,b)=>a-b).join()===sp.join();yans=true;
 yfb=(ok?'Yes! ':'Not quite. ')+chunkHtml(chunksOf(w,sp))+'<div style="font-size:.85em">'+why+'</div>';sfx(ok?'ok':'no');learn()}
const splitHtml=()=>{const[w]=SY[yi];
 const row=[...w].map((c,n)=>`<span class=lt>${esc(c)}</span>`+(n<w.length-1?`<button class="gap${ys.has(n+1)?' on':''}" data-a=gap data-n="${n+1}" aria-label="Split after ${c}" aria-pressed="${ys.has(n+1)}"></button>`:'')).join('');
 return `<div class=prog><span>Word ${yi+1} of ${SY.length}</span></div><div class=card><p>Clap the beats, then tap between letters to split the word into syllables.</p>
 <div class=split>${row}</div><div class=row><button class=ghost data-a=yhear>🔊 Hear it</button><button data-a=ycheck${yans?' disabled':''}>Check</button></div>
 <div class=msg aria-live=polite>${yfb}</div><div class=row>${yans?'<button data-a=ynext>Next word ▶</button>':''}</div></div>`};
function learn(){
 const tabs=LT.map(([k,n])=>`<button class="${k===lt?'':'ghost'}" data-a=tab data-k="${k}">${n}</button>`).join('');
 const body=lt==='s'?soundsHtml():lt==='d'?(DG?(DG.end?endHtml():qHtml()):menuHtml()):lt==='t'?stratHtml():lt==='w'?labHtml():lt==='p'?spellHtml():lt==='y'?sylHtml():splitHtml();
 draw(`<h2>🧠 Word attack</h2><div class=chips>${tabs}</div>${body}<button class="ghost wide" data-a=home>Back</button>`);
 if(DG&&lt==='d'&&!DG.end&&DG.ans)document.querySelectorAll('#si .opt').forEach(b=>b.disabled=true);
}

// ---- Sound chart: [IPA, common spellings, example words] (British English) ----
function chart(){
 const tabs=TABS.map(([k,n])=>`<button class="${k===ptab?'':'ghost'}" data-a=ptab data-k="${k}">${n}</button>`).join('');
 const hint=ptab==='long'?'Long vowels include the sounds that say their letter name, plus gliding vowels.':ptab==='short'?'Short vowels are quick sounds, like the "a" in cat.':'Pick a sound to start.';
 draw(`<h2>🔤 Sound chart</h2><div class=card><small>Tap a sound to hear an example word. Tap the words to hear them again.</small></div><div class=chips>${tabs}</div>
 <div class="phg ${ptab}">${PH[ptab].map((x,j)=>`<button class=ph data-a=psound data-i="${j}" aria-label="${x[0]} as in ${x[2][0]}"><span class="sym ipa">${x[0]}</span><span class=sp>${x[1]}</span></button>`).join('')}</div>
 <div class="detail card center" id=pd>${esc(hint)}</div><button class="ghost wide" data-a=home>Back</button>`);
}
const pdetail=x=>`<div class="big ipa">/${x[0]}/</div><div>Spelled: <b>${esc(x[1])}</b></div><div class=row>${x[2].map(w=>`<button class=ghost data-a=say data-w="${w}">${w}</button>`).join('')}</div>`;

// ---- One click handler for every screen ----
function click(e){
 const b=e.target.closest('[data-a]');if(!b||b.disabled)return;const a=b.dataset.a,d=b.dataset;
 if(a==='back'){try{speechSynthesis.cancel()}catch{}return rooms()}
 if(a==='home'){try{speechSynthesis.cancel()}catch{}return home()}
 if(a==='start')return start();if(a==='rec')return rec();if(a==='next')return next();if(a==='stats')return stats();
 if(a==='hear')return say(rd.words[rd.i].w,.7);
 if(a==='learn'){lt='s';return learn()}
 if(a==='chart'){ptab='cons';return chart()}
 if(a==='ptab'){ptab=d.k;return chart()}
 if(a==='psound'){const j=+d.i,x=PH[ptab][j];document.querySelectorAll('#si .ph').forEach((q,n)=>q.classList.toggle('sel',n===j));$('#pd').innerHTML=pdetail(x);return say(x[2][0],.7)}
 if(a==='tab'){lt=d.k;return learn()}
 if(a==='skill'){DG={skill:d.k,n:0,score:0};return nextQ()}
 if(a==='again'){DG={skill:DG.skill,n:0,score:0};return nextQ()}
 if(a==='menu'){DG=null;return learn()}
 if(a==='hear2')return sayList(DG.q.say);
 if(a==='pick')return pickAns(+d.i);
 if(a==='dnext')return nextQ();
 if(a==='say')return say(d.w,.7);
 if(a==='lab'){lt='w';li=Math.max(0,L.findIndex(x=>x[0]===d.w));return learn()}
 if(a==='chunks'){$('#lch').innerHTML=chunkHtml(L[li][1])+`<p>Strategy: <b>${STRAT[L[li][2]][0]}</b></p>`;return}
 if(a==='lsay')return labSay();
 if(a==='squiz'){DG={skill:'spell',n:0,score:0};lt='d';return nextQ()}
 if(a==='ygo'){lt='x';return learn()}
 if(a==='gap'){if(!yans){const n=+d.n;ys.has(n)?ys.delete(n):ys.add(n);learn()}return}
 if(a==='yhear')return say(SY[yi][0],.7);
 if(a==='ycheck')return ycheck();
 if(a==='ynext'){yi=(yi+1)%SY.length;ys=new Set();yans=false;yfb='';return learn()}
 if(a==='lhear')return say(L[li][0],.7);
 if(a==='lprev'||a==='lnext'){li=(li+(a==='lnext'?1:L.length-1))%L.length;return learn()}
}
return{open,home};
})();
