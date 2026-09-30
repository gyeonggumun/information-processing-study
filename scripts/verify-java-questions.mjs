import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { javaCodeQuestions } from '../src/data/javaCodeQuestions.js';
import { buildCodeWalkthrough } from '../src/lib/codeWalkthrough.js';
import { isCodeOutputCorrect } from '../src/lib/codePractice.js';

for (const level of ['하', '중', '상']) {
  assert.equal(javaCodeQuestions.filter((q) => q.difficulty === level).length, 50);
}
assert.equal(new Set(javaCodeQuestions.map((q) => q.id)).size, 150);
assert.equal(new Set(javaCodeQuestions.map((q) => q.code)).size, 150);
for (const q of javaCodeQuestions) {
  assert(q.answerText.trim() && q.explanation.length > 40 && q.trace.length >= 3, q.id);
  assert.equal(q.trace.length, q.anchors.length, q.id);
  const { annotatedCode, steps } = buildCodeWalkthrough(q);
  assert.equal(steps.length, q.trace.length, q.id);
  assert.equal(annotatedCode.split('\n').filter((line) => line.trimStart().startsWith('// [')).length, q.trace.length, q.id);
  assert.equal(annotatedCode.split('\n').filter((line) => !line.trimStart().startsWith('// [')).join('\n'), q.code, q.id);
}

const folder = resolve('node_modules/.cache/java-verifier');
mkdirSync(folder, { recursive: true });
const sourcePath = resolve(folder, 'Runner.java');
const classes = javaCodeQuestions.map((q, index) =>
  q.code.replace(/^import java\.util\.\*;\n\n/, '').replace('class Main {', 'class Q' + index + ' {'));
const calls = javaCodeQuestions.map((q, index) =>
  '        System.out.print("\\n@@' + q.id + '@@\\n"); Q' + index + '.main(args);').join('\n');
writeFileSync(sourcePath, 'import java.util.*;\n\n' + classes.join('\n\n') +
  '\n\npublic class Runner {\n    public static void main(String[] args) {\n' + calls + '\n    }\n}\n');

execFileSync('javac', ['-encoding', 'UTF-8', '-d', folder, sourcePath], { timeout: 180000, stdio: 'pipe' });
const output = execFileSync('java', ['-cp', folder, 'Runner'], { encoding: 'utf8', timeout: 30000 });
const sections = output.split(/\r?\n@@(java-[a-z]+-\d+)@@\r?\n/).slice(1);
assert.equal(sections.length, 300);
for (let i = 0; i < sections.length; i += 2) {
  const question = javaCodeQuestions[i / 2];
  assert.equal(sections[i], question.id);
  assert(isCodeOutputCorrect(sections[i + 1], question.answerText),
    question.id + ': 실제=' + sections[i + 1].trim() + ', 예상=' + question.answerText);
}
console.log('Java 하·중·상 각 50문항: 코드 컴파일·실행 출력·주석 풀이 검증 완료');
