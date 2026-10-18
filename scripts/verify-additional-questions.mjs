import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { additionalWrittenQuestions } from '../src/data/additionalWrittenQuestions.js';
import { additionalCQuestions } from '../src/data/additionalCQuestions.js';
import { additionalJavaQuestions } from '../src/data/additionalJavaQuestions.js';
import { additionalPythonQuestions } from '../src/data/additionalPythonQuestions.js';
import { additionalSqlQuestions } from '../src/data/additionalSqlQuestions.js';
import { cCodeQuestions, previousCCodeQuestions } from '../src/data/cCodeQuestions.js';
import { javaCodeQuestions, previousJavaCodeQuestions } from '../src/data/javaCodeQuestions.js';
import { pythonCodeQuestions, previousPythonCodeQuestions } from '../src/data/pythonCodeQuestions.js';
import { sqlCodeQuestions, previousSqlCodeQuestions } from '../src/data/sqlCodeQuestions.js';
import { practiceQuestions, previousPracticeQuestions } from '../src/data/practiceQuestionBank.js';
import { examFocusedQuestions } from '../src/data/examFocusedQuestions.js';
import { buildCodeWalkthrough } from '../src/lib/codeWalkthrough.js';
import { getUnseenQuestions, practiceKey, summarizePracticeHistory } from '../src/lib/practiceHistory.js';
import { summarizeWrongAnswers } from '../src/lib/wrongAnswers.js';
import { matchesWrittenAnswer } from '../src/lib/writtenAnswer.js';

const source = JSON.parse(readFileSync('src/data/restoredExamsSource.json', 'utf8'));
const originals = source.flatMap(exam => exam.questions);
const referenceIds = new Set(originals.map(q => q.id));
const writtenBank = [...practiceQuestions, ...examFocusedQuestions, ...additionalWrittenQuestions];
const groups = [
  ['exam', additionalWrittenQuestions, writtenBank, previousPracticeQuestions],
  ['C', additionalCQuestions, cCodeQuestions, previousCCodeQuestions],
  ['Java', additionalJavaQuestions, javaCodeQuestions, previousJavaCodeQuestions],
  ['Python', additionalPythonQuestions, pythonCodeQuestions, previousPythonCodeQuestions],
  ['SQL', sqlCodeQuestions.filter(q => q.id.includes('-additional-')), sqlCodeQuestions, previousSqlCodeQuestions],
];
assert.equal(additionalWrittenQuestions.length, 160);
assert.equal(writtenBank.length, 521);
for (const subject of ['소프트웨어 설계', '소프트웨어 개발', '데이터베이스 구축', '정보시스템 구축관리']) {
  assert.equal(additionalWrittenQuestions.filter(q => q.subject === subject).length, 40, subject);
}
const compact = text => text.replace(/\s+/gu, '');
const contentOf = (q, type) => compact(type === 'exam' ? q.prompt : type === 'SQL' ? JSON.stringify(q.tables) + q.code : q.code);
for (const [type, added, bank, archived] of groups) {
  const old = bank.filter(q => !q.id.includes('-additional-'));
  assert.equal(old.length, type === 'exam' ? 361 : 150, `${type}: 기존 문항 유지`);
  if (type !== 'exam') {
    assert.equal(added.length, 40);
    for (const [level, count] of Object.entries({ 하: 10, 중: 15, 상: 15 })) {
      assert.equal(added.filter(q => q.difficulty === level).length, count, `${type} ${level}`);
    }
  }
  const all = [...bank, ...archived];
  const keyMap = new Map(all.map(q => [practiceKey(type, q.id), q]));
  assert.equal(keyMap.size, all.length, `${type}: 기존·신규·과거 ID 충돌 없음`);
  const oldContent = new Set([...old, ...archived].map(q => contentOf(q, type)));
  const newContent = new Set();
  for (const q of added) {
    assert.equal(bank.find(item => item.id === q.id), q, `${q.id}: 실제 출제 목록 연결`);
    assert(q.prompt && q.title && q.answerText.trim() && q.explanation.length >= 60, q.id);
    assert(q.examReferences.length > 0 && q.examReferences.every(id => referenceIds.has(id)), `${q.id}: 근거 문항 존재`);
    const content = contentOf(q, type);
    assert(!oldContent.has(content) && !newContent.has(content), `${q.id}: 문장·코드·SQL 표 포함 중복 없음`);
    newContent.add(content);
    if (type === 'exam') {
      assert.equal(q.type, '필답형');
      assert(!q.choices);
      assert(q.acceptedAnswers.includes(q.answerText));
      for (const answer of q.acceptedAnswers) assert(matchesWrittenAnswer(q, answer), q.id);
      assert(!matchesWrittenAnswer(q, '') && !matchesWrittenAnswer(q, '오답 예시'), q.id);
    } else if (type !== 'SQL') {
      assert.equal(q.trace.length, q.anchors.length);
      const walkthrough = buildCodeWalkthrough(q);
      assert.equal(walkthrough.steps.length, q.trace.length);
      assert(walkthrough.steps.every(step => step.lineIndex >= 0));
    } else {
      assert(q.tables.length && q.steps.length >= 2);
    }
    // 실제 사용자 데이터는 건드리지 않고 출제·풀이 기록·오답 연결을 메모리에서 확인합니다.
    const attempt = { id: `test-${q.id}`, practice_type: type, question_id: q.id, is_correct: false, created_at: '2026-10-18T00:00:00Z' };
    assert.equal(keyMap.get(summarizePracticeHistory([attempt])[0].key), q);
    assert.equal(summarizeWrongAnswers([attempt], keyMap).pending[0].question, q);
    assert.equal(getUnseenQuestions([q], type, new Set([practiceKey(type, q.id)])).length, 0);
    assert.equal(getUnseenQuestions([q], type, new Set()).length, 1);
  }
}
assert.equal(groups.reduce((sum, [, added]) => sum + added.length, 0), 320);
for (const question of additionalSqlQuestions) assert([...sqlCodeQuestions, ...previousSqlCodeQuestions].includes(question), `${question.id}: 다양화 전 원본도 보존`);
const studyData = readFileSync('src/data/studyData.js', 'utf8');
assert(studyData.includes('...additionalWrittenQuestions'), '필답형 페이지 데이터에 추가');

// 아래 계산값은 제작 시 사용한 답안 상수가 아니라 별도 연산으로 검산합니다.
const categoryAnswers = (subject, category, expected) => {
  const questions = additionalWrittenQuestions.filter(q => q.subject === subject && q.category === category);
  assert.equal(questions.length, expected.length);
  questions.forEach((q, i) => assert(matchesWrittenAnswer(q, String(expected[i])), `${q.id}: 계산 검산`));
};
categoryAnswers('소프트웨어 개발', '커버리지 비율 계산', [[9, 12], [6, 8], [8, 10], [12, 15]].map(([a, b]) => a / b * 100));
const traverse = (node, mode) => !node ? '' : mode === 'pre' ? node[0] + traverse(node[1], mode) + traverse(node[2], mode) : mode === 'in' ? traverse(node[1], mode) + node[0] + traverse(node[2], mode) : traverse(node[1], mode) + traverse(node[2], mode) + node[0];
categoryAnswers('소프트웨어 개발', '트리 순회', [
  traverse(['A', ['B', ['D'], ['E']], ['C']], 'post'),
  traverse(['M', ['N', null, ['Q']], ['P']], 'pre'),
  traverse(['R', ['S'], ['T', ['U']]], 'in'),
  traverse(['K', ['L', ['N']], ['M', null, ['P']]], 'post'),
]);
function bubble(values, passes) {
  let swaps = 0;
  for (let p = 0; p < passes; p++) for (let i = 0; i < values.length - 1 - p; i++) {
    if (values[i] > values[i + 1]) { [values[i], values[i + 1]] = [values[i + 1], values[i]]; swaps++; }
  }
  return { values, swaps };
}
categoryAnswers('소프트웨어 개발', '정렬 중간 상태', [bubble([9, 3, 7, 1], 1).values.at(-1), bubble([8, 2, 6, 4], 1).swaps, bubble([2, 7, 4, 9], 1).swaps, bubble([6, 5, 3, 1], 2).values[0]]);
const ipNumber = ip => ip.split('.').reduce((sum, value) => sum * 256 + Number(value), 0);
const ipText = n => [24, 16, 8, 0].map(shift => (n >>> shift) & 255).join('.');
const subnet = (ip, prefix, kind) => {
  const size = 2 ** (32 - prefix), start = Math.floor(ipNumber(ip) / size) * size;
  return ipText(kind === 'network' ? start : kind === 'broadcast' ? start + size - 1 : kind === 'first' ? start + 1 : start + size - 2);
};
categoryAnswers('정보시스템 구축관리', '서브넷 주소 계산', [subnet('192.168.50.77', 26, 'network'), subnet('192.168.60.145', 27, 'broadcast'), subnet('10.20.30.99', 28, 'first'), subnet('172.18.6.211', 29, 'last')]);
categoryAnswers('정보시스템 구축관리', '마스크·균등 분할', [ipText(2 ** 32 - 2 ** (32 - 27)), 24 + Math.log2(4), 2 ** (32 - 28) - 2, 2 ** (32 - 25 - Math.log2(8))]);
function faults(refs, capacity, policy) {
  const frames = []; let total = 0;
  refs.forEach((page, time) => {
    const hit = frames.find(frame => frame.page === page);
    if (hit) { hit.last = time; hit.count++; return; }
    total++;
    if (frames.length === capacity) {
      const next = frame => { const index = refs.indexOf(frame.page, time + 1); return index < 0 ? Infinity : index; };
      frames.sort((a, b) => policy === 'FIFO' ? a.loaded - b.loaded : policy === 'LRU' ? a.last - b.last : policy === 'LFU' ? a.count - b.count || a.last - b.last : next(b) - next(a));
      frames.shift();
    }
    frames.push({ page, loaded: time, last: time, count: 1 });
  });
  return total;
}
categoryAnswers('정보시스템 구축관리', '페이지 교체 계산', [faults([1, 2, 3, 1, 4], 3, 'LRU'), faults([1, 2, 1, 3, 1], 2, 'FIFO'), faults([1, 2, 1, 3, 1], 2, 'LFU'), faults([1, 2, 3, 1, 2], 2, 'OPT')]);
// 예제의 완료 시점을 독립적으로 시간 단위 시뮬레이션합니다.
function schedule(jobs, policy, quantum = Infinity) {
  const work = jobs.map(([arrival, burst], id) => ({ arrival, burst, left: burst, id }));
  let time = 0, active = null, slice = 0;
  const queue = [];
  while (work.some(job => job.left > 0)) {
    for (const job of work) if (job.arrival === time) queue.push(job);
    if (policy === 'SRT' && active && queue.some(job => job.left < active.left)) { queue.push(active); active = null; }
    if (!active) {
      if (policy === 'SJF' || policy === 'SRT') queue.sort((a, b) => a.left - b.left || a.id - b.id);
      active = queue.shift() ?? null; slice = 0;
    }
    if (active) {
      active.left--; slice++;
      if (!active.left) { active.done = time + 1; active = null; }
      else if (slice === quantum) { queue.push(active); active = null; }
    }
    time++;
  }
  return work.map(job => job.done - job.arrival - job.burst);
}
const srtWait = schedule([[0, 6], [2, 2]], 'SRT');
categoryAnswers('정보시스템 구축관리', '스케줄링 계산', [schedule([[0, 4], [1, 3]], 'FCFS')[1], schedule([[0, 6], [2, 2]], 'SJF')[1], srtWait.reduce((a, b) => a + b, 0) / srtWait.length, schedule([[0, 4], [0, 2]], 'RR', 2)[0]]);
console.log('PASS: 320문항(4과목×40 + 4언어×40), 근거 ID·해설·중복 방지·오답/기록 연결·계산 검산');
