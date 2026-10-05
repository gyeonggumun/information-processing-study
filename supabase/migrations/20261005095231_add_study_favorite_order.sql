alter table public.study_favorites
  add column sort_order integer not null default 0;

with ranked as (
  select user_id, material_id,
    row_number() over (partition by user_id order by created_at desc, material_id) - 1 as position
  from public.study_favorites
)
update public.study_favorites as favorite
set sort_order = ranked.position
from ranked
where favorite.user_id = ranked.user_id
  and favorite.material_id = ranked.material_id;

create index study_favorites_user_sort_order_idx
  on public.study_favorites (user_id, sort_order);

grant update (sort_order) on public.study_favorites to authenticated;

create policy "Users can reorder their own study favorites"
on public.study_favorites
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create function public.reorder_study_favorites(p_material_ids text[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_material_ids is null
    or cardinality(p_material_ids) <> (
      select count(*) from public.study_favorites where user_id = (select auth.uid())
    )
    or (
      select count(distinct requested.material_id)
      from unnest(p_material_ids) as requested(material_id)
    ) <> cardinality(p_material_ids)
    or exists (
      select 1 from unnest(p_material_ids) as requested(material_id)
      where not exists (
        select 1 from public.study_favorites as favorite
        where favorite.user_id = (select auth.uid())
          and favorite.material_id = requested.material_id
      )
    )
  then
    raise exception 'Invalid favorite order';
  end if;

  update public.study_favorites as favorite
  set sort_order = requested.position::integer - 1
  from unnest(p_material_ids) with ordinality as requested(material_id, position)
  where favorite.user_id = (select auth.uid())
    and favorite.material_id = requested.material_id;
end;
$$;

revoke all on function public.reorder_study_favorites(text[]) from public, anon;
grant execute on function public.reorder_study_favorites(text[]) to authenticated;
