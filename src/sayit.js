// Say It! (v4.4): speech scoring engines, the XP rule and the per-class switches. Routes live in worker.js.
import {scoreText} from '../public/textscore.js';
import SayData from '../public/sayit-data.js';

// ---- XP rule (change here) ----
export const SAY_CAP=10;        // the most XP a pupil can ever earn from recording one word
export const SAY_DAILY=60;      // voice submissions per pupil per rolling 24 hours (limits engine cost)
export const SAY_GAP=2;         // seconds between submissions from one pupil
export const SAY_MAXBYTES=400000; // 3 s of 16 kHz mono 16-bit WAV is about 96 KB
// Accuracy band -> XP for ONE recording. The pupil is paid the difference between this and what they have already earned on the word.
// Bands are first guesses: calibrate them with real pupil recordings (README, "Say It!").
export const sayTier=acc=>acc>=90?10:acc>=80?8:acc>=65?6:acc>=50?4:acc>=25?2:0;

// ---- Per-class switches (classes.settings.say). on: the room exists at all. voice: pupil recordings may be sent to a scoring service and logged. ----
// Defaults: on = true, voice = false. A class whose teacher has never opened the setting gets the no-microphone content only.
export const sayCfg=set=>{const s=(set&&set.say)||{},on=s.on!==false;return{on,voice:on&&s.voice===true}};

// Words that may earn XP besides the class's own word bank: the Say It! starter set and the Word lab words.
export const SAY_EXTRA=new Set([...SayData.WORDS.map(x=>x[0]),...SayData.L.map(x=>x[0])].map(w=>w.toLowerCase()));

// ---- Engines ----
const ORDER=['azure','google','whisper'];
export const engines=env=>ORDER.filter(e=>e==='azure'?env.AZURE_SPEECH_KEY&&env.AZURE_REGION:e==='google'?env.GOOGLE_STT_KEY:env.AI);
export async function runEngine(name,audio,word,env){return {azure,google,whisper}[name](audio,word,env)}

async function azure(audio,word,env){
 const cfg=btoa(JSON.stringify({ReferenceText:word,GradingSystem:'HundredMark',Granularity:'Phoneme',Dimension:'Comprehensive',PhonemeAlphabet:'IPA',EnableMiscue:true}));
 const r=await fetch(`https://${env.AZURE_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${env.SPEECH_LANG||'en-GB'}&format=detailed`,{method:'POST',headers:{'Ocp-Apim-Subscription-Key':env.AZURE_SPEECH_KEY,'Content-Type':'audio/wav; codecs=audio/pcm; samplerate=16000','Pronunciation-Assessment':cfg,Accept:'application/json'},body:audio});
 if(!r.ok)throw new Error('azure '+r.status);
 const nb=(await r.json()).NBest?.[0];
 if(!nb)return{accuracy:0,phonemes:[],heard:''};
 const phonemes=(nb.Words||[]).flatMap(w=>(w.Phonemes||[]).map(x=>({ipa:x.Phoneme,score:Math.round(x.PronunciationAssessment?.AccuracyScore??0)})));
 return{accuracy:Math.round(nb.PronunciationAssessment?.AccuracyScore??0),phonemes,heard:nb.Display||''};
}
async function google(audio,word,env){
 const r=await fetch('https://speech.googleapis.com/v1/speech:recognize?key='+env.GOOGLE_STT_KEY,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({config:{encoding:'LINEAR16',sampleRateHertz:16000,languageCode:env.GOOGLE_LANG||'en-SG',maxAlternatives:5},audio:{content:b64(audio)}})});
 if(!r.ok)throw new Error('google '+r.status);
 return{phonemes:[],...scoreText(word,(await r.json()).results?.[0]?.alternatives||[])};
}
async function whisper(audio,word,env){
 const out=await env.AI.run('@cf/openai/whisper-large-v3-turbo',{audio:b64(audio),language:'en'});
 return{phonemes:[],...scoreText(word,[{transcript:out.text||''}])};
}
function b64(buf){const u=new Uint8Array(buf);let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s)}

// Browser speech recognition runs on the pupil's device; only the recognised text reaches the Worker, which scores it here.
export function scoreHeard(word,alts){
 const a=(Array.isArray(alts)?alts:[]).slice(0,5).map(x=>({transcript:String((x&&x.transcript)||'').slice(0,60),confidence:typeof(x&&x.confidence)==='number'&&x.confidence>=0&&x.confidence<=1?x.confidence:undefined}));
 return{phonemes:[],...scoreText(word,a)};
}
