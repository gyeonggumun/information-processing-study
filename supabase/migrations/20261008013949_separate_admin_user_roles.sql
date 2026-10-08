-- App roles are separate from Supabase's database/JWT role (authenticated).
-- Look up the verified Google account on every call so users cannot grant themselves admin.
create or replace function private.current_app_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case when exists (
    select 1
    from auth.users as account
    where account.id = (select auth.uid())
      and lower(account.email) = 'lion989072@gmail.com'
      and account.email_confirmed_at is not null
      and exists (
        select 1 from auth.identities as linked_identity
        where linked_identity.user_id = account.id
          and linked_identity.provider = 'google'
      )
  ) then 'admin' else 'user' end;
$$;

revoke all on function private.current_app_role() from public, anon;
grant execute on function private.current_app_role() to authenticated;

create or replace function public.get_my_app_role()
returns text
language sql
stable
set search_path = ''
as $$
  select private.current_app_role();
$$;

revoke all on function public.get_my_app_role() from public, anon;
grant execute on function public.get_my_app_role() to authenticated;
