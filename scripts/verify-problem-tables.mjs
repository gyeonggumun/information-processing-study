import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { getRestoredProblemBlocks } from '../src/lib/restoredProblemPresentation.js';
import { buildCodeCalculationTrace } from '../src/lib/codeCalculationTrace.js';

const server = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false } });
try {
  const { practiceQuestions, codeQuestions, previousQuestions } = await server.ssrLoadModule('/src/data/studyData.js');
  const { restoredExamQuestions } = await server.ssrLoadModule('/src/data/restoredExams.js');
  const { similarExamQuestions } = await server.ssrLoadModule('/src/data/similarExams.js');
  const bank = new Map([
    ...Object.entries(previousQuestions).flatMap(([type, qs]) => qs.map(q => [`${type}:${q.id}`, q])),
    ...practiceQuestions.map(q => [`exam:${q.id}`, q]),
    ...Object.entries(codeQuestions).flatMap(([type, qs]) => qs.map(q => [`${type}:${q.id}`, q])),
    ...restoredExamQuestions.map(q => [`exam:${q.id}`, q]),
    ...similarExamQuestions.map(q => [`exam:${q.id}`, q]),
  ]);
  let tables = 0;
  const check = (id, columns, rows) => {
    assert(columns?.length && columns.every(value => typeof value === 'string' && value.trim()), `${id}: 빈 열 제목`);
    assert(rows.every(row => row.length === columns.length), `${id}: 행·열 수 불일치`);
    assert(rows.flat().every(value => value !== undefined && !(typeof value === 'number' && !Number.isFinite(value))), `${id}: 누락되거나 계산 불가능한 셀`);
    tables++;
  };
  const arithmetic = [];
  const db = new DatabaseSync(':memory:');
  const scan = (id, value) => {
    if (typeof value !== 'string') return;
    const pattern = /(?<![\w.^\d])(-?\d+(?:\.\d+)?(?:\s*[+×*/÷−-]\s*\(?-?\d+(?:\.\d+)?\)?)+)\s*=\s*(-?\d+(?:\.\d+)?(?:\/\d+)?)/gu;
    for (const match of value.matchAll(pattern)) {
      const expression = match[1].replaceAll('×', '*').replaceAll('÷', '/').replaceAll('−', '-');
      try {
        const actual = db.prepare(`SELECT (${expression.replace(/(\d+)\s*\//gu, '$1.0/')}) AS n`).get().n;
        const [n, d = 1] = match[2].split('/').map(Number), expected = n / d;
        if (id === 'exam:past-2023-2-q2' && /^\d+\/\d+$/u.test(expression) && Math.trunc(actual) === expected) continue;
        // 정수 나눗셈·반올림 표기 등은 사람이 문맥을 확인하는 후보로만 보고합니다.
        if (actual !== null && Math.abs(actual - expected) > 0.011) arithmetic.push({ id, expression: match[0], context: value.slice(Math.max(0, match.index - 35), match.index + match[0].length + 65) });
      } catch { /* 괄호 일부만 잡힌 식은 검산 대상에서 제외합니다. */ }
    }
  };
  for (const [id, q] of bank) {
    q.tables?.forEach(t => check(id, t.columns, t.rows));
    const blocks = q.restored ? getRestoredProblemBlocks(q) : q.blocks;
    for (const items of [blocks, q.answerBlocks, q.solutionBlocks]) items?.forEach(b => {
      if (b.type === 'table') check(id, b.rows[0], b.rows.slice(1));
      if (b.type !== 'code') scan(id, b.text);
      b.rows?.forEach(row => row.forEach(value => scan(id, value)));
    });
    if (['C', 'Java', 'Python'].includes(q.language) && q.code && q.answerText) {
      const trace = buildCodeCalculationTrace(q);
      if (trace) check(id, trace.columns, trace.rows);
    }
    for (const key of ['explanation', 'trace', 'steps']) {
      if (Array.isArray(q[key])) q[key].forEach(text => scan(id, text));
      else scan(id, q[key]);
    }
    q.walkthrough?.steps.forEach(step => scan(id, step.description));
  }
  const saved = JSON.parse(readFileSync('src/data/sqlSolutionTables.json', 'utf8'));
  for (const [id, items] of Object.entries(saved.questions)) items.forEach(t => {
    check(id, t.columns, t.rows);
    t.calculationNotes?.forEach(note => scan(id, note));
  });
  const find = id => restoredExamQuestions.find(q => q.id === `past-${id}`);
  const display = id => getRestoredProblemBlocks(find(id));
  const access = display('2025-3-q18').find(b => b.type === 'table');
  assert.deepEqual(access.rows[0], ['구분', '설명']);
  assert.deepEqual(access.rows.slice(1).map(row => row[0]), ['ㄱ', 'ㄴ', 'ㄷ'], '첫 설명을 열 제목으로 소비하지 않음');
  let choices = 0;
  for (const q of restoredExamQuestions) {
    const original = JSON.stringify(q.blocks);
    for (const b of getRestoredProblemBlocks(q).filter(b => b.type === 'table')) {
      assert(!/^[ㄱ-ㅎ]\./u.test(b.rows[0][0]), `${q.id}: 합쳐진 보기 제목 금지`);
      if (b.rows[0][0] === '기호') {
        assert.deepEqual(b.rows[0], ['기호', '보기']);
        assert(b.rows.slice(1).every(row => /^[ㄱ-ㅎ]$/u.test(row[0]) && row[1].trim()), `${q.id}: 보기 기호·내용 대응`);
        choices++;
      }
    }
    assert.equal(JSON.stringify(q.blocks), original, `${q.id}: 원본 블록은 불변`);
  }
  assert.equal(choices, 6);
  const definitions = display('2023-1-q12').find(b => b.type === 'table');
  assert(definitions.rows[1][1].includes('하나의 행'));
  assert(definitions.rows[3][1].includes('전체 튜플의 수'));
  assert(!definitions.rows.flat().some(cell => /튜플 안의 튜플|유니크/u.test(cell)));
  assert(!display('2023-1-q8').flatMap(b => b.rows?.flat() ?? []).some(cell => cell.includes('네트워크를 통해 전파되지 않으며')));
  const union = display('2023-3-q6');
  assert.equal(union.filter(b => b.type === 'code').length, 1);
  assert(union.find(b => b.type === 'code').text.includes('ORDER BY A DESC'));
  assert.deepEqual(find('2023-3-q6').walkthrough.tables.at(-1).rows, [['A'], ['4'], ['3'], ['2'], ['1']]);
  console.log(`PASS: 설명 표 머리글·보기 ${choices}개 분리·용어 정의·UNION 전체 코드·최종 표·원본 보존`);
  for (const [id, mode, expectedDone] of [['2024-2-q12', 'SRT', [17, 5, 26, 10]], ['2025-2-q13', 'RR', [20, 8, 26, 25]]]) {
    const q = find(id);
    const tasks = q.blocks.find(b => b.type === 'table').rows.slice(1).map(([name, at, duration], i) => ({ name, at: Number(at), duration: Number(duration), left: Number(duration), i }));
    let time = 0, next = 0;
    const queue = [];
    while (tasks.some(t => t.left)) {
      let task;
      if (mode === 'SRT') task = tasks.filter(t => t.at <= time && t.left).sort((a, b) => a.left - b.left || a.at - b.at || a.i - b.i)[0];
      else {
        while (next < tasks.length && tasks[next].at <= time) queue.push(tasks[next++]);
        task = queue.shift();
      }
      if (!task) { time++; continue; }
      const run = Math.min(mode === 'SRT' ? 1 : 4, task.left);
      task.left -= run;
      time += run;
      if (!task.left) task.done = time;
      else if (mode === 'RR') {
        while (next < tasks.length && tasks[next].at <= time) queue.push(tasks[next++]);
        queue.push(task);
      }
    }
    assert.deepEqual(tasks.map(t => t.done), expectedDone, `${q.id}: 표의 도착·실행 시간으로 완료 시각 독립 계산`);
    const average = tasks.reduce((sum, t) => sum + t.done - t.at - t.duration, 0) / tasks.length;
    assert.equal(average, parseFloat(q.answerBlocks[0].text), `${q.id}: 평균 대기시간과 정답 일치`);
  }
  const lru = find('2024-3-q4');
  const references = lru.blocks.find(b => b.text?.startsWith('페이지 참조 순서')).text.split(':')[1].match(/\d+/gu).map(Number);
  const frames = new Map();
  let faults = 0;
  references.forEach((page, time) => {
    if (!frames.has(page)) {
      faults++;
      if (frames.size === 3) frames.delete([...frames].sort((a, b) => a[1] - b[1])[0][0]);
    }
    frames.set(page, time);
  });
  assert.equal(faults, Number(lru.answerBlocks[0].text));
  console.log('PASS: 원본 프로세스 표의 SRT·RR 완료/대기시간, LRU 참조열을 독립 시뮬레이션');
  db.close();
  console.log(`PASS: ${bank.size}문항의 문제·정답·중간 풀이 표 ${tables}개 행·열·셀 검증`);
  const candidates = arithmetic.filter((item, index, all) => all.findIndex(other => other.id === item.id && other.expression === item.expression) === index);
  console.log(JSON.stringify({ arithmeticCandidates: candidates }, null, 2));
  assert.equal(candidates.length, 0, '숫자로 표현된 계산식·설명 불일치 후보는 문맥 검토 필요');
} finally { await server.close(); }
