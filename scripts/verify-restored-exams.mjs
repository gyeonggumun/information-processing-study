import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getUnseenQuestions } from '../src/lib/practiceHistory.js';
import { summarizeWrongAnswers } from '../src/lib/wrongAnswers.js';
import { restoredExamSolutions } from '../src/data/restoredExamSolutions.js';

const source = JSON.parse(readFileSync('src/data/restoredExamsSource.json', 'utf8'));
const server = await createServer({ configFile: false, plugins: [react()], server: { middlewareMode: true, hmr: false } });
try {
  const { restoredExams, restoredExamQuestions } = await server.ssrLoadModule('/src/data/restoredExams.js');
  const { RestoredBlocks } = await server.ssrLoadModule('/src/components/RestoredExamPanel.jsx');
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
  console.log(`PASS: 11회차 220문항·해설·출처·34개 원본 도표(실제 ${images}개 참조), 원문 조건 보존, 오타 보정, XSS 이스케이프, 미풀이 제외·오답 복습 연동`);
} finally {
  await server.close();
}
