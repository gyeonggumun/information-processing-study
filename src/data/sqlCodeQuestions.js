// 공개된 실기 복원 자료의 SQL 출제 유형을 참고한 창작 변형 문제입니다. 실제 기출 원문은 아닙니다.
// 참고: https://jeongcheogi.edugamja.com/coding/coding-expected-questions-sql
// SQL 동작 확인: https://www.postgresql.org/docs/current/queries.html
const questions = [];
const levelIds = { 하: 'easy', 중: 'medium', 상: 'hard' };
const table = (name, columns, rows) => ({ name, columns, rows });
const result = (tables, code, answerText, explanation, steps, prompt = '표와 SQL문을 참고하여 조회 결과를 순서대로 작성하세요.') =>
  ({ tables, code, answerText: String(answerText), explanation, steps, prompt, answerMode: 'result' });
const blanks = (tables, code, answerText, explanation, steps, prompt) =>
  ({ tables, code, answerText, explanation, steps, prompt, answerMode: 'blanks' });

function addFamily(difficulty, family, title, build) {
  for (let variant = 0; variant < 5; variant += 1) {
    const number = questions.filter((question) => question.difficulty === difficulty).length + 1;
    questions.push({
      id: `sql-${levelIds[difficulty]}-${String(number).padStart(3, '0')}`,
      language: 'SQL', difficulty, family, variant: variant + 1, title,
      source: '실기 출제 유형 기반 창작 변형', ...build(variant),
    });
  }
}

function students(v) {
  return table('STUDENT', ['id', 'name', 'dept', 'score', 'mentor_id'], [
    [1, '김민수', '개발', 62 + v * 2, null],
    [2, '이서연', '개발', 78 + v, null],
    [3, '박지훈', '운영', 85 - v, 1],
    [4, '이하늘', '운영', 91 - v * 2, 2],
    [5, '최유진', '보안', 70 + v * 3, 2],
    [6, '정다은', '개발', 74 + v * 2, 3],
  ]);
}

function customers() {
  return table('CUSTOMER', ['id', 'name'], [[1, '가온'], [2, '누리'], [3, '다솜'], [4, '라온']]);
}

function orders(v) {
  return table('ORDERS', ['id', 'customer_id', 'amount', 'status'], [
    [1, 1, 10 + v * 2, '완료'], [2, 1, 20 + v, '취소'],
    [3, 2, 30 + v * 3, '완료'], [4, 2, 15 + v * 2, '완료'],
    [5, 3, 25 + v, '취소'], [6, 3, 40 + v * 2, '완료'],
  ]);
}

// 하: 단일 테이블 조회·정렬·집계와 기본 DML 문장 완성.
addFamily('하', 'where-count', 'WHERE 조건을 만족하는 행 수', (v) => {
  const t = students(v), boundary = 70 + v * 3;
  const count = t.rows.filter((row) => row[3] >= boundary).length;
  return result([t], `SELECT COUNT(*) AS result\nFROM STUDENT\nWHERE score >= ${boundary};`, count,
    'WHERE는 집계 전에 행을 걸러냅니다. 남은 행의 수를 COUNT(*)로 셉니다.',
    [`score가 ${boundary} 이상인 학생만 남깁니다.`, `남은 ${count}행을 COUNT(*)가 반환합니다.`], 'result 값을 작성하세요.');
});

addFamily('하', 'like-order', 'LIKE와 내림차순 정렬', (v) => {
  const t = students(v), prefix = ['이', '김', '박', '최', '정'][v];
  const names = t.rows.filter((row) => row[1].startsWith(prefix)).sort((a, b) => b[0] - a[0]).map((row) => row[1]);
  return result([t], `SELECT name\nFROM STUDENT\nWHERE name LIKE '${prefix}%'\nORDER BY id DESC;`, names.join('\n'),
    'LIKE의 %는 길이가 0개 이상인 임의의 문자를 뜻합니다. ORDER BY id DESC는 id 큰 순서로 정렬합니다.',
    [`'${prefix}'으로 시작하는 이름을 고릅니다.`, 'id를 내림차순으로 정렬한 뒤 name 열만 출력합니다.'], '조회되는 name을 위에서 아래 순서로 작성하세요.');
});

addFamily('하', 'between', 'BETWEEN 범위의 행 수', (v) => {
  const t = students(v), low = 68 + v * 2, high = 84 + v;
  const count = t.rows.filter((row) => row[3] >= low && row[3] <= high).length;
  return result([t], `SELECT COUNT(*) AS result\nFROM STUDENT\nWHERE score BETWEEN ${low} AND ${high};`, count,
    'BETWEEN은 양쪽 경계값을 모두 포함합니다.', [`${low} 이상 ${high} 이하인 score만 선택합니다.`, `조건에 맞는 행은 ${count}개입니다.`], 'result 값을 작성하세요.');
});

addFamily('하', 'in-sum', 'IN 조건과 SUM', (v) => {
  const t = orders(v), ids = [1 + v % 2, 3 + v % 2, 6];
  const sum = t.rows.filter((row) => ids.includes(row[0])).reduce((total, row) => total + row[2], 0);
  return result([t], `SELECT SUM(amount) AS result\nFROM ORDERS\nWHERE id IN (${ids.join(', ')});`, sum,
    'IN 목록에 포함된 id의 amount만 더합니다.', [`id가 ${ids.join(', ')}인 행을 고릅니다.`, `선택한 금액을 합치면 ${sum}입니다.`], 'result 값을 작성하세요.');
});

addFamily('하', 'distinct', 'DISTINCT로 중복 제거', (v) => {
  const t = students(v), boundary = 60 + v * 5;
  const count = new Set(t.rows.filter((row) => row[3] >= boundary).map((row) => row[2])).size;
  return result([t], `SELECT COUNT(*) AS result\nFROM (SELECT DISTINCT dept FROM STUDENT WHERE score >= ${boundary}) AS D;`, count,
    '조건을 먼저 적용하고 DISTINCT로 중복 부서를 한 번씩만 남깁니다.',
    [`score가 ${boundary} 이상인 학생의 dept를 고릅니다.`, `중복을 제거한 부서는 ${count}개입니다.`], 'result 값을 작성하세요.');
});

addFamily('하', 'count-null', 'COUNT 열과 NULL의 차이', (v) => {
  const t = students(v), boundary = 1 + v;
  const count = t.rows.filter((row) => row[0] >= boundary && row[4] !== null).length;
  return result([t], `SELECT COUNT(mentor_id) AS result\nFROM STUDENT\nWHERE id >= ${boundary};`, count,
    'COUNT(열)은 NULL을 제외하고 셉니다. COUNT(*)와 혼동하지 마세요.',
    [`id가 ${boundary} 이상인 행을 살핍니다.`, `그중 mentor_id가 NULL이 아닌 행은 ${count}개입니다.`], 'result 값을 작성하세요.');
});

addFamily('하', 'group-count', 'GROUP BY로 부서별 인원 집계', (v) => {
  const t = students(v), boundary = 60 + v * 5;
  const groups = Object.entries(Object.groupBy(t.rows.filter((row) => row[3] >= boundary), (row) => row[2])).sort(([a], [b]) => a.localeCompare(b, 'ko'));
  return result([t], `SELECT dept, COUNT(*) AS cnt\nFROM STUDENT\nWHERE score >= ${boundary}\nGROUP BY dept\nORDER BY dept ASC;`, groups.map(([dept, rows]) => `${dept} ${rows.length}`).join('\n'),
    'WHERE로 행을 거른 뒤 GROUP BY로 같은 부서끼리 묶습니다. ORDER BY가 출력 순서를 고정합니다.',
    [`score ${boundary} 이상만 남깁니다.`, '부서별로 묶어 각각의 행 수를 셉니다.', '부서명 오름차순으로 출력합니다.'], '출력되는 dept와 cnt를 한 줄에 한 행씩 작성하세요.');
});

addFamily('하', 'having', 'HAVING으로 그룹 조건 적용', (v) => {
  const t = orders(v), boundary = 20 + v * 5;
  const groups = [1, 2, 3].filter((id) => t.rows.filter((row) => row[1] === id && row[2] >= boundary).length >= 2);
  return result([t], `SELECT COUNT(*) AS result FROM (\n  SELECT customer_id\n  FROM ORDERS\n  WHERE amount >= ${boundary}\n  GROUP BY customer_id\n  HAVING COUNT(*) >= 2\n) AS G;`, groups.length,
    'WHERE는 개별 주문을, HAVING은 묶인 고객 그룹을 걸러냅니다.',
    [`amount가 ${boundary} 이상인 주문만 남깁니다.`, '고객별로 묶어 주문이 2건 이상인 그룹을 고릅니다.', `그룹 수는 ${groups.length}개입니다.`], 'result 값을 작성하세요.');
});

addFamily('하', 'insert-values', 'INSERT문의 VALUES 완성', (v) => {
  const t = table('MEMBER', ['id', 'name'], [[1 + v, '가온']]);
  return blanks([t], `INSERT INTO MEMBER (id, name)\n① (${2 + v}, '누리');`, 'VALUES',
    'INSERT INTO 뒤의 열 목록에 대응하는 값을 VALUES 뒤의 괄호에 순서대로 적습니다.',
    ['삽입할 테이블과 열을 확인합니다.', '열 목록 뒤에는 VALUES 키워드가 옵니다.'], '①에 들어갈 SQL 키워드를 작성하세요.');
});

addFamily('하', 'like-desc-blanks', 'LIKE 패턴과 DESC 빈칸', (v) => {
  const t = students(v), prefix = ['이', '김', '박', '최', '정'][v];
  return blanks([t], `SELECT name FROM STUDENT\nWHERE name LIKE '①'\nORDER BY id ②;`, `${prefix}%, DESC`,
    '접두어 검색은 LIKE 패턴 뒤에 %를 붙이고, 큰 id부터 보려면 DESC를 사용합니다.',
    [`'${prefix}'으로 시작하는 모든 이름은 '${prefix}%'로 찾습니다.`, '내림차순 지정은 DESC입니다.'], `이름이 '${prefix}'으로 시작하는 학생을 id 내림차순으로 조회합니다. ①, ②의 답을 쉼표로 구분해 작성하세요.`);
});

// 중: 조인·서브쿼리·집합 연산·데이터 변경 결과 추적.
addFamily('중', 'inner-join-sum', 'INNER JOIN 후 금액 합계', (v) => {
  const c = customers(), o = orders(v), target = 1 + v % 3;
  const sum = o.rows.filter((row) => row[1] === target && row[3] === '완료').reduce((n, row) => n + row[2], 0);
  return result([c, o], `SELECT SUM(O.amount) AS result\nFROM CUSTOMER C INNER JOIN ORDERS O ON C.id = O.customer_id\nWHERE C.id = ${target} AND O.status = '완료';`, sum,
    '조인 조건으로 고객과 주문을 연결한 뒤 완료 주문만 합산합니다.',
    [`고객 ${target}번과 연결되는 주문을 찾습니다.`, `상태가 완료인 주문의 합계는 ${sum}입니다.`], 'result 값을 작성하세요.');
});

addFamily('중', 'left-unmatched', 'LEFT JOIN에서 주문 없는 고객', (v) => {
  const c = customers(), o = orders(v), boundary = 1 + v % 3;
  const count = c.rows.filter((row) => row[0] >= boundary && !o.rows.some((order) => order[1] === row[0])).length;
  return result([c, o], `SELECT COUNT(*) AS result\nFROM CUSTOMER C LEFT JOIN ORDERS O ON C.id = O.customer_id\nWHERE C.id >= ${boundary} AND O.id IS NULL;`, count,
    'LEFT JOIN은 왼쪽 고객을 모두 유지합니다. 매칭 주문이 없으면 오른쪽 열이 NULL입니다.',
    [`id ${boundary} 이상 고객을 살핍니다.`, `연결된 주문이 없는 고객은 ${count}명입니다.`], 'result 값을 작성하세요.');
});

addFamily('중', 'group-having-sum', 'GROUP BY와 HAVING 합계 기준', (v) => {
  const o = orders(v), boundary = 35 + v * 5;
  const sums = [1, 2, 3].map((id) => [id, o.rows.filter((row) => row[1] === id).reduce((n, row) => n + row[2], 0)]).filter(([, sum]) => sum >= boundary);
  return result([o], `SELECT customer_id, SUM(amount) AS total\nFROM ORDERS\nGROUP BY customer_id\nHAVING SUM(amount) >= ${boundary}\nORDER BY customer_id;`, sums.map(([id, sum]) => `${id} ${sum}`).join('\n'),
    '고객별 합계를 먼저 구하고 HAVING으로 합계 기준을 적용합니다.',
    ['customer_id별로 amount를 합칩니다.', `${boundary} 이상인 그룹만 남깁니다.`, 'customer_id 오름차순으로 출력합니다.'], 'customer_id와 total을 한 줄에 한 행씩 작성하세요.');
});

addFamily('중', 'above-average', '전체 평균보다 높은 값', (v) => {
  const t = students(v), avg = t.rows.reduce((n, row) => n + row[3], 0) / t.rows.length;
  const count = t.rows.filter((row) => row[3] > avg).length;
  return result([t], 'SELECT COUNT(*) AS result\nFROM STUDENT\nWHERE score > (SELECT AVG(score) FROM STUDENT);', count,
    '스칼라 서브쿼리에서 전체 평균을 먼저 계산하고, 외부 WHERE의 각 점수와 비교합니다.',
    [`전체 score 평균은 ${avg.toFixed(2)}입니다.`, `평균보다 엄격히 큰 학생은 ${count}명입니다.`], 'result 값을 작성하세요.');
});

addFamily('중', 'in-subquery', 'IN 서브쿼리로 고객 선택', (v) => {
  const c = customers(), o = orders(v), boundary = 25 + v * 3;
  const ids = new Set(o.rows.filter((row) => row[2] >= boundary && row[3] === '완료').map((row) => row[1]));
  return result([c, o], `SELECT COUNT(*) AS result FROM CUSTOMER\nWHERE id IN (SELECT customer_id FROM ORDERS\n             WHERE amount >= ${boundary} AND status = '완료');`, c.rows.filter((row) => ids.has(row[0])).length,
    '서브쿼리가 반환한 고객 id 목록으로 외부 CUSTOMER의 id를 검사합니다. 같은 id가 여러 번 나와도 고객 행은 한 번만 셉니다.',
    [`완료 주문 중 ${boundary} 이상인 고객 id를 모읍니다.`, 'IN 목록에 속한 고객을 셉니다.'], 'result 값을 작성하세요.');
});

addFamily('중', 'exists-correlated', 'EXISTS 상관 서브쿼리', (v) => {
  const c = customers(), o = orders(v), boundary = 20 + v * 5;
  const count = c.rows.filter((row) => o.rows.some((order) => order[1] === row[0] && order[2] > boundary)).length;
  return result([c, o], `SELECT COUNT(*) AS result FROM CUSTOMER C\nWHERE EXISTS (SELECT 1 FROM ORDERS O\n              WHERE O.customer_id = C.id AND O.amount > ${boundary});`, count,
    'EXISTS는 외부 고객마다 조건을 만족하는 주문이 한 건이라도 있는지만 검사합니다.',
    [`각 고객에 대해 금액이 ${boundary} 초과인 주문 존재 여부를 확인합니다.`, `존재하는 고객은 ${count}명입니다.`], 'result 값을 작성하세요.');
});

addFamily('중', 'union-distinct', 'UNION의 중복 제거', (v) => {
  const a = table('A', ['id'], [[1], [2], [3 + v]]), b = table('B', ['id'], [[2], [3 + v], [5 + v]]);
  const count = new Set([...a.rows, ...b.rows].map((row) => row[0])).size;
  return result([a, b], 'SELECT COUNT(*) AS result FROM (\n  SELECT id FROM A\n  UNION\n  SELECT id FROM B\n) AS U;', count,
    'UNION은 두 조회 결과를 합치면서 중복 행을 제거합니다. UNION ALL과 다릅니다.',
    ['두 테이블의 id를 합칩니다.', `중복을 제거하면 ${count}개의 서로 다른 id가 남습니다.`], 'result 값을 작성하세요.');
});

addFamily('중', 'case-sum', 'CASE 조건부 집계', (v) => {
  const o = orders(v), boundary = 20 + v * 4;
  const count = o.rows.filter((row) => row[3] === '완료' && row[2] >= boundary).length;
  return result([o], `SELECT SUM(CASE WHEN status = '완료' AND amount >= ${boundary}\n                THEN 1 ELSE 0 END) AS result\nFROM ORDERS;`, count,
    '각 행에서 조건이 참이면 1, 거짓이면 0으로 바꾼 뒤 SUM합니다.',
    [`완료이면서 amount가 ${boundary} 이상인 행은 1이 됩니다.`, `1의 개수는 ${count}개입니다.`], 'result 값을 작성하세요.');
});

addFamily('중', 'update-select', 'UPDATE 후 조회 결과', (v) => {
  const t = students(v), bonus = 3 + v, boundary = 80 + v;
  const count = t.rows.filter((row) => row[3] + (row[2] === '개발' ? bonus : 0) >= boundary).length;
  return result([t], `UPDATE STUDENT SET score = score + ${bonus} WHERE dept = '개발';\nSELECT COUNT(*) AS result FROM STUDENT WHERE score >= ${boundary};`, count,
    'UPDATE의 WHERE에 해당하는 개발 부서 점수만 올린 후 두 번째 SELECT를 실행합니다.',
    [`개발 부서 세 학생의 score에 ${bonus}를 더합니다.`, `변경된 표에서 ${boundary} 이상인 학생은 ${count}명입니다.`], '두 SQL문을 순서대로 실행한 뒤 result 값을 작성하세요.');
});

addFamily('중', 'delete-select', 'DELETE 후 집계 결과', (v) => {
  const o = orders(v), boundary = 20 + v * 3;
  const sum = o.rows.filter((row) => !(row[3] === '취소' && row[2] <= boundary)).reduce((n, row) => n + row[2], 0);
  return result([o], `DELETE FROM ORDERS WHERE status = '취소' AND amount <= ${boundary};\nSELECT SUM(amount) AS result FROM ORDERS;`, sum,
    'DELETE 조건에 맞는 행만 지우고, 남은 모든 주문 금액을 합산합니다.',
    [`취소이면서 ${boundary} 이하인 주문만 삭제합니다.`, `남은 amount의 합계는 ${sum}입니다.`], '두 SQL문을 순서대로 실행한 뒤 result 값을 작성하세요.');
});

// 상: 복합 조인·상관 서브쿼리·NULL 함정·관계 나눗셈과 DDL 제약조건.
addFamily('상', 'nested-correlated', '중첩 상관 서브쿼리의 COUNT', (v) => {
  const a = table('A', ['id', 'x'], [[1, 10 + v], [2, 20 + v * 2], [3, 30 + v], [4, 40 - v]]);
  const b = table('B', ['id', 'y'], [[1, 5 + v], [1, 15 + v], [2, 20 + v], [3, 35 - v], [5, 50]]);
  const matched = a.rows.filter(([, x]) => {
    const previous = new Set(a.rows.filter((row) => row[1] < x).map((row) => row[0]));
    const ys = b.rows.filter((row) => previous.has(row[0])).map((row) => row[1]);
    return ys.length && x > ys.reduce((n, y) => n + y, 0) / ys.length;
  });
  return result([a, b], `SELECT COUNT(*) AS result FROM A\nWHERE x > (\n  SELECT AVG(y) FROM B\n  WHERE B.id IN (\n    SELECT A2.id FROM A A2 WHERE A2.x < A.x\n  )\n);`, matched.length,
    '가장 안쪽의 A.x는 바깥 A의 현재 행을 가리킵니다. 행마다 더 작은 x의 id 목록과 해당 B.y 평균을 새로 구합니다.',
    ['바깥 A를 한 행씩 순회합니다.', '현재 x보다 작은 A2.x의 id를 모읍니다.', '그 id를 가진 B.y의 평균과 현재 x를 비교합니다.', `참인 바깥 행은 ${matched.length}개입니다.`], 'result 값을 작성하세요.');
});

addFamily('상', 'division', '이중 NOT EXISTS로 전 과목 이수 찾기', (v) => {
  const required = table('REQUIRED', ['course_id'], [[1], [2], [3 + v]]);
  const passed = table('PASSED', ['student_id', 'course_id'], [
    [1, 1], [1, 2], [1, 3 + v], [2, 1], [2, 2], [3, 1], [3, 3 + v], [4, 1], [4, 2], ...(v % 2 ? [[4, 3 + v]] : []),
  ]);
  const count = [1, 2, 3, 4].filter((id) => required.rows.every(([course]) => passed.rows.some((row) => row[0] === id && row[1] === course))).length;
  return result([students(v), required, passed], 'SELECT COUNT(*) AS result FROM STUDENT S\nWHERE NOT EXISTS (\n  SELECT 1 FROM REQUIRED R\n  WHERE NOT EXISTS (\n    SELECT 1 FROM PASSED P\n    WHERE P.student_id = S.id AND P.course_id = R.course_id\n  )\n);', count,
    '안쪽 NOT EXISTS는 한 필수 과목을 이수하지 않았는지 검사합니다. 바깥 NOT EXISTS는 미이수 필수 과목이 하나도 없는 학생만 남깁니다.',
    ['각 학생과 필수 과목을 비교합니다.', '빠진 과목이 한 개라도 있으면 학생을 제외합니다.', `모든 과목을 이수한 학생은 ${count}명입니다.`], 'result 값을 작성하세요.');
});

addFamily('상', 'not-in-null', 'NOT IN과 NULL의 함정', (v) => {
  const a = table('A', ['id'], [[1], [2], [3], [4], [5]]);
  const b = table('B', ['id'], [[2], [v % 2 ? null : 4 + v]]);
  const count = b.rows.some((row) => row[0] === null) ? 0 : a.rows.filter((row) => !b.rows.some((item) => item[0] === row[0])).length;
  return result([a, b], 'SELECT COUNT(*) AS result FROM A\nWHERE id NOT IN (SELECT id FROM B);', count,
    'NOT IN 대상에 NULL이 있으면 비교가 UNKNOWN이 되어 비일치 행도 통과하지 못합니다. NULL이 없을 때만 일반적인 차집합처럼 동작합니다.',
    [v % 2 ? 'B에 NULL이 포함되어 있습니다.' : 'B에는 NULL이 없습니다.', `NOT IN을 통과한 A 행은 ${count}개입니다.`], 'result 값을 작성하세요.');
});

addFamily('상', 'right-join', 'RIGHT OUTER JOIN의 미연결 행', (v) => {
  const a = table('A', ['id'], [[1], [2 + v], [3 + v]]);
  const b = table('B', ['id'], [[1], [2], [4 + v], [6 + v]]);
  const count = b.rows.filter((row) => !a.rows.some((item) => item[0] === row[0])).length;
  return result([a, b], 'SELECT COUNT(*) AS result\nFROM A RIGHT OUTER JOIN B ON A.id = B.id\nWHERE A.id IS NULL;', count,
    'RIGHT OUTER JOIN은 오른쪽 B의 모든 행을 유지합니다. A와 연결되지 않은 B 행은 A.id가 NULL입니다.',
    ['B의 모든 행을 기준으로 A와 id를 맞춥니다.', `A가 없는 B 행은 ${count}개입니다.`], 'result 값을 작성하세요.');
});

addFamily('상', 'self-join', '자기 조인에서 점수 비교 쌍', (v) => {
  const t = students(v);
  const count = t.rows.reduce((n, a) => n + t.rows.filter((b) => a[2] === b[2] && a[3] < b[3]).length, 0);
  return result([t], 'SELECT COUNT(*) AS result\nFROM STUDENT A JOIN STUDENT B ON A.dept = B.dept\nWHERE A.score < B.score;', count,
    '한 테이블을 A와 B라는 별칭으로 두 번 읽습니다. 같은 부서인 쌍 중 A.score가 더 작은 순서쌍만 셉니다.',
    ['같은 부서인 학생끼리 쌍을 만듭니다.', '동점은 제외하고 A의 점수가 더 낮은 쌍만 남깁니다.', `조건을 만족하는 쌍은 ${count}개입니다.`], 'result 값을 작성하세요.');
});

addFamily('상', 'dept-average', '부서별 평균과 상관 서브쿼리', (v) => {
  const t = students(v);
  const count = t.rows.filter((row) => {
    const group = t.rows.filter((item) => item[2] === row[2]);
    return row[3] > group.reduce((n, item) => n + item[3], 0) / group.length;
  }).length;
  return result([t], 'SELECT COUNT(*) AS result FROM STUDENT S\nWHERE S.score > (SELECT AVG(S2.score) FROM STUDENT S2\n                 WHERE S2.dept = S.dept);', count,
    '전체 평균이 아니라 바깥 학생과 같은 부서의 평균을 행마다 다시 구합니다.',
    ['바깥 S의 부서를 확인합니다.', '같은 부서 S2의 평균과 S.score를 비교합니다.', `자기 부서 평균보다 높은 학생은 ${count}명입니다.`], 'result 값을 작성하세요.');
});

addFamily('상', 'join-having-average', 'JOIN과 HAVING에 전체 평균 결합', (v) => {
  const c = customers(), o = orders(v);
  const avg = o.rows.reduce((n, row) => n + row[2], 0) / o.rows.length;
  const count = c.rows.filter((row) => o.rows.filter((order) => order[1] === row[0] && order[3] === '완료').reduce((n, order) => n + order[2], 0) > avg).length;
  return result([c, o], 'SELECT COUNT(*) AS result FROM (\n  SELECT C.id FROM CUSTOMER C JOIN ORDERS O ON C.id = O.customer_id\n  WHERE O.status = \'완료\'\n  GROUP BY C.id\n  HAVING SUM(O.amount) > (SELECT AVG(amount) FROM ORDERS)\n) AS T;', count,
    '서브쿼리의 전체 주문 평균과 고객별 완료 주문 합계를 비교합니다. WHERE와 HAVING의 적용 시점이 다릅니다.',
    [`전체 주문의 평균 금액은 ${avg.toFixed(2)}입니다.`, '완료 주문만 고객별로 합칩니다.', `합계가 평균보다 큰 고객 그룹은 ${count}개입니다.`], 'result 값을 작성하세요.');
});

addFamily('상', 'cte-aggregate', 'WITH 공통 테이블과 그룹 필터', (v) => {
  const o = orders(v), boundary = 30 + v * 5;
  const totals = [1, 2, 3].map((id) => o.rows.filter((row) => row[1] === id && row[3] === '완료').reduce((n, row) => n + row[2], 0));
  const count = totals.filter((sum) => sum >= boundary).length;
  return result([o], `WITH completed AS (\n  SELECT customer_id, SUM(amount) AS total\n  FROM ORDERS WHERE status = '완료'\n  GROUP BY customer_id\n)\nSELECT COUNT(*) AS result FROM completed WHERE total >= ${boundary};`, count,
    'WITH에서 완료 주문의 고객별 합계를 임시 결과로 만든 뒤, 외부 SELECT가 합계 조건을 적용합니다.',
    ['완료 주문만 고객별로 합산합니다.', `total이 ${boundary} 이상인 고객 그룹은 ${count}개입니다.`], 'result 값을 작성하세요.');
});

addFamily('상', 'create-domain-check', 'CREATE DOMAIN의 값 범위 제약', (v) => {
  const minimum = v * 10, maximum = 100 - v * 5;
  return blanks([], `CREATE DOMAIN valid_score AS INTEGER\n  ① (VALUE BETWEEN ${minimum} AND ${maximum});`, 'CHECK',
    'CREATE DOMAIN에서 값의 허용 조건은 CHECK 제약식으로 선언합니다. VALUE는 도메인에 입력될 값을 가리킵니다.',
    [`허용 범위는 ${minimum} 이상 ${maximum} 이하입니다.`, '도메인의 값 조건을 선언하는 키워드는 CHECK입니다.'], '①에 들어갈 SQL 키워드를 작성하세요.');
});

addFamily('상', 'conditional-having', '조건부 집계와 서브쿼리 HAVING', (v) => {
  const c = customers(), o = orders(v);
  const threshold = o.rows.filter((row) => row[3] === '완료').reduce((n, row) => n + row[2], 0) / o.rows.filter((row) => row[3] === '완료').length;
  const count = c.rows.filter((customer) => {
    const sum = o.rows.filter((row) => row[1] === customer[0] && row[3] === '완료').reduce((n, row) => n + row[2], 0);
    return sum > threshold;
  }).length;
  return result([c, o], "SELECT COUNT(*) AS result FROM (\n  SELECT C.id FROM CUSTOMER C LEFT JOIN ORDERS O ON C.id = O.customer_id\n  GROUP BY C.id\n  HAVING SUM(CASE WHEN O.status = '완료' THEN O.amount ELSE 0 END) >\n         (SELECT AVG(amount) FROM ORDERS WHERE status = '완료')\n) AS T;", count,
    'LEFT JOIN으로 주문 없는 고객도 그룹에 포함하고, CASE로 완료 주문만 합산한 뒤 완료 주문의 전체 평균과 비교합니다.',
    [`완료 주문 한 건의 평균 금액은 ${threshold.toFixed(2)}입니다.`, '고객별 완료 주문 합계를 구합니다.', `합계가 평균보다 큰 고객은 ${count}명입니다.`], 'result 값을 작성하세요.');
});

export const sqlCodeQuestions = questions;
