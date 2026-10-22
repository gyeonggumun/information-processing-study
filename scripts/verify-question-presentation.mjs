import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { additionalWrittenQuestions } from '../src/data/additionalWrittenQuestions.js';
import { refreshedWrittenQuestions } from '../src/data/practicalRefreshWritten.js';
import { cCodeQuestions, javaCodeQuestions, pythonCodeQuestions, sqlCodeQuestions } from '../src/data/practicalRefreshCode.js';
import { getRestoredProblemBlocks, getRestoredProblemNote } from '../src/lib/restoredProblemPresentation.js';

const authModule = '\0question-presentation-auth';
const server = await createServer({ configFile: false, plugins: [react(), {
  name: 'question-presentation-auth', enforce: 'pre',
  resolveId(id) { if (id === '../contexts/AuthContext') return authModule; },
  load(id) { if (id === authModule) return 'export function useAuth() { return { appRole: "pro", user: { id: "test-only" }, isLoading: false }; }'; },
}], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false } });
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
const heading = html => html.match(/<h2\b[^>]*>(.*?)<\/h2>/su)?.[1];

try {
  const { default: Written } = await server.ssrLoadModule('/src/components/ExamRetryPanel.jsx');
  const { default: Code } = await server.ssrLoadModule('/src/components/CodePracticePanel.jsx');
  const { default: Sql } = await server.ssrLoadModule('/src/components/SqlPracticePanel.jsx');
  const { default: Restored } = await server.ssrLoadModule('/src/components/RestoredExamPanel.jsx');
  const { restoredExamQuestions } = await server.ssrLoadModule('/src/data/restoredExams.js');
  const written = refreshedWrittenQuestions;
  const groups = [
    [Written, written, '필답형 문제'],
    [Code, cCodeQuestions, 'C 코드 문제'],
    [Code, javaCodeQuestions, 'Java 코드 문제'],
    [Code, pythonCodeQuestions, 'Python 코드 문제'],
    [Sql, sqlCodeQuestions, 'SQL 쿼리 문제'],
    [Restored, restoredExamQuestions, '실기 복원 문제'],
  ];
  assert.deepEqual(groups.map(([, questions]) => questions.length), [601, 210, 210, 210, 210, 220]);
  for (const [Panel, questions, title] of groups) {
    for (const question of questions) {
      const render = extra => renderToStaticMarkup(createElement(Panel, { question, onClose() {}, ...extra }));
      const before = render({});
      assert.equal(heading(before), title, `${question.id}: 풀이 전 중립 제목`);
      assert(!before.includes('code-solution') && !before.includes('풀이 과정') && !before.includes('핵심 개념'), `${question.id}: 풀이 전 해설 미노출`);
      if (question.prompt) assert(before.includes(escape(question.prompt)), `${question.id}: 문제 조건 유지`);
      if (question.code) assert(before.includes(escape(question.code)), `${question.id}: 코드 유지`);
      if (question.tables) for (const table of question.tables) {
        assert(before.includes(escape(table.name)), `${question.id}: 자료 표 유지`);
      }
      if (question.restored) {
        if (question.correction) assert(!before.includes(escape(question.correction)), `${question.id}: 정답을 포함한 검수 안내 미노출`);
        const note = getRestoredProblemNote(question);
        if (note) assert(before.includes(escape(note)), `${question.id}: 필수 전제 유지`);
        const retry = render({ isRetry: true });
        assert.equal(heading(retry), title, `${question.id}: 복원 오답 복습도 동일`);
      }
      for (const is_correct of [true, false]) {
        const after = render({ reviewAttempt: { is_correct } });
        assert.equal(heading(after), escape(question.title), `${question.id}: 풀이 기록에서 개념 제목 복원`);
        if (question.restored) {
          assert(after.includes('풀이 과정') && after.includes('정답 / 예시 답안'), `${question.id}: 복원 해설 유지`);
          if (question.correction) assert(after.includes(escape(question.correction)), `${question.id}: 검수 안내는 해설에서 공개`);
        } else {
          assert(after.includes(escape(question.explanation)), `${question.id}: 해설 유지`);
          assert(after.includes(escape(question.answerText)), `${question.id}: 정답 유지`);
          if (question.language) assert(after.includes('code-solution') && after.includes('풀이 과정'), `${question.id}: 주석과 단계별 풀이 유지`);
        }
      }
    }
  }
  const coins = restoredExamQuestions.find(q => q.id === 'past-2023-2-q2');
  const original = JSON.stringify(coins.blocks);
  const display = getRestoredProblemBlocks(coins).find(b => b.type === 'code').text;
  assert(!/4장 출력|1개 출력|2개 출력/u.test(display), '출력값 주석 제거');
  for (const amount of ['1000', '500', '100', '10']) assert(display.includes(`// ${amount}원 개수`), '빈칸의 동전 단위 대응 유지');
  assert.equal(JSON.stringify(coins.blocks), original, '복원 원본은 변경하지 않음');
  const malware = restoredExamQuestions.find(q => q.id === 'past-2025-1-q4');
  assert(!getRestoredProblemBlocks(malware).some(b => b.text?.includes('랜섬웨어이다.')), '정답을 노출하지 않고 지문의 잘못된 악성코드 분류 수정');
  const cipher = restoredExamQuestions.find(q => q.id === 'past-2024-2-q7');
  assert(!getRestoredProblemBlocks(cipher).some(b => b.text?.includes('1997년')), '잘못된 표준 제정 연도 제거, 정답은 미공개');
  for (const id of ['past-2026-2-q20', 'past-2024-1-q6']) {
    const note = getRestoredProblemNote(restoredExamQuestions.find(q => q.id === id));
    assert(note.includes('→') && !/3NF|BCNF|제3|후보키|슈퍼키/u.test(note), '함수 종속은 제공하되 정규형 답이나 판단 과정은 제외');
  }
  const changed = additionalWrittenQuestions.filter(q => [
    'practice-additional-design-037', 'practice-additional-design-038',
    'practice-additional-design-039', 'practice-additional-design-040',
    'practice-additional-database-031', 'practice-additional-systems-032',
  ].includes(q.id));
  assert.equal(changed.length, 6);
  for (const question of changed) for (const answer of question.acceptedAnswers) {
    if (answer.length >= 3) assert(!question.prompt.includes(answer), `${question.id}: 정답 후보 나열 제거`);
  }
  console.log('PASS: 1,661문항의 풀이 전 중립 제목·조건 보존, 정답/오답 기록의 해설·주석 유지, 복원 검수 안내 분리, 보기식 힌트 6건·출력값 주석 제거');
} finally {
  await server.close();
}
