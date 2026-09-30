import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cCodeQuestions } from '../src/data/cCodeQuestions.js';
import { isCodeOutputCorrect } from '../src/lib/codePractice.js';

const compiler = process.argv[2];
assert(compiler, '사용법: node scripts/verify-c-questions.mjs <zig 실행 파일 | cl>');
for (const level of ['하', '중', '상']) {
  assert.equal(cCodeQuestions.filter((q) => q.difficulty === level).length, 50);
}
assert.equal(new Set(cCodeQuestions.map((q) => q.id)).size, 150);
assert.equal(new Set(cCodeQuestions.map((q) => q.code)).size, 150);
for (const q of cCodeQuestions) {
  assert(q.answerText.trim() && q.explanation.length > 40 && q.trace.length >= 2, q.id);
  if (q.difficulty === '상') assert(q.code.split('\n').length >= 20, `${q.id}: 상 난이도 코드 길이`);
}
assert(isCodeOutputCorrect(' 1\n  23\t4 ', '1 23 4'));
assert(!isCodeOutputCorrect('12 3', '1 23'));
assert(!isCodeOutputCorrect('abc', 'ABC'));
assert(!isCodeOutputCorrect('', '0'));

// 각 문제의 사용자 정의 식별자만 접두화해 하나의 검증 프로그램으로 묶습니다.
// 문자열·문자 리터럴은 그대로 보존하고 표준 라이브러리 이름은 변경하지 않습니다.
const reserved = new Set(('auto break case char const continue default do double else enum extern float for goto if inline int long register restrict return short signed sizeof static struct switch typedef union unsigned void volatile while _Alignas _Alignof _Atomic _Bool _Complex _Generic _Imaginary _Noreturn _Static_assert _Thread_local printf strlen NULL').split(' '));
function isolate(source, index) {
  return source.replace(/^#include.*$/gm, '').replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b[A-Za-z_]\w*\b/g, (token) => {
    if (!/^[A-Za-z_]\w*$/.test(token) || reserved.has(token)) return token;
    return `q${index}_${token}`;
  });
}
const folder = resolve('node_modules/.cache/c-verifier');
mkdirSync(folder, { recursive: true });
const sourcePath = resolve(folder, 'questions.c');
const source = '#include <stdio.h>\n#include <string.h>\n' + cCodeQuestions.map((q, i) => isolate(q.code, i)).join('\n') +
  '\nint main(void) {\n' + cCodeQuestions.map((q, i) => `printf("\\n@@${q.id}@@\\n"); q${i}_main();`).join('\n') + '\nreturn 0;\n}\n';
writeFileSync(sourcePath, source);
for (const optimization of ['-O0', '-O2']) {
  const exe = resolve(folder, `questions-${optimization.slice(1)}${process.platform === 'win32' ? '.exe' : ''}`);
  if (compiler === 'cl') {
    execFileSync('cl', ['/nologo', '/std:c11', optimization === '-O0' ? '/Od' : '/O2', sourcePath, `/Fe${exe}`], { timeout: 180000, stdio: 'pipe', cwd: folder });
  } else {
    execFileSync(resolve(compiler), ['cc', '-std=c11', optimization, '-Wall', '-Wextra', '-Werror', '-Wno-unused-but-set-parameter', sourcePath, '-o', exe], { timeout: 180000, stdio: 'pipe' });
  }
  const output = execFileSync(exe, [], { encoding: 'utf8', timeout: 10000 });
  const sections = output.split(/\r?\n@@(c-[a-z]+-\d+)@@\r?\n/).slice(1);
  assert.equal(sections.length, 300);
  for (let i = 0; i < sections.length; i += 2) {
    const question = cCodeQuestions[i / 2];
    assert.equal(sections[i], question.id);
    assert(isCodeOutputCorrect(sections[i + 1], question.answerText), `${question.id}: 실제=${sections[i + 1].trim()}, 예상=${question.answerText}`);
  }
  console.log(`${optimization}: C 150문항 실행 출력 일치`);
}
console.log('하·중·상 각 50개, ID/코드 중복 없음, 해설/추적/출력 채점 검증 완료');
