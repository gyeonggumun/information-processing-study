create table public.support_inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  category text not null check (category in ('general', 'content', 'bug', 'account')),
  title text not null check (char_length(btrim(title)) between 2 and 120),
  body text not null check (char_length(btrim(body)) between 10 and 5000),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'answered')),
  reply text not null default '' check (char_length(reply) <= 5000),
  replied_by uuid references auth.users(id) on delete set null,
  replied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, request_id),
  check (status <> 'answered' or char_length(btrim(reply)) > 0)
);
create index support_inquiries_owner_page_idx on public.support_inquiries(user_id, created_at desc, id desc);
create index support_inquiries_status_page_idx on public.support_inquiries(status, created_at desc, id desc);
create index support_inquiries_page_idx on public.support_inquiries(created_at desc, id desc);
create index support_inquiries_replied_by_idx on public.support_inquiries(replied_by) where replied_by is not null;
alter table public.support_inquiries enable row level security;
revoke all on public.support_inquiries from public, anon, authenticated;
grant select on public.support_inquiries to authenticated;
create policy "Owners and admins can read inquiries with a current session"
on public.support_inquiries for select to authenticated
using ((select private.is_current_login_session()) and
  ((select auth.uid()) = user_id or (select private.can_manage_users())));

create function private.create_support_inquiry(p_request_id uuid, p_category text, p_title text, p_body text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  existing public.support_inquiries%rowtype;
  new_id uuid;
begin
  if caller_id is null or not private.is_current_login_session() then
    raise exception using errcode = '42501', message = 'Current login required';
  end if;
  p_title := btrim(p_title, E' \t\r\n');
  p_body := btrim(p_body, E' \t\r\n');
  if p_request_id is null or p_category is null or p_category not in ('general','content','bug','account')
    or p_title is null or char_length(btrim(p_title)) not between 2 and 120
    or p_body is null or char_length(btrim(p_body)) not between 10 and 5000 then
    raise exception using errcode = '22023', message = 'INQUIRY_INVALID';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('support:' || caller_id::text, 0));
  select * into existing from public.support_inquiries where user_id = caller_id and request_id = p_request_id;
  if found then
    if existing.category <> p_category or existing.title <> btrim(p_title) or existing.body <> btrim(p_body) then
      raise exception using errcode = '22023', message = 'INQUIRY_REQUEST_REUSED';
    end if;
    return existing.id;
  end if;
  if exists (select 1 from public.support_inquiries where user_id = caller_id and created_at > now() - interval '1 minute')
    or (select count(*) from public.support_inquiries where user_id = caller_id and created_at > now() - interval '24 hours') >= 10 then
    raise exception using errcode = 'P0001', message = 'INQUIRY_RATE_LIMIT';
  end if;
  insert into public.support_inquiries(user_id, request_id, category, title, body)
  values (caller_id, p_request_id, p_category, btrim(p_title), btrim(p_body)) returning id into new_id;
  return new_id;
end;
$$;
revoke all on function private.create_support_inquiry(uuid,text,text,text) from public, anon;
grant execute on function private.create_support_inquiry(uuid,text,text,text) to authenticated;
create function public.create_support_inquiry(p_request_id uuid, p_category text, p_title text, p_body text)
returns uuid language sql set search_path = ''
as $$ select private.create_support_inquiry(p_request_id, p_category, p_title, p_body); $$;
revoke all on function public.create_support_inquiry(uuid,text,text,text) from public, anon;
grant execute on function public.create_support_inquiry(uuid,text,text,text) to authenticated;

create function private.list_support_inquiries(p_admin boolean, p_status text, p_before_created_at timestamptz, p_before_id uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  result jsonb;
begin
  if caller_id is null or not private.is_current_login_session() then
    raise exception using errcode = '42501', message = 'Current login required';
  end if;
  if p_admin is null or p_status is null or p_status not in ('all','pending','in_progress','answered')
    or (p_before_created_at is null) <> (p_before_id is null) then
    raise exception using errcode = '22023', message = 'Invalid inquiry filter or cursor';
  end if;
  if p_admin and not private.can_manage_users() then
    raise exception using errcode = '42501', message = 'Admin access required';
  end if;
  with candidates as materialized (
    select q.id, q.user_id, q.category, q.title, q.body, q.status, q.reply, q.replied_at, q.created_at, q.updated_at,
      case when p_admin then account.email::text else null end as author_email,
      case when p_admin then profile.nickname else null end as author_nickname
    from public.support_inquiries q
    left join auth.users account on account.id = q.user_id
    left join public.profiles profile on profile.user_id = q.user_id
    where (p_admin or q.user_id = caller_id) and (p_status = 'all' or q.status = p_status)
      and (p_before_created_at is null or (q.created_at, q.id) < (p_before_created_at, p_before_id))
    order by q.created_at desc, q.id desc limit 11
  ), displayed as (select * from candidates order by created_at desc, id desc limit 10)
  select jsonb_build_object(
    'items', (select coalesce(jsonb_agg(to_jsonb(displayed) order by created_at desc, id desc), '[]'::jsonb) from displayed),
    'has_more', (select count(*) > 10 from candidates)
  ) into result;
  return result;
end;
$$;
revoke all on function private.list_support_inquiries(boolean,text,timestamptz,uuid) from public, anon;
grant execute on function private.list_support_inquiries(boolean,text,timestamptz,uuid) to authenticated;
create function public.list_support_inquiries(p_admin boolean default false, p_status text default 'all', p_before_created_at timestamptz default null, p_before_id uuid default null)
returns jsonb language sql stable set search_path = ''
as $$ select private.list_support_inquiries(p_admin, p_status, p_before_created_at, p_before_id); $$;
revoke all on function public.list_support_inquiries(boolean,text,timestamptz,uuid) from public, anon;
grant execute on function public.list_support_inquiries(boolean,text,timestamptz,uuid) to authenticated;

create function private.reply_support_inquiry(p_id uuid, p_status text, p_reply text, p_expected_updated_at timestamptz)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  current_updated_at timestamptz;
begin
  if auth.uid() is null or not private.can_manage_users() then
    raise exception using errcode = '42501', message = 'Admin access required';
  end if;
  p_reply := btrim(p_reply, E' \t\r\n');
  if p_status is null or p_status not in ('pending','in_progress','answered') or p_reply is null
    or char_length(btrim(p_reply)) > 5000 or (p_status = 'answered' and btrim(p_reply) = '')
    or (p_status <> 'answered' and btrim(p_reply) <> '') or p_expected_updated_at is null then
    raise exception using errcode = '22023', message = 'INQUIRY_REPLY_INVALID';
  end if;
  select updated_at into current_updated_at from public.support_inquiries where id = p_id for update;
  if not found then raise exception using errcode = '22023', message = 'INQUIRY_NOT_FOUND'; end if;
  if current_updated_at <> p_expected_updated_at then
    raise exception using errcode = 'P0001', message = 'INQUIRY_CONFLICT';
  end if;
  update public.support_inquiries set status = p_status, reply = btrim(p_reply), updated_at = clock_timestamp(),
    replied_at = case when p_status = 'answered' then clock_timestamp() else null end,
    replied_by = case when p_status = 'answered' then auth.uid() else null end
  where id = p_id;
end;
$$;
revoke all on function private.reply_support_inquiry(uuid,text,text,timestamptz) from public, anon;
grant execute on function private.reply_support_inquiry(uuid,text,text,timestamptz) to authenticated;
create function public.reply_support_inquiry(p_id uuid, p_status text, p_reply text, p_expected_updated_at timestamptz)
returns void language sql set search_path = ''
as $$ select private.reply_support_inquiry(p_id, p_status, p_reply, p_expected_updated_at); $$;
revoke all on function public.reply_support_inquiry(uuid,text,text,timestamptz) from public, anon;
grant execute on function public.reply_support_inquiry(uuid,text,text,timestamptz) to authenticated;
notify pgrst, 'reload schema';
