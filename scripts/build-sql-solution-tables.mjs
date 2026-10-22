import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { sqlCodeQuestions, previousSqlCodeQuestions } from '../src/data/practicalRefreshCode.js';
import { buildSqlSolutionTables } from './lib/sql-solution-tables.mjs';

const questions = [...sqlCodeQuestions, ...previousSqlCodeQuestions];
const source = questions.map(({ id, code, tables, answerMode, answerText }) => ({ id, code, tables, answerMode, answerText }));
const sha256 = createHash('sha256').update(JSON.stringify(source)).digest('hex');
const path = 'src/data/sqlSolutionTables.json';
const generatorSha256 = createHash('sha256').update(readFileSync('scripts/lib/sql-solution-tables.mjs', 'utf8').replace(/\r\n/gu, '\n')).digest('hex');
const result = { version: 1, sha256, generatorSha256, questions: Object.fromEntries(questions.map(q => [q.id, buildSqlSolutionTables(q)])) };
const serialized = JSON.stringify(result) + '\n';
if (process.argv.includes('--check')) {
  if (readFileSync(path, 'utf8').replace(/\r\n/gu, '\n') !== serialized) throw new Error('SQL 해설 표가 최신 문제와 다릅니다. npm run sql:solution-tables를 실행하세요.');
} else writeFileSync(path, serialized);
console.log(`PASS: SQL ${questions.length}문항의 JOIN·WHERE·VIEW·파생 테이블·최종 결과와 정답 일치`);
