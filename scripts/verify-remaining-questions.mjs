import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createServer } from 'vite';
import { refreshedWrittenQuestions as current, refreshedPreviousWrittenQuestions as previous } from '../src/data/practicalRefreshWritten.js';
import { similarExamTheory } from '../src/data/similarExamTheory.js';
import { matchesWrittenAnswer } from '../src/lib/writtenAnswer.js';
import { getRestoredProblemBlocks } from '../src/lib/restoredProblemPresentation.js';

const written = [...current, ...previous];
const similar = similarExamTheory.map(([key, , , prompt, answerText]) => ({ id: `similar-${key}`, prompt, answerText }));
const bank = [...written, ...similar];
const byId = new Map(bank.map(q => [q.id, q]));
assert.equal(bank.length, 774);
assert.equal(byId.size, bank.length);
for (const q of bank) {
  assert(q.prompt.trim() && q.answerText.trim(), q.id);
  assert(!/undefined|\[object Object\]|\uFFFD|따움표|갯수|트랜젝션/u.test(q.prompt), q.id);
}
for (const q of written) {
  assert(matchesWrittenAnswer(q, q.answerText), `${q.id}: 표시 답안은 허용 답안과 일치`);
  assert(q.acceptedAnswers.every(a => typeof a === 'string' && a.trim()), q.id);
  assert(!q.explanation.includes('모든 결정자가 후보키여야 한다는 더 강한 조건은 BCNF'), `${q.id}: 잘못된 BCNF 구별 설명`);
}
console.log('1차 PASS: 일반 필답형 724·유사 이론 50문항의 ID·지문·답안·오타·허용 답안 검증');

const ipPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/gu;
const ipNumber = value => value.split('.').reduce((n, part) => (n << 8n) | BigInt(part), 0n);
const ipText = value => [24n, 16n, 8n, 0n].map(bits => String((value >> bits) & 255n)).join('.');
let subnets = 0;
for (const q of written.filter(q => /^\d+\.\d+\.\d+\.\d+$/u.test(q.answerText))) {
  const prefix = q.prompt.match(/\/(\d{1,2})/u);
  const ips = [...q.prompt.matchAll(ipPattern)].map(m => m[0]);
  let expected;
  if (/서브넷 마스크/u.test(q.prompt) && !ips.length && prefix) {
    expected = ipText(((1n << 32n) - 1n) ^ ((1n << BigInt(32 - Number(prefix[1]))) - 1n));
  } else {
    const p = prefix ? Number(prefix[1]) : ips.find(ip => ip.startsWith('255.'))?.split('.').reduce((n, octet) => n + Number(octet).toString(2).replaceAll('0', '').length, 0);
    if (p === undefined || !ips.length) continue;
    let size = 1n << BigInt(32 - p), network = ipNumber(ips[0]) / size * size;
    if (q.id === 'practice-systems-026-r5') { size /= 8n; network += size * 2n; }
    const broadcast = network + size - 1n;
    expected = ipText(/첫 사용 가능/u.test(q.prompt) ? network + 1n : /마지막 사용 가능/u.test(q.prompt) ? broadcast - 1n : /브로드캐스트 주소/u.test(q.prompt) ? broadcast : network);
  }
  assert.equal(q.answerText, expected, `${q.id}: 실제 IP·마스크로 독립 검산`);
  subnets++;
}
const extraIp = byId.get('similar-subnet');
const address = ipNumber('172.22.78.19'), size = 1n << 11n, network = address / size * size;
assert.deepEqual(extraIp.answerText.match(ipPattern), [ipText(network), ipText(network + size - 1n)]);
assert.equal(subnets, 11);

function schedule(jobs, mode, quantum) {
  const tasks = jobs.map(([name, at, duration], i) => ({ name, at, duration, left: duration, i }));
  let time = 0, next = 0;
  const queue = [];
  while (tasks.some(t => t.left)) {
    let task;
    if (mode === 'RR') {
      while (next < tasks.length && tasks[next].at <= time) queue.push(tasks[next++]);
      task = queue.shift();
    } else task = tasks.filter(t => t.left && t.at <= time).sort((a, b) => mode === 'FCFS' ? a.at - b.at || a.i - b.i : (mode === 'SRT' ? a.left - b.left : a.duration - b.duration) || a.at - b.at || a.i - b.i)[0];
    if (!task) { time++; continue; }
    const run = Math.min(mode === 'RR' ? quantum : mode === 'SRT' ? 1 : task.left, task.left);
    task.left -= run;
    time += run;
    if (!task.left) task.done = time;
    else if (mode === 'RR') {
      while (next < tasks.length && tasks[next].at <= time) queue.push(tasks[next++]);
      queue.push(task);
    }
  }
  return tasks.map(t => ({ ...t, wait: t.done - t.at - t.duration }));
}
let schedules = 0;
for (const q of bank.filter(q => /SRT|SJF|FCFS|\bRR\b/u.test(q.prompt) && /^\d+(?:\.\d+)?(?:ms)?$/u.test(q.answerText))) {
  let jobs = [...q.prompt.matchAll(/([A-Z]\d?)\(\s*(?:도착\s*)?(\d+)\s*,\s*(?:실행\s*)?(\d+)\)/gu)].map(([, name, at, duration]) => [name, Number(at), Number(duration)]);
  if (!jobs.length && q.id === 'practice-systems-014-r5') jobs = [['A', 0, 3], ['B', 0, 5], ['C', 0, 2]];
  if (!jobs.length && q.id === 'exam-focused-081') jobs = [['P1', 0, 5], ['P2', 0, 3], ['P3', 0, 1]];
  if (!jobs.length) continue;
  const mode = /SRT/u.test(q.prompt) ? 'SRT' : /SJF/u.test(q.prompt) ? 'SJF' : /FCFS/u.test(q.prompt) ? 'FCFS' : 'RR';
  const quantum = Number(q.prompt.match(/할당량(?:은|는)?\s*(\d+)/u)?.[1]);
  assert(mode !== 'RR' || quantum > 0, q.id);
  const tasks = schedule(jobs, mode, quantum);
  const target = q.prompt.match(/([A-Z]\d?)(?:의)?\s*대기시간/u)?.[1];
  let answer = /평균/u.test(q.prompt) ? tasks.reduce((sum, t) => sum + t.wait, 0) / tasks.length : tasks.find(t => t.name === target)?.wait;
  if (/소수 둘째/u.test(q.prompt)) answer = Number(answer.toFixed(2));
  assert.equal(Number(q.answerText.replace('ms', '')), answer, `${q.id}: 완료 시각에서 도착·실행 시간을 뺀 독립 검산`);
  schedules++;
}
assert(schedules >= 10);

const pageCases = [
  ['practice-systems-024-r5', 'LRU', 3, [2, 5, 2, 7, 5, 8, 2]],
  ['practice-systems-067-r2', 'LRU', 3, [1, 2, 3, 1, 4, 2, 5]],
  ['practice-systems-068-r2', 'LFU', 3, [1, 2, 1, 3, 4, 2]],
  ['exam-focused-059', 'FIFO', 3, [1, 2, 3, 1, 4, 2, 5]],
  ['exam-focused-079', 'LRU', 3, [1, 2, 3, 1, 4, 2, 5]],
  ['practice-additional-systems-013', 'LRU', 3, [1, 2, 3, 1, 4]],
  ['practice-additional-systems-014', 'FIFO', 2, [1, 2, 1, 3, 1]],
  ['practice-additional-systems-015', 'LFU', 2, [1, 2, 1, 3, 1]],
  ['practice-additional-systems-016', 'OPT', 2, [1, 2, 3, 1, 2]],
  ['similar-lru', 'LRU', 3, [4, 1, 6, 4, 2, 1, 7]],
];
for (const [id, mode, count, refs] of pageCases) {
  const q = byId.get(id), frames = new Map();
  assert(q.prompt.replaceAll(',', '').replaceAll(' ', '').replaceAll('·', '').includes(refs.join('')), `${id}: 참조열이 검산 자료와 일치`);
  let faults = 0;
  refs.forEach((page, time) => {
    if (!frames.has(page)) {
      faults++;
      if (frames.size === count) {
        const nextUse = p => { const n = refs.indexOf(p, time + 1); return n < 0 ? Infinity : n; };
        const victim = [...frames].sort((a, b) => mode === 'FIFO' ? a[1].loaded - b[1].loaded : mode === 'LFU' ? a[1].count - b[1].count || a[1].used - b[1].used : mode === 'OPT' ? nextUse(b[0]) - nextUse(a[0]) : a[1].used - b[1].used)[0][0];
        frames.delete(victim);
      }
      frames.set(page, { loaded: time, used: time, count: 0 });
    }
    const entry = frames.get(page); entry.used = time; entry.count++;
  });
  assert.equal(Number(q.answerText), faults, id);
}
console.log(`2차 PASS: 주소/마스크 ${subnets + 1}·CPU 대기시간 ${schedules}·페이지 교체 ${pageCases.length}문항 독립 검산`);

const normalizationIds = ['practice-database-032', 'practice-database-034', 'practice-database-037-r2', 'exam-focused-037', 'exam-focused-038', 'practice-additional-database-014', 'practice-additional-database-015', 'practical-extra-database-10', 'practical-extra-database-11'];
for (const id of normalizationIds) {
  const q = byId.get(id);
  assert(q && q.prompt.includes('원자값') && q.prompt.includes('후보키') && q.prompt.includes('단계'), `${id}: 정규화 단계 판별에 필요한 전제`);
}
for (const id of ['practice-database-037', 'practice-database-038']) {
  assert(byId.get(id).prompt.includes('모든 비자명 다치 종속'));
  assert(byId.get(id).explanation.includes('슈퍼키'));
}
assert(byId.get('practical-extra-database-11').explanation.includes('결정자가 슈퍼키'));
console.log('3차 PASS: 정규화 단계 전제·비자명 다치 종속·후보키와 슈퍼키 구별');

const server = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false } });
try {
  const { restoredExamQuestions: restored } = await server.ssrLoadModule('/src/data/restoredExams.js');
  const find = id => restored.find(q => q.id === `past-${id}`);
  const url = find('2024-3-q9');
  const parsed = new URL('foo://localhost:8080/over/there?name=ferret#nose');
  const parts = [parsed.protocol.slice(0, -1), parsed.host, parsed.pathname, parsed.search.slice(1), parsed.hash.slice(1)];
  assert.deepEqual(parts, ['foo', 'localhost:8080', '/over/there', 'name=ferret', 'nose']);
  for (const part of parts) assert(url.explanation.join(' ').includes(part));
  assert(url.explanation.join(' ').includes('query→path→scheme→authority→fragment'));
  assert.equal(url.answerBlocks[0].text, '43125');
  const edges = new Set(['1-2', '2-3', '2-4', '3-4', '4-5', '5-6', '6-1', '6-7']);
  for (const id of ['2025-2-q11', '2023-1-q19']) {
    const q = find(id), covered = new Set();
    for (const line of q.answerBlocks[0].text.split('\n')) {
      const path = line.split(':')[1].match(/\d+/gu).map(Number);
      assert.equal(path[0], 1); assert.equal(path.at(-1), 7);
      path.slice(1).forEach((node, i) => { const edge = `${path[i]}-${node}`; assert(edges.has(edge), `${q.id}: 존재하지 않는 간선`); covered.add(edge); });
    }
    for (const edge of ['2-3', '2-4', '6-1', '6-7']) assert(covered.has(edge), `${q.id}: 분기 누락`);
    assert(q.explanation.join(' ').includes('부분 경로'));
  }
  console.log('4차 PASS: URL의 authority/fragment와 보기 번호, 종료점까지의 경로·유효 간선·네 분기 전수 대조');

  const integrity = find('2025-1-q2'), original = JSON.stringify(integrity.blocks);
  const table = getRestoredProblemBlocks(integrity).find(b => b.type === 'table');
  assert.deepEqual(table.rows[0], ['구분', '검사 기준', '위반 예시']);
  assert.deepEqual(table.rows.slice(1).map(r => r[0]), ['ㄱ', 'ㄴ', 'ㄷ']);
  assert(table.rows.every(row => row.length === 3));
  assert.equal(JSON.stringify(integrity.blocks), original);
  const db = new DatabaseSync(':memory:');
  try {
    db.exec('PRAGMA foreign_keys=ON;CREATE TABLE Parent(id INTEGER PRIMARY KEY);INSERT INTO Parent VALUES(1);CREATE TABLE Child(id TEXT PRIMARY KEY NOT NULL,score INTEGER CHECK(score BETWEEN 0 AND 100),parent INTEGER REFERENCES Parent(id));');
    db.exec("INSERT INTO Child VALUES('a',100,1);INSERT INTO Child VALUES('b',0,NULL);");
    for (const bad of ["('c',120,1)", "(NULL,50,1)", "('a',50,1)", "('c',50,99)"]) assert.throws(() => db.exec(`INSERT INTO Child VALUES${bad};`), /constraint|NOT NULL/iu);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM Child').get().n, 2);
  } finally { db.close(); }
  console.log('5차 PASS: 재구성 표의 행/열·원본 보존·점수 범위·기본키 NULL/중복·참조 무결성 실제 실행');
} finally { await server.close(); }
