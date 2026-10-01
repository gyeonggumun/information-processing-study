import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { sqlCodeQuestions } from '../src/data/sqlCodeQuestions.js';

const normalize = (value) => String(value).trim().replace(/\s+/g, ' ');
const ids = new Set();

for (const level of ['하', '중', '상']) {
  assert.equal(sqlCodeQuestions.filter((question) => question.difficulty === level).length, 50, `${level} 문항 수`);
  assert.equal(new Set(sqlCodeQuestions.filter((question) => question.difficulty === level).map((question) => question.family)).size, 10, `${level} 유형 수`);
}

for (const question of sqlCodeQuestions) {
  assert.ok(!ids.has(question.id), `중복 ID: ${question.id}`);
  ids.add(question.id);
  assert.ok(question.title && question.prompt && question.code && question.answerText && question.explanation);
  assert.ok(question.steps.length >= 2, `${question.id}: 풀이 단계 누락`);
  const db = new DatabaseSync(':memory:');
  try {
    for (const table of question.tables) {
      const definitions = table.columns.map((column, index) => {
        const values = table.rows.map((row) => row[index]).filter((value) => value !== null);
        return `${column} ${values.every((value) => typeof value === 'number') ? 'INTEGER' : 'TEXT'}`;
      });
      db.exec(`CREATE TABLE ${table.name} (${definitions.join(', ')});`);
      const insert = db.prepare(`INSERT INTO ${table.name} VALUES (${table.columns.map(() => '?').join(', ')});`);
      for (const row of table.rows) insert.run(...row);
    }
    if (question.answerMode === 'blanks') {
      if (question.family !== 'create-domain-check') {
        const parts = question.answerText.split(',').map((part) => part.trim());
        const completed = question.code.replace('①', parts[0]).replace('②', parts[1] ?? '');
        db.exec(completed);
      }
      continue;
    }
    const statements = question.code.split(';').map((part) => part.trim()).filter(Boolean);
    for (const statement of statements.slice(0, -1)) db.exec(`${statement};`);
    const rows = db.prepare(statements.at(-1)).all();
    const actual = rows.map((row) => Object.values(row).map((value) => value === null ? 'NULL' : value).join(' ')).join('\n');
    assert.equal(normalize(actual), normalize(question.answerText), `${question.id}: SQL 실행 결과 불일치`);
  } finally {
    db.close();
  }
}

console.log(`SQL ${sqlCodeQuestions.length}문항: 난이도별 50문항, 고유 ID, 실행 결과 검증 완료`);
