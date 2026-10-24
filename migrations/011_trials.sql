-- v2.5: Trials of the Archmage (teacher-scheduled, server-judged word sets). Run once in the D1 Console, BEFORE deploying v2.5.
-- Existing databases only; fresh installs already get these from schema.sql.
create table if not exists trials(id integer primary key autoincrement,code text,owner integer,title text,words text,format text default 'hear',opens integer,closes integer,reveal text default 'finish',base integer,ts integer default (unixepoch()));
create index if not exists tr_c on trials(code);
create table if not exists trial_runs(id integer primary key autoincrement,trial_id integer,student_id integer,cur text,i integer default 0,score integer default 0,n integer default 0,status text default 'active',started integer default (unixepoch()),finished integer);
create unique index if not exists trr_u on trial_runs(trial_id,student_id);
create index if not exists trr_s on trial_runs(student_id);
create table if not exists trial_answers(run_id integer,idx integer,word text,kind text,ans text,ok integer,ms integer,etype text,primary key(run_id,idx));
