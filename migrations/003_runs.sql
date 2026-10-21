-- Only needed if you already deployed an earlier version.
create table if not exists runs(id integer primary key autoincrement,student_id integer,hearts integer,correct integer,cur text,status text default 'active',ts integer default (unixepoch()));
