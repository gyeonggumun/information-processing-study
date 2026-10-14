-- 관리자 본인에게만 적용되는 카드 순서와 복원 가능한 삭제 목록입니다.
create table public.exam_summary_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  card_order text[] not null default '{}',
  hidden_card_ids text[] not null default '{}',
  constraint exam_summary_card_order_valid check (
    cardinality(card_order) <= 512 and array_position(card_order, null) is null
  ),
  constraint exam_summary_hidden_cards_valid check (
    cardinality(hidden_card_ids) <= 512 and array_position(hidden_card_ids, null) is null
  )
);

comment on table public.exam_summary_preferences is '실기 요약의 계정별 카드 순서와 복원 가능한 삭제 목록';
alter table public.exam_summary_preferences enable row level security;
revoke all on table public.exam_summary_preferences from public, anon, authenticated;
grant select, insert, update on table public.exam_summary_preferences to authenticated;

create policy "Admins can read their own exam summary preferences"
on public.exam_summary_preferences for select to authenticated
using ((select auth.uid()) = user_id and (select public.get_my_app_role()) = 'admin');

create policy "Admins can create their own exam summary preferences"
on public.exam_summary_preferences for insert to authenticated
with check ((select auth.uid()) = user_id and (select public.get_my_app_role()) = 'admin');

create policy "Admins can update their own exam summary preferences"
on public.exam_summary_preferences for update to authenticated
using ((select auth.uid()) = user_id and (select public.get_my_app_role()) = 'admin')
with check ((select auth.uid()) = user_id and (select public.get_my_app_role()) = 'admin');
