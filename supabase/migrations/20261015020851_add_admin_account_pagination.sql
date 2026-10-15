-- One admin-only snapshot: at most ten accounts and global role counts.
create function private.get_managed_users_page(
  p_search text, p_before_created_at timestamptz, p_before_user_id uuid
)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  result jsonb;
  caller_id uuid := auth.uid();
begin
  if caller_id is null or not private.can_manage_users() then
    raise exception using errcode = '42501', message = 'Admin access required';
  end if;

  -- The existing function validates search/cursor and uses the same stable ordering.
  with candidates as materialized (
    select * from private.list_managed_users_with_roles(p_search, p_before_created_at, p_before_user_id)
    order by created_at desc, user_id desc limit 11
  ), displayed as (
    select * from candidates order by created_at desc, user_id desc limit 10
  )
  select jsonb_build_object(
    'accounts', (select coalesce(jsonb_agg(to_jsonb(displayed) order by created_at desc, user_id desc), '[]'::jsonb) from displayed),
    'has_more', (select count(*) > 10 from candidates),
    'counts', (
      select jsonb_build_object(
        'total', count(*),
        'user', count(*) filter (where account.id <> caller_id and coalesce(assignment.app_role, 'user') = 'user'),
        'pro', count(*) filter (where account.id <> caller_id and assignment.app_role = 'pro'),
        'admin', count(*) filter (where account.id = caller_id)
      )
      from auth.users account
      left join private.account_app_roles assignment on assignment.user_id = account.id
    )
  ) into result;
  return result;
end;
$$;
revoke all on function private.get_managed_users_page(text, timestamptz, uuid) from public, anon;
grant execute on function private.get_managed_users_page(text, timestamptz, uuid) to authenticated;

create function public.get_managed_users_page(
  p_search text default '', p_before_created_at timestamptz default null,
  p_before_user_id uuid default null
)
returns jsonb language sql stable set search_path = ''
as $$ select private.get_managed_users_page(p_search, p_before_created_at, p_before_user_id); $$;
revoke all on function public.get_managed_users_page(text, timestamptz, uuid) from public, anon;
grant execute on function public.get_managed_users_page(text, timestamptz, uuid) to authenticated;

notify pgrst, 'reload schema';
