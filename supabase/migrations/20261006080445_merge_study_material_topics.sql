-- 세부 학습 카드의 1/2, 2/2 즐겨찾기를 한 주제 카드로 통합합니다.
-- 같은 주제의 여러 부분을 즐겨찾기했다면 기존 순서가 가장 앞선 항목을 남깁니다.
with ranked as (
  select user_id, material_id,
    row_number() over (
      partition by user_id, regexp_replace(material_id, '-p[1-9][0-9]*$', '-p1')
      order by sort_order, created_at, material_id
    ) as position
  from public.study_favorites
  where material_id ~ '--g[0-9]+-p[1-9][0-9]*$'
)
delete from public.study_favorites as favorite
using ranked
where favorite.user_id = ranked.user_id
  and favorite.material_id = ranked.material_id
  and ranked.position > 1;

update public.study_favorites
set material_id = regexp_replace(material_id, '-p[2-9][0-9]*$', '-p1')
where material_id ~ '--g[0-9]+-p[2-9][0-9]*$';
