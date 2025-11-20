insert into profiles (email, username, avatar_url)
values
('alice@flipperagents.com', 'AliceFlipz', 'https://i.pravatar.cc/150?img=1'),
('bob@flipperagents.com', 'BobDeals', 'https://i.pravatar.cc/150?img=2')
on conflict (email) do nothing;
insert into flips (user_id, title, buy, sell, yield_pct, category)
select id, 'MacBook Pro M3', 950, 1350, 42.1, 'Electronics' from profiles where username='AliceFlipz'
union all
select id, 'Jordan 1 Retro High', 180, 320, 77.8, 'Sneakers' from profiles where username='BobDeals';
insert into wins (flip_id, platform)
select id, 'discord' from flips;
