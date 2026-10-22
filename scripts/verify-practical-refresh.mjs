import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';
import { refreshedCodeQuestions as code, refreshedPreviousCodeQuestions as oldCode, codeRefreshAudit } from '../src/data/practicalRefreshCode.js';
import { refreshedWrittenQuestions as written, refreshedPreviousWrittenQuestions as oldWritten, writtenRefreshAudit } from '../src/data/practicalRefreshWritten.js';
import { getCodeSolutionGuide } from '../src/lib/codeSolutionGuides.js';
import { getSqlSolutionGuide } from '../src/lib/sqlSolutionGuide.js';
import { buildCodeWalkthrough } from '../src/lib/codeWalkthrough.js';
import { matchesWrittenAnswer } from '../src/lib/writtenAnswer.js';
import { getUnseenQuestions, practiceKey, summarizePracticeHistory } from '../src/lib/practiceHistory.js';
import { summarizeWrongAnswers } from '../src/lib/wrongAnswers.js';

const exams = JSON.parse(readFileSync('src/data/restoredExamsSource.json', 'utf8'));
const originals = exams.flatMap(e => e.questions), referenceIds = new Set(originals.map(q => q.id));
const groups = { exam: [written, oldWritten], ...Object.fromEntries(Object.keys(code).map(type => [type, [code[type], oldCode[type]]])) };
let added = 0, changed = 0;
for (const [type, [bank, archived]] of Object.entries(groups)) {
  const keyMap = new Map([...bank, ...archived].map(q => [practiceKey(type, q.id), q]));
  assert.equal(keyMap.size, bank.length + archived.length, `${type}: 현재·보관 ID 충돌 없음`);
  const additions = bank.filter(q => q.id.startsWith('practical-extra-'));
  assert.equal(additions.length, type === 'exam' ? 80 : 20);
  if (type === 'exam') for (const subject of new Set(written.map(q => q.subject))) assert.equal(additions.filter(q => q.subject === subject).length, 20);
  added += additions.length;
  const revised = bank.filter(q => q.alignmentRevisionOf);
  changed += revised.length;
  for (const q of revised) {
    assert.equal(q.id, `${q.alignmentRevisionOf}-r3`);
    const before = archived.find(old => old.id === q.alignmentRevisionOf);
    assert(before, `${q.id}: 이전 문항 복습용 보관`);
    assert(!bank.some(old => old.id === before.id), `${q.id}: 이전 문항 랜덤 출제 제외`);
    assert.notEqual(type === 'exam' ? before.prompt : before.code, type === 'exam' ? q.prompt : q.code);
    const attempt = { id: 'test-only', practice_type: type, question_id: before.id, is_correct: false, created_at: '2026-10-22T00:00:00Z' };
    assert.equal(keyMap.get(summarizePracticeHistory([attempt])[0].key), before);
    assert.equal(summarizeWrongAnswers([attempt], keyMap).pending[0].question, before);
    assert.equal(getUnseenQuestions([q], type, new Set([practiceKey(type, before.id)])).length, 1);
    assert.equal(getUnseenQuestions([q], type, new Set([practiceKey(type, q.id)])).length, 0);
  }
  const content = q => type === 'exam' ? q.prompt.replace(/\s+/gu, '') : JSON.stringify([q.code, q.tables]);
  assert.equal(new Set(bank.map(content)).size, bank.length, `${type}: 현재 지문·코드·표 중복 없음`);
  for (const q of [...additions, ...revised]) {
    assert(q.prompt && q.answerText.trim() && q.explanation.length >= 60, `${q.id}: 지문·답·전체 해설`);
    assert(q.examReferences.length && q.examReferences.every(id => referenceIds.has(id)), `${q.id}: 근거 복원 문항 확인`);
    assert(!originals.some(o => o.blocks.some(b => b.type === 'code' && b.text === q.code)), `${q.id}: 복원 코드 전재 아님`);
    if (type === 'exam') {
      assert.equal(q.type, '필답형'); assert(!q.choices);
      q.acceptedAnswers.forEach(answer => assert(matchesWrittenAnswer(q, answer), `${q.id}: 정답 별칭`));
      assert(!matchesWrittenAnswer(q, ''));
    } else {
      const guide = type === 'SQL' ? getSqlSolutionGuide(q) : getCodeSolutionGuide(q);
      assert(guide.rules.length >= 2 && guide.caution.length > 25);
      if (type !== 'SQL') {
        const walk = buildCodeWalkthrough(q);
        assert.equal(walk.steps.length, q.trace.length);
        assert.equal(q.trace.length, q.anchors.length);
        assert(walk.steps.every(step => step.lineIndex >= 0));
      }
    }
  }
}
assert.equal(added, 160); assert.equal(changed, 117);
assert.equal(changed, codeRefreshAudit.length + writtenRefreshAudit.length);
assert.equal(written.length, 601);
Object.values(code).forEach(bank => assert.equal(bank.length, 210));

// 별도 목록만 검증하는 실수를 막고 실제 페이지의 데이터 진입점을 검사합니다.
const server = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false } });
try {
  const actual = await server.ssrLoadModule('/src/data/studyData.js');
  assert.deepEqual(actual.practiceQuestions.map(q => q.id), written.map(q => q.id));
  for (const type of Object.keys(code)) {
    assert.deepEqual(actual.codeQuestions[type].map(q => q.id), code[type].map(q => q.id));
    assert.deepEqual(actual.previousQuestions[type].map(q => q.id), oldCode[type].map(q => q.id));
  }
  assert.deepEqual(actual.previousQuestions.exam.map(q => q.id), oldWritten.map(q => q.id));
} finally { await server.close(); }
console.log('PASS: 최종 랜덤 출제 1,441문항, 유형 교체 117개·신규 160개, 8항목별 추가 수·근거·주석·실제 페이지 연결·기존 풀이와 오답 보존');
