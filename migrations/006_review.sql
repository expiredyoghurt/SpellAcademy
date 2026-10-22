-- Only needed if you already deployed an earlier version.
alter table lists add column shared text default '[]';
alter table lists add column declined text default '[]';
