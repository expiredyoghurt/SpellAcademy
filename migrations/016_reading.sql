-- v4.5 Say It! "Learn to read" path. Run once in the D1 Console BEFORE deploying (safe to re-run: every statement is "if not exists").
-- rd_prof: one row per pupil (avatar, sound sequence, how many sounds are taught, parent consent for voice). rd_state: mastery per sound / word / sentence.
-- rd_log: what was practised, for the parent summary. No audio and no transcript is stored anywhere.
create table if not exists rd_prof(student_id integer primary key,avatar text default '🦊',seq text default 'jolly',taught integer default 0,consent integer default 0,sessions integer default 0,newday integer default 0,newid text default '',upd integer default 0);
create table if not exists rd_state(student_id integer,kind text,key text,h text default '[]',d text default '[]',box integer default 0,due integer default 0,upd integer default 0,primary key(student_id,kind,key));
create table if not exists rd_log(id integer primary key autoincrement,student_id integer,act text,kind text,key text,ok integer default 0,assist integer default 0,day integer default 0,ts integer default (unixepoch()));
create index if not exists rl_s on rd_log(student_id,day);
