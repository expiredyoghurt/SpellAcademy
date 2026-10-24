-- v2.6: second-level cool-downs. nxt = unix time a word may next be practised; lastok = 0 when the latest answer was a miss.
alter table word_state add column nxt integer default 0;
alter table word_state add column lastok integer default 1;
update word_state set nxt=due*86400-28800;
