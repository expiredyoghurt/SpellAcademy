-- Phase 2: badges, plus an index for streak and spellbook queries. Run once in the D1 Console.
create table if not exists badges(student_id integer,badge text,ts integer default (unixepoch()),primary key(student_id,badge));
create index if not exists a_st on attempts(student_id,ts);
