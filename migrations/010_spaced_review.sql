-- v2.3: spaced review (word_state) and error types (attempts.etype). Run once in the D1 Console, BEFORE deploying v2.3.
-- Existing databases only; fresh installs already get these from schema.sql.
-- No data copy is needed: each pupil's word_state is built automatically from their old attempts the first time they play or are viewed.
create table if not exists word_state(student_id integer,word text,box integer default 0,due integer default 0,lapses integer default 0,n integer default 0,upd integer default 0,primary key(student_id,word));
create index if not exists ws_due on word_state(student_id,due);
alter table attempts add column etype text;
