create table if not exists teachers(id integer primary key autoincrement,user text unique,salt text,hash text);
create table if not exists classes(code text primary key,name text,teacher_id integer,settings text default '{}');
create table if not exists students(id integer primary key autoincrement,name text collate nocase,code text,xp integer default 0,spell integer default 0,unique(name,code));
create table if not exists lists(id integer primary key autoincrement,code text,name text,words text,owner integer,levels text default '[]',shared text default '[]',declined text default '[]');
create table if not exists attempts(id integer primary key autoincrement,student_id integer,mode text,word text,ok integer,tries integer,ms integer,xp integer,ts integer default (unixepoch()),ans text,etype text);
create index if not exists a_s on attempts(student_id);
create table if not exists runs(id integer primary key autoincrement,student_id integer,hearts integer,correct integer,cur text,status text default 'active',peak integer default 0,deaths integer default 0,ts integer default (unixepoch()));
create table if not exists class_lists(code text,list text,primary key(code,list));
create table if not exists badges(student_id integer,badge text,ts integer default (unixepoch()),primary key(student_id,badge));
create index if not exists a_st on attempts(student_id,ts);
create table if not exists duel_wins(id integer primary key autoincrement,student_id integer,room text,ts integer default (unixepoch()));
create index if not exists dw_s on duel_wins(student_id);
create table if not exists word_state(student_id integer,word text,box integer default 0,due integer default 0,lapses integer default 0,n integer default 0,upd integer default 0,nxt integer default 0,lastok integer default 1,primary key(student_id,word));
create index if not exists ws_due on word_state(student_id,due);
create table if not exists trials(id integer primary key autoincrement,code text,owner integer,title text,words text,format text default 'hear',opens integer,closes integer,reveal text default 'finish',base integer,ts integer default (unixepoch()));
create index if not exists tr_c on trials(code);
create table if not exists trial_runs(id integer primary key autoincrement,trial_id integer,student_id integer,cur text,i integer default 0,score integer default 0,n integer default 0,status text default 'active',started integer default (unixepoch()),finished integer);
create unique index if not exists trr_u on trial_runs(trial_id,student_id);
create index if not exists trr_s on trial_runs(student_id);
create table if not exists trial_answers(run_id integer,idx integer,word text,kind text,ans text,ok integer,ms integer,etype text,primary key(run_id,idx));

-- v3.0 Spellcraft Lessons
create table if not exists lesson_state(student_id integer,lesson text,stages integer default 0,upd integer default 0,primary key(student_id,lesson));
create table if not exists lesson_attempts(id integer primary key autoincrement,student_id integer,lesson text,stage text,kind text,item text,ok integer,hints integer default 0,ans text,etype text,ts integer default (unixepoch()));
create index if not exists la_s on lesson_attempts(student_id,lesson);
create table if not exists lesson_runs(id integer primary key autoincrement,student_id integer,lesson text,stage text,cur text,i integer default 0,score integer default 0,n integer default 0,status text default 'active',ts integer default (unixepoch()));
create index if not exists lr_s on lesson_runs(student_id);

-- v4.4 Say It! 
-- speech_best holds what each pupil has earned from each word (XP is capped per word); speech_attempts logs every voice submission (no audio, no transcript).
create table if not exists speech_best(student_id integer,word text,xp integer default 0,best integer default 0,tries integer default 0,upd integer default 0,primary key(student_id,word));
create table if not exists speech_attempts(id integer primary key autoincrement,student_id integer,word text,engine text,accuracy integer default 0,phonemes text,xp integer default 0,ts integer default (unixepoch()));
create index if not exists sa_s on speech_attempts(student_id,ts);
