create table public.study_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id text not null,
  material_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, material_id)
);

create index study_favorites_user_created_at_idx
  on public.study_favorites (user_id, created_at desc);

alter table public.study_favorites enable row level security;

revoke all on table public.study_favorites from anon, authenticated;
grant select, insert, delete on table public.study_favorites to authenticated;

create policy "Users can read their own study favorites"
on public.study_favorites
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own study favorites"
on public.study_favorites
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own study favorites"
on public.study_favorites
for delete
to authenticated
using ((select auth.uid()) = user_id);
