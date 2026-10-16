import assert from 'node:assert/strict';
import { getUnseenQuestions, loadPracticeAttempts, mergeAttempts, practiceKey, savePracticeAttempt, summarizePracticeHistory } from '../src/lib/practiceHistory.js';

const types = ['exam', 'C', 'Java', 'Python', 'SQL'];
const record = (id, type = 'exam', correct = true, time = '2026-10-16T00:00:00Z') => ({ id, user_id: 'owner', practice_type: type, question_id: id, is_correct: correct, created_at: time });

// 정답·오답·언어에 관계없이 한 번 제출한 문제는 일반 출제에서 제외합니다.
for (const type of types) {
  for (const difficulty of ['하', '중', '상']) {
    const questions = Array.from({ length: 50 }, (_, index) => ({ id: String(index), difficulty }));
    const completed = new Set();
    while (completed.size < questions.length) {
      const candidates = getUnseenQuestions(questions, type, completed);
      assert.equal(candidates.length, questions.length - completed.size);
      const question = candidates[Math.floor(Math.random() * candidates.length)];
      const key = practiceKey(type, question.id);
      assert.ok(!completed.has(key));
      completed.add(key);
    }
    assert.deepEqual(getUnseenQuestions(questions, type, completed), []);
    assert.equal(getUnseenQuestions(questions, 'different-type', completed).length, 50);
  }
}
assert.deepEqual(getUnseenQuestions([{ id: 'last' }], 'exam', new Set(), 'last'), []);
const wrongAndRight = [record('wrong', 'exam', false), record('right')];
assert.equal(getUnseenQuestions([{ id: 'wrong' }, { id: 'right' }], 'exam', new Set(wrongAndRight.map(attempt => practiceKey(attempt.practice_type, attempt.question_id)))).length, 0);

const oldWrong = record('old', 'SQL', false);
oldWrong.question_id = 'same';
const retry = record('retry', 'SQL', true, '2026-10-16T01:00:00Z');
retry.question_id = 'same';
const rows = mergeAttempts([oldWrong, record('C', 'C')], [retry, retry]);
const summary = summarizePracticeHistory(rows);
assert.equal(rows.length, 3);
assert.equal(summary.length, 2);
assert.equal(summary[0].attempt.id, 'retry');
assert.equal(summary[0].attempt.is_correct, true);
assert.equal(summary[0].count, 2);
assert.equal(rows.length, 3, '해설 요약은 원본 통계를 변경하지 않음');

// 1,000건 이상도 계정 필터·안정적 정렬·500건 페이지 조회를 유지합니다.
const source = Array.from({ length: 1203 }, (_, index) => record(String(index).padStart(5, '0')));
const ranges = [];
const client = { from(table) {
  assert.equal(table, 'practice_attempts');
  return { select() { return this; }, eq(column, value) { assert.equal(column, 'user_id'); assert.equal(value, 'owner'); return this; }, order() { return this; }, range(start, end) { ranges.push([start, end]); this.result = { data: source.slice(start, end + 1) }; return this; }, abortSignal(signal) { assert.ok(signal instanceof AbortSignal); return Promise.resolve(this.result); } };
} };
assert.equal((await loadPracticeAttempts(client, 'owner', new AbortController().signal)).length, 1203);
assert.deepEqual(ranges, [[0, 499], [500, 999], [1000, 1499]]);
const failingClient = { from: () => ({ select() { return this; }, eq() { return this; }, order() { return this; }, range() { return this; }, abortSignal: async () => ({ error: Error('offline') }) }) };
await assert.rejects(loadPracticeAttempts(failingClient, 'owner', new AbortController().signal), /offline/);

// 응답 유실에 따른 재전송은 본인의 같은 UUID만 확인하고 중복 등록하지 않습니다.
for (const duplicate of [false, true]) {
  let lookup = false;
  const filters = [];
  const saved = record('stable-uuid');
  const mock = { from: () => ({ insert() { return this; }, select() { return this; }, eq(column, value) { lookup = true; filters.push([column, value]); return this; }, single: async () => duplicate && !lookup ? { error: { code: '23505' } } : { data: saved } }) };
  assert.equal((await savePracticeAttempt(mock, saved)).id, saved.id);
  if (duplicate) assert.deepEqual(filters, [['user_id', 'owner'], ['id', 'stable-uuid']]);
}
await assert.rejects(savePracticeAttempt({ from: () => ({ insert() { return this; }, select() { return this; }, single: async () => ({ error: Error('save failed') }) }) }, record('failure')), /save failed/);

console.log('PASS: 5유형·3난이도 비중복 출제, 전체 완료, 정답·오답 제외, 최신 풀이 요약, 1,203건 계정별 조회, 저장 오류·동일 UUID 재시도');
