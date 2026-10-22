import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { refreshedWrittenQuestions as written, refreshedPreviousWrittenQuestions as oldWritten, writtenQualityAudit } from '../src/data/practicalRefreshWritten.js';
import { refreshedCodeQuestions as code, refreshedPreviousCodeQuestions as oldCode, codeQualityAudit } from '../src/data/practicalRefreshCode.js';
import { matchesWrittenAnswer as matches } from '../src/lib/writtenAnswer.js';
import { buildCodeWalkthrough } from '../src/lib/codeWalkthrough.js';
import { getUnseenQuestions, practiceKey } from '../src/lib/practiceHistory.js';
import { summarizeWrongAnswers } from '../src/lib/wrongAnswers.js';

const byId = new Map(written.map(q => [q.id, q]));
const byKey = { exam: [written, oldWritten], ...Object.fromEntries(Object.keys(code).map(type => [type, [code[type], oldCode[type]]])) };
const referenceIds = new Set(JSON.parse(readFileSync('src/data/restoredExamsSource.json')).flatMap(e => e.questions.map(q => q.id)));
const audit = [...writtenQualityAudit, ...codeQualityAudit];

// 1차: 실제 복원 유형과 연결되는 새 문항이며, 불필요한 구문항은 출제에서 제외됩니다.
assert.equal(writtenQualityAudit.length, 21);
assert.equal(codeQualityAudit.length, 10);
for (const entry of audit) {
  const [current, previous] = byKey[entry.type];
  const q = current.find(q => q.id === entry.id), old = previous.find(q => q.id === entry.previousId);
  assert(q && old && !current.some(q => q.id === old.id));
  assert.equal(q.qualityRevisionOf, old.id);
  assert(q.examReferences.length && q.examReferences.every(ref => referenceIds.has(ref)));
  assert(q.explanation.length > 60);
}
console.log('1차 PASS: 31문항의 실기 유형 근거·교체·이전 문제 제외');

// 2차: 정의, SQL 문법, 음수 경계값, 스케줄링 계산을 독립적으로 검산합니다.
for (const id of ['practice-database-035', 'exam-focused-039']) {
  assert(byId.get(id).prompt.includes('슈퍼키'));
  assert(!byId.get(id).prompt.includes('모든 결정자가 후보키'));
}
assert(byId.get('practice-database-031').prompt.includes('모든 후보키'));
assert(byId.get('practice-database-033').prompt.includes('주요 속성'));
const domain = byId.get('practical-extra-database-18');
const completed = domain.prompt.slice(0, domain.prompt.indexOf(';') + 1).replace('①', domain.answerText);
assert.match(completed, /^CREATE DOMAIN SCORE AS INTEGER CHECK \(VALUE BETWEEN 0 AND 100\);$/u);
const sql = new DatabaseSync(':memory:');
try {
  sql.exec("CREATE TABLE TEAM(id INTEGER PRIMARY KEY); INSERT INTO TEAM VALUES (1); CREATE TABLE STUDENT(name TEXT, score INTEGER); INSERT INTO STUDENT VALUES ('김하나', 80), ('김둘', 90), ('이셋', 70);");
  for (const alias of byId.get('exam-focused-048').acceptedAnswers) sql.exec(`CREATE TABLE P_${alias}(id INTEGER, FOREIGN KEY(id) ${alias} TEAM(id));`);
  for (const alias of byId.get('exam-focused-046').acceptedAnswers) assert.equal(sql.prepare(`SELECT score FROM STUDENT ORDER BY score ${alias}`).all()[0].score, 90);
  for (const alias of byId.get('exam-focused-045').acceptedAnswers) assert.equal(sql.prepare(`SELECT COUNT(*) AS n FROM STUDENT WHERE name LIKE '${alias}'`).get().n, 2);
} finally { sql.close(); }
assert(matches(byId.get('practice-development-064-r4'), `${-3 - 1} ${8 + 1}`));
let selection = [8, 6, 9, 3, 5];
for (let i = 0; i < 2; i++) {
  let min = i;
  for (let j = i + 1; j < selection.length; j++) if (selection[j] < selection[min]) min = j;
  [selection[i], selection[min]] = [selection[min], selection[i]];
}
assert(matches(byId.get('practice-development-066-r4'), selection.join(' ')));
// 일반 SRTF 시뮬레이터: 도착 시각·남은 시간·도착 순서로 매 시각을 선택합니다.
const tasks = [{ at: 0, duration: 5 }, { at: 1, duration: 2 }, { at: 2, duration: 1 }].map((p, i) => ({ ...p, i, left: p.duration }));
for (let time = 0; tasks.some(p => p.left); time++) {
  const ready = tasks.filter(p => p.at <= time && p.left).sort((a, b) => a.left - b.left || a.at - b.at || a.i - b.i);
  if (ready.length && --ready[0].left === 0) ready[0].done = time + 1;
}
const wait = tasks.reduce((sum, p) => sum + p.done - p.at - p.duration, 0) / tasks.length;
assert(matches(byId.get('practical-extra-systems-19'), wait.toFixed(2)));
for (const id of ['exam-focused-055', 'exam-focused-056', 'exam-focused-081', 'practical-extra-systems-19']) {
  assert(byId.get(id).prompt.includes('반올림') && byId.get(id).prompt.includes('문맥 교환 시간은 0'));
}
console.log('2차 PASS: 정규화·외래키 정의, 실제 SQL 키워드 실행, 도메인 구문·음수 경계·선택 정렬·SRTF 독립 검산');

// 3차: 새 문항은 중복이 없고 기존 사용자 기록·오답은 이전 문제로 연결됩니다.
for (const [type, [current, archived]] of Object.entries(byKey)) {
  assert.equal(current.length, type === 'exam' ? 601 : 210);
  const keyMap = new Map([...current, ...archived].map(q => [practiceKey(type, q.id), q]));
  assert.equal(keyMap.size, current.length + archived.length);
  const signature = q => type === 'exam' ? q.prompt.replace(/\s/gu, '') : JSON.stringify([q.code, q.tables]);
  assert.equal(new Set(current.map(signature)).size, current.length);
  for (const entry of audit.filter(a => a.type === type)) {
    const old = keyMap.get(practiceKey(type, entry.previousId));
    const attempt = { id: 'test', practice_type: type, question_id: old.id, is_correct: false, created_at: '2026-10-22T00:00:00Z' };
    assert.equal(summarizeWrongAnswers([attempt], keyMap).pending[0].question, old);
    assert(getUnseenQuestions(current, type, new Set([practiceKey(type, old.id)])).some(q => q.id === entry.id));
  }
}
console.log('3차 PASS: 현재 1,441문항 중복·ID 충돌 없음, 교체 전 오답과 새 문제 출제 분리');

// 4차: 모든 정답 별칭과 대표 오채점 반례, 코드의 주석 연결을 최종 검증합니다.
for (const q of [...written, ...oldWritten]) for (const alias of q.acceptedAnswers) assert(matches(q, alias), `${q.id}: ${alias}`);
const invalid = [
  ['1.33', '13.3'], ['1.33', '-1.33'], ['1.33', '133'], ['1.33', '1/33'], ['5', '.5'],
  ['4 2', '42'], ['-4 9', '4 9'], ['10/3', '103'], ['10/3', '1/03'],
  ['172.20.36.0', '17.220.36.0'], ['172.20.36.0', '17220360'], ['255.255.254.0', '25.525.525.40'],
];
for (const [answer, input] of invalid) assert(!matches({ acceptedAnswers: [answer] }, input), `${input} 오채점 방지`);
for (const [answer, input] of [['3.33', '３.３３０'], ['MC/DC', 'mc dc'], ['BCNF', 'bc nf'], ['제1정규형', '제 1 정규형'], ['/28', '28'], ['4 2', '4, 2'], ['10/3', '10 / 3']]) assert(matches({ acceptedAnswers: [answer] }, input));
for (const [id, input] of [['exam-focused-048', 'REFERENCE'], ['exam-focused-046', 'Descending'], ['exam-focused-045', '"김%"']]) assert(!matches(byId.get(id), input));
for (const q of [...code.C, ...code.Java, ...code.Python]) {
  const walk = buildCodeWalkthrough(q);
  assert.equal(walk.steps.length, q.trace.length);
  assert(walk.steps.every(step => step.lineIndex >= 0));
}
assert(code.C.filter(q => q.family === 'function-pointer-hex').every(q => q.code.includes('(unsigned int)node.value')));
console.log('4차 PASS: 전체 필답형 별칭, 소수·음수·분수·IP·다중 답안 오채점 방지, 630개 코드 주석 위치');
