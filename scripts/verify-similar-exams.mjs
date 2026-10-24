import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { similarExamQuestions as questions } from '../src/data/similarExams.js';
import { pickRestoredExamQuestion } from '../src/lib/restoredExamPractice.js';
import { practiceKey, savePracticeAttempt } from '../src/lib/practiceHistory.js';
import { summarizeWrongAnswers } from '../src/lib/wrongAnswers.js';
import { isCodeOutputCorrect } from '../src/lib/codePractice.js';

assert.equal(questions.length, 200);
assert.equal(new Set(questions.map(q => q.id)).size, 200);
const source = new Map(JSON.parse(readFileSync('src/data/restoredExamsSource.json')).flatMap(e => e.questions.map(q => [q.id, q])));
const normalize = text => text.replace(/\s/gu, '');
const lookup = new Map(questions.map(q => [practiceKey('exam', q.id), q]));
for (const [language, count] of Object.entries({ '이론·계산': 50, C: 40, Java: 40, Python: 40, SQL: 30 })) {
  const bank = questions.filter(q => q.language === language);
  assert.equal(bank.length, count);
  assert.equal(new Set(bank.map(q => normalize(JSON.stringify(q.blocks)))).size, count);
  for (const q of bank) {
    assert(q.id.startsWith('similar-') && q.similar && !q.restored);
    assert(q.answer.trim() && q.explanation.length >= 2 && q.explanation.every(s => s.length >= 20), q.id);
    const original = source.get(q.sourceQuestionId);
    assert(original, `${q.id}: 출제 유형 근거`);
    if (q.code) assert(!original.blocks.some(b => b.type === 'code' && normalize(b.text) === normalize(q.code)), `${q.id}: 원문과 다른 코드`);
    if (['C', 'Java', 'Python'].includes(language)) {
      assert.equal(q.trace.length, q.anchors.length);
      assert(q.solutionBlocks[0].text.includes('[01]'), `${q.id}: 주석 풀이`);
      assert(q.anchors.every(anchor => q.code.includes(anchor)), `${q.id}: 주석 위치 누락`);
    }
    const attempt = { id: 'test', user_id: 'test-user', practice_type: 'exam', question_id: q.id, is_correct: false, created_at: '2026-10-23T00:00:00Z' };
    assert.equal(summarizeWrongAnswers([attempt], lookup).pending[0].question, q);
    assert.equal(summarizeWrongAnswers([{ ...attempt, id: 'retry', is_correct: true }, attempt], lookup).pending.length, 0);
  }
}
const done = new Set();
for (let i = 0; i < 200; i++) {
  // 고정 난수로도 아직 안 푼 모든 항목에 도달하고 재출제하지 않아야 합니다.
  const q = pickRestoredExamQuestion(questions, done, undefined, () => 0.63);
  assert(q && !done.has(practiceKey('exam', q.id)));
  done.add(practiceKey('exam', q.id));
}
assert.equal(pickRestoredExamQuestion(questions, done), null);
assert.notEqual(pickRestoredExamQuestion(questions, new Set(), questions[0].id, () => 0).id, questions[0].id);
for (let i = 0; i < 200; i++) assert.equal(pickRestoredExamQuestion(questions, new Set(), undefined, () => (i + 0.5) / 200).id, questions[i].id);
let saved;
const client = { from(name) { assert.equal(name, 'practice_attempts'); return { insert(row) { saved = row; return { select() { return { async single() { return { data: { ...row, created_at: '2026-10-23T00:00:00Z' }, error: null }; } }; } }; } }; } };
await savePracticeAttempt(client, { id: 'test-save', user_id: 'test-user', practice_type: 'exam', question_id: questions[0].id, is_correct: false });
assert.equal(saved.question_id, questions[0].id);
assert.equal(saved.practice_type, 'exam');
console.log('PASS: 200문항 분포·독립 ID·복원 근거·주석·무작위 전수 도달·중복 제외·기록 및 오답 재풀이');

const literal = value => value === null ? 'NULL' : typeof value === 'number' ? String(value) : `'${value.replaceAll("'", "''")}'`;
for (const q of questions.filter(q => q.language === 'SQL')) {
  const db = new DatabaseSync(':memory:');
  try {
    for (const t of q.tables) {
      const columns = t.columns.map((col, i) => `"${col}" ${t.rows.some(r => typeof r[i] === 'string') ? 'TEXT' : 'INTEGER'}`).join(',');
      db.exec(`CREATE TABLE "${t.name}"(${columns}); INSERT INTO "${t.name}" VALUES ${t.rows.map(r => `(${r.map(literal).join(',')})`).join(',')};`);
    }
    const statements = (q.verificationSql || q.code).split(';').map(s => s.trim()).filter(Boolean);
    statements.slice(0, -1).forEach(sql => db.exec(sql));
    const rows = db.prepare(statements.at(-1)).all().map(row => Object.values(row));
    assert.deepEqual(rows, q.resultRows, `${q.id}: 실제 SQL 결과`);
    assert.deepEqual(q.solutionBlocks.at(-1).rows.slice(1), rows.map(r => r.map(x => x === null ? 'NULL' : String(x))));
    if (q.key.startsWith('sql-view-')) assert.deepEqual(db.prepare('SELECT name,total FROM Sales ORDER BY name').all().map(Object.values), q.solutionTables[1].rows);
    if (q.key.startsWith('sql-join-average-')) assert.deepEqual(db.prepare('SELECT s.id,s.name,s.dept_id,d.budget FROM Staff s JOIN Dept d ON s.dept_id=d.id ORDER BY s.id').all().map(Object.values), q.solutionTables[0].rows);
  } finally { db.close(); }
}
console.log('PASS: SQL 30문항 실제 실행, 빈칸 완성 SQL, JOIN·VIEW 중간 표·최종 결과 표');

if (process.argv.includes('--execute')) {
  const python = questions.filter(q => q.language === 'Python');
  const runner = 'import contextlib,io,json,sys\noutputs=[]\nfor code in json.load(sys.stdin):\n stream=io.StringIO()\n with contextlib.redirect_stdout(stream):\n  exec(compile(code,"<similar-question>","exec"),{})\n outputs.append(stream.getvalue())\njson.dump(outputs,sys.stdout)';
  const outputs = JSON.parse(execFileSync('python', ['-c', runner], { input: JSON.stringify(python.map(q => q.code)), encoding: 'utf8', timeout: 30000 }));
  python.forEach((q, i) => assert(isCodeOutputCorrect(outputs[i], q.answer), `${q.id}: ${outputs[i]} / ${q.answer}`));
  const folder = resolve('node_modules/.cache/similar-exams'); mkdirSync(folder, { recursive: true });
  const java = questions.filter(q => q.language === 'Java');
  const javaFile = resolve(folder, 'Runner.java');
  writeFileSync(javaFile, 'import java.util.*;\n' + java.map((q, i) => q.code.replace(/^import java\.util\.\*;\n\n/, '').replace('class Main {', `class Q${i} {`)).join('\n') + '\npublic class Runner { public static void main(String[] args) {\n' + java.map((q, i) => `System.out.print("\\n@@${q.id}@@\\n"); Q${i}.main(args);`).join('\n') + '\n}}');
  execFileSync('javac', ['-encoding', 'UTF-8', '-d', folder, javaFile], { timeout: 60000 });
  function check(output, bank) {
    const parts = output.split(/\r?\n@@([\w-]+)@@\r?\n/u).slice(1);
    assert.equal(parts.length, bank.length * 2);
    for (let i = 0; i < bank.length; i++) { assert.equal(parts[i * 2], bank[i].id); assert(isCodeOutputCorrect(parts[i * 2 + 1], bank[i].answer), `${bank[i].id}: ${parts[i * 2 + 1]} / ${bank[i].answer}`); }
  }
  check(execFileSync('java', ['-cp', folder, 'Runner'], { encoding: 'utf8', timeout: 30000 }), java);
  const c = questions.filter(q => q.language === 'C');
  const reserved = new Set('auto break case char const continue default do double else enum extern float for goto if inline int long register restrict return short signed sizeof static struct switch typedef union unsigned void volatile while printf strlen strcpy NULL'.split(' '));
  const isolate = (code, i) => code.replace(/^#include.*$/gm, '').replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b[A-Za-z_]\w*\b/g, token => /^[A-Za-z_]\w*$/.test(token) && !reserved.has(token) ? `q${i}_${token}` : token);
  const cFile = resolve(folder, 'questions.c');
  writeFileSync(cFile, '#include <stdio.h>\n#include <string.h>\n' + c.map((q, i) => isolate(q.code, i)).join('\n') + '\nint main(void) {\n' + c.map((q, i) => `printf("\\n@@${q.id}@@\\n"); q${i}_main();`).join('\n') + '\nreturn 0; }');
  for (const opt of ['-O0', '-O2']) {
    const exe = resolve(folder, `similar-${opt.slice(1)}.exe`);
    execFileSync(resolve('node_modules/.cache/c-verifier/zig-x86_64-windows-0.15.2/zig.exe'), ['cc', '-std=c11', opt, '-Wall', '-Wextra', '-Werror', cFile, '-o', exe], { timeout: 120000 });
    check(execFileSync(exe, [], { encoding: 'utf8', timeout: 10000 }), c);
  }
  console.log('PASS: C 40문항 O0/O2·Java 40문항 컴파일 및 실행·Python 40문항 실행 결과 일치');
}

const authId = '\0similar-test-auth';
const server = await createServer({ configFile: false, plugins: [react(), {
  name: 'similar-test', enforce: 'pre',
  resolveId(id) { if (id === '../contexts/AuthContext') return authId; },
  load(id) { if (id === authId) return 'let state={};export function useAuth(){return state} export function setAuth(s){state=s} export function getSafeReturnPath(v){return v}'; },
}], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false } });
try {
  const { setAuth } = await server.ssrLoadModule(authId);
  const { default: Page } = await server.ssrLoadModule('/src/pages/SimilarExamsPage.jsx');
  const { default: Retry } = await server.ssrLoadModule('/src/components/ExamRetryPanel.jsx');
  const { default: Layout } = await server.ssrLoadModule('/src/components/Layout.jsx');
  for (const role of ['user', 'pro', 'admin', 'invalid']) {
    setAuth({ appRole: role, isLoading: false, isLoggedIn: true, hasNickname: true, user: { id: 'test-user' }, nickname: '검증' });
    const page = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Page)));
    const menu = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Layout)));
    const allowed = ['pro', 'admin'].includes(role);
    assert.equal(page.includes('실기 유사 랜덤 문제'), allowed);
    assert.equal(page.includes('비공개 페이지입니다.'), !allowed);
    assert.equal(menu.includes('href="/similar-exams"'), allowed);
    for (const q of questions) for (const review of [false, true]) {
      const html = renderToStaticMarkup(createElement(Retry, { question: q, onClose() {}, ...(review ? { reviewAttempt: { is_correct: false } } : {}) }));
      assert.equal(html.includes('풀이 과정'), allowed && review);
      if (!allowed) assert(!html.includes('내 답안') && !html.includes(q.title) && html.includes('Pro 이상 전용 문제입니다.'));
      else if (!review) assert(html.includes('내 답안') && !html.includes(q.title) && !html.includes('유형 참고:'));
      else assert(html.includes(q.title) && html.includes('유형 참고:') && !html.includes('정답으로 기록'));
    }
  }
  setAuth({ appRole: 'pro', isLoading: true });
  assert(renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Page))).includes('로그인 상태를 확인'));
  setAuth({ appRole: undefined, isLoading: false, isLoggedIn: false, hasNickname: false });
  assert(!renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Page))).includes('실기 유사 랜덤 문제'));
  for (const file of ['PracticeHistoryPage', 'WrongAnswersPage']) assert(readFileSync(`src/pages/${file}.jsx`, 'utf8').includes('...similarExamQuestions.map'));
  console.log('PASS: Pro/Admin 메뉴·페이지·재풀이 허용, User/미확인 권한 비공개, 200문항 제출 전 힌트·해설 비노출 및 복습 해설');
} finally { await server.close(); }
