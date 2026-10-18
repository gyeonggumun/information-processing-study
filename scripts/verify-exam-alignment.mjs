import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cCodeQuestions, previousCCodeQuestions } from '../src/data/cCodeQuestions.js';
import { javaCodeQuestions, previousJavaCodeQuestions } from '../src/data/javaCodeQuestions.js';
import { pythonCodeQuestions, previousPythonCodeQuestions } from '../src/data/pythonCodeQuestions.js';
import { sqlCodeQuestions, previousSqlCodeQuestions } from '../src/data/sqlCodeQuestions.js';
import { practiceQuestions, previousPracticeQuestions } from '../src/data/practiceQuestionBank.js';
import { examFocusedQuestions } from '../src/data/examFocusedQuestions.js';
import { additionalWrittenQuestions } from '../src/data/additionalWrittenQuestions.js';
import { buildCodeWalkthrough } from '../src/lib/codeWalkthrough.js';
import { getUnseenQuestions, practiceKey, summarizePracticeHistory } from '../src/lib/practiceHistory.js';
import { summarizeWrongAnswers } from '../src/lib/wrongAnswers.js';
import { matchesWrittenAnswer } from '../src/lib/writtenAnswer.js';

const source = JSON.parse(readFileSync('src/data/restoredExamsSource.json', 'utf8'));
const original = new Map(source.flatMap(exam => exam.questions.map(question => [question.id, question])));
const compact = text => text.replace(/\s+/gu, '');
const sourceCode = new Set([...original.values()].flatMap(q => q.blocks.filter(b => b.type === 'code').map(b => compact(b.text))));
const groups = [
  ['exam', practiceQuestions, previousPracticeQuestions, 16],
  ['C', cCodeQuestions, previousCCodeQuestions, 20],
  ['Java', javaCodeQuestions, previousJavaCodeQuestions, 15],
  ['Python', pythonCodeQuestions, previousPythonCodeQuestions, 35],
  ['SQL', sqlCodeQuestions, previousSqlCodeQuestions, 10],
];
let changedCount = 0;
for (const [type, current, previous, expected] of groups) {
  const revised = current.filter(q => q.revisionOf);
  assert.equal(revised.length, expected, `${type}: 교체 수`);
  assert.equal(previous.length, expected, `${type}: 과거 기록용 보존 수`);
  assert.equal(new Set([...current, ...previous].map(q => q.id)).size, current.length + previous.length, `${type}: 신구 ID 중복 없음`);
  assert.equal(current.length, type === 'exam' ? 280 : 190);
  if (type !== 'exam') for (const level of ['하', '중', '상']) assert.equal(current.filter(q => q.difficulty === level).length, { 하: 60, 중: 65, 상: 65 }[level]);
  const oldMap = new Map(previous.map(q => [q.id, q]));
  const map = new Map([...previous, ...current].map(q => [practiceKey(type, q.id), q]));
  for (const question of revised) {
    const old = oldMap.get(question.revisionOf);
    assert.ok(old && question.id === `${old.id}-r2`);
    assert.ok(question.examReferences.length > 0 && question.examReferences.every(id => original.has(id)), `${question.id}: 실제 비교 회차·문항 연결`);
    assert.ok(question.explanation.length > 40, question.id);
    if (type === 'exam') {
      assert.notEqual(question.prompt, old.prompt);
      for (const answer of question.acceptedAnswers) assert.ok(matchesWrittenAnswer(question, answer), `${question.id}: 동의 답안 채점`);
    } else {
      assert.notEqual(question.code, old.code);
      assert.ok(!sourceCode.has(compact(question.code)), `${question.id}: 복원 코드 그대로 복제하지 않음`);
      if (type !== 'SQL') {
        const walkthrough = buildCodeWalkthrough(question);
        assert.equal(walkthrough.steps.length, question.trace.length);
        assert.ok(walkthrough.steps.every(step => step.lineIndex >= 0));
      }
    }
    const oldAttempt = { id: 'old-result', practice_type: type, question_id: old.id, is_correct: false, created_at: '2026-10-17T00:00:00Z' };
    const completedKeys = new Set([practiceKey(type, old.id)]);
    assert.equal(getUnseenQuestions([question], type, completedKeys)[0].id, question.id, '구버전 풀이가 새 문제를 푼 것으로 처리되지 않음');
    assert.equal(map.get(summarizePracticeHistory([oldAttempt])[0].key).id, old.id, '과거 해설은 구버전 문제와 연결');
    assert.equal(summarizeWrongAnswers([oldAttempt], map).pending[0].question.id, old.id, '과거 오답 복습 보존');
    assert.equal(getUnseenQuestions([question], type, new Set([practiceKey(type, question.id)])).length, 0, '새 문제 제출 후 중복 출제 제외');
  }
  changedCount += revised.length;
}
assert.equal(changedCount, 96);
assert.equal(practiceQuestions.length + examFocusedQuestions.length + additionalWrittenQuestions.length, 521, '일반 필답형 기존 361문항 및 신규 160문항');
for (const path of ['src/pages/PracticeHistoryPage.jsx', 'src/pages/WrongAnswersPage.jsx']) assert.ok(readFileSync(path, 'utf8').includes('Object.entries(previousQuestions)'), `${path}: 구버전 조회 연결`);
console.log('PASS: 창작 변형 96문항·회차 근거·원문 코드 비동일·기존 문항 수 유지·풀이 주석 위치·구버전 기록과 새 문제 ID 분리');
