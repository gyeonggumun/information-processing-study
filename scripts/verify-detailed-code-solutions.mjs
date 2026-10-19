import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { cCodeQuestions, previousCCodeQuestions } from '../src/data/cCodeQuestions.js';
import { javaCodeQuestions, previousJavaCodeQuestions } from '../src/data/javaCodeQuestions.js';
import { pythonCodeQuestions, previousPythonCodeQuestions } from '../src/data/pythonCodeQuestions.js';
import { sqlCodeQuestions, previousSqlCodeQuestions } from '../src/data/sqlCodeQuestions.js';
import { getCodeSolutionGuide } from '../src/lib/codeSolutionGuides.js';
import { getSqlSolutionGuide } from '../src/lib/sqlSolutionGuide.js';
import { buildCodeCalculationTrace } from '../src/lib/codeCalculationTrace.js';
import { buildCodeWalkthrough } from '../src/lib/codeWalkthrough.js';

const code = [...cCodeQuestions, ...javaCodeQuestions, ...pythonCodeQuestions, ...previousCCodeQuestions, ...previousJavaCodeQuestions, ...previousPythonCodeQuestions];
const sql = [...sqlCodeQuestions, ...previousSqlCodeQuestions];
const current = [...cCodeQuestions, ...javaCodeQuestions, ...pythonCodeQuestions, ...sqlCodeQuestions];
const originals = JSON.stringify([...code, ...sql]);
const counts = { C: 0, Java: 0, Python: 0 };
let rows = 0;
for (const q of [...code, ...sql]) {
  const guide = q.language === 'SQL' ? getSqlSolutionGuide(q) : getCodeSolutionGuide(q);
  assert(guide, `${q.id}: 현재·구버전 모두 풀이 기준 제공`);
  assert(guide.rules.length >= 2 && guide.rules.every(rule => rule.length >= 45), `${q.id}: 단편 키워드가 아닌 문장 설명`);
  assert(guide.caution.length > 25, `${q.id}: 구별할 개념과 주의점`);
  if (q.language === 'SQL') continue;
  const walk = buildCodeWalkthrough(q);
  assert.equal(walk.steps.length, q.trace.length, '기존 주석 번호 및 단계 대응 유지');
  const trace = buildCodeCalculationTrace(q);
  if (!trace) continue;
  counts[q.language]++;
  rows += trace.rows.length;
  assert.equal(trace.output.trim().replace(/\s+/gu, ' '), q.answerText.trim().replace(/\s+/gu, ' '));
  assert(trace.rows.every(row => row.length === trace.columns.length && row.every(value => typeof value === 'string' && !/NaN|undefined/u.test(value))), `${q.id}: 중간 계산 누락 없음`);
  assert.throws(() => buildCodeCalculationTrace({ ...q, answerText: 'incorrect-test-answer' }), /상세 계산 표와 정답 불일치/u, '검증되지 않은 표를 조용히 노출하지 않음');
}
assert(Object.values(counts).every(count => count >= 45), '세 언어 모두 구체적인 중간 계산 표 제공');
assert(rows > 1500);
assert.equal(buildCodeCalculationTrace({ ...cCodeQuestions[0], code: 'unknown template' }), null, '알 수 없는 코드 형태를 추측 계산하지 않음');
const loop = buildCodeCalculationTrace(cCodeQuestions.find(q => q.family === 'loop-continue'));
assert(loop.rows.some(row => row[0] === 'i=2' && row[2].includes('합계 1 유지')), 'continue인 회차도 생략하지 않음');
const sort = buildCodeCalculationTrace(cCodeQuestions.find(q => q.family === 'bubble-pass'));
assert(sort.rows.some(row => row[1].includes('거짓: 유지')) && sort.rows.some(row => row[1].includes('참: 교환')), '교환·미교환 비교 모두 표시');
const branch = buildCodeCalculationTrace(cCodeQuestions.find(q => q.family === 'branch-recursion'));
assert(branch.label.includes('실제 호출 순서와 구분'), 'C의 피연산자 평가 순서를 임의의 시간순으로 단정하지 않음');
const memo = buildCodeCalculationTrace(pythonCodeQuestions.find(q => q.family === 'memo-recursion'));
assert(memo.rows.some(row => row[2].includes('자식 호출 생략')), '캐시 적중과 실제 재귀 계산 구별');

const auth = '\0detailed-solutions-auth';
const server = await createServer({ configFile: false, plugins: [react(), {
  name: 'detailed-solutions-auth', enforce: 'pre',
  resolveId(id) { if (id === '../contexts/AuthContext') return auth; },
  load(id) { if (id === auth) return 'export function useAuth(){return {user:{id:"test-only"}}}'; },
}], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false } });
try {
  const { default: CodePanel } = await server.ssrLoadModule('/src/components/CodePracticePanel.jsx');
  const { default: SqlPanel } = await server.ssrLoadModule('/src/components/SqlPracticePanel.jsx');
  for (const question of current) {
    const Component = question.language === 'SQL' ? SqlPanel : CodePanel;
    const before = renderToStaticMarkup(createElement(Component, { question }));
    assert(!before.includes('먼저 이해할 풀이 기준') && !before.includes('상세 중간 계산'), `${question.id}: 제출 전 힌트로 노출하지 않음`);
    for (const is_correct of [true, false]) {
      const after = renderToStaticMarkup(createElement(Component, { question, reviewAttempt: { is_correct } }));
      assert(after.includes('먼저 이해할 풀이 기준') && after.includes('헷갈리기 쉬운 점'), `${question.id}: 정답·오답 복습 모두 상세 해설`);
      if (question.language !== 'SQL' && buildCodeCalculationTrace(question)) assert(after.includes('상세 중간 계산') && after.includes('scope="row"'), '계산 표와 접근성 행 제목 표시');
    }
  }
} finally { await server.close(); }
assert.equal(JSON.stringify([...code, ...sql]), originals, '문제 코드·정답·식별자·기존 해설 원본은 불변');
console.log(`PASS: 현재 760문항 및 보관 문항의 유형별 설명, 중간 계산 C ${counts.C}·Java ${counts.Java}·Python ${counts.Python}개 / ${rows}단계, 출력 정답 일치·제출 전 비노출·정답/오답 해설·원본 보존`);
