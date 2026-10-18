import assert from 'node:assert/strict';
import { sqlCodeQuestions, previousSqlCodeQuestions } from '../src/data/sqlCodeQuestions.js';
import { practiceQuestions, previousPracticeQuestions } from '../src/data/practiceQuestionBank.js';
import { diversifySqlQuestions } from '../src/data/sqlQuestionVariety.js';
import { diversifyWrittenQuestions } from '../src/data/writtenQuestionVariety.js';
import { matchesWrittenAnswer } from '../src/lib/writtenAnswer.js';
import { getUnseenQuestions, practiceKey, summarizePracticeHistory } from '../src/lib/practiceHistory.js';
import { summarizeWrongAnswers } from '../src/lib/wrongAnswers.js';

const sqlVaried = sqlCodeQuestions.filter(q => q.variationOf);
const writtenVaried = practiceQuestions.filter(q => q.variationOf);
assert.equal(sqlVaried.length, 152);
assert.equal(writtenVaried.length, 40);
assert.equal(sqlVaried.filter(q => q.variedQuery).length, 80, '자료 이름뿐 아니라 검색·집계 조건도 변경');
assert.equal(new Set(sqlVaried.filter(q => q.variedQuery).map(q => JSON.stringify(q.tables))).size, 80, '재구성한 질의끼리도 동일 자료 표를 재사용하지 않음');
const families = Object.values(Object.groupBy(sqlCodeQuestions, q => q.family));
assert.equal(families.length, 38);
for (const family of families) {
  assert.equal(family.length, 5);
  const contexts = family.map(q => q.context ?? 'ORIGINAL');
  assert.equal(new Set(contexts).size, 5, `${family[0].family}: 서로 다른 자료 설정 5개`);
  const shapes = family.map(q => JSON.stringify(q.tables.map(t => [t.name, t.columns])) + q.code);
  assert.equal(new Set(shapes).size, 5, `${family[0].family}: 표·열 배치·SQL이 다름`);
}
assert.equal(families.filter(g => new Set(g.map(q => q.tables.map(t => t.rows.length).join(','))).size > 1).length, 20, '행 개수도 달라진 유형 수');
assert(families.filter(g => new Set(g.map(q => q.answerText)).size > 1).length >= 27, '숫자·문자 답안도 단일 패턴으로 반복되지 않음');
const content = new Set();
for (const q of sqlCodeQuestions) {
  const signature = JSON.stringify(q.tables) + q.code.replace(/\s+/gu, '');
  assert(!content.has(signature), `${q.id}: 자료와 질의의 완전 중복 없음`);
  content.add(signature);
  for (const t of q.tables) {
    assert.equal(new Set(t.columns).size, t.columns.length, `${q.id}: 중복 열 없음`);
    assert(t.rows.every(row => row.length === t.columns.length), `${q.id}: 표의 열과 값 대응`);
  }
}
for (const [type, current, previous, diversify] of [
  ['SQL', sqlCodeQuestions, previousSqlCodeQuestions, diversifySqlQuestions],
  ['exam', practiceQuestions, previousPracticeQuestions, diversifyWrittenQuestions],
]) {
  const lookup = new Map([...previous, ...current].map(q => [practiceKey(type, q.id), q]));
  assert.equal(lookup.size, previous.length + current.length, `${type}: 구버전·현재 ID 충돌 없음`);
  const prior = new Map(previous.map(q => [q.id, q]));
  const baseline = current.map(q => q.variationOf ? prior.get(q.variationOf) : q);
  const before = JSON.stringify(baseline);
  assert.deepEqual(diversify(baseline).questions, current, `${type}: 새로고침에도 고정된 문제와 답`);
  assert.equal(JSON.stringify(baseline), before, `${type}: 원본 변경 없음`);
  for (const q of current.filter(item => item.variationOf)) {
    const old = prior.get(q.variationOf);
    assert(old && q.id === `${old.id}-v2` && old.difficulty === q.difficulty, q.id);
    assert.equal(q.family, old.family, `${q.id}: 출제 개념 유지`);
    const attempt = { practice_type: type, question_id: old.id, is_correct: false };
    assert.equal(lookup.get(summarizePracticeHistory([attempt])[0].key), old, `${q.id}: 과거 해설은 원본 자료로 유지`);
    assert.equal(summarizeWrongAnswers([attempt], lookup).pending[0].question, old, `${q.id}: 기존 오답 재풀이 보존`);
    assert.equal(getUnseenQuestions([q], type, new Set([practiceKey(type, old.id)])).length, 1, `${q.id}: 다른 자료의 새 문제로 구별`);
    assert.equal(getUnseenQuestions([q], type, new Set([practiceKey(type, q.id)])).length, 0, `${q.id}: 새 문제 제출 후 반복 제외`);
    if (type === 'exam') {
      assert(q.prompt !== old.prompt && !q.prompt.startsWith('다음 두 설명'), q.id);
      assert.deepEqual(q.acceptedAnswers, old.acceptedAnswers);
      for (const answer of q.acceptedAnswers) assert(matchesWrittenAnswer(q, answer), q.id);
      assert(!matchesWrittenAnswer(q, '오답 예시'), q.id);
    }
  }
}
for (const subject of ['소프트웨어 설계', '소프트웨어 개발', '데이터베이스 구축', '정보시스템 구축관리']) {
  assert.equal(writtenVaried.filter(q => q.subject === subject).length, 10, `${subject}: 상황 지문 10개`);
}
console.log('PASS: SQL 152문항(조건·질의 80개 포함)·38유형의 5가지 자료 설정·20유형의 행 수 변화·일반 기출 상황 지문 40개, 완전 중복 방지·고정 생성·원본/기록 보존');
