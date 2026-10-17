-- 일반 사용자의 DELETE 권한은 부여하지 않고, 서버에서 검증한 관리자만 초기화합니다.
create or replace function private.reset_managed_user_practice(p_user_id uuid, p_confirm_email text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  target_email text;
  deleted_count bigint;
begin
  if auth.uid() is null or not private.can_manage_users() then
    raise exception using errcode = '42501', message = 'Admin access required';
  end if;
  if p_user_id is null or p_confirm_email is null or btrim(p_confirm_email) = '' then
    raise exception using errcode = '22023', message = 'Target and confirmation email required';
  end if;
  select lower(account.email) into target_email from auth.users account
  where account.id = p_user_id for update;
  if not found or target_email is null or target_email <> lower(btrim(p_confirm_email)) then
    raise exception using errcode = '22023', message = 'Account or confirmation email mismatch';
  end if;

  -- 통계·오답노트·완료 문제는 이 테이블에서 계산합니다. 다른 계정·학습 설정은 건드리지 않습니다.
  delete from public.practice_attempts where user_id = p_user_id;
  get diagnostics deleted_count = row_count;
  return jsonb_build_object('user_id', p_user_id, 'deleted_count', deleted_count, 'reset_at', now());
end;
$$;
revoke all on function private.reset_managed_user_practice(uuid, text) from public, anon;
grant execute on function private.reset_managed_user_practice(uuid, text) to authenticated;

-- 노출된 API 함수 자체는 권한 상승 없이 private 구현의 관리자 검증을 거칩니다.
create or replace function public.reset_managed_user_practice(p_user_id uuid, p_confirm_email text)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.reset_managed_user_practice(p_user_id, p_confirm_email); $$;
revoke all on function public.reset_managed_user_practice(uuid, text) from public, anon;
grant execute on function public.reset_managed_user_practice(uuid, text) to authenticated;

notify pgrst, 'reload schema';
