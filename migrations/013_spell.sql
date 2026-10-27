-- v2.9: each pupil's chosen active spell (0 = always the newest one they have learned). Run once in the D1 Console, BEFORE deploying v2.9.
alter table students add column spell integer default 0;
