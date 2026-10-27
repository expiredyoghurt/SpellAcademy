-- v3.0 Spellcraft Lessons. Run once in the D1 Console BEFORE deploying (safe to re-run: every statement is "if not exists").
create table if not exists lesson_state(student_id integer,lesson text,stages integer default 0,upd integer default 0,primary key(student_id,lesson));
create table if not exists lesson_attempts(id integer primary key autoincrement,student_id integer,lesson text,stage text,kind text,item text,ok integer,hints integer default 0,ans text,etype text,ts integer default (unixepoch()));
create index if not exists la_s on lesson_attempts(student_id,lesson);
create table if not exists lesson_runs(id integer primary key autoincrement,student_id integer,lesson text,stage text,cur text,i integer default 0,score integer default 0,n integer default 0,status text default 'active',ts integer default (unixepoch()));
create index if not exists lr_s on lesson_runs(student_id);
