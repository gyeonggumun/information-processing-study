-- All synthetic accounts, inquiries and replies roll back after verification.
begin;
create temporary table support_test_result(result jsonb);
do $$
declare
  actor_ids uuid[] := array[gen_random_uuid(),gen_random_uuid(),gen_random_uuid()];
  session_ids uuid[] := array[gen_random_uuid(),gen_random_uuid(),gen_random_uuid()];
  request_key uuid := gen_random_uuid();
  inquiry_id uuid;
  other_inquiry_id uuid;
  owner_id uuid;
  owner_session uuid;
  version timestamptz;
  first_page jsonb;
  next_page jsonb;
  cursor jsonb;
  i integer;
begin
  for i in 1..3 loop
    insert into auth.users(id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
    values (actor_ids[i],'authenticated','authenticated',actor_ids[i] || '@support-test.invalid',now(),'{}','{}',now(),now());
    insert into auth.sessions(id,user_id,created_at,updated_at) values(session_ids[i],actor_ids[i],now(),now());
    insert into private.account_login_sessions(user_id,session_id,session_created_at) values(actor_ids[i],session_ids[i],now());
  end loop;
  insert into private.account_app_roles(user_id,app_role) values(actor_ids[2],'pro');
  perform set_config('request.jwt.claims',jsonb_build_object('sub',actor_ids[1],'role','authenticated','session_id',session_ids[1])::text,true);
  execute 'set local role authenticated';
  inquiry_id := public.create_support_inquiry(request_key,'content','자료 문의','학습 자료의 설명을 확인하고 싶습니다.');
  if public.create_support_inquiry(request_key,'content','자료 문의','학습 자료의 설명을 확인하고 싶습니다.') <> inquiry_id then raise exception 'Duplicate retry created another inquiry'; end if;
  begin
    perform public.create_support_inquiry(gen_random_uuid(),'general','추가 문의','연속 문의 제한을 확인하는 내용입니다.');
    raise exception 'Rate limit bypass';
  exception when raise_exception then if sqlerrm <> 'INQUIRY_RATE_LIMIT' then raise; end if; end;
  begin
    perform public.create_support_inquiry(request_key,'content','다른 제목','학습 자료의 설명을 확인하고 싶습니다.');
    raise exception 'Request key reused for different contents';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.create_support_inquiry(gen_random_uuid(),'general','  ',repeat('a',10));
    raise exception 'Blank title accepted';
  exception when invalid_parameter_value then null; end;
  begin
    update public.support_inquiries set reply = 'forged',status = 'answered' where id = inquiry_id;
    raise exception 'Direct reply allowed';
  exception when insufficient_privilege then null; end;
  execute 'reset role';

  for i in 2..3 loop
    perform set_config('request.jwt.claims',jsonb_build_object('sub',actor_ids[i],'role','authenticated','session_id',session_ids[i])::text,true);
    execute 'set local role authenticated';
    if exists(select 1 from public.support_inquiries where id = inquiry_id) then raise exception 'Cross-user RLS leak'; end if;
    if jsonb_array_length(public.list_support_inquiries() -> 'items') <> 0 then raise exception 'Cross-user RPC leak'; end if;
    other_inquiry_id := public.create_support_inquiry(request_key,'general','다른 계정 문의','같은 요청 키도 다른 계정에서는 별개입니다.');
    if other_inquiry_id = inquiry_id then raise exception 'Request ownership crossed'; end if;
    begin
      perform public.list_support_inquiries(true);
      raise exception 'User/Pro can manage inquiries';
    exception when insufficient_privilege then null; end;
    begin
      perform public.reply_support_inquiry(inquiry_id,'answered','권한 없는 답변',now());
      raise exception 'User/Pro can reply';
    exception when insufficient_privilege then null; end;
    execute 'reset role';
  end loop;
  select account.id into owner_id
  from auth.users account
  where lower(account.email) = 'lion989072@gmail.com' and account.email_confirmed_at is not null
    and exists(select 1 from auth.identities identity where identity.user_id = account.id and identity.provider = 'google');
  if owner_id is null then raise exception 'Verified owner account needed'; end if;
  -- An uncommitted session fixture avoids requiring or issuing a real login token.
  -- Both this row and the accepted-session mapping revert at ROLLBACK.
  owner_session := gen_random_uuid();
  insert into auth.sessions(id,user_id,created_at,updated_at) values(owner_session,owner_id,now(),now());
  insert into private.account_login_sessions(user_id,session_id,session_created_at) values(owner_id,owner_session,now())
  on conflict(user_id) do update set session_id = excluded.session_id, session_created_at = excluded.session_created_at;
  select updated_at into version from public.support_inquiries where id = inquiry_id;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated','session_id',owner_session)::text,true);
  execute 'set local role authenticated';
  if not exists(select 1 from public.support_inquiries where id = inquiry_id) then raise exception 'Admin cannot read inquiries'; end if;
  if jsonb_array_length(public.list_support_inquiries(true) -> 'items') < 3 then raise exception 'Admin RPC listing failed'; end if;
  perform public.reply_support_inquiry(inquiry_id,'answered','검증용 관리자 답변입니다.',version);
  begin
    perform public.reply_support_inquiry(inquiry_id,'answered','이전 버전으로 덮어쓰기',version);
    raise exception 'Lost-update protection failed';
  exception when raise_exception then if sqlerrm <> 'INQUIRY_CONFLICT' then raise; end if; end;
  begin
    perform public.reply_support_inquiry(inquiry_id,'answered','',version);
    raise exception 'Empty answer accepted';
  exception when invalid_parameter_value then null; end;
  execute 'reset role';

  perform set_config('request.jwt.claims',jsonb_build_object('sub',actor_ids[1],'role','authenticated','session_id',session_ids[1])::text,true);
  execute 'set local role authenticated';
  if not exists(select 1 from public.support_inquiries where id = inquiry_id and status = 'answered' and reply = '검증용 관리자 답변입니다.') then raise exception 'Author cannot read reply'; end if;
  if jsonb_array_length(public.list_support_inquiries(false,'answered') -> 'items') <> 1 then raise exception 'Status filter failed'; end if;
  execute 'reset role';
  for i in 1..12 loop
    insert into public.support_inquiries(user_id,request_id,category,title,body,created_at)
    values(actor_ids[1],gen_random_uuid(),'general','페이지 검증 ' || i,'페이지 이동을 검증하는 문의 내용입니다.',now() - interval '2 minutes');
  end loop;
  execute 'set local role authenticated';
  first_page := public.list_support_inquiries();
  if jsonb_array_length(first_page -> 'items') <> 10 or not (first_page ->> 'has_more')::boolean then raise exception 'First page failed'; end if;
  cursor := first_page #> '{items,9}';
  next_page := public.list_support_inquiries(false,'all',(cursor ->> 'created_at')::timestamptz,(cursor ->> 'id')::uuid);
  if jsonb_array_length(next_page -> 'items') <> 3 or (next_page ->> 'has_more')::boolean then raise exception 'Second page failed'; end if;
  if exists(select 1 from jsonb_array_elements(first_page -> 'items') a join jsonb_array_elements(next_page -> 'items') b on a ->> 'id' = b ->> 'id') then raise exception 'Duplicate page entries'; end if;
  execute 'reset role';
  update public.support_inquiries set created_at = now() - interval '2 minutes' where user_id = actor_ids[1];
  execute 'set local role authenticated';
  begin
    perform public.create_support_inquiry(gen_random_uuid(),'general','일일 한도 확인','하루 등록 개수 제한을 확인합니다.');
    raise exception 'Daily limit bypass';
  exception when raise_exception then if sqlerrm <> 'INQUIRY_RATE_LIMIT' then raise; end if; end;
  execute 'reset role';
  perform set_config('request.jwt.claims',jsonb_build_object('sub',actor_ids[1],'role','authenticated','session_id',gen_random_uuid())::text,true);
  execute 'set local role authenticated';
  if exists(select 1 from public.support_inquiries) then raise exception 'Stale session RLS access'; end if;
  begin perform public.list_support_inquiries(); raise exception 'Stale session RPC access'; exception when insufficient_privilege then null; end;
  execute 'reset role';
  perform set_config('request.jwt.claims','{}',true);
  execute 'set local role anon';
  begin perform public.list_support_inquiries(); raise exception 'Anonymous RPC access'; exception when insufficient_privilege then null; end;
  execute 'reset role';
  insert into support_test_result values ('{"submission":"passed","idempotency":"passed","rate_limits":"passed","ownership_rls":"passed","admin_reply":"passed","conflicts":"blocked","pagination":[10,3],"stale_session":"blocked","anonymous":"blocked"}');
end;
$$;
select result from support_test_result;
rollback;
