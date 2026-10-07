create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

alter table public.profiles
  add column if not exists deletion_requested_at timestamptz,
  add column if not exists deletion_scheduled_for timestamptz,
  add column if not exists deletion_processing_at timestamptz;

create index if not exists profiles_deletion_due_idx
  on public.profiles (deletion_scheduled_for)
  where deletion_scheduled_for is not null;

create or replace function private.restore_account_deletion()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_rows integer;
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  update public.profiles
  set deletion_requested_at = null,
      deletion_scheduled_for = null,
      deletion_processing_at = null,
      updated_at = clock_timestamp()
  where user_id = (select auth.uid())
    and deletion_scheduled_for > clock_timestamp()
    and deletion_processing_at is null;

  get diagnostics affected_rows = row_count;
  if affected_rows > 0 then
    return 'restored';
  end if;

  if exists (
    select 1 from public.profiles
    where user_id = (select auth.uid())
      and deletion_scheduled_for is not null
  ) then
    return 'expired';
  end if;

  return 'none';
end;
$$;

revoke all on function private.restore_account_deletion() from public, anon;
grant execute on function private.restore_account_deletion() to authenticated;

create or replace function public.restore_account_deletion()
returns text
language sql
set search_path = ''
as $$
  select private.restore_account_deletion();
$$;

revoke all on function public.restore_account_deletion() from public, anon;
grant execute on function public.restore_account_deletion() to authenticated;

create or replace function private.claim_due_account_deletions()
returns table(user_id uuid)
language sql
security definer
set search_path = ''
as $$
  with due_rows as (
    select profile.user_id
    from public.profiles as profile
    where profile.deletion_scheduled_for <= statement_timestamp()
      and (
        profile.deletion_processing_at is null
        or profile.deletion_processing_at < statement_timestamp() - interval '30 minutes'
      )
    order by profile.deletion_scheduled_for
    limit 100
    for update skip locked
  )
  update public.profiles as profile
  set deletion_processing_at = clock_timestamp()
  from due_rows
  where profile.user_id = due_rows.user_id
  returning profile.user_id;
$$;

revoke all on function private.claim_due_account_deletions() from public, anon, authenticated;
grant execute on function private.claim_due_account_deletions() to service_role;

create or replace function public.claim_due_account_deletions()
returns table(user_id uuid)
language sql
set search_path = ''
as $$
  select user_id from private.claim_due_account_deletions();
$$;

revoke all on function public.claim_due_account_deletions() from public, anon, authenticated;
grant execute on function public.claim_due_account_deletions() to service_role;

create or replace function private.get_account_deletion_cron_secret()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'account_deletion_cron_secret'
  limit 1;
$$;

revoke all on function private.get_account_deletion_cron_secret() from public, anon, authenticated;
grant execute on function private.get_account_deletion_cron_secret() to service_role;

create or replace function public.get_account_deletion_cron_secret()
returns text
language sql
set search_path = ''
as $$
  select private.get_account_deletion_cron_secret();
$$;

revoke all on function public.get_account_deletion_cron_secret() from public, anon, authenticated;
grant execute on function public.get_account_deletion_cron_secret() to service_role;

do $$
begin
  if not exists (select 1 from vault.secrets where name = 'account_deletion_cron_secret') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'account_deletion_cron_secret',
      'Private authentication token for the account deletion cron worker'
    );
  end if;

  if not exists (select 1 from vault.secrets where name = 'account_deletion_project_url') then
    perform vault.create_secret(
      'https://wypzkqzsgnnzpjcztlbz.supabase.co',
      'account_deletion_project_url',
      'Supabase API URL used by the account deletion cron worker'
    );
  end if;

  if not exists (select 1 from vault.secrets where name = 'account_deletion_publishable_key') then
    perform vault.create_secret(
      'sb_publishable_3aYNLG9sCs8U0krAMUsykw_c7NHE-gk',
      'account_deletion_publishable_key',
      'Publishable API key used by pg_net to invoke the account deletion worker'
    );
  end if;
end;
$$;

select cron.schedule(
  'process-account-deletions',
  '*/5 * * * *',
  $job$
    select net.http_post(
      url := (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'account_deletion_project_url'
      ) || '/functions/v1/process-account-deletions',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'account_deletion_publishable_key'
        ),
        'x-cron-secret', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'account_deletion_cron_secret'
        )
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 10000
    );
  $job$
);
