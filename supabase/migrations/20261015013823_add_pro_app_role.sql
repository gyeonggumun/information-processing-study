-- User/Pro assignments are server-owned; the verified owner remains the only Admin.
create table private.account_app_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  app_role text not null check (app_role in ('user', 'pro')),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
alter table private.account_app_roles enable row level security;
revoke all on private.account_app_roles from public, anon, authenticated, service_role;

create or replace function private.current_app_role()
returns text language sql stable security definer set search_path = ''
as $$
  select case when exists (
    select 1 from auth.users account
    where account.id = (select auth.uid())
      and lower(account.email) = 'lion989072@gmail.com'
      and account.email_confirmed_at is not null
      and exists (select 1 from auth.identities identity
        where identity.user_id = account.id and identity.provider = 'google')
  ) then 'admin' else coalesce((
    select assignment.app_role from private.account_app_roles assignment
    where assignment.user_id = (select auth.uid())
  ), 'user') end;
$$;
revoke all on function private.current_app_role() from public, anon;
grant execute on function private.current_app_role() to authenticated;

create function private.set_managed_user_role(p_user_id uuid, p_role text)
returns text language plpgsql security definer set search_path = ''
as $$
declare
  target_email text;
begin
  if auth.uid() is null or not private.can_manage_users() then
    raise exception using errcode = '42501', message = 'Admin access required';
  end if;
  if p_user_id is null or p_role is null or p_role not in ('user', 'pro') then
    raise exception using errcode = '22023', message = 'Only user or pro can be assigned';
  end if;
  select lower(account.email) into target_email from auth.users account
  where account.id = p_user_id for update;
  if not found then
    raise exception using errcode = '22023', message = 'Account not found';
  end if;
  if target_email = 'lion989072@gmail.com' or p_user_id = auth.uid() then
    raise exception using errcode = '42501', message = 'Owner role cannot be changed';
  end if;
  insert into private.account_app_roles(user_id, app_role, updated_at, updated_by)
  values (p_user_id, p_role, now(), auth.uid())
  on conflict (user_id) do update set app_role = excluded.app_role,
    updated_at = excluded.updated_at, updated_by = excluded.updated_by;
  return p_role;
end;
$$;
revoke all on function private.set_managed_user_role(uuid, text) from public, anon;
grant execute on function private.set_managed_user_role(uuid, text) to authenticated;

create function public.set_managed_user_role(p_user_id uuid, p_role text)
returns text language sql set search_path = ''
as $$ select private.set_managed_user_role(p_user_id, p_role); $$;
revoke all on function public.set_managed_user_role(uuid, text) from public, anon;
grant execute on function public.set_managed_user_role(uuid, text) to authenticated;

-- Preserve the existing pagination RPC contract for older clients.
create function private.list_managed_users_with_roles(
  p_search text, p_before_created_at timestamptz, p_before_user_id uuid
)
returns table (user_id uuid, email text, nickname text, created_at timestamptz,
  last_active_at timestamptz, deletion_scheduled_for timestamptz, app_role text)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not private.can_manage_users() then
    raise exception using errcode = '42501', message = 'Admin access required';
  end if;
  return query
  select managed.*, case when managed.user_id = auth.uid() then 'admin'
    else coalesce(assignment.app_role, 'user') end
  from private.list_managed_users(p_search, p_before_created_at, p_before_user_id) managed
  left join private.account_app_roles assignment on assignment.user_id = managed.user_id
  order by managed.created_at desc, managed.user_id desc;
end;
$$;
revoke all on function private.list_managed_users_with_roles(text, timestamptz, uuid) from public, anon;
grant execute on function private.list_managed_users_with_roles(text, timestamptz, uuid) to authenticated;

create function public.list_managed_users_with_roles(
  p_search text default '', p_before_created_at timestamptz default null,
  p_before_user_id uuid default null
)
returns table (user_id uuid, email text, nickname text, created_at timestamptz,
  last_active_at timestamptz, deletion_scheduled_for timestamptz, app_role text)
language sql stable set search_path = ''
as $$ select * from private.list_managed_users_with_roles(p_search, p_before_created_at, p_before_user_id); $$;
revoke all on function public.list_managed_users_with_roles(text, timestamptz, uuid) from public, anon;
grant execute on function public.list_managed_users_with_roles(text, timestamptz, uuid) to authenticated;

-- Keep the restrictive single-session policy and ownership checks intact.
alter policy "Admins can read their own exam summary preferences" on public.exam_summary_preferences
using ((select auth.uid()) = user_id and (select public.get_my_app_role()) in ('pro', 'admin'));
alter policy "Admins can read their own exam summary preferences" on public.exam_summary_preferences
rename to "Pro and admins can read their own exam summary preferences";
alter policy "Admins can create their own exam summary preferences" on public.exam_summary_preferences
with check ((select auth.uid()) = user_id and (select public.get_my_app_role()) in ('pro', 'admin'));
alter policy "Admins can create their own exam summary preferences" on public.exam_summary_preferences
rename to "Pro and admins can create their own exam summary preferences";
alter policy "Admins can update their own exam summary preferences" on public.exam_summary_preferences
using ((select auth.uid()) = user_id and (select public.get_my_app_role()) in ('pro', 'admin'))
with check ((select auth.uid()) = user_id and (select public.get_my_app_role()) in ('pro', 'admin'));
alter policy "Admins can update their own exam summary preferences" on public.exam_summary_preferences
rename to "Pro and admins can update their own exam summary preferences";

notify pgrst, 'reload schema';
