import sources from './restoredExamsSource.json' with { type: 'json' };
import { similarExamTheory } from './similarExamTheory.js';
import { similarExamCode } from './similarExamCode.js';
import { similarExamSql } from './similarExamSql.js';
import { buildCodeWalkthrough } from '../lib/codeWalkthrough.js';

const references = new Map(sources.flatMap(exam => exam.questions.map(q => [q.id, { sourceUrl: exam.sourceUrl, license: exam.license }])));
const text = value => ({ type: 'text', text: value });
const tableBlock = ({ name, columns, rows }) => ({ type: 'table', caption: name, rows: [columns, ...rows.map(row => row.map(value => value === null ? 'NULL' : String(value)))] });
const theory = similarExamTheory.map(([key, ref, category, prompt, answer, steps]) => ({ key, ref, category, prompt, answer, steps, language: '이론·계산' }));

export const similarExamQuestions = [...theory, ...similarExamCode, ...similarExamSql].map(item => {
  const sourceQuestionId = `past-${item.ref}`;
  const source = references.get(sourceQuestionId);
  if (!source) throw new Error(`유사 문항의 복원 근거 누락: ${item.key}`);
  const blocks = [text(item.prompt || `다음 ${item.language === 'SQL' ? '표와 SQL의 최종 조회 결과' : `${item.language} 코드의 출력 결과`}를 작성하시오.`)];
  if (item.tables) blocks.push(...item.tables.map(tableBlock));
  if (item.code) blocks.push({ type: 'code', text: item.code });
  const solutionBlocks = item.language === 'SQL'
    ? [...(item.solutionTables || []).map(tableBlock), tableBlock({ name: '최종 조회 결과', columns: item.resultColumns, rows: item.resultRows })]
    : item.code ? [{ type: 'code', text: buildCodeWalkthrough(item).annotatedCode }] : [];
  return { ...item, ...source, id: `similar-${item.key}`, similar: true, sourceQuestionId,
    title: `실기 유사 · ${item.category}`, blocks, answerBlocks: [text(item.answer)],
    explanation: item.steps, solutionBlocks,
    referenceBasis: item.referenceBasis || '복원 문제의 핵심 유형을 유지하고 사례·변수·조건·데이터를 바꾼 창작 변형',
  };
});
