-- Keep account activity separate from profiles so users without a nickname are covered.
create table private.account_activity (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_active_at timestamptz not null default clock_timestamp(),
  deletion_processing_at timestamptz
);

alter table private.account_activity enable row level security;

-- Existing accounts receive a fresh 90-day window when this policy is introduced.
insert into private.account_activity (user_id, last_active_at)
select id, clock_timestamp() from auth.users
on conflict (user_id) do nothing;

create index account_activity_inactive_idx
  on private.account_activity (last_active_at)
  where deletion_processing_at is null;

create or replace function private.create_account_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into private.account_activity (user_id) values (new.id);
  return new;
end;
$$;

revoke all on function private.create_account_activity() from public, anon, authenticated;

create trigger on_auth_user_created_track_activity
  after insert on auth.users
  for each row execute function private.create_account_activity();

create or replace function private.restore_account_deletion()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_id uuid := (select auth.uid());
  previous_activity timestamptz;
  processing_at timestamptz;
  scheduled_for timestamptz;
begin
  if account_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  select last_active_at, deletion_processing_at
    into previous_activity, processing_at
  from private.account_activity
  where user_id = account_id
  for update;

  if not found then
    raise exception 'Account activity is unavailable';
  end if;

  select deletion_scheduled_for into scheduled_for
  from public.profiles
  where user_id = account_id
  for update;

  if scheduled_for is not null then
    if scheduled_for <= clock_timestamp() or processing_at is not null then
      return 'expired';
    end if;

    update public.profiles
    set deletion_requested_at = null,
        deletion_scheduled_for = null,
        deletion_processing_at = null,
        updated_at = clock_timestamp()
    where user_id = account_id;

    update private.account_activity
    set last_active_at = clock_timestamp()
    where user_id = account_id;

    return 'restored';
  end if;

  if processing_at is not null or previous_activity <= clock_timestamp() - interval '90 days' then
    return 'inactive-expired';
  end if;

  update private.account_activity
  set last_active_at = clock_timestamp()
  where user_id = account_id;

  return 'none';
end;
$$;

create or replace function private.touch_account_activity()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_id uuid := (select auth.uid());
  previous_activity timestamptz;
  processing_at timestamptz;
  scheduled_for timestamptz;
begin
  if account_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  select last_active_at, deletion_processing_at
    into previous_activity, processing_at
  from private.account_activity
  where user_id = account_id
  for update;

  if not found or processing_at is not null or previous_activity <= clock_timestamp() - interval '90 days' then
    return false;
  end if;

  select deletion_scheduled_for into scheduled_for
  from public.profiles
  where user_id = account_id;

  if scheduled_for is not null then
    return false;
  end if;

  update private.account_activity
  set last_active_at = clock_timestamp()
  where user_id = account_id;

  return true;
end;
$$;

revoke all on function private.touch_account_activity() from public, anon;
grant execute on function private.touch_account_activity() to authenticated;

create or replace function public.touch_account_activity()
returns boolean
language sql
set search_path = ''
as $$
  select private.touch_account_activity();
$$;

revoke all on function public.touch_account_activity() from public, anon;
grant execute on function public.touch_account_activity() to authenticated;

create or replace function private.claim_due_account_deletions()
returns table(user_id uuid)
language sql
security definer
set search_path = ''
as $$
  with due_rows as (
    select activity.user_id
    from private.account_activity as activity
    left join public.profiles as profile on profile.user_id = activity.user_id
    where (
      profile.deletion_scheduled_for <= statement_timestamp()
      or (
        profile.deletion_scheduled_for is null
        and activity.last_active_at <= statement_timestamp() - interval '90 days'
      )
    )
      and (
        activity.deletion_processing_at is null
        or activity.deletion_processing_at < statement_timestamp() - interval '30 minutes'
      )
    order by activity.last_active_at
    limit 100
    for update of activity skip locked
  )
  update private.account_activity as activity
  set deletion_processing_at = clock_timestamp()
  from due_rows
  where activity.user_id = due_rows.user_id
  returning activity.user_id;
$$;

create or replace function private.release_account_deletion_claim(p_user_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update private.account_activity
  set deletion_processing_at = null
  where user_id = p_user_id;
$$;

revoke all on function private.release_account_deletion_claim(uuid) from public, anon, authenticated;
grant execute on function private.release_account_deletion_claim(uuid) to service_role;

create or replace function public.release_account_deletion_claim(p_user_id uuid)
returns void
language sql
set search_path = ''
as $$
  select private.release_account_deletion_claim(p_user_id);
$$;

revoke all on function public.release_account_deletion_claim(uuid) from public, anon, authenticated;
grant execute on function public.release_account_deletion_claim(uuid) to service_role;
