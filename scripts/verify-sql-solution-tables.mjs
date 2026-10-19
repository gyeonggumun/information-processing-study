import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { sqlCodeQuestions, previousSqlCodeQuestions } from '../src/data/sqlCodeQuestions.js';
import { buildSqlSolutionTables } from './lib/sql-solution-tables.mjs';

const saved = JSON.parse(readFileSync('src/data/sqlSolutionTables.json', 'utf8'));
const all = [...sqlCodeQuestions, ...previousSqlCodeQuestions];
let joins = 0, derived = 0;
for (const question of all) {
  const tables = buildSqlSolutionTables(question);
  assert.deepEqual(tables, saved.questions[question.id], `${question.id}: SQL 재실행 결과와 저장된 해설 표 일치`);
  if (/\bJOIN\b/u.test(question.code)) {
    assert(tables.some(table => table.title === 'JOIN 결합 결과'), `${question.id}: 결합 표 누락 없음`);
    joins++;
  }
  if (tables.some(table => table.title === '파생 테이블 완성 결과')) derived++;
  for (const table of tables) assert(table.columns.length && table.rows.every(row => row.length === table.columns.length), `${question.id}: 표 행과 열 일치`);
}
assert(joins >= 60 && derived > 0);
const base = { id: 'test-only', answerMode: 'result',
  tables: [{ name: 'A', columns: ['id', 'name'], rows: [[1, '가'], [2, '나'], [3, '다']] },
    { name: 'B', columns: ['id', 'amount'], rows: [[1, 5], [1, 8], [2, null], [4, 99]] }] };
const left = buildSqlSolutionTables({ ...base, code: 'SELECT COUNT(*) AS result FROM A LEFT JOIN B ON A.id=B.id WHERE B.amount IS NULL OR B.amount>6;', answerText: '3' });
assert.deepEqual(left.filter(table => ['JOIN 결합 결과', 'WHERE 적용 결과', '최종 조회 결과'].includes(table.title)).map(table => table.rows.length), [4, 3, 1], 'JOIN·WHERE·최종 집계의 행 수 구별');
assert.deepEqual(left[0].rows.at(-1), [3, '다', null, null], 'LEFT JOIN의 미연결 NULL 유지');
assert.deepEqual(left[0].columns, ['A.id', 'A.name', 'B.id', 'B.amount'], '두 테이블의 같은 열 이름 구별');
const right = buildSqlSolutionTables({ ...base, code: 'SELECT COUNT(*) AS result FROM A RIGHT JOIN B ON A.id=B.id WHERE A.id IS NULL;', answerText: '1' });
assert.deepEqual(right[1].rows, [[null, null, 4, 99]], 'RIGHT JOIN 미연결 행 유지');
const inner = buildSqlSolutionTables({ ...base, code: 'SELECT COUNT(*) AS result FROM (SELECT A.id, SUM(B.amount) AS total FROM A JOIN B ON A.id=B.id GROUP BY A.id HAVING SUM(B.amount)>10) AS D;', answerText: '1' });
assert.deepEqual(inner.find(t => t.title === '파생 테이블 완성 결과').rows, [[1, 13]], 'GROUP BY·HAVING 뒤 파생 테이블은 원본 행이 아닌 그룹 결과');
const view = buildSqlSolutionTables({ ...base, code: 'CREATE VIEW SALES_VIEW AS SELECT A.id, B.amount FROM A JOIN B ON A.id=B.id WHERE B.amount>6; SELECT id, amount FROM SALES_VIEW ORDER BY id, amount;', answerText: '1 8' });
assert.deepEqual(view.find(t => t.title.startsWith('VIEW')).columns, ['id', 'amount']);
assert.deepEqual(view.find(t => t.title.startsWith('VIEW')).rows, [[1, 8]], '두 표에서 만든 VIEW 완성 결과');
const empty = buildSqlSolutionTables({ ...base, code: 'SELECT A.id, B.amount FROM A JOIN B ON A.id=B.id WHERE B.amount>200;', answerText: '' });
assert.deepEqual(empty.at(-1).columns, ['id', 'amount']);
assert.deepEqual(empty.at(-1).rows, [], '빈 결과에서도 열 이름 보존');
const cte = buildSqlSolutionTables({ ...base, code: 'WITH chosen AS (SELECT id, amount FROM B WHERE amount>6) SELECT COUNT(*) AS result FROM chosen;', answerText: '2' });
assert.equal(cte.find(t => t.title.startsWith('WITH')).rows.length, 2);
const correlatedQuestion = sqlCodeQuestions.find(q => q.family === 'additional-nested-average-correlated');
const correlated = buildSqlSolutionTables(correlatedQuestion).find(t => t.title === '행별 조건 대입');
const index = name => correlated.columns.indexOf(name);
assert.equal(correlated.rows[0][index('WHERE 판정')], 'UNKNOWN(NULL)');
assert.equal(correlated.rows[0][index('평균 분모(개수)')], 0, '빈 평균과 숫자 0을 구분');
assert.equal(correlated.rows[2][index('평균 분자(합)')], 44);
assert.equal(correlated.rows[2][index('평균 분모(개수)')], 3, '외부 행마다 평균 대상과 개수 추적');
const havingQuestion = sqlCodeQuestions.find(q => q.family === 'group-having-subquery-average');
const having = buildSqlSolutionTables(havingQuestion);
assert(having.some(t => t.title.startsWith('SUM(amount) 계산') && t.calculationNotes.length > 0));
assert(having.some(t => t.title === '그룹별 HAVING 판정'), 'SELECT 목록 밖 HAVING의 집계도 값 대입');
const nullableQuestion = sqlCodeQuestions.find(q => q.family === 'additional-nullable-distinct-count');
const nullable = buildSqlSolutionTables(nullableQuestion);
assert.equal(nullable.find(t => t.title === 'COUNT(value) 계산').rows[0].at(-1), 4);
assert.equal(nullable.find(t => t.title === 'COUNT(DISTINCT value) 계산').rows[0].at(-1), 3);

const auth = '\0sql-tables-test-auth';
const server = await createServer({ configFile: false, plugins: [react(), {
  name: 'sql-tables-test-auth', enforce: 'pre',
  resolveId(id) { if (id === '../contexts/AuthContext') return auth; },
  load(id) { if (id === auth) return 'export function useAuth(){return {user:{id:"test-only"}}}'; },
}], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false } });
try {
  const { default: Tables } = await server.ssrLoadModule('/src/components/SqlSolutionTables.jsx');
  const { default: Panel } = await server.ssrLoadModule('/src/components/SqlPracticePanel.jsx');
  for (const question of all) {
    const before = renderToStaticMarkup(createElement(Panel, { question }));
    assert(!before.includes('SQL 단계별 완성 표') && !before.includes('SQL 완성 표를 불러오는 중'), `${question.id}: 풀이 전에는 표와 지연 로딩 안내 모두 미노출`);
    const html = renderToStaticMarkup(createElement(Tables, { questionId: question.id }));
    assert.equal((html.match(/<table\b/gu) ?? []).length, saved.questions[question.id].length, `${question.id}: 단계별 표 렌더링`);
    if (saved.questions[question.id].some(t => t.rows.length === 0)) assert(html.includes('조건에 맞는 행이 없습니다. (0행)'));
    if (saved.questions[question.id].some(t => t.rows.some(row => row.includes(null)))) assert(html.includes('<em>NULL</em>'));
  }
  assert.equal(renderToStaticMarkup(createElement(Tables, { questionId: 'missing' })), '');
  console.log(`PASS: 현재·구버전 352문항, JOIN ${joins}개·파생 테이블 ${derived}개, LEFT/RIGHT·중복 행·NULL·VIEW·WITH·빈 결과·제출 전 비노출·해설 표 렌더링`);
} finally {
  await server.close();
}
