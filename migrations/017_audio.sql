-- v4.6 Say It! recorded sounds and voice-overs, saved from Admin > Audio. Run once in the D1 Console BEFORE deploying (safe to re-run).
-- kind: sounds | vo | words. key: the sound id, voice-over key or word. b64: the WAV file, base64 (about 30 to 350 KB).
create table if not exists audio_clips(kind text,key text,type text default 'audio/wav',b64 text,bytes integer default 0,upd integer default 0,primary key(kind,key));
