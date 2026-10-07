-- 닉네임은 공개 프로필 테이블에서 유일하게 관리하고, 중복 여부와 저장을 RPC로 처리합니다.
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_nickname_format check (
    char_length(nickname) between 2 and 12
    and nickname ~ '^[가-힣A-Za-z0-9_]+$'
  )
);

create unique index profiles_nickname_unique
  on public.profiles (lower(btrim(nickname)));

alter table public.profiles enable row level security;
revoke all on table public.profiles from anon, authenticated;

-- 기존 계정의 닉네임을 보존합니다. 적용 전 현재 계정 데이터에 중복이 없음을 확인했습니다.
insert into public.profiles (user_id, nickname)
select id, btrim(raw_user_meta_data ->> 'nickname')
from auth.users
where nullif(btrim(raw_user_meta_data ->> 'nickname'), '') is not null
  and char_length(btrim(raw_user_meta_data ->> 'nickname')) between 2 and 12
  and btrim(raw_user_meta_data ->> 'nickname') ~ '^[가-힣A-Za-z0-9_]+$'
on conflict (user_id) do nothing;

-- 비노출 스키마에서 권한을 확인한 뒤 public RPC가 필요한 동작만 호출합니다.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.nickname_is_available(p_nickname text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_nickname text := btrim(coalesce(p_nickname, ''));
begin
  if v_user_id is null then
    raise exception '로그인이 필요합니다.' using errcode = '42501';
  end if;

  if char_length(v_nickname) not between 2 and 12
    or v_nickname !~ '^[가-힣A-Za-z0-9_]+$' then
    return false;
  end if;

  return not exists (
    select 1
    from public.profiles as profile
    where lower(btrim(profile.nickname)) = lower(v_nickname)
      and profile.user_id <> v_user_id
  );
end;
$$;

create or replace function private.get_my_nickname()
returns text
language sql
security definer
set search_path = ''
as $$
  select profile.nickname
  from public.profiles as profile
  where profile.user_id = (select auth.uid());
$$;

create or replace function private.save_nickname(p_nickname text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_nickname text := btrim(coalesce(p_nickname, ''));
begin
  if v_user_id is null then
    raise exception '로그인이 필요합니다.' using errcode = '42501';
  end if;

  if char_length(v_nickname) not between 2 and 12
    or v_nickname !~ '^[가-힣A-Za-z0-9_]+$' then
    raise exception '닉네임 형식이 올바르지 않습니다.' using errcode = '22023';
  end if;

  insert into public.profiles (user_id, nickname)
  values (v_user_id, v_nickname)
  on conflict (user_id) do update
    set nickname = excluded.nickname,
        updated_at = now();

  return v_nickname;
end;
$$;

revoke all on function private.nickname_is_available(text) from public, anon, authenticated;
revoke all on function private.get_my_nickname() from public, anon, authenticated;
revoke all on function private.save_nickname(text) from public, anon, authenticated;
grant execute on function private.nickname_is_available(text) to authenticated;
grant execute on function private.get_my_nickname() to authenticated;
grant execute on function private.save_nickname(text) to authenticated;

create or replace function public.check_nickname_availability(p_nickname text)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select private.nickname_is_available(p_nickname);
$$;

create or replace function public.get_my_nickname()
returns text
language sql
security invoker
set search_path = ''
as $$
  select private.get_my_nickname();
$$;

create or replace function public.save_nickname(p_nickname text)
returns text
language sql
security invoker
set search_path = ''
as $$
  select private.save_nickname(p_nickname);
$$;

revoke all on function public.check_nickname_availability(text) from public, anon, authenticated;
revoke all on function public.get_my_nickname() from public, anon, authenticated;
revoke all on function public.save_nickname(text) from public, anon, authenticated;
grant execute on function public.check_nickname_availability(text) to authenticated;
grant execute on function public.get_my_nickname() to authenticated;
grant execute on function public.save_nickname(text) to authenticated;

notify pgrst, 'reload schema';
