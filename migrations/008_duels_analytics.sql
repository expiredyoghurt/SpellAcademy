-- Phase 3 (v2.1): server-checked duels and wrong-spelling analytics. Run once in the D1 Console, BEFORE deploying v2.1.
create table if not exists duel_wins(id integer primary key autoincrement,student_id integer,room text,ts integer default (unixepoch()));
create index if not exists dw_s on duel_wins(student_id);
alter table attempts add column ans text;
