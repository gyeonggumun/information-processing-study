create table public.practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  practice_type text not null check (practice_type in ('exam', 'C', 'Java', 'Python')),
  question_id text not null,
  is_correct boolean not null,
  created_at timestamptz not null default now()
);

create index practice_attempts_user_created_at_idx
  on public.practice_attempts (user_id, created_at desc);

alter table public.practice_attempts enable row level security;

grant usage on schema public to authenticated;
grant select, insert on public.practice_attempts to authenticated;

create policy "Users can read their own practice attempts"
on public.practice_attempts
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own practice attempts"
on public.practice_attempts
for insert
to authenticated
with check ((select auth.uid()) = user_id);
