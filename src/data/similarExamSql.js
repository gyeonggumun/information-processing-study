export const similarExamSql = [];
const table = (name, columns, rows) => ({ name, columns, rows });
function add(key, v, ref, category, tables, code, resultColumns, resultRows, steps, extra = {}) {
  similarExamSql.push({ key: `sql-${key}-${v + 1}`, ref, category, language: 'SQL', tables, code,
    resultColumns, resultRows, steps, answer: resultRows.map(row => row.map(x => x ?? 'NULL').join(' | ')).join('\n'),
    ...extra });
}
for (let v = 0; v < 5; v++) {
  const budgets = [80 + v * 10, 160 + v * 20, 300 - v * 15];
  const employees = [[11, 'Ari', 1], [12, 'Bomi', 2], [13, 'Ciel', 3], [14, 'Dani', v % 2 + 2], [15, 'Evan', null]];
  const average = budgets.reduce((a, b) => a + b, 0) / 3;
  const joined = employees.filter(r => r[2] !== null).map(r => [...r, budgets[r[2] - 1]]);
  const kept = joined.filter(r => r[3] > average);
  add('join-average', v, '2026-1-q18', '조인과 평균 비교', [table('Staff', ['id', 'name', 'dept_id'], employees), table('Dept', ['id', 'budget'], budgets.map((n, i) => [i + 1, n]))],
    'SELECT COUNT(*) AS result\nFROM Staff s JOIN Dept d ON s.dept_id = d.id\nWHERE d.budget > (SELECT AVG(budget) FROM Dept);', ['result'], [[kept.length]],
    [`Dept 평균은 (${budgets.join('+')})/3=${average}입니다. 바깥의 직원 수가 아니라 Dept의 세 행으로 계산합니다.`, `내부 조인은 부서가 연결되는 ${joined.length}행을 만듭니다. dept_id가 NULL인 Evan은 연결되지 않습니다.`, `예산이 평균을 초과하는 직원은 ${kept.map(r => r[1]).join(', ') || '없음'}입니다. COUNT(*)는 조인 후 조건을 통과한 행을 세므로 ${kept.length}입니다.`],
    { solutionTables: [table('JOIN 결과', ['id', 'name', 'dept_id', 'budget'], joined), table('WHERE 결과', ['id', 'name', 'dept_id', 'budget'], kept)] });

  const xs = [5 + v, 12 + v * 2, 24 + v, 35 + v * 3], ys = [[1, 8 + v], [1, 18 + v * 3], [2, 42 - v * 2], [3, 66 + v], [5, 90]];
  const op = v % 2 ? '<' : '>';
  const details = xs.map((x, i) => {
    const ids = xs.map((n, j) => [n, j + 1]).filter(([n]) => n < x).map(([, id]) => id);
    const values = ys.filter(([id]) => ids.includes(id)).map(([, y]) => y);
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
    return { id: i + 1, x, values, avg, ok: avg !== null && (op === '>' ? x > avg : x < avg) };
  });
  const accepted = details.filter(d => d.ok).length;
  add('correlated', v, '2026-2-q13', '중첩 상관 질의', [table('A', ['id', 'x'], xs.map((x, i) => [i + 1, x])), table('B', ['id', 'y'], ys)],
    `SELECT COUNT(*) AS result FROM A\nWHERE x ${op} (\n    SELECT AVG(y) FROM B\n    WHERE B.id IN (\n        SELECT P.id FROM A P WHERE P.x < A.x\n    )\n);`, ['result'], [[accepted]],
    ['바깥 A의 한 행을 고정한 뒤 그 x보다 작은 P.x의 id들을 찾습니다. 해당 id를 가진 B의 모든 행이 평균 계산에 들어가며 같은 id의 두 행도 따로 계산합니다.', ...details.map(d => `A.id=${d.id}, x=${d.x}: y=[${d.values.join(', ')}], 평균=${d.avg ?? 'NULL'}, 비교 결과=${d.avg === null ? 'UNKNOWN' : d.ok ? '참' : '거짓'}입니다.`), `빈 집합의 AVG는 0이 아니라 NULL이며 비교가 UNKNOWN이어서 통과하지 않습니다. 참인 행 ${accepted}개를 셉니다.`],
    { solutionTables: [table('바깥 행별 판정', ['id', 'x', '평균', '통과'], details.map(d => [d.id, d.x, d.avg, d.ok ? 'O' : 'X']))] });

  const names = ['박', '김', '이', '최', '정'], prefix = names[v];
  const rows = [[210 + v * 10, `${prefix}하늘`, 'SW'], [212 + v * 10, '강민수', 'DB'], [214 + v * 10, `${prefix}지우`, 'NET'], [216 + v * 10, '오서준', 'SW']];
  const order = v % 2 ? 'ASC' : 'DESC';
  const ordered = rows.filter(r => r[1].startsWith(prefix)).sort((a, b) => order === 'ASC' ? a[0] - b[0] : b[0] - a[0]);
  const code = 'SELECT id, name FROM Student\nWHERE name LIKE ①\nORDER BY id ②;';
  add('like', v, '2026-2-q12', 'SQL 빈칸', [table('Student', ['id', 'name', 'dept'], rows)], code, ['id', 'name'], ordered.map(r => r.slice(0, 2)),
    [`성명이 '${prefix}'로 시작하도록 LIKE '${prefix}%'를 사용합니다. %는 뒤에 오는 0개 이상의 문자를 뜻합니다.`, `학번을 ${order === 'ASC' ? '오름차순' : '내림차순'}으로 정렬하는 키워드는 ${order}입니다.`, `조건을 만족하는 두 학생의 학번 순서는 ${ordered.map(r => r[0]).join('→')}이며 아래 표가 완성된 조회 결과입니다.`],
    { prompt: `Student에서 성명이 '${prefix}'로 시작하는 학생을 조회하고 id ${order === 'ASC' ? '오름차순' : '내림차순'}으로 정렬한다. ①, ②를 순서대로 쓰시오.`, answer: `① '${prefix}%' ② ${order}`, verificationSql: `SELECT id, name FROM Student WHERE name LIKE '${prefix}%' ORDER BY id ${order};` });

  const threshold = 70 + v * 3;
  const scores = [['DB', 60 + v], ['DB', 90 + v], ['OS', 80 + v * 2], ['OS', 90 + v], ['NET', 50 + v], ['NET', 65 + v]];
  const groups = ['DB', 'NET', 'OS'].map(name => { const nums = scores.filter(r => r[0] === name).map(r => r[1]); return [name, Math.min(...nums), Math.max(...nums), nums.reduce((a, b) => a + b, 0) / nums.length]; });
  add('group', v, '2023-1-q16', '그룹 집계', [table('Result', ['subject', 'score'], scores)],
    `SELECT subject, MIN(score) AS low, MAX(score) AS high\nFROM Result\nGROUP BY subject\nHAVING AVG(score) >= ${threshold}\nORDER BY subject;`, ['subject', 'low', 'high'], groups.filter(r => r[3] >= threshold).map(r => r.slice(0, 3)),
    ['GROUP BY subject로 같은 과목의 점수를 묶습니다. MIN·MAX·AVG는 각 그룹 안에서 따로 계산합니다.', `그룹별 평균은 ${groups.map(r => `${r[0]}=${r[3]}`).join(', ')}입니다. HAVING은 이 평균이 ${threshold} 이상인 그룹만 남깁니다.`, '최종 결과에는 평균 열을 포함하지 않고 과목·최솟값·최댓값만 출력합니다. ORDER BY가 과목 순서를 정합니다.'],
    { solutionTables: [table('그룹 집계', ['subject', 'low', 'high', 'average'], groups)] });

  const orders = [[1, 1, 30 + v * 5], [2, 2, 20 + v * 2], [3, 1, 60 + v * 4], [4, 3, 15 + v], [5, 2, 55 + v * 3]];
  const clients = [[1, 'Ari'], [2, 'Bomi'], [3, 'Ciel']];
  const minimum = 80 + v * 5;
  const joinedOrders = orders.map(([, id, amount]) => [id, clients[id - 1][1], amount]);
  const view = clients.map(([id, name]) => [name, orders.filter(r => r[1] === id).reduce((sum, r) => sum + r[2], 0)]);
  add('view', v, '2023-1-q16', '뷰와 집계 조회', [table('Client', ['id', 'name'], clients), table('Orders', ['id', 'client_id', 'amount'], orders)],
    `CREATE VIEW Sales AS\nSELECT c.name, SUM(o.amount) AS total\nFROM Client c JOIN Orders o ON c.id = o.client_id\nGROUP BY c.id, c.name;\n\nSELECT name, total FROM Sales\nWHERE total >= ${minimum}\nORDER BY name;`, ['name', 'total'], view.filter(r => r[1] >= minimum),
    ['고객과 주문을 먼저 연결한 뒤 고객별로 주문 금액을 합산합니다. VIEW는 이 질의에 이름을 붙인 것으로 조회 시 해당 결과를 사용합니다.', `Sales의 내용은 ${view.map(([name, total]) => `${name}=${total}`).join(', ')}입니다.`, `바깥 WHERE가 합계 ${minimum} 이상인 행만 선택하고 이름 순서로 정렬합니다. 원본 주문 한 행의 금액에 조건을 먼저 적용하면 다른 결과가 됩니다.`],
    { referenceBasis: '복원 SQL의 조인·GROUP BY를 뷰 조회로 확장한 창작 유형', solutionTables: [table('JOIN 결과', ['client_id', 'name', 'amount'], joinedOrders), table('Sales 뷰', ['name', 'total'], view)] });

  const values = [15 + v, null, 15 + v, 25 + v, null, v % 2 ? 25 + v : 45 + v];
  const count = values.filter(x => x !== null).length, distinct = new Set(values.filter(x => x !== null)).size;
  add('null-count', v, '2026-1-q9', 'COUNT와 중복 제거', [table('Measurement', ['id', 'value'], values.map((n, i) => [i + 1, n]))],
    'SELECT COUNT(*) AS all_rows, COUNT(value) AS filled,\n       COUNT(DISTINCT value) AS unique_values\nFROM Measurement;', ['all_rows', 'filled', 'unique_values'], [[values.length, count, distinct]],
    [`COUNT(*)는 NULL 포함 모든 행을 세므로 ${values.length}입니다. COUNT(value)는 NULL인 두 행을 제외해 ${count}입니다.`, `DISTINCT value에서 NULL을 제외한 서로 다른 값은 ${[...new Set(values.filter(x => x !== null))].join(', ')}입니다.`, `따라서 출력은 ${values.length}, ${count}, ${distinct}입니다. 집계 질의가 반환하는 행 자체는 이 세 값이 들어 있는 한 행입니다.`]);
}
