-- Database-owner regression test. Fixtures, assignments and deletions roll back.
begin;
create temporary table admin_pagination_result (result jsonb);
do $$
declare
  owner_id uuid;
  owner_session uuid;
  fixture_id uuid;
  fixture_ids uuid[] := '{}';
  expected_ids text[];
  seen_ids text[] := '{}';
  prefix text := 'pagination-' || gen_random_uuid()::text;
  baseline jsonb;
  first_page jsonb;
  second_page jsonb;
  last_page jsonb;
  empty_page jsonb;
  cursor jsonb;
  i integer;
begin
  select account.id, accepted.session_id into owner_id, owner_session
  from auth.users account join private.account_login_sessions accepted on accepted.user_id = account.id
  join auth.sessions session on session.id = accepted.session_id and session.user_id = account.id
  where lower(account.email) = 'lion989072@gmail.com' and account.email_confirmed_at is not null
    and exists (select 1 from auth.identities identity where identity.user_id = account.id and identity.provider = 'google');
  if owner_id is null then raise exception 'An active owner session is needed for this regression test'; end if;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', owner_id, 'role', 'authenticated', 'session_id', owner_session)::text, true);
  baseline := public.get_managed_users_page('') -> 'counts';

  for i in 1..23 loop
    fixture_id := gen_random_uuid();
    fixture_ids := array_append(fixture_ids, fixture_id);
    insert into auth.users(id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (fixture_id, 'authenticated', 'authenticated', prefix || '-' || i || '@page-test.invalid', now(), '{}', '{}',
      '2026-01-01'::timestamptz + (i / 2) * interval '1 second', now());
    if i % 3 = 0 then insert into private.account_app_roles(user_id, app_role) values (fixture_id, 'pro'); end if;
  end loop;
  select array_agg(id::text order by created_at desc, id desc) into expected_ids
  from auth.users where id = any(fixture_ids);

  execute 'set local role authenticated';
  first_page := public.get_managed_users_page(prefix);
  if jsonb_array_length(first_page -> 'accounts') <> 10 or not (first_page ->> 'has_more')::boolean then raise exception 'First page is not ten accounts'; end if;
  if (first_page #>> '{counts,total}')::bigint <> (baseline ->> 'total')::bigint + 23
    or (first_page #>> '{counts,user}')::bigint <> (baseline ->> 'user')::bigint + 16
    or (first_page #>> '{counts,pro}')::bigint <> (baseline ->> 'pro')::bigint + 7
    or first_page #>> '{counts,admin}' <> baseline ->> 'admin' then raise exception 'Global counts mismatch'; end if;
  seen_ids := seen_ids || array(select item ->> 'user_id' from jsonb_array_elements(first_page -> 'accounts') item);
  cursor := first_page #> '{accounts,9}';
  second_page := public.get_managed_users_page(prefix, (cursor ->> 'created_at')::timestamptz, (cursor ->> 'user_id')::uuid);
  if jsonb_array_length(second_page -> 'accounts') <> 10 or not (second_page ->> 'has_more')::boolean then raise exception 'Second page boundary failed'; end if;
  seen_ids := seen_ids || array(select item ->> 'user_id' from jsonb_array_elements(second_page -> 'accounts') item);
  cursor := second_page #> '{accounts,9}';
  last_page := public.get_managed_users_page(prefix, (cursor ->> 'created_at')::timestamptz, (cursor ->> 'user_id')::uuid);
  if jsonb_array_length(last_page -> 'accounts') <> 3 or (last_page ->> 'has_more')::boolean then raise exception 'Last page boundary failed'; end if;
  seen_ids := seen_ids || array(select item ->> 'user_id' from jsonb_array_elements(last_page -> 'accounts') item);
  if seen_ids <> expected_ids then raise exception 'Duplicate, missing or unordered accounts'; end if;
  if public.get_managed_users_page(prefix) -> 'accounts' <> first_page -> 'accounts' then raise exception 'Previous page replay failed'; end if;
  empty_page := public.get_managed_users_page(prefix || '-no-match');
  if jsonb_array_length(empty_page -> 'accounts') <> 0 or (empty_page ->> 'has_more')::boolean
    or empty_page -> 'counts' <> first_page -> 'counts' then raise exception 'Search changed global counts'; end if;
  perform public.set_managed_user_role(fixture_ids[1], 'pro');
  if (public.get_managed_users_page(prefix) #>> '{counts,pro}')::bigint <> (baseline ->> 'pro')::bigint + 8 then raise exception 'Role counts did not refresh'; end if;
  begin
    perform public.get_managed_users_page(prefix, now(), null);
    raise exception 'Invalid cursor accepted';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.get_managed_users_page(repeat('x', 101));
    raise exception 'Oversized search accepted';
  exception when invalid_parameter_value then null; end;
  execute 'reset role';

  delete from auth.users where id in (select (item ->> 'user_id')::uuid from jsonb_array_elements(last_page -> 'accounts') item);
  execute 'set local role authenticated';
  empty_page := public.get_managed_users_page(prefix, (cursor ->> 'created_at')::timestamptz, (cursor ->> 'user_id')::uuid);
  if jsonb_array_length(empty_page -> 'accounts') <> 0 or (empty_page ->> 'has_more')::boolean
    or (empty_page #>> '{counts,total}')::bigint <> (baseline ->> 'total')::bigint + 20 then raise exception 'Deleted page/count mismatch'; end if;
  execute 'reset role';

  for i in 5..6 loop
    perform set_config('request.jwt.claims', jsonb_build_object('sub', fixture_ids[i], 'role', 'authenticated', 'session_id', gen_random_uuid())::text, true);
    execute 'set local role authenticated';
    if public.get_my_app_role() <> (case when i = 6 then 'pro' else 'user' end) then raise exception 'Invalid non-admin fixture'; end if;
    begin
      perform public.get_managed_users_page('');
      raise exception 'Non-admin account accessed global list/counts';
    exception when insufficient_privilege then null; end;
    execute 'reset role';
  end loop;
  perform set_config('request.jwt.claims', '{}', true);
  execute 'set local role anon';
  begin
    perform public.get_managed_users_page('');
    raise exception 'Anonymous accessed global list/counts';
  exception when insufficient_privilege then null; end;
  execute 'reset role';
  insert into admin_pagination_result values ('{"pages":[10,10,3],"stable_order":"passed","global_counts":"passed","search":"passed","role_changes":"passed","deletion":"passed","non_admin":"blocked"}');
end;
$$;
select result from admin_pagination_result;
rollback;
