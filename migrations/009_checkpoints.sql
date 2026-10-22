-- v2.2: dungeon checkpoints. Run once in the D1 Console, BEFORE deploying v2.2 (existing databases only; fresh installs already get these columns from schema.sql).
alter table runs add column peak integer default 0;
alter table runs add column deaths integer default 0;
