import { addCodeFamily } from './additionalQuestionFactory.js';
const questions = [];
const add = (level, family, title, refs, build) => addCodeFamily(questions, 'SQL', level, family, title, refs, build);
const table = (name, columns, rows) => ({ name, columns, rows });
const answer = (tables, code, value, explanation, steps) => ({ tables, code, answerText: String(value), answerMode: 'result', prompt: '표와 SQL을 참고하여 결과를 행·열 순서대로 작성하세요.', explanation, steps });
add('하', 'like-keyword-completion', '조회 패턴과 정렬 키워드 완성', ['past-2026-2-q12'], v => {
  const prefix = ['강', '문', '조', '유', '송'][v];
  return { tables: [table('PERSON', ['id', 'name'], [[21, prefix + '하나'], [24, '박누리'], [27, prefix + '두리']])],
    code: 'SELECT id, name FROM PERSON\nWHERE name LIKE ①\nORDER BY id ②;', answerText: `'${prefix}%', DESC`, answerMode: 'blanks',
    prompt: `성이 '${prefix}'인 사람을 id 큰 순서로 조회하려 합니다. ①에는 작은따옴표를 포함한 패턴, ②에는 정렬 키워드를 순서대로 작성하세요.`,
    explanation: 'LIKE에서 %는 길이 0 이상인 임의 문자열이므로 성 뒤의 이름 전체를 허용하려면 접두어 다음에 붙입니다. 문자열 패턴은 작은따옴표로 감싸고 내림차순은 DESC입니다. 두 빈칸을 쉼표로 나누어 순서대로 작성합니다.',
    steps: [`'${prefix}%'는 해당 성으로 시작하는 이름을 선택합니다.`, 'id=27, 21 순서가 되도록 DESC를 지정합니다.'] };
});
add('하', 'nullable-distinct-count', '전체 행 수와 NULL 제외 및 중복 제거', ['past-2025-3-q20'], v => {
  const rows = [[1, v + 2], [2, null], [3, v + 2], [4, v + 5], [5, null], [6, v + 8]];
  return answer([table('MEASURE', ['id', 'value'], rows)], 'SELECT COUNT(*) AS all_rows, COUNT(value) AS known_rows, COUNT(DISTINCT value) AS distinct_values\nFROM MEASURE;', '6 4 3',
    'COUNT(*)는 NULL이 든 행도 모두 셉니다. COUNT(value)는 그 열이 NULL인 행을 제외하고, COUNT(DISTINCT value)는 NULL을 제외한 뒤 같은 값의 중복도 제거합니다. 출력 열의 순서를 바꾸지 않도록 주의합니다.',
    ['전체 행은 여섯 개입니다.', `NULL 아닌 값 네 개 중 ${v + 2}가 두 번 나와 고유 값은 세 개입니다.`]);
});
add('중', 'join-group-threshold', '조인 후 그룹 합계와 HAVING', ['past-2026-1-q18', 'past-2023-1-q16'], v => {
  const rows = [[1, 1, 15 + v], [2, 1, 20 + v], [3, 2, 8 + v], [4, 2, 12 + v], [5, 3, 40 + v]], limit = 28 + v;
  const sums = [1, 2, 3].map(id => rows.filter(r => r[1] === id).reduce((s, r) => s + r[2], 0));
  const selected = [1, 2, 3].filter(id => sums[id - 1] > limit);
  return answer([table('TEAM', ['id', 'label'], [[1, '가'], [2, '나'], [3, '다']]), table('POINTS', ['id', 'team_id', 'score'], rows)],
    `SELECT T.id, SUM(P.score) AS total\nFROM TEAM T JOIN POINTS P ON T.id = P.team_id\nGROUP BY T.id\nHAVING SUM(P.score) > ${limit}\nORDER BY T.id;`, selected.map(id => `${id} ${sums[id - 1]}`).join('\n'),
    '조인은 팀마다 여러 점수 행을 연결하고 GROUP BY는 연결된 행을 팀별로 묶습니다. HAVING은 집계가 끝난 합계에 조건을 적용합니다. 원본 점수 한 건이 조건을 넘는지 검사하는 WHERE와 구분합니다.',
    [`팀별 합계는 ${sums.join(', ')}입니다.`, `${limit}보다 큰 팀 ${selected.join(', ')}를 id 오름차순으로 출력합니다.`]);
});
add('중', 'update-average-filter', '서브쿼리 기준의 UPDATE 후 조회', ['past-2024-2-q3'], v => {
  const scores = [10 + v, 20 + v, 30 + v, 40 + v], avg = scores.reduce((s, n) => s + n, 0) / scores.length, bonus = v + 6;
  const updated = scores.map(n => n < avg ? n + bonus : n);
  return answer([table('RESULTS', ['id', 'score'], scores.map((n, i) => [i + 1, n]))],
    `UPDATE RESULTS SET score = score + ${bonus}\nWHERE id IN (SELECT id FROM RESULTS WHERE score < (SELECT AVG(score) FROM RESULTS));\nSELECT id, score FROM RESULTS ORDER BY id;`, updated.map((n, i) => `${i + 1} ${n}`).join('\n'),
    'UPDATE의 대상은 문장 실행 시 평균보다 작은 score를 가진 id 집합입니다. 해당 행에만 보너스를 더하고 SELECT는 변경 후 값을 조회합니다. 이 문제의 갱신 후에도 선택 행과 제외 행의 경계는 뒤집히지 않습니다.',
    [`원래 평균은 ${avg}이고 id 1·2가 대상입니다.`, `두 행에 ${bonus}를 더한 뒤 값은 ${updated.join(', ')}입니다.`, '마지막 SELECT의 id 오름차순을 따라 네 행을 작성합니다.']);
});
add('중', 'union-sum', 'UNION과 UNION ALL의 합계 차이', ['past-2023-3-q6'], v => {
  const a = [v + 2, v + 5, v + 5], b = [v + 5, v + 9], unique = [...new Set([...a, ...b])], all = [...a, ...b];
  return answer([table('FIRST_SET', ['value'], a.map(n => [n])), table('SECOND_SET', ['value'], b.map(n => [n]))],
    'SELECT\n (SELECT SUM(value) FROM (SELECT value FROM FIRST_SET UNION SELECT value FROM SECOND_SET) AS U) AS distinct_sum,\n (SELECT SUM(value) FROM (SELECT value FROM FIRST_SET UNION ALL SELECT value FROM SECOND_SET) AS A) AS all_sum;', `${unique.reduce((s, n) => s + n, 0)} ${all.reduce((s, n) => s + n, 0)}`,
    'UNION은 두 조회 결과 전체에서 중복 행을 한 번만 남깁니다. UNION ALL은 같은 테이블 안의 중복과 두 테이블 사이의 중복을 모두 유지합니다. 각각 만들어진 결과 집합에 SUM을 적용한 두 값을 순서대로 비교합니다.',
    [`UNION의 값은 ${unique.join(', ')}입니다.`, `UNION ALL은 ${all.join(', ')} 다섯 값을 전부 더합니다.`]);
});
add('상', 'nested-average-correlated', '외부 행과 중첩 평균 서브쿼리', ['past-2026-2-q13'], v => {
  const a = [[1, 12 + v], [2, 26 + v], [3, 34 + v], [4, 47 + v]], b = [[1, 7 + v], [1, 15 + v], [2, 22 + v], [3, 55 + v], [5, 90 + v]], trace = [];
  const count = a.filter(row => {
    const ids = a.filter(other => other[1] < row[1]).map(other => other[0]), values = b.filter(other => ids.includes(other[0])).map(other => other[1]);
    const avg = values.length ? values.reduce((s, n) => s + n, 0) / values.length : null;
    trace.push(`A.id=${row[0]}: 비교 평균은 ${avg === null ? 'NULL' : avg}입니다.`);
    return avg !== null && row[1] > avg;
  }).length;
  return answer([table('A', ['id', 'amount'], a), table('B', ['id', 'reward'], b)],
    'SELECT COUNT(*) AS result FROM A\nWHERE amount > (\n SELECT AVG(reward) FROM B\n WHERE B.id IN (SELECT P.id FROM A P WHERE P.amount < A.amount)\n);', count,
    '가장 안쪽 A.amount는 현재 외부 행을 가리킵니다. 그보다 작은 amount를 가진 P의 id 집합을 구한 뒤 해당 B 행 전체의 reward 평균을 계산합니다. 같은 id의 B 행이 두 개면 둘 다 평균에 포함하며, 대상이 비면 AVG는 NULL이어서 비교가 참이 아닙니다.', [...trace, `조건이 참인 외부 행은 ${count}개입니다.`]);
});
add('상', 'outer-join-null-filter', '외부 조인에서 NULL 필터와 중복 행 수', ['past-2026-2-q14'], v => {
  const a = [[1, 10 + v], [2, 20 + v], [3, 30 + v], [4, 40 + v]], b = [[1, 8 + v], [1, 18 + v], [2, null], [3, 35 + v]], boundary = 22 + v;
  let count = 0;
  for (const row of a) {
    const matches = b.filter(other => other[0] === row[0]);
    count += matches.length ? matches.filter(other => other[1] === null || other[1] < boundary).length : 1;
  }
  return answer([table('ACCOUNT', ['id', 'credit'], a), table('EVENT', ['account_id', 'cost'], b)],
    `SELECT COUNT(*) AS result\nFROM ACCOUNT A LEFT JOIN EVENT E ON A.id = E.account_id\nWHERE E.cost IS NULL OR E.cost < ${boundary};`, count,
    'LEFT JOIN은 왼쪽 행을 보존하지만 대응되는 오른쪽 행이 여러 개면 조인 결과도 여러 행입니다. 오른쪽 데이터 자체의 NULL과 미연결 행을 위해 채운 NULL은 모두 IS NULL 조건을 통과합니다. COUNT(*)는 필터 뒤의 조인 행 수를 셉니다.',
    ['id 1은 두 연결 행이 모두 금액 조건을 통과합니다.', 'id 2는 실제 NULL, id 4는 미연결 NULL이므로 포함되고 id 3은 제외됩니다.', `최종 결과는 ${count}행입니다.`]);
});
add('상', 'division-missing-course', '이중 NOT EXISTS와 필수 항목 전체 충족', ['past-2025-3-q14'], v => {
  const ids = [v + 11, v + 21, v + 31, v + 41], courses = ['DB', 'OS'], enroll = [[ids[0], 'DB'], [ids[0], 'OS'], [ids[0], 'DB'], [ids[1], 'DB'], [ids[2], 'DB'], [ids[2], 'OS']];
  return answer([table('LEARNER', ['id'], ids.map(id => [id])), table('REQUIRED', ['course'], courses.map(c => [c])), table('ENROLL', ['learner_id', 'course'], enroll)],
    'SELECT L.id FROM LEARNER L\nWHERE NOT EXISTS (\n SELECT 1 FROM REQUIRED R\n WHERE NOT EXISTS (\n  SELECT 1 FROM ENROLL E WHERE E.learner_id = L.id AND E.course = R.course\n )\n)\nORDER BY L.id;', `${ids[0]}\n${ids[2]}`,
    '안쪽 NOT EXISTS는 한 필수 과목을 이수하지 못한 경우를 찾습니다. 바깥 NOT EXISTS는 그러한 누락 과목이 하나도 없는 학습자만 선택합니다. EXISTS는 존재 여부만 보므로 같은 과목을 중복 등록한 행이 결과 학습자를 늘리지는 않습니다.',
    [`필수 과목 DB·OS를 모두 가진 학습자는 ${ids[0]}, ${ids[2]}입니다.`, `${ids[1]}은 OS 누락, ${ids[3]}은 두 과목 모두 누락입니다.`, '중복 DB 행을 여러 이수 조건으로 계산하지 않고 id 순서대로 두 행을 출력합니다.']);
});
export const additionalSqlQuestions = questions;
