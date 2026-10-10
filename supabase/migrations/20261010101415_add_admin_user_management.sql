-- Sensitive admin actions also require a currently existing Auth session.
create or replace function private.can_manage_users()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.current_app_role() = 'admin'
    and exists (
      select 1 from auth.sessions as active_session
      where active_session.id = nullif(auth.jwt() ->> 'session_id', '')::uuid
        and active_session.user_id = (select auth.uid())
    );
$$;

revoke all on function private.can_manage_users() from public, anon;
grant execute on function private.can_manage_users() to authenticated;

create or replace function public.can_manage_users()
returns boolean
language sql
stable
set search_path = ''
as $$
  select private.can_manage_users();
$$;

revoke all on function public.can_manage_users() from public, anon;
grant execute on function public.can_manage_users() to authenticated;

create or replace function private.list_managed_users(
  p_search text,
  p_before_created_at timestamptz,
  p_before_user_id uuid
)
returns table (
  user_id uuid,
  email text,
  nickname text,
  created_at timestamptz,
  last_active_at timestamptz,
  deletion_scheduled_for timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  search_term text := lower(btrim(coalesce(p_search, '')));
begin
  if not private.can_manage_users() then
    raise exception using errcode = '42501', message = 'Admin access required';
  end if;
  if char_length(search_term) > 100
    or (p_before_created_at is null) <> (p_before_user_id is null) then
    raise exception using errcode = '22023', message = 'Invalid search or cursor';
  end if;

  return query
  select account.id, account.email::text, profile.nickname,
         account.created_at, activity.last_active_at, profile.deletion_scheduled_for
  from auth.users as account
  left join public.profiles as profile on profile.user_id = account.id
  left join private.account_activity as activity on activity.user_id = account.id
  where (
    search_term = ''
    or position(search_term in lower(coalesce(account.email, ''))) > 0
    or position(search_term in lower(coalesce(profile.nickname, ''))) > 0
  )
    and (p_before_created_at is null or (account.created_at, account.id) < (p_before_created_at, p_before_user_id))
  order by account.created_at desc, account.id desc
  limit 21;
end;
$$;

revoke all on function private.list_managed_users(text, timestamptz, uuid) from public, anon;
grant execute on function private.list_managed_users(text, timestamptz, uuid) to authenticated;

create or replace function public.list_managed_users(
  p_search text default '',
  p_before_created_at timestamptz default null,
  p_before_user_id uuid default null
)
returns table (
  user_id uuid,
  email text,
  nickname text,
  created_at timestamptz,
  last_active_at timestamptz,
  deletion_scheduled_for timestamptz
)
language sql
stable
set search_path = ''
as $$
  select * from private.list_managed_users(p_search, p_before_created_at, p_before_user_id);
$$;

revoke all on function public.list_managed_users(text, timestamptz, uuid) from public, anon;
grant execute on function public.list_managed_users(text, timestamptz, uuid) to authenticated;
