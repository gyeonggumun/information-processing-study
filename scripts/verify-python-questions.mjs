import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { pythonCodeQuestions } from '../src/data/pythonCodeQuestions.js';
import { buildCodeWalkthrough } from '../src/lib/codeWalkthrough.js';
import { isCodeOutputCorrect } from '../src/lib/codePractice.js';

for (const level of ['하', '중', '상']) {
  assert.equal(pythonCodeQuestions.filter((q) => q.difficulty === level).length, 50);
}
assert.equal(new Set(pythonCodeQuestions.map((q) => q.id)).size, 150);
assert.equal(new Set(pythonCodeQuestions.map((q) => q.code)).size, 150);
for (const q of pythonCodeQuestions) {
  assert(q.answerText.trim() && q.explanation.length > 40 && q.trace.length >= 3, q.id);
  assert.equal(q.trace.length, q.anchors.length, q.id);
  const { annotatedCode, steps } = buildCodeWalkthrough(q);
  assert.equal(steps.length, q.trace.length, q.id);
  assert.equal(annotatedCode.split('\n').filter((line) => line.trimStart().startsWith('# [')).length, q.trace.length, q.id);
  assert.equal(annotatedCode.split('\n').filter((line) => !line.trimStart().startsWith('# [')).join('\n'), q.code, q.id);
}

const runner = [
  'import contextlib, io, json, sys',
  'codes = json.load(sys.stdin)',
  'outputs = []',
  'for code in codes:',
  '    stream = io.StringIO()',
  '    with contextlib.redirect_stdout(stream):',
  '        exec(compile(code, "<question>", "exec"), {"__name__": "__main__"})',
  '    outputs.append(stream.getvalue())',
  'json.dump(outputs, sys.stdout)',
].join('\n');
const output = execFileSync('python', ['-c', runner], {
  input: JSON.stringify(pythonCodeQuestions.map((q) => q.code)),
  encoding: 'utf8',
  env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
  maxBuffer: 10 * 1024 * 1024,
  timeout: 30000,
});
const actual = JSON.parse(output);
assert.equal(actual.length, 150);
for (let i = 0; i < actual.length; i += 1) {
  const question = pythonCodeQuestions[i];
  assert(isCodeOutputCorrect(actual[i], question.answerText),
    question.id + ': 실제=' + actual[i].trim() + ', 예상=' + question.answerText);
}
console.log('Python 하·중·상 각 50문항: 실제 실행 출력·주석 풀이 검증 완료');
