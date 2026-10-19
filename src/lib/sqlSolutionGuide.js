const guides = new Map();
const register = (families, rules, caution) => {
  for (const family of families.split(' ')) guides.set(family, { rules, caution });
};
register('where-count between in-sum', [
  '원본의 각 행에 WHERE를 대입해 참인 행만 남깁니다. BETWEEN a AND b는 양쪽 경계를 포함하고 IN은 나열한 값 중 하나와 일치하는지 검사합니다.',
  '필터를 마친 표에서 COUNT(*)는 남은 행 수를, SUM(열)은 해당 열의 값들을 더합니다. 행의 id나 조건에 쓴 기준값을 합산하는 것이 아닙니다.',
], '조건 검사 → 행 선택 → 집계 순서입니다. 경계값의 포함 여부와 실제로 집계하는 열을 확인하세요.');
register('like-order like-desc-blanks additional-like-keyword-completion', [
  'LIKE의 %는 0글자 이상의 임의 문자열, _는 정확히 한 글자입니다. 예를 들어 강%는 강으로 시작하는 이름이며 %강은 강으로 끝나는 이름입니다.',
  '패턴에 맞는 행을 고른 다음 ORDER BY의 열을 기준으로 정렬합니다. DESC는 큰 값부터, ASC 또는 방향 생략은 작은 값부터이며 SELECT에 적힌 열만 출력합니다.',
], '정렬 기준 열과 출력할 열은 다를 수 있습니다. 빈칸 문제라면 패턴의 작은따옴표까지 필요한지 확인하세요.');
register('distinct count-null additional-nullable-distinct-count', [
  'COUNT(*)는 NULL이 포함된 행도 전부 셉니다. COUNT(열)은 그 열이 NULL인 행을 제외하며 COUNT(DISTINCT 열)은 거기에 중복 값까지 한 번만 셉니다.',
  'SELECT DISTINCT는 선택한 열들의 조합을 기준으로 중복 행을 제거합니다. 먼저 WHERE를 적용한 결과에서 중복 여부를 판단합니다.',
], 'NULL은 숫자 0도 빈 문자열도 아닙니다. 값이 0인 행은 COUNT(열)에 포함되지만 NULL인 행은 빠집니다.');
register('group-count having group-having-sum additional-join-group-threshold derived-group-count cte-aggregate', [
  'WHERE가 있으면 개별 행을 먼저 고르고 GROUP BY의 값이 같은 행끼리 묶습니다. 각 그룹의 COUNT·SUM을 별도로 계산한 뒤 HAVING 조건으로 그룹을 선택합니다.',
  '바깥 SELECT가 안쪽 결과를 세는 구조라면 안쪽의 한 행은 원본 한 건이 아니라 그룹 하나입니다. 마지막 ORDER BY는 선택된 그룹 결과의 출력 순서를 정합니다.',
], 'WHERE는 집계 전 행, HAVING은 집계 후 그룹을 거릅니다. 바깥 COUNT를 원본 데이터의 건수로 계산하지 마세요.');
register('inner-join-sum left-unmatched right-join self-join additional-outer-join-null-filter', [
  'ON을 만족하는 왼쪽·오른쪽 행의 조합을 만듭니다. 같은 id에 대응하는 행이 둘이면 조인 결과도 두 행이므로 원본의 고유 id 수와 결과 행 수는 다를 수 있습니다.',
  'LEFT는 왼쪽, RIGHT는 오른쪽의 미연결 행을 보존하고 반대편 열을 NULL로 채웁니다. 이 표에 WHERE를 적용한 뒤 SELECT의 열이나 집계값을 구합니다.',
], 'NULL은 실제 데이터에도 있을 수 있습니다. WHERE B.amount IS NULL이 반드시 미연결만 뜻하지는 않으며 COUNT(*)는 중복 조인 행도 셉니다.');
register('above-average dept-average nested-correlated additional-nested-average-correlated', [
  'AVG는 대상 값의 합을 NULL 아닌 값의 개수로 나눕니다. 외부 별칭을 참조하지 않으면 전체 기준값을 한 번 구할 수 있지만, 참조하면 현재 외부 행마다 대상을 새로 정해야 합니다.',
  '외부 행 하나를 고정하고 안쪽 조건에 그 값을 대입합니다. 가장 안쪽의 대상 목록 → 중간 평균 → 외부 비교 순으로 계산하며 대상이 없으면 AVG는 NULL이어서 > 비교를 통과하지 않습니다.',
], '평균을 반올림한 표시값으로 경계 비교하지 마세요. 같은 id의 내부 행이 여러 개면 AVG에는 각 행이 모두 포함됩니다.');
register('join-having-average group-having-subquery-average conditional-having', [
  '서브쿼리에서 비교 기준 평균을 먼저 구합니다. 전체 한 건의 평균인지, 특정 상태의 평균인지 WHERE의 범위를 구분해야 합니다.',
  '외부 질의는 조인·필터 후 그룹별 합계를 구해 그 기준과 비교합니다. SUM(CASE...)이면 조건에 맞는 행만 금액을 더하고 ELSE의 값도 집계에 반영합니다.',
], '그룹 합계와 건별 평균은 단위가 다릅니다. 그룹 평균이나 그룹 합계들의 평균으로 바꿔 계산하지 마세요.');
register('in-subquery exists-correlated not-in-null', [
  'IN은 내부 결과 목록에 외부 값이 있는지, EXISTS는 조건에 맞는 내부 행이 하나라도 있는지 검사합니다. 내부에 같은 값이 여러 번 있어도 외부 행이 그만큼 복제되지는 않습니다.',
  'NOT IN 목록에 NULL이 있으면 일치하지 않는 값도 비교가 UNKNOWN이 될 수 있습니다. WHERE는 참만 통과시키며 거짓과 UNKNOWN은 모두 제외합니다.',
], 'NOT IN을 무조건 차집합처럼 계산하지 마세요. NULL이 있는지와 외부 값이 NULL인지 먼저 검사하세요.');
register('division additional-division-missing-course', [
  '외부 대상 하나와 필수 항목 하나를 고정합니다. 안쪽 NOT EXISTS가 참이면 그 대상에게 해당 필수 항목의 이력이 없다는 뜻입니다.',
  '바깥 NOT EXISTS는 그러한 누락 필수 항목이 하나도 없는 대상만 고릅니다. 대상별로 필수 항목 체크표를 만들고 모두 충족한 행만 남기면 이중 부정을 풀 수 있습니다.',
], '같은 필수 항목을 중복으로 이수한 것은 서로 다른 두 항목을 이수한 것과 다릅니다. EXISTS는 건수가 아니라 존재 여부를 봅니다.');
register('union-distinct additional-union-sum', [
  'UNION은 두 SELECT 결과를 합친 뒤 동일한 전체 행을 한 번만 남깁니다. UNION ALL은 테이블 내부와 테이블 사이의 중복을 모두 유지합니다.',
  '합쳐진 결과 표를 먼저 만든 뒤 바깥 SUM·COUNT를 적용합니다. SELECT가 여러 열이면 한 열이 같아도 다른 열이 다르면 서로 다른 행입니다.',
], 'UNION 자체는 원하는 출력 순서를 보장하지 않습니다. 순서는 ORDER BY가 있는 경우에 그 기준을 따릅니다.');
register('insert-values foreign-key-ddl create-domain-check', [
  'INSERT의 열 목록과 VALUES의 값은 같은 위치끼리 대응합니다. FOREIGN KEY는 자식 열, REFERENCES는 참조할 부모 테이블과 열을 지정합니다.',
  'CHECK는 입력 가능한 값의 조건입니다. CREATE DOMAIN 안의 VALUE는 그 도메인에 입력될 값이며 범위 조건에서 >=·<=가 경계를 포함하는지 확인합니다.',
], '키워드 빈칸은 조회 결과값을 쓰는 문제가 아닙니다. 선언하는 대상과 참조되는 대상을 반대로 쓰지 마세요.');
register('update-select delete-select additional-update-average-filter', [
  '명령을 위에서 아래로 수행합니다. UPDATE는 조건에 맞는 행의 지정 열만 바꾸고 DELETE는 조건에 맞는 행 자체를 없앱니다. 조건 밖의 행은 그대로입니다.',
  '이후 SELECT는 변경 전 표가 아니라 변경을 마친 표에서 계산합니다. 조건이 AND이면 둘 다 참이어야 하며 평균 서브쿼리로 대상 id를 정했다면 그 집합을 확인하고 값을 갱신합니다.',
], 'UPDATE로 값이 달라진 행을 집계할 때 원래 값을 더하지 마세요. 문제의 마지막 조회 열·정렬 순서도 반영해야 합니다.');
export const getSqlSolutionGuide = question => guides.get(question.family);
