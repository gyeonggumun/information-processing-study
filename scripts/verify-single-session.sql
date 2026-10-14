-- All generated users, Auth sessions and test records are rolled back.
begin;
create temporary table session_test_ids as
select gen_random_uuid() as account_a, gen_random_uuid() as account_b,
       gen_random_uuid() as old_session, gen_random_uuid() as new_session,
       gen_random_uuid() as other_session;
grant select on session_test_ids to authenticated;
insert into auth.users(id, email, aud, role, created_at, updated_at)
select account_a, account_a::text || '@example.invalid', 'authenticated', 'authenticated', now(), now() from session_test_ids
union all select account_b, account_b::text || '@example.invalid', 'authenticated', 'authenticated', now(), now() from session_test_ids;
insert into auth.sessions(id,user_id,created_at,updated_at)
select old_session,account_a,now()-interval '2 minutes',now() from session_test_ids
union all select other_session,account_b,now()-interval '2 minutes',now() from session_test_ids;
select set_config('request.jwt.claims', (select json_build_object('sub',account_a,'role','authenticated','session_id',old_session)::text from session_test_ids),true);
set local role authenticated;
do $$ begin
  if public.check_single_session() is not true then raise exception 'First login denied'; end if;
  if public.check_single_session() is not true then raise exception 'Same-session tab denied'; end if;
end $$;
reset role;
insert into auth.sessions(id,user_id,created_at,updated_at)
select new_session,account_a,now()-interval '1 minute',now() from session_test_ids;
select set_config('request.method','GET',true), set_config('request.path','/practice_attempts',true);
set local role authenticated;
do $$ begin
  if public.check_single_session() is not false then raise exception 'Old login reclaimed ownership'; end if;
  if private.is_current_login_session() is not false then raise exception 'RLS accepted old login'; end if;
  begin
    perform public.enforce_single_session_request();
    raise exception 'GET API accepted old login';
  exception when sqlstate 'PT401' then null;
  end;
  perform set_config('request.method','POST',true);
  perform set_config('request.path','/rpc/save_nickname',true);
  begin
    perform public.enforce_single_session_request();
    raise exception 'RPC API accepted old login';
  exception when sqlstate 'PT401' then null;
  end;
  perform set_config('request.path','/rpc/check_single_session',true);
  perform public.enforce_single_session_request();
end $$;
reset role;
select set_config('request.jwt.claims', (select json_build_object('sub',account_a,'role','authenticated','session_id',new_session)::text from session_test_ids),true);
set local role authenticated;
do $$ begin
  if public.check_single_session() is not true then raise exception 'New login denied'; end if;
  perform set_config('request.path','/practice_attempts',true);
  perform public.enforce_single_session_request();
end $$;
reset role;
select set_config('request.jwt.claims', (select json_build_object('sub',account_b,'role','authenticated','session_id',other_session)::text from session_test_ids),true);
set local role authenticated;
do $$ begin
  if public.check_single_session() is not true then raise exception 'Other account affected'; end if;
end $$;
reset role;
delete from auth.sessions where id = (select new_session from session_test_ids);
select set_config('request.jwt.claims', (select json_build_object('sub',account_a,'role','authenticated','session_id',old_session)::text from session_test_ids),true);
set local role authenticated;
do $$ begin
  if public.check_single_session() is not false then raise exception 'Logout revived old login'; end if;
end $$;
reset role;
select set_config('request.jwt.claims', (select json_build_object('sub',account_b,'role','authenticated','session_id',new_session)::text from session_test_ids),true);
set local role authenticated;
do $$ begin
  if public.check_single_session() is not false then raise exception 'Foreign session accepted'; end if;
end $$;
reset role;
do $$ begin
  if has_table_privilege('authenticated','private.account_login_sessions','select') then raise exception 'Private session table exposed'; end if;
  if has_function_privilege('anon','public.check_single_session()','execute') then raise exception 'Anonymous session RPC exposed'; end if;
end $$;
rollback;
select 'PASS: newest login, same-session tabs, stale GET/RPC/RLS denial, account isolation, no old-session revival, privileges; test data rolled back' as result;
