-- Only needed if you already deployed v1. Fresh installs use schema.sql.
alter table classes add column settings text default '{}';
