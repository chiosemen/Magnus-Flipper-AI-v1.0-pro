# README_DB.md — Supabase
1) Create project → copy Project URL + anon key.
2) Run schema.sql then seed.sql in SQL Editor.
3) RLS:
```sql
create policy "Users can view their own profile" on profiles for select using (auth.uid() = id);
create policy "Users manage their flips" on flips for all using (auth.uid() = user_id);
create policy "Everyone can view wins" on wins for select using (true);
```
