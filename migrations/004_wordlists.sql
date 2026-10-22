-- Only needed if you already deployed an earlier version.
alter table lists add column owner integer;
update lists set owner=(select teacher_id from classes where classes.code=lists.code);
create table if not exists class_lists(code text,list text,primary key(code,list));
insert or ignore into class_lists(code,list) select code,'c'||id from lists where code is not null;
