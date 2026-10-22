import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { refreshedWrittenQuestions as written, refreshedPreviousWrittenQuestions as oldWritten, writtenSuitabilityAudit } from '../src/data/practicalRefreshWritten.js';
import { refreshedCodeQuestions as code, refreshedPreviousCodeQuestions as oldCode, codeSuitabilityAudit } from '../src/data/practicalRefreshCode.js';
import { matchesWrittenAnswer } from '../src/lib/writtenAnswer.js';
import { practiceKey, getUnseenQuestions } from '../src/lib/practiceHistory.js';
import { summarizeWrongAnswers } from '../src/lib/wrongAnswers.js';
import { buildCodeWalkthrough } from '../src/lib/codeWalkthrough.js';

const audit = [...writtenSuitabilityAudit, ...codeSuitabilityAudit];
const banks = { exam: [written, oldWritten], ...Object.fromEntries(Object.keys(code).map(type => [type, [code[type], oldCode[type]]])) };
const sources = new Map(JSON.parse(readFileSync('src/data/restoredExamsSource.json')).flatMap(e => e.questions.map(q => [q.id, q])));
const compact = text => text.replace(/\s/gu, '');
assert.equal(writtenSuitabilityAudit.length, 24);
assert.equal(codeSuitabilityAudit.length, 20);
assert.deepEqual(Object.fromEntries(['C', 'Java', 'Python'].map(type => [type, codeSuitabilityAudit.filter(q => q.type === type).length])), { C: 5, Java: 5, Python: 10 });
for (const subject of new Set(written.map(q => q.subject))) {
  assert.equal(written.filter(q => q.suitabilityRevisionOf && q.subject === subject).length, 6);
}
for (const item of audit) {
  const q = banks[item.type][0].find(q => q.id === item.id);
  assert(q.examReferences.length && q.examReferences.every(ref => sources.has(ref)), item.id);
  for (const ref of q.examReferences) {
    const source = sources.get(ref);
    const text = compact(item.type === 'exam' ? q.prompt : q.code);
    assert(!source.blocks.some(b => b.text && compact(b.text) === text), `${q.id}: 복원 원문 재사용 금지`);
  }
}
// 출제 근거가 있는 낯선 문법을 일괄 삭제하지 않습니다. SQL은 해당 유형 유지.
assert(code.Java.some(q => q.family === 'additional-enum-navigation'));
assert(code.Java.some(q => q.family === 'generic-overload-selection'));
assert.equal(code.SQL.length, 210);
console.log('1차 PASS: 4과목 24개·코드 20개 교체 근거, 원문과 다른 창작 조건, 유효한 기존 유형 유지');

const byId = new Map(written.map(q => [q.id, q]));
function answer(id, expected) {
  const q = byId.get(`practice-${id}-r5`);
  assert(q, id);
  assert(matchesWrittenAnswer(q, String(expected)), `${id}: 독립 검산 ${expected}와 정답 ${q.answerText}`);
}
// 생산 코드의 답안 문자열을 가져다 비교하지 않고 입력에서 다시 계산합니다.
const statements = new Set(['s1', 's2', 's4', 's8', 's1', 's3', 's4', 's5', 's8']);
answer('development-036', statements.size / 8 * 100);
answer('development-038', ((2 + 1 + 1) / 6 * 100).toFixed(2));
const cases = [[true, true, false], [false, true, true]];
answer('development-040', ([0, 1, 2].reduce((sum, c) => sum + new Set(cases.map(row => row[c])).size, 0) / 6 * 100).toFixed(2));
const pairs = [[true, true], [false, true], [true, false], [false, false]];
const independent = [];
for (let i = 0; i < pairs.length; i++) for (let j = i + 1; j < pairs.length; j++) {
  const a = pairs[i], b = pairs[j];
  if (a[1] === b[1] && a[0] !== b[0] && (a[0] && a[1]) !== (b[0] && b[1])) independent.push(`T${i + 1} T${j + 1}`);
}
assert.equal(independent.length, 1);
answer('development-042', independent[0]);
answer('development-058', [4 - 1, 4, 4 + 1, 15 - 1, 15, 15 + 1].join(' '));
const candidateKeys = [['A'], ['B']];
const superNotCandidate = [['A'], ['B'], ['A', 'B'], ['A', 'C']].filter(set => candidateKeys.some(k => k.every(a => set.includes(a))) && !candidateKeys.some(k => k.length === set.length && k.every(a => set.includes(a))));
answer('database-014', superNotCandidate.length);
answer('database-030', new Set([[1, '가'], [2, '나'], [3, '가'], [4, '다'], [5, '나']].filter(([a]) => a >= 3).map(([, b]) => b)).size);
const db = new DatabaseSync(':memory:');
try {
  db.exec("PRAGMA foreign_keys=ON; CREATE TABLE 기록(팀 TEXT,점수 INTEGER); INSERT INTO 기록 VALUES ('가',20),('가',NULL),('가',40),('나',NULL); CREATE TABLE 부서(id INTEGER PRIMARY KEY); CREATE TABLE 직원(id INTEGER,부서id INTEGER REFERENCES 부서(id) ON DELETE CASCADE); INSERT INTO 부서 VALUES(10),(20); INSERT INTO 직원 VALUES(1,10),(2,10),(3,20);");
  answer('database-064', Object.values(db.prepare("SELECT COUNT(점수), SUM(점수) FROM 기록 WHERE 팀='가'").get()).join(' '));
  const before = db.prepare('SELECT COUNT(*) AS n FROM 직원').get().n;
  db.exec('DELETE FROM 부서 WHERE id=10');
  answer('database-066', before - db.prepare('SELECT COUNT(*) AS n FROM 직원').get().n);
} finally { db.close(); }
const rr = [3, 5, 2].map((duration, id) => ({ duration, left: duration, id }));
const queue = [...rr];
let time = 0;
while (queue.length) {
  const p = queue.shift(), amount = Math.min(2, p.left);
  time += amount; p.left -= amount;
  if (p.left) queue.push(p); else p.done = time;
}
answer('systems-014', (rr.reduce((sum, p) => sum + p.done - p.duration, 0) / rr.length).toFixed(2));
function averageWait(inputs, preemptive) {
  const ps = inputs.map(([at, duration], i) => ({ at, duration, i, left: duration }));
  let active;
  for (let t = 0; ps.some(p => p.left); t++) {
    if (preemptive || !active?.left) active = ps.filter(p => p.at <= t && p.left).sort((a, b) => a.left - b.left || a.at - b.at || a.i - b.i)[0];
    if (active && --active.left === 0) active.done = t + 1;
  }
  return (ps.reduce((sum, p) => sum + p.done - p.at - p.duration, 0) / ps.length).toFixed(2);
}
answer('systems-016', averageWait([[0, 5], [1, 4], [2, 1]], false));
answer('systems-018', averageWait([[0, 7], [2, 2], [3, 1]], true));
const lru = new Map(); let faults = 0;
for (const [t, p] of [2, 5, 2, 7, 5, 8, 2].entries()) {
  if (!lru.has(p)) {
    faults++;
    if (lru.size === 3) lru.delete([...lru].sort((a, b) => a[1] - b[1])[0][0]);
  }
  lru.set(p, t);
}
answer('systems-024', faults);
answer('systems-026', `192.168.24.${256 / 8 * 3 - 1}`);
answer('systems-004', `${4 + 2}${4}${0}`);
for (const q of written.filter(q => q.suitabilityRevisionOf)) {
  assert(q.explanation.length > 90 && q.acceptedAnswers.every(a => matchesWrittenAnswer(q, a)), q.id);
  assert(!q.prompt.includes('다음 두 설명을 비교하고 ②'), q.id);
}
console.log('2차 PASS: 커버리지·키·관계대수·SQL·RR/SJF/SRTF·LRU·서브넷 독립 계산, 풀이·허용 답안 점검');

for (const [type, [current, old]] of Object.entries(banks)) {
  assert.equal(current.length, type === 'exam' ? 601 : 210);
  assert.equal(new Set([...current, ...old].map(q => q.id)).size, current.length + old.length);
  assert.equal(new Set(current.map(q => compact(type === 'exam' ? q.prompt : JSON.stringify([q.code, q.tables])))).size, current.length);
  const byKey = new Map([...current, ...old].map(q => [practiceKey(type, q.id), q]));
  for (const a of audit.filter(a => a.type === type)) {
    assert(!current.some(q => q.id === a.previousId));
    const previous = old.find(q => q.id === a.previousId), next = current.find(q => q.id === a.id);
    assert(previous && next && next.suitabilityRevisionOf === previous.id);
    assert.notEqual(type === 'exam' ? previous.prompt : previous.code, type === 'exam' ? next.prompt : next.code);
    const attempt = { id: 'test', practice_type: type, question_id: previous.id, is_correct: false, created_at: '2026-10-22T01:00:00Z' };
    assert.equal(summarizeWrongAnswers([attempt], byKey).pending[0].question, previous);
    assert(getUnseenQuestions(current, type, new Set([practiceKey(type, previous.id)])).some(q => q.id === next.id));
    if (type !== 'exam') {
      const walk = buildCodeWalkthrough(next);
      assert(walk.steps.length >= 5 && walk.steps.length === next.trace.length && next.trace.length === next.anchors.length);
      assert(walk.steps.every(s => s.lineIndex >= 0));
    }
  }
}
console.log('3차 PASS: 1,441문항 중복·교체·주석 연결 검증, 기존 오답 보존 및 새 문항 무작위 출제 연결');
