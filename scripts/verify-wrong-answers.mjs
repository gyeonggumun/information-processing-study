import assert from 'node:assert/strict';
import { summarizeWrongAnswers } from '../src/lib/wrongAnswers.js';
import { matchesWrittenAnswer } from '../src/lib/writtenAnswer.js';

const questionMap = new Map(['exam:e1', 'C:c1', 'Java:j1', 'Python:p1', 'SQL:s1'].map((key) => [key, { title: key }]));
const attempt = (practice_type, question_id, is_correct) => ({ practice_type, question_id, is_correct });
const history = [
  attempt('SQL', 's1', true),
  attempt('C', 'c1', false),
  attempt('exam', 'e1', false),
  attempt('Python', 'p1', false),
  attempt('Java', 'j1', false),
  attempt('SQL', 's1', false),
  attempt('exam', 'e1', true),
  attempt('C', 'removed', false),
];

const summary = summarizeWrongAnswers(history, questionMap);
assert.deepEqual(summary.pending.map(({ key }) => key), ['C:c1', 'exam:e1', 'Python:p1', 'Java:j1']);
assert.equal(summary.resolvedCount, 1);
assert.equal(summary.totalWrongAttempts, 6);
assert.equal(summary.unavailableCount, 1);

const afterRetry = summarizeWrongAnswers([attempt('exam', 'e1', true), ...history], questionMap);
assert.deepEqual(afterRetry.pending.map(({ key }) => key), ['C:c1', 'Python:p1', 'Java:j1']);
assert.equal(afterRetry.resolvedCount, 2);

assert.ok(matchesWrittenAnswer({ acceptedAnswers: ['정규화', 'Normalization'] }, ' normalization '));
assert.ok(!matchesWrittenAnswer({ acceptedAnswers: ['정규화'] }, '반정규화'));

console.log('오답노트: 최신 풀이 기준 목록, 재풀이 완료, 유형 통합, 답안 채점 검증 완료');
