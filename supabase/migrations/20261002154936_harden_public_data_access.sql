revoke all on table public.practice_attempts from anon, authenticated;
grant select, insert on table public.practice_attempts to authenticated;

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;
