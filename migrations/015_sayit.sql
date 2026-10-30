-- v4.4 Say It! Run once in the D1 Console BEFORE deploying (safe to re-run: every statement is "if not exists").
-- speech_best holds what each pupil has earned from each word (XP is capped per word); speech_attempts logs every voice submission (no audio, no transcript).
create table if not exists speech_best(student_id integer,word text,xp integer default 0,best integer default 0,tries integer default 0,upd integer default 0,primary key(student_id,word));
create table if not exists speech_attempts(id integer primary key autoincrement,student_id integer,word text,engine text,accuracy integer default 0,phonemes text,xp integer default 0,ts integer default (unixepoch()));
create index if not exists sa_s on speech_attempts(student_id,ts);
