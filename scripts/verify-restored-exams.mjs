import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getUnseenQuestions } from '../src/lib/practiceHistory.js';
import { summarizeWrongAnswers } from '../src/lib/wrongAnswers.js';
import { restoredExamSolutions } from '../src/data/restoredExamSolutions.js';
import { pickRestoredExamQuestion } from '../src/lib/restoredExamPractice.js';

const source = JSON.parse(readFileSync('src/data/restoredExamsSource.json', 'utf8'));
const authModule = '\0restored-exam-test-auth';
const server = await createServer({ configFile: false, plugins: [react(), {
  name: 'restored-exam-test-auth',
  enforce: 'pre',
  resolveId(id) { if (id === '../contexts/AuthContext') return authModule; },
  load(id) { if (id === authModule) return 'export let testAuth = {}; export function setTestAuth(value) { testAuth = value; } export function useAuth() { return testAuth; }'; },
}], server: { middlewareMode: true, hmr: false } });
try {
  const { restoredExams, restoredExamQuestions } = await server.ssrLoadModule('/src/data/restoredExams.js');
  const { RestoredBlocks, default: RestoredExamPanel } = await server.ssrLoadModule('/src/components/RestoredExamPanel.jsx');
  const { setTestAuth } = await server.ssrLoadModule(authModule);
  assert.equal(restoredExams.length, 11);
  assert.equal(restoredExamQuestions.length, 220);
  assert.equal(new Set(restoredExamQuestions.map(q => q.id)).size, 220);
  const posts = ['562', '561', '558', '554', '540', '495', '483', '476', '453', '420', '372'];
  let images = 0;
  for (const [i, exam] of restoredExams.entries()) {
    assert.ok(exam.sourceUrl.endsWith(`/${posts[i]}`));
    assert.equal(exam.author, 'Life-Journey');
    assert.equal(exam.license, 'https://creativecommons.org/licenses/by/4.0/');
    assert.match(exam.sourceSha256, /^[a-f0-9]{64}$/);
    assert.equal(exam.questions.length, 20);
    assert.equal(restoredExamSolutions[exam.id].length, 20);
    assert.deepEqual(exam.questions.map(q => q.number), Array.from({ length: 20 }, (_, n) => n + 1));
    for (const q of exam.questions) {
      assert.ok(q.blocks.length > 0 && q.answerBlocks.length > 0);
      assert.ok(q.explanation.every(step => step.length >= 20), `${q.id}: 충분한 풀이 설명`);
      const original = source[i].questions[q.number - 1];
      assert.deepEqual(q.blocks, original.blocks, `${q.id}: 문제 조건·숫자·코드 보존`);
      for (const blocks of [q.blocks, q.answerBlocks]) {
        const html = renderToStaticMarkup(createElement(RestoredBlocks, { blocks }));
        for (const block of blocks) {
          assert.ok(['text', 'code', 'image', 'table'].includes(block.type));
          if (block.type === 'image') {
            assert.match(block.src, /^\/restored-exams\/[\w-]+\.(png|jpg|webp)$/);
            assert.ok(existsSync(`public${block.src}`));
            const magic = readFileSync(`public${block.src}`).subarray(0, 12);
            if (block.src.endsWith('.png')) assert.deepEqual([...magic.subarray(0, 4)], [137, 80, 78, 71]);
            else if (block.src.endsWith('.jpg')) assert.deepEqual([...magic.subarray(0, 2)], [255, 216]);
            else assert.equal(magic.toString('ascii', 8), 'WEBP');
            assert.ok(html.includes(block.src));
            assert.ok(!block.source.includes('?'), 'CDN 임시 서명은 배포하지 않음');
            images++;
          } else if (block.type === 'table') {
            assert.ok(block.rows.length > 0 && html.includes('<table'));
          } else {
            assert.equal(typeof block.text, 'string');
            assert.ok(block.text.trim());
            const escaped = block.text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
            assert.ok(html.includes(escaped), `${q.id}: ${block.type} 원문 렌더링 보존`);
          }
        }
      }
    }
  }
  const lookup = new Map(restoredExamQuestions.map(q => [`exam:${q.id}`, q]));
  const first = restoredExamQuestions[0];
  const empty = new Set();
  for (let i = 0; i < restoredExamQuestions.length; i++) {
    assert.equal(pickRestoredExamQuestion(restoredExamQuestions, empty, undefined, () => (i + 0.5) / 220).id, restoredExamQuestions[i].id, '모든 회차의 220문항을 랜덤 후보에 포함');
  }
  assert.equal(pickRestoredExamQuestion(restoredExamQuestions, new Set(lookup.keys())), null, '전체 완료');
  assert.equal(pickRestoredExamQuestion([], empty), null, '빈 문제은행');
  assert.notEqual(pickRestoredExamQuestion(restoredExamQuestions, empty, first.id, () => 0).id, first.id, '다른 문제는 현재 문제 제외');
  assert.notEqual(pickRestoredExamQuestion(restoredExamQuestions, new Set([`exam:${first.id}`]), undefined, () => 0).id, first.id, '정답·오답 모두 재출제 제외');
  assert.equal(pickRestoredExamQuestion([first], empty, first.id).id, first.id, '남은 하나를 건너뛰어도 완료 처리하지 않음');
  const completed = new Set();
  while (completed.size < 220) {
    const picked = pickRestoredExamQuestion(restoredExamQuestions, completed);
    assert.ok(picked && !completed.has(`exam:${picked.id}`));
    completed.add(`exam:${picked.id}`);
  }
  assert.equal(pickRestoredExamQuestion(restoredExamQuestions, completed), null, '중복 없이 전체 풀이 후 종료');
  for (const appRole of ['user', 'pro', 'admin', undefined, 'invalid']) {
    setTestAuth({ appRole, user: { id: 'test-only' }, isLoading: false });
    for (const mode of [{}, { isRetry: true }, { reviewAttempt: { is_correct: false } }]) {
      const panel = renderToStaticMarkup(createElement(RestoredExamPanel, { question: first, onClose() {}, ...mode }));
      if (appRole === 'pro' || appRole === 'admin') assert.ok(panel.includes(first.title), `${appRole}: 문제·복습 허용`);
      else assert.ok(panel.includes('Pro 이상 전용 문제입니다.') && !panel.includes(first.title) && !panel.includes('내 답안') && !panel.includes('풀이 과정'), `${appRole}: 문제·해설·자기채점 차단`);
    }
  }
  setTestAuth({ appRole: 'pro', isLoading: true });
  assert.ok(!renderToStaticMarkup(createElement(RestoredExamPanel, { question: first })).includes(first.title), '권한 확인 중에는 문제 미노출');
  assert.match(readFileSync('src/App.jsx', 'utf8'), /function RestoredExamRoute\(\)\s*\{\s*return <ProtectedRoute requiredRole="pro">/);
  const attempt = { practice_type: 'exam', question_id: first.id, is_correct: false };
  assert.equal(getUnseenQuestions(restoredExams[0].questions, 'exam', new Set(lookup.keys())).length, 0);
  assert.equal(getUnseenQuestions(restoredExams[0].questions, 'exam', new Set([`exam:${first.id}`])).length, 19);
  assert.equal(summarizeWrongAnswers([attempt], lookup).pending[0].question.id, first.id);
  assert.equal(summarizeWrongAnswers([{ ...attempt, is_correct: true }, attempt], lookup).resolvedCount, 1);
  const fixed = restoredExamQuestions.find(q => q.id === 'past-2023-2-q4');
  assert.ok(fixed.answerBlocks[0].text.startsWith('INSERT INTO'));
  assert.ok(restoredExamQuestions.find(q => q.id === 'past-2023-3-q5').answerBlocks[0].text === '->');
  const commands = restoredExamQuestions.find(q => q.id === 'past-2025-3-q3');
  assert.ok(commands.blocks.some(b => b.text?.startsWith('4. 파일을 복사')));
  assert.equal(commands.answerBlocks.length, 4, '문제 안의 번호 목록을 새 문항으로 오인하지 않음');
  assert.equal(restoredExamQuestions.find(q => q.id === 'past-2025-3-q4').answerBlocks.length, 5);
  assert.ok(restoredExamQuestions.find(q => q.id === 'past-2023-2-q19').blocks.some(b => b.type === 'code'), '구형 코드 표도 코드 블록으로 복원');
  assert.equal(images, 34);
  const malicious = renderToStaticMarkup(createElement(RestoredBlocks, { blocks: [{ type: 'text', text: '<script>alert(1)</script>' }] }));
  assert.ok(malicious.includes('&lt;script&gt;') && !malicious.includes('<script>'));
  console.log(`PASS: 전체 220문항 랜덤 후보·중복 제외·완료 처리, Pro/Admin 허용 및 일반 계정 문제·해설·오답 복습 차단, 11회차 출처·34개 도표(실제 ${images}개 참조)·원문 보존·오답 연동`);
} finally {
  await server.close();
}
