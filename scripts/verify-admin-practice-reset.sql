-- 운영 DB에서도 임시 검증 데이터·세션을 포함한 모든 변경을 롤백합니다.
begin;
do $test$
declare
  admin_id uuid;
  target_a uuid := gen_random_uuid();
  target_b uuid := gen_random_uuid();
  pro_id uuid := gen_random_uuid();
  admin_session uuid := gen_random_uuid();
  user_session uuid := gen_random_uuid();
  pro_session uuid := gen_random_uuid();
  email_a text := 'reset-a-' || gen_random_uuid()::text || '@example.invalid';
  email_b text := 'reset-b-' || gen_random_uuid()::text || '@example.invalid';
  result jsonb;
  original_count bigint;
begin
  select id into admin_id from auth.users where lower(email) = 'lion989072@gmail.com';
  if admin_id is null then raise exception 'Verified administrator fixture unavailable'; end if;
  select count(*) into original_count from public.practice_attempts;
  insert into auth.users(id, email) values (target_a, email_a), (target_b, email_b), (pro_id, 'reset-pro-' || pro_id::text || '@example.invalid');
  insert into private.account_app_roles(user_id, app_role) values (pro_id, 'pro');
  insert into auth.sessions(id, user_id, created_at, updated_at) values
    (admin_session, admin_id, clock_timestamp(), clock_timestamp()),
    (user_session, target_a, clock_timestamp(), clock_timestamp()),
    (pro_session, pro_id, clock_timestamp(), clock_timestamp());
  insert into private.account_login_sessions(user_id, session_id, session_created_at)
    select user_id, id, created_at from auth.sessions where id in (admin_session, user_session, pro_session)
    on conflict(user_id) do update set session_id=excluded.session_id, session_created_at=excluded.session_created_at;
  insert into public.practice_attempts(user_id, practice_type, question_id, is_correct)
    select target_a, type, 'reset-fixture', false from unnest(array['exam','C','Java','Python','SQL']) type;
  insert into public.practice_attempts(user_id, practice_type, question_id, is_correct) values(target_b,'SQL','other-user-fixture',true);
  insert into public.study_favorites(user_id,subject_id,material_id) values(target_a,'reset-fixture','reset-fixture');
  insert into public.exam_summary_preferences(user_id,card_order) values(target_a,array['reset-fixture']);

  perform set_config('request.jwt.claims', '{}', true);
  begin
    perform public.reset_managed_user_practice(target_a,email_a);
    raise exception 'Anonymous caller was accepted';
  exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claims', jsonb_build_object('sub',target_a,'session_id',user_session,'app_metadata',jsonb_build_object('role','admin'),'user_metadata',jsonb_build_object('role','admin'))::text, true);
  begin
    execute 'set local role authenticated';
    perform public.reset_managed_user_practice(target_b,email_b);
    raise exception 'User with forged admin metadata was accepted';
  exception when insufficient_privilege then null; end;
  execute 'reset role';
  perform set_config('request.jwt.claims', jsonb_build_object('sub',pro_id,'session_id',pro_session)::text, true);
  begin
    execute 'set local role authenticated';
    perform public.reset_managed_user_practice(target_a,email_a);
    raise exception 'Pro caller was accepted';
  exception when insufficient_privilege then null; end;
  execute 'reset role';
  perform set_config('request.jwt.claims', jsonb_build_object('sub',admin_id,'session_id',gen_random_uuid())::text, true);
  begin
    perform public.reset_managed_user_practice(target_a,email_a);
    raise exception 'Invalid admin session was accepted';
  exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claims', jsonb_build_object('sub',admin_id,'session_id',admin_session)::text, true);
  if not private.can_manage_users() then raise exception 'Admin fixture not authorized'; end if;
  begin
    perform public.reset_managed_user_practice(target_a,email_b);
    raise exception 'Wrong confirmation email was accepted';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.reset_managed_user_practice(gen_random_uuid(),email_a);
    raise exception 'Missing target was accepted';
  exception when invalid_parameter_value then null; end;
  if (select count(*) from public.practice_attempts where user_id=target_a) <> 5 then raise exception 'Failed requests changed data'; end if;

  execute 'set local role authenticated';
  select public.reset_managed_user_practice(target_a,upper(email_a)) into result;
  execute 'reset role';
  if (result->>'deleted_count')::int <> 5 or result->>'user_id' <> target_a::text then raise exception 'Unexpected reset response'; end if;
  if exists(select 1 from public.practice_attempts where user_id=target_a) then raise exception 'Target still has attempts'; end if;
  if (select count(*) from public.practice_attempts where user_id=target_b) <> 1 then raise exception 'Other user was changed'; end if;
  if not exists(select 1 from auth.users where id=target_a)
    or not exists(select 1 from public.study_favorites where user_id=target_a)
    or not exists(select 1 from public.exam_summary_preferences where user_id=target_a) then raise exception 'Account or learning preferences were changed'; end if;
  result := public.reset_managed_user_practice(target_a,email_a);
  if (result->>'deleted_count')::int <> 0 then raise exception 'Empty account reset failed'; end if;
  if (select count(*) from public.practice_attempts) <> original_count+1 then raise exception 'Unrelated attempts changed'; end if;
  if has_function_privilege('anon','public.reset_managed_user_practice(uuid,text)','EXECUTE')
    or has_function_privilege('anon','private.reset_managed_user_practice(uuid,text)','EXECUTE')
    or has_table_privilege('authenticated','public.practice_attempts','DELETE') then raise exception 'Excessive privileges'; end if;
  raise notice 'PASS: anonymous/User/Pro/forged role/expired session denied; admin target-only reset; favorites/preferences preserved; empty account; all changes rolled back';
end;
$test$;
rollback;
select 'PASS: 관리자 초기화 보안·대상 격리·설정 보존 검증 완료, 테스트 변경 모두 롤백' as verification;
