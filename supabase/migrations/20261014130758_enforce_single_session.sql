-- Keep the newest accepted login even after its Auth session is signed out.
-- Do not foreign-key session_id: removing the newest session must not revive older ones.
create table private.account_login_sessions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  session_id uuid not null,
  session_created_at timestamptz not null
);
alter table private.account_login_sessions enable row level security;
revoke all on private.account_login_sessions from public, anon, authenticated, service_role;

insert into private.account_login_sessions(user_id, session_id, session_created_at)
select distinct on (user_id) user_id, id, created_at
from auth.sessions where created_at is not null
order by user_id, created_at desc, id desc;

create function private.is_current_login_session()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from auth.sessions s
    join private.account_login_sessions accepted on accepted.user_id = s.user_id
      and accepted.session_id = s.id
    where s.user_id = (select auth.uid())
      and s.id = nullif(auth.jwt()->>'session_id', '')::uuid
      and (s.not_after is null or s.not_after > now())
      and not exists (
        select 1 from auth.sessions newer where newer.user_id = s.user_id
          and (newer.created_at, newer.id) > (s.created_at, s.id)
      )
  );
$$;
revoke all on function private.is_current_login_session() from public, anon;
grant execute on function private.is_current_login_session() to authenticated;

create function private.check_single_session()
returns boolean language plpgsql security definer set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_session uuid := nullif(auth.jwt()->>'session_id', '')::uuid;
  login_at timestamptz;
begin
  if caller_id is null or caller_session is null then return false; end if;
  select s.created_at into login_at from auth.sessions s
  where s.id = caller_session and s.user_id = caller_id
    and (s.not_after is null or s.not_after > now())
    and not exists (select 1 from auth.sessions newer where newer.user_id = s.user_id
      and (newer.created_at, newer.id) > (s.created_at, s.id));
  if login_at is null then return false; end if;
  insert into private.account_login_sessions as accepted(user_id, session_id, session_created_at)
  values (caller_id, caller_session, login_at)
  on conflict (user_id) do update
  set session_id = excluded.session_id, session_created_at = excluded.session_created_at
  where (accepted.session_created_at, accepted.session_id) < (excluded.session_created_at, excluded.session_id);
  return private.is_current_login_session();
end;
$$;
revoke all on function private.check_single_session() from public, anon;
grant execute on function private.check_single_session() to authenticated;

create function public.check_single_session()
returns boolean language sql set search_path = ''
as $$ select private.check_single_session(); $$;
revoke all on function public.check_single_session() from public, anon;
grant execute on function public.check_single_session() to authenticated;

-- Pre-request also protects SECURITY DEFINER RPCs; a browser-only guard is insufficient.
create function public.enforce_single_session_request()
returns void language plpgsql set search_path = ''
as $$
begin
  if current_user <> 'authenticated' then return; end if;
  if current_setting('request.method', true) = 'POST'
    and ltrim(current_setting('request.path', true), '/') = 'rpc/check_single_session' then return; end if;
  if not private.is_current_login_session() then
    raise exception using errcode = 'PT401', message = 'SESSION_REPLACED';
  end if;
end;
$$;
revoke all on function public.enforce_single_session_request() from public;
grant execute on function public.enforce_single_session_request() to anon, authenticated, service_role;

-- Defense in depth for table access through APIs other than PostgREST.
create policy "Require current login session" on public.practice_attempts as restrictive
for all to authenticated using ((select private.is_current_login_session())) with check ((select private.is_current_login_session()));
create policy "Require current login session" on public.study_favorites as restrictive
for all to authenticated using ((select private.is_current_login_session())) with check ((select private.is_current_login_session()));
create policy "Require current login session" on public.profiles as restrictive
for all to authenticated using ((select private.is_current_login_session())) with check ((select private.is_current_login_session()));
create policy "Require current login session" on public.exam_summary_preferences as restrictive
for all to authenticated using ((select private.is_current_login_session())) with check ((select private.is_current_login_session()));

-- Admin Edge Functions use this helper before service-role operations.
create or replace function private.can_manage_users()
returns boolean language sql stable security definer set search_path = ''
as $$ select private.current_app_role() = 'admin' and private.is_current_login_session(); $$;
revoke all on function private.can_manage_users() from public, anon;
grant execute on function private.can_manage_users() to authenticated;

alter role authenticator set pgrst.db_pre_request = 'public.enforce_single_session_request';
notify pgrst, 'reload config';
notify pgrst, 'reload schema';
