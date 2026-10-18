// 같은 출제 개념 안에서도 자료의 모양과 질의를 달리한 고정 변형입니다.
// 구버전은 호출자가 보존하므로 이미 저장된 오답·해설의 의미가 바뀌지 않습니다.
const profiles = [
  null,
  { prefix: 'SHOP', tables: { STUDENT: 'PRODUCT', CUSTOMER: 'SUPPLIER', ORDERS: 'SHIPMENT', MEMBER: 'ITEM' },
    columns: { id: 'record_no', name: 'label', dept: 'warehouse', score: 'stock', mentor_id: 'manager_no', customer_id: 'supplier_no', amount: 'quantity', status: 'state' },
    words: { 학생: '상품', 고객: '공급사', 주문: '입고', 부서: '보관 창고', 점수: '재고', 개발: '1창고', 보안: '2창고', 운영: '3창고', 완료: '검수', 취소: '반려' },
    names: ['파랑펜', '노랑펜', '파랑공책', '노랑공책', '흰지우개', '검정펜', '큰공책', '작은지우개'] },
  { prefix: 'LIB', tables: { STUDENT: 'BOOK', CUSTOMER: 'READER', ORDERS: 'LOAN', MEMBER: 'WRITER' },
    columns: { id: 'record_no', name: 'display_name', dept: 'shelf', score: 'loan_count', mentor_id: 'editor_no', customer_id: 'reader_no', amount: 'days', status: 'state' },
    words: { 학생: '도서', 고객: '독자', 주문: '대출', 부서: '서가', 점수: '대출 횟수', 개발: 'A서가', 보안: 'B서가', 운영: 'C서가', 완료: '반납', 취소: '연체' },
    names: ['별의기록', '숲의기록', '별과바다', '숲과바다', '여행일기', '관찰일기', '별빛일기', '작은역사'] },
  { prefix: 'PLANT', tables: { STUDENT: 'MACHINE', CUSTOMER: 'WORKSHOP', ORDERS: 'INSPECTION', MEMBER: 'DEVICE' },
    columns: { id: 'record_no', name: 'label', dept: 'line', score: 'temperature', mentor_id: 'supervisor_no', customer_id: 'workshop_no', amount: 'reading', status: 'state' },
    words: { 학생: '설비', 고객: '작업장', 주문: '검사', 부서: '라인', 점수: '온도', 개발: '1라인', 보안: '2라인', 운영: '3라인', 완료: '통과', 취소: '보류' },
    names: ['센서가', '모터가', '센서나', '모터나', '제어기가', '밸브나', '제어기나', '밸브가'] },
  { prefix: 'SPORT', tables: { STUDENT: 'CONTESTANT', CUSTOMER: 'CLUB', ORDERS: 'RESULT', MEMBER: 'PLAYER' },
    columns: { id: 'record_no', name: 'display_name', dept: 'division', score: 'points', mentor_id: 'coach_no', customer_id: 'club_no', amount: 'earned', status: 'state' },
    words: { 학생: '선수', 고객: '구단', 주문: '경기', 부서: '조', 점수: '득점', 개발: 'A조', 보안: 'B조', 운영: 'C조', 완료: '승인', 취소: '무효' },
    names: ['한가람', '한누리', '최가람', '최누리', '문하늘', '서하늘', '김바다', '김가람'] },
];
const table = (name, columns, rows) => ({ name, columns, rows });
const total = values => values.reduce((sum, value) => sum + value, 0);
const aggregate = (values, kind) => kind === 'COUNT' ? values.length : kind === 'SUM' ? total(values) : Math.max(...values);
const scalar = (question, tables, code, answer, explanation, steps) => ({ ...question, tables, code, answerText: String(answer), answerMode: 'result',
  prompt: '주어진 표에서 SQL문을 실행한 결과를 작성하세요.', explanation, steps });
const blank = (question, tables, code, answer, prompt, explanation, steps) => ({ ...question, tables, code, answerText: answer, answerMode: 'blanks', prompt, explanation, steps });

const seedFor = family => [...family].reduce((seed, letter) => (seed * 31 + letter.charCodeAt(0)) >>> 0, 7);

function people(v, family) {
  const seed = seedFor(family);
  const scores = [[], [58, 70, 70, 93], [61, 83, 75, 83, 96, 68, 55], [80, 64, 80, 91, 56, 74, 88, 64], [72, 95, 66, 72, 84]][v];
  return table('STUDENT', ['id', 'name', 'dept', 'score', 'mentor_id'], scores.map((score, i) => [
    i + 1, profiles[v].names[(i + seed) % profiles[v].names.length], ['개발', '보안', '운영'][(i + v + seed) % 3], score + ((seed + i * (seed % 7 + 1)) % 13) - 6,
    (i + v + seed) % 3 === 0 ? null : (i % (seed % 3 + 2)) + 1,
  ]));
}
function transactions(v, family) {
  const seed = seedFor(family);
  const amounts = [[], [8, 26, 18, 41], [13, 22, 37, 16, 45, 28, 19], [24, 11, 33, 24, 58, 17, 39, 12], [15, 42, 21, 36, 18]][v];
  return table('ORDERS', ['id', 'customer_id', 'amount', 'status'], amounts.map((amount, i) => [i + 1, (i + v + seed) % 4 + 1, amount + (seed + i * 3) % 11 - 5, i % 3 === (v + seed) % 3 ? '취소' : '완료']));
}
function patterned(question, v, isBlank) {
  const additional = question.family.startsWith('additional-'), offset = additional ? 2 : isBlank ? 0 : 1;
  const t = people(v, question.family), sample = t.rows[(v + offset) % t.rows.length][1], mode = (v - 1 + offset) % 4 + 1;
  const pattern = mode === 1 ? `%${sample.at(-1)}` : mode === 2 ? `%${sample[1]}%` : mode === 3 ? `${sample[0]}${'_'.repeat(sample.length - 1)}` : `${sample[0]}%`;
  const predicate = new RegExp(`^${pattern.replace(/%/gu, '.*').replace(/_/gu, '.')}$`, 'u');
  const descending = (v + offset) % 2 === 0, direction = descending ? 'DESC' : 'ASC', key = additional ? 'score' : 'id', column = additional ? 3 : 0;
  const selected = t.rows.filter(row => predicate.test(row[1])).sort((a, b) => (descending ? b[column] - a[column] : a[column] - b[column]) || a[0] - b[0]);
  const criteria = mode === 1 ? `이름이 '${sample.at(-1)}'로 끝나는` : mode === 2 ? `이름에 '${sample[1]}'가 포함된` : mode === 3 ? `이름이 '${sample[0]}'로 시작하고 전체 길이가 ${sample.length}자인` : `이름이 '${sample[0]}'로 시작하는`;
  const explanation = 'LIKE에서 %는 길이 제한 없는 문자열이고 _는 정확히 한 글자입니다. 검색 조건을 적용한 다음 ORDER BY에 명시된 기준으로 정렬합니다.';
  const steps = [`패턴 '${pattern}'에 맞는 id는 ${selected.map(row => row[0]).join(', ')}입니다.`, `${key} ${direction} 순서의 이름은 ${selected.map(row => row[1]).join(', ')}입니다.`];
  if (isBlank) return blank(question, [t], `SELECT ${additional ? 'id, name' : 'name'} FROM STUDENT\nWHERE name LIKE ①\nORDER BY ${key} ②${additional ? ', id ASC' : ''};`, `'${pattern}', ${direction}`,
    `${criteria} 학생을 ${key} ${descending ? '내림차순' : '오름차순'}으로 조회하려 합니다.${additional ? ' 같은 점수에서는 id 오름차순입니다.' : ''} 작은따옴표를 포함해 ①, ②를 순서대로 작성하세요.`, explanation, steps);
  return scalar(question, [t], `SELECT id, name FROM STUDENT\nWHERE name LIKE '${pattern}'\nORDER BY id ${direction};`, selected.map(row => `${row[0]} ${row[1]}`).join('\n'), explanation, steps);
}

const builders = {
  'where-count': (q, v) => {
    const t = people(v, q.family), limit = 65 + v * 4, kind = v === 2 ? 'SUM' : v === 3 ? 'MAX' : 'COUNT';
    const selected = t.rows.filter(r => v === 1 ? r[3] <= limit : r[3] >= limit && (v !== 4 || r[4] !== null));
    const value = aggregate(selected.map(r => r[3]), kind), condition = `score ${v === 1 ? '<=' : '>='} ${limit}${v === 4 ? ' AND mentor_id IS NOT NULL' : ''}`;
    return scalar(q, [t], `SELECT ${kind}(${kind === 'COUNT' ? '*' : 'score'}) AS result\nFROM STUDENT\nWHERE ${condition};`, value,
      'WHERE로 조건에 맞는 행을 남긴 뒤 SELECT의 집계 함수를 적용합니다. COUNT는 행 수, SUM은 합계, MAX는 최댓값을 반환합니다.',
      [`남는 id는 ${selected.map(r => r[0]).join(', ')}입니다.`, `${kind}를 적용한 결과는 ${value}입니다.`]);
  },
  'like-order': (q, v) => patterned(q, v, false),
  'like-desc-blanks': (q, v) => patterned(q, v, true),
  'additional-like-keyword-completion': (q, v) => patterned(q, v, true),
  between: (q, v) => {
    const t = people(v, q.family), low = 62 + v, high = 82 + v, inverted = v % 2 === 1, kind = v === 2 ? 'SUM' : 'COUNT';
    const selected = t.rows.filter(r => (r[3] >= low && r[3] <= high) !== inverted), value = aggregate(selected.map(r => r[3]), kind);
    return scalar(q, [t], `SELECT ${kind}(${kind === 'COUNT' ? '*' : 'score'}) AS result\nFROM STUDENT\nWHERE score ${inverted ? 'NOT ' : ''}BETWEEN ${low} AND ${high};`, value,
      'BETWEEN은 양 끝값을 포함합니다. NOT BETWEEN은 그 범위 밖의 값만 선택합니다. 선택된 행에 SELECT의 집계 함수를 적용합니다.',
      [`${inverted ? '범위 밖' : '범위 안'}의 id는 ${selected.map(r => r[0]).join(', ')}입니다.`, `${kind} 결과는 ${value}입니다.`]);
  },
  'in-sum': (q, v) => {
    const t = transactions(v, q.family), ids = [1, v + 1, t.rows.length], inverted = v % 2 === 1;
    const selected = t.rows.filter(r => ids.includes(r[0]) !== inverted), value = total(selected.map(r => r[2]));
    return scalar(q, [t], `SELECT SUM(amount) AS result\nFROM ORDERS\nWHERE id ${inverted ? 'NOT ' : ''}IN (${ids.join(', ')});`, value,
      'IN은 목록에 속한 행을, NOT IN은 목록에 속하지 않은 행을 선택합니다. 선택된 행의 amount를 한 번씩 합산합니다.',
      [`선택된 id는 ${selected.map(r => r[0]).join(', ')}입니다.`, `${selected.map(r => r[2]).join(' + ')} = ${value}입니다.`]);
  },
  distinct: (q, v) => {
    const t = people(v, q.family), limit = 70 + v * 3, field = v % 2 ? 'dept' : 'score', index = field === 'dept' ? 2 : 3;
    const selected = t.rows.filter(r => r[3] >= limit), values = [...new Set(selected.map(r => r[index]))];
    return scalar(q, [t], `SELECT COUNT(DISTINCT ${field}) AS result\nFROM STUDENT WHERE score >= ${limit};`, values.length,
      'WHERE 조건을 먼저 적용하고 지정 열의 서로 다른 값만 셉니다. 같은 값이 여러 행에 반복되어도 DISTINCT 집계에는 한 번만 포함됩니다.',
      [`조건을 통과한 id는 ${selected.map(r => r[0]).join(', ')}입니다.`, `${field}의 서로 다른 값은 ${values.join(', ')}이며 ${values.length}개입니다.`]);
  },
  'count-null': (q, v) => {
    const t = people(v, q.family), rows = t.rows.filter(r => r[0] >= v), expression = v === 1 ? '*' : v === 2 || v === 4 ? 'DISTINCT mentor_id' : 'mentor_id';
    const known = rows.filter(r => r[4] !== null), value = expression === '*' ? rows.length : expression.startsWith('DISTINCT') ? new Set(known.map(r => r[4])).size : known.length;
    return scalar(q, [t], `SELECT COUNT(${expression}) AS result\nFROM STUDENT WHERE id >= ${v};`, value,
      'COUNT(*)는 NULL 유무와 관계없이 행을 셉니다. COUNT(열)은 NULL을 제외하며 COUNT(DISTINCT 열)은 남은 값의 중복도 제거합니다.',
      [`필터 뒤 ${rows.length}행 중 mentor_id가 NULL이 아닌 행은 ${known.length}개입니다.`, `COUNT(${expression})의 결과는 ${value}입니다.`]);
  },
  'group-count': (q, v) => {
    const t = people(v, q.family), limit = 60 + v * 3, kind = v % 2 ? 'COUNT' : 'SUM';
    const groups = Object.entries(Object.groupBy(t.rows.filter(r => r[3] >= limit), r => r[2])).sort(([a], [b]) => a.localeCompare(b, 'ko'));
    const rows = groups.map(([name, items]) => `${name} ${aggregate(items.map(r => r[3]), kind)}`);
    return scalar(q, [t], `SELECT dept, ${kind}(${kind === 'COUNT' ? '*' : 'score'}) AS result\nFROM STUDENT WHERE score >= ${limit}\nGROUP BY dept\nORDER BY dept;`, rows.join('\n'),
      'WHERE로 행을 선택하고 GROUP BY로 같은 dept를 묶은 뒤 각 그룹에 집계를 적용합니다. 최종 출력은 ORDER BY 순서입니다.',
      [`남는 행은 ${groups.reduce((n, [, items]) => n + items.length, 0)}개입니다.`, `그룹별 ${kind} 결과: ${rows.join(' / ')}`]);
  },
  having: (q, v) => {
    const t = transactions(v, q.family), limit = 12 + v * 3, minimum = v % 2 + 1;
    const groups = Object.groupBy(t.rows.filter(r => r[2] >= limit), r => r[1]);
    const ids = Object.entries(groups).filter(([, rows]) => rows.length >= minimum).map(([id]) => id);
    return scalar(q, [t], `SELECT COUNT(*) AS result FROM (\n SELECT customer_id FROM ORDERS\n WHERE amount >= ${limit}\n GROUP BY customer_id HAVING COUNT(*) >= ${minimum}\n) AS selected;`, ids.length,
      'WHERE는 개별 행의 금액 조건이고 HAVING은 그룹별 행 수 조건입니다. 외부 COUNT(*)는 필터를 통과한 그룹 수를 셉니다.',
      [`금액 조건 뒤 그룹별 건수: ${Object.entries(groups).map(([id, rows]) => `${id}번=${rows.length}`).join(', ')}`, `최소 ${minimum}건인 그룹은 ${ids.join(', ') || '없음'}이며 결과는 ${ids.length}입니다.`]);
  },
  'insert-values': (q, v) => {
    const t = table('MEMBER', ['id', 'name', 'dept'], [[v + 10, profiles[v].names[0], '개발']]);
    const code = [null, "① INTO MEMBER (id, name, dept) VALUES (31, '새항목', '운영');", "INSERT ① MEMBER (id, name, dept) VALUES (32, '새항목', '운영');", "INSERT INTO MEMBER (id, name, dept) ① (33, '새항목', '운영');", "① MEMBER (id, name, dept) VALUES (34, '새항목', '운영');"][v];
    const answer = [null, 'INSERT', 'INTO', 'VALUES', 'INSERT INTO'][v];
    return blank(q, [t], code, answer, '새 행을 추가하는 SQL문의 ①을 작성하세요.',
      '행 삽입문은 INSERT INTO 테이블명 (열 목록) VALUES (값 목록) 순서로 작성합니다. 열과 값은 위치별로 대응합니다.',
      ['추가할 세 값은 id·name·dept에 순서대로 대응합니다.', `빈 위치에 들어갈 구문은 ${answer}입니다.`]);
  },
  'above-average': (q, v) => {
    const t = people(v, q.family), average = total(t.rows.map(r => r[3])) / t.rows.length, less = v % 2 === 1;
    const rows = t.rows.filter(r => less ? r[3] < average : r[3] > average);
    return scalar(q, [t], `SELECT COUNT(*) AS result FROM STUDENT\nWHERE score ${less ? '<' : '>'} (SELECT AVG(score) FROM STUDENT);`, rows.length,
      '서브쿼리는 전체 행의 평균을 반환합니다. 외부 WHERE는 각 행의 score를 그 값과 비교하며 평균과 같은 값은 부등호의 방향에 맞게 판단합니다.',
      [`전체 평균은 ${average}입니다.`, `조건을 만족하는 id는 ${rows.map(r => r[0]).join(', ')}이므로 ${rows.length}행입니다.`]);
  },
  'union-distinct': (q, v) => {
    const inputs = [null, [[2, 2, 5, 8], [5, 9]], [[3, 6], [3, 6, 6, 12, 15]], [[4, 7, 7], [7, 10, 13, 4]], [[1, 5, 9, 9], [5, 9, 13]]][v];
    const all = v % 2 === 0, values = all ? inputs.flat() : [...new Set(inputs.flat())], kind = v >= 3 ? 'SUM' : 'COUNT', value = aggregate(values, kind);
    return scalar(q, [table('A', ['id'], inputs[0].map(id => [id])), table('B', ['id'], inputs[1].map(id => [id]))],
      `SELECT ${kind}(${kind === 'COUNT' ? '*' : 'id'}) AS result FROM (\n SELECT id FROM A\n UNION${all ? ' ALL' : ''}\n SELECT id FROM B\n) AS combined;`, value,
      `UNION${all ? ' ALL은 모든 중복 행을 유지합니다.' : '은 전체 결과에서 중복 행을 제거합니다.'} 합친 결과에 바깥 집계 함수를 적용합니다.`,
      [`집합 연산 뒤 값은 ${values.join(', ')}입니다.`, `${kind} 결과는 ${value}입니다.`]);
  },
  'update-select': (q, v) => {
    const t = people(v, q.family), bonus = v + 4, limit = 78 + v, target = v % 2 ? '보안' : '운영';
    const updated = t.rows.map(r => r[3] + (r[2] === target ? bonus : 0));
    const count = updated.filter(score => score >= limit).length;
    return scalar(q, [t], `UPDATE STUDENT SET score = score + ${bonus} WHERE dept = '${target}';\nSELECT COUNT(*) AS result FROM STUDENT WHERE score >= ${limit};`, count,
      'UPDATE의 조건에 맞는 행만 수정합니다. 이어지는 SELECT는 원본이 아니라 수정된 값을 기준으로 조건을 적용합니다.',
      [`id 순서의 변경 후 score는 ${updated.join(', ')}입니다.`, `${limit} 이상은 ${count}행입니다.`]);
  },
  'delete-select': (q, v) => {
    const t = transactions(v, q.family), limit = 20 + v * 2, state = v % 2 ? '완료' : '취소';
    const kept = t.rows.filter(r => !(r[3] === state && r[2] <= limit)), kind = v % 2 ? 'COUNT' : 'SUM', value = aggregate(kept.map(r => r[2]), kind);
    return scalar(q, [t], `DELETE FROM ORDERS WHERE status = '${state}' AND amount <= ${limit};\nSELECT ${kind}(${kind === 'COUNT' ? '*' : 'amount'}) AS result FROM ORDERS;`, value,
      'DELETE에서 AND로 연결된 두 조건을 모두 만족하는 행만 지웁니다. 남은 행 전체에 마지막 SELECT의 집계 함수를 적용합니다.',
      [`삭제 후 남는 id는 ${kept.map(r => r[0]).join(', ')}입니다.`, `${kind} 결과는 ${value}입니다.`]);
  },
  'not-in-null': (q, v) => {
    const a = [1, 2, 4, 7, 9, 11, 13].slice(0, v + 3), b = [2, v + 4, null], excludeNull = v !== 2;
    const value = excludeNull ? a.filter(id => !b.includes(id)).length : 0;
    return scalar(q, [table('A', ['id'], a.map(id => [id])), table('B', ['id'], b.map(id => [id]))],
      `SELECT COUNT(*) AS result FROM A\nWHERE id NOT IN (SELECT id FROM B${excludeNull ? ' WHERE id IS NOT NULL' : ''});`, value,
      'NOT IN의 서브쿼리 결과에 NULL이 남으면 일치하지 않는 값의 비교도 UNKNOWN이 되어 WHERE를 통과하지 못합니다. NULL을 제외했는지 먼저 확인합니다.',
      [excludeNull ? '서브쿼리에서 NULL을 제외하므로 실제 비교 목록에는 두 수만 남습니다.' : '서브쿼리 결과에 NULL이 남아 있습니다.', `외부 조건을 통과한 행은 ${value}개입니다.`]);
  },
  'right-join': (q, v) => {
    const a = [1, 3, 3 + v], b = [1, 2, 4, 6, 8, 10, 12].slice(0, 3 + v), onlyMissing = v % 2 === 1;
    const selected = b.filter(id => a.includes(id) !== onlyMissing);
    return scalar(q, [table('A', ['id'], a.map(id => [id])), table('B', ['id'], b.map(id => [id]))],
      `SELECT COUNT(*) AS result FROM A RIGHT OUTER JOIN B ON A.id = B.id\nWHERE A.id IS ${onlyMissing ? '' : 'NOT '}NULL;`, selected.length,
      'RIGHT JOIN은 오른쪽의 모든 행을 유지합니다. 연결 상대가 없는 경우에만 왼쪽 id가 NULL이므로 IS NULL과 IS NOT NULL은 서로 다른 행을 선택합니다.',
      [`필터를 통과한 B.id는 ${selected.join(', ')}입니다.`, `COUNT(*) 결과는 ${selected.length}입니다.`]);
  },
  'self-join': (q, v) => {
    const t = people(v, q.family), pairs = t.rows.flatMap(a => t.rows.filter(b => a[2] === b[2] && (v % 2 ? a[3] <= b[3] : a[3] < b[3]) && a[0] < b[0]).map(b => [a[0], b[0]]));
    return scalar(q, [t], `SELECT COUNT(*) AS result FROM STUDENT A JOIN STUDENT B ON A.dept = B.dept\nWHERE A.score ${v % 2 ? '<=' : '<'} B.score AND A.id < B.id;`, pairs.length,
      '자기 조인에서는 A행과 B행이 각각 조건을 만족해야 합니다. id의 부등식은 자기 자신과 반대 방향 쌍을 제외하며 score의 <=는 동점도 허용합니다.',
      [`조건을 만족하는 (A.id, B.id)는 ${pairs.map(pair => `(${pair.join(', ')})`).join(', ') || '없음'}입니다.`, `따라서 ${pairs.length}쌍입니다.`]);
  },
  'dept-average': (q, v) => {
    const t = people(v, q.family), groups = Object.groupBy(t.rows, r => r[2]), averages = Object.fromEntries(Object.entries(groups).map(([key, rows]) => [key, total(rows.map(r => r[3])) / rows.length]));
    const rows = t.rows.filter(r => v % 2 ? r[3] < averages[r[2]] : r[3] > averages[r[2]]);
    return scalar(q, [t], `SELECT COUNT(*) AS result FROM STUDENT S\nWHERE S.score ${v % 2 ? '<' : '>'} (SELECT AVG(T.score) FROM STUDENT T WHERE T.dept = S.dept);`, rows.length,
      '상관 조건 T.dept=S.dept 때문에 전체 평균이 아니라 현재 행과 같은 그룹의 평균을 사용합니다. 그룹이 바뀌면 비교 평균도 달라집니다.',
      [`그룹별 평균: ${Object.entries(averages).map(([key, value]) => `${key}=${value}`).join(', ')}`, `조건을 만족하는 id는 ${rows.map(r => r[0]).join(', ') || '없음'}이며 ${rows.length}행입니다.`]);
  },
  'additional-nullable-distinct-count': (q, v) => {
    const values = [null, [3, null, 3, 9], [null, 4, 7, null, 4, 11, 7], [8, 8, 8, null, null, 12], [2, 5, 9, 14, 2, null, 9, 20]][v];
    const known = values.filter(n => n !== null), distinct = new Set(known).size;
    return scalar(q, [table('MEASURE', ['id', 'value'], values.map((n, i) => [i + 1, n]))],
      'SELECT COUNT(*) AS all_rows, COUNT(value) AS known_rows, COUNT(DISTINCT value) AS distinct_values FROM MEASURE;', `${values.length} ${known.length} ${distinct}`,
      'COUNT(*)는 모든 행, COUNT(value)는 NULL이 아닌 행, COUNT(DISTINCT value)는 NULL 제외 후 서로 다른 값의 수를 반환합니다.',
      [`전체 ${values.length}행 중 값이 있는 행은 ${known.length}개입니다.`, `서로 다른 값은 ${[...new Set(known)].join(', ')}이며 ${distinct}개입니다.`]);
  },
};

const variationTitles = {
  'where-count': '행 조건과 집계 결과', between: '범위 조건과 집계 결과',
  'in-sum': '목록 조건과 합계',
  'like-order': '문자열 조건과 정렬', 'like-desc-blanks': '조회 조건과 정렬 구문 완성',
  'additional-like-keyword-completion': '조회 조건과 정렬 구문 완성',
  'group-count': '그룹별 집계 결과', 'insert-values': '행 추가 SQL 완성',
  'union-distinct': '집합 연산과 집계 결과', 'right-join': '외부 조인과 연결 여부',
};

function contextualize(question, v) {
  const profile = profiles[v], seed = seedFor(question.family), identifiers = { ...profile.columns };
  for (const t of question.tables) identifiers[t.name] = profile.tables[t.name] ?? `${profile.prefix}_${t.name}`;
  // DDL에는 자료 표 없이 테이블·도메인이 등장하므로 이름을 따로 수집합니다.
  for (const match of question.code.matchAll(/CREATE (?:TABLE|DOMAIN) ([A-Za-z_][A-Za-z_0-9]*)/gu)) identifiers[match[1]] ??= `${profile.prefix}_${match[1]}`;
  const translate = value => String(value).replace(/[A-Za-z_][A-Za-z_0-9]*/gu, token => identifiers[token] ?? token)
    .replace(/김민수|이서연|박지훈|이하늘|최유진|정다은/gu, name => profile.names[(['김민수', '이서연', '박지훈', '이하늘', '최유진', '정다은'].indexOf(name) + seed) % profile.names.length])
    .replace(/학생|고객|주문|부서|점수|개발|보안|운영|완료|취소/gu, word => profile.words[word] ?? word);
  return { ...question, context: profile.prefix,
    tables: question.tables.map(t => {
      const extra = v === 3 ? ['zone', 'batch'] : v === 2 ? [] : ['zone'];
      const order = t.columns.map((_, i) => (i + v + seed) % t.columns.length);
      const rows = t.rows.map((row, i) => [...order.map(index => typeof row[index] === 'string' ? translate(row[index]) : row[index]), ...extra.map((_, j) => j ? `B${seed % 100}-${(i + v) % 3}` : ['동부', '서부', '남부'][(i + v + seed) % 3])]);
      return { name: identifiers[t.name], columns: [...order.map(i => translate(t.columns[i])), ...extra], rows: v % 2 ? rows.toReversed() : [...rows.slice(1), ...rows.slice(0, 1)] };
    }),
    code: translate(question.code), prompt: translate(question.prompt), title: translate(question.title),
    answerText: translate(question.answerText), explanation: translate(question.explanation), steps: question.steps.map(translate),
  };
}

export function diversifySqlQuestions(original) {
  const previous = [];
  const questions = original.map(question => {
    const v = question.variant - 1;
    if (!v) return question;
    const rebuilt = builders[question.family]?.(question, v) ?? question;
    const varied = contextualize({ ...rebuilt, title: variationTitles[question.family] ?? rebuilt.title }, v);
    previous.push(question);
    return { ...varied, id: `${question.id}-v2`, variationOf: question.id, variedQuery: Boolean(builders[question.family]) };
  });
  return { questions, previous };
}
