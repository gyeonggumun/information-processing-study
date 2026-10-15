-- Run as the database owner. All fixtures and mutations are rolled back.
begin;
create temporary table role_verification_result (result jsonb);
do $$
declare
  basic_id uuid := gen_random_uuid();
  pro_id uuid := gen_random_uuid();
  basic_session uuid := gen_random_uuid();
  pro_session uuid := gen_random_uuid();
  owner_id uuid;
  owner_session uuid;
  owner_checks boolean := false;
  changed_rows integer;
begin
  insert into auth.users(id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values (basic_id, 'authenticated', 'authenticated', basic_id || '@role-test.invalid', now(), '{}', '{"role":"admin","app_role":"pro"}', now(), now()),
    (pro_id, 'authenticated', 'authenticated', pro_id || '@role-test.invalid', now(), '{}', '{}', now(), now());
  insert into auth.sessions(id, user_id, created_at, updated_at)
  values (basic_session, basic_id, now(), now()), (pro_session, pro_id, now(), now());
  insert into private.account_login_sessions(user_id, session_id, session_created_at)
  values (basic_id, basic_session, now()), (pro_id, pro_session, now());
  insert into private.account_app_roles(user_id, app_role) values (pro_id, 'pro');
  insert into public.exam_summary_preferences(user_id, card_order) values (basic_id, array['basic-fixture']);

  perform set_config('request.jwt.claims', jsonb_build_object('sub', pro_id, 'role', 'authenticated', 'session_id', pro_session)::text, true);
  execute 'set local role authenticated';
  if public.get_my_app_role() <> 'pro' then raise exception 'Pro lookup failed'; end if;
  if public.can_manage_users() then raise exception 'Pro became admin'; end if;
  insert into public.exam_summary_preferences(user_id, card_order, hidden_card_ids) values (pro_id, array['a','b'], array['b']);
  update public.exam_summary_preferences set card_order = array['b','a'] where user_id = pro_id;
  if not exists (select 1 from public.exam_summary_preferences where user_id = pro_id and card_order = array['b','a'] and hidden_card_ids = array['b']) then
    raise exception 'Pro personal preferences failed';
  end if;
  if exists (select 1 from public.exam_summary_preferences where user_id = basic_id) then raise exception 'Cross-user read allowed'; end if;
  update public.exam_summary_preferences set card_order = '{}' where user_id = basic_id;
  get diagnostics changed_rows = row_count;
  if changed_rows <> 0 then raise exception 'Cross-user update allowed'; end if;
  begin
    insert into public.exam_summary_preferences(user_id) values (basic_id);
    raise exception 'Cross-user insert allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform public.set_managed_user_role(basic_id, 'pro');
    raise exception 'Pro can assign roles';
  exception when insufficient_privilege then null; end;
  begin
    perform public.list_managed_users_with_roles('', null, null);
    raise exception 'Pro can list accounts';
  exception when insufficient_privilege then null; end;
  execute 'reset role';

  perform set_config('request.jwt.claims', jsonb_build_object('sub', basic_id, 'role', 'authenticated', 'session_id', basic_session)::text, true);
  execute 'set local role authenticated';
  if public.get_my_app_role() <> 'user' then raise exception 'Metadata privilege escalation'; end if;
  if exists (select 1 from public.exam_summary_preferences) then raise exception 'User can read summary preferences'; end if;
  begin
    insert into public.exam_summary_preferences(user_id) values (basic_id);
    raise exception 'User can write summary preferences';
  exception when insufficient_privilege then null; end;
  begin
    update private.account_app_roles set app_role = 'pro' where user_id = basic_id;
    raise exception 'Direct role assignment allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform public.set_managed_user_role(basic_id, 'pro');
    raise exception 'User can assign roles';
  exception when insufficient_privilege then null; end;
  execute 'reset role';

  -- An invalidated login must still be rejected even when the account is Pro.
  perform set_config('request.jwt.claims', jsonb_build_object('sub', pro_id, 'role', 'authenticated', 'session_id', basic_session)::text, true);
  execute 'set local role authenticated';
  if exists (select 1 from public.exam_summary_preferences) then raise exception 'Stale session accepted'; end if;
  execute 'reset role';

  select account.id, accepted.session_id into owner_id, owner_session
  from auth.users account join private.account_login_sessions accepted on accepted.user_id = account.id
  join auth.sessions session on session.id = accepted.session_id and session.user_id = account.id
  where lower(account.email) = 'lion989072@gmail.com' and account.email_confirmed_at is not null
    and exists (select 1 from auth.identities identity where identity.user_id = account.id and identity.provider = 'google');
  if owner_id is not null then
    perform set_config('request.jwt.claims', jsonb_build_object('sub', owner_id, 'role', 'authenticated', 'session_id', owner_session)::text, true);
    execute 'set local role authenticated';
    if public.get_my_app_role() <> 'admin' then raise exception 'Owner role changed'; end if;
    if public.can_manage_users() then
      if public.set_managed_user_role(basic_id, 'pro') <> 'pro' then raise exception 'Admin promotion failed'; end if;
      if not exists (select 1 from public.list_managed_users_with_roles(basic_id::text, null, null) where user_id = basic_id and app_role = 'pro') then
        -- Search checks email, which contains this synthetic UUID.
        raise exception 'Managed list does not reflect Pro';
      end if;
      if public.set_managed_user_role(basic_id, 'user') <> 'user' then raise exception 'Admin demotion failed'; end if;
      begin
        perform public.set_managed_user_role(basic_id, 'admin');
        raise exception 'Admin assignment accepted';
      exception when invalid_parameter_value then null; end;
      begin
        perform public.set_managed_user_role(owner_id, 'user');
        raise exception 'Owner demotion accepted';
      exception when insufficient_privilege then null; end;
      owner_checks := true;
    end if;
    execute 'reset role';
  end if;

  perform set_config('request.jwt.claims', '{}', true);
  execute 'set local role anon';
  begin
    perform public.set_managed_user_role(basic_id, 'pro');
    raise exception 'Anonymous assignment accepted';
  exception when insufficient_privilege then null; end;
  execute 'reset role';
  insert into role_verification_result values (jsonb_build_object('user_pro_rls', 'passed', 'metadata_escalation', 'blocked',
    'cross_user_access', 'blocked', 'stale_session', 'blocked', 'admin_assignment_checks', owner_checks));
end;
$$;
select result from role_verification_result;
rollback;
