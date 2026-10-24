import assert from 'node:assert/strict';
import { summarizeWrongAnswers, wrongAnswerPresentation } from '../src/lib/wrongAnswers.js';
import { matchesWrittenAnswer } from '../src/lib/writtenAnswer.js';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

const questionMap = new Map(['exam:e1', 'C:c1', 'Java:j1', 'Python:p1', 'SQL:s1'].map((key) => [key, { title: key }]));
const attempt = (practice_type, question_id, is_correct) => ({ practice_type, question_id, is_correct });
const history = [
  attempt('SQL', 's1', true),
  attempt('C', 'c1', false),
  attempt('exam', 'e1', false),
  attempt('Python', 'p1', false),
  attempt('Java', 'j1', false),
  attempt('SQL', 's1', false),
  attempt('exam', 'e1', true),
  attempt('C', 'removed', false),
];

const summary = summarizeWrongAnswers(history, questionMap);
assert.deepEqual(summary.pending.map(({ key }) => key), ['C:c1', 'exam:e1', 'Python:p1', 'Java:j1']);
assert.equal(summary.resolvedCount, 1);
assert.equal(summary.totalWrongAttempts, 6);
assert.equal(summary.unavailableCount, 1);

const afterRetry = summarizeWrongAnswers([attempt('exam', 'e1', true), ...history], questionMap);
assert.deepEqual(afterRetry.pending.map(({ key }) => key), ['C:c1', 'Python:p1', 'Java:j1']);
assert.equal(afterRetry.resolvedCount, 2);

assert.ok(matchesWrittenAnswer({ acceptedAnswers: ['정규화', 'Normalization'] }, ' normalization '));
assert.ok(!matchesWrittenAnswer({ acceptedAnswers: ['정규화'] }, '반정규화'));

console.log('오답노트: 최신 풀이 기준 목록, 재풀이 완료, 유형 통합, 답안 채점 검증 완료');

assert.deepEqual(wrongAnswerPresentation('exam', { restored:true,id:'past-2026-1-q7',examId:'2026-1',number:7,title:'오버로딩과 동적 바인딩' }), { label:'실기 복원 문제',title:'2026년 1회 · 7번 문제' });
assert.equal(wrongAnswerPresentation('exam', { restored:true,id:'past-2023-3-q11',title:'재귀 정답 단서' }).title,'2023년 3회 · 11번 문제');
assert.equal(wrongAnswerPresentation('exam', { restored:true,title:'정답 단서' }).title,'실기 복원 문제');
assert.deepEqual(wrongAnswerPresentation('exam', { similar:true,sourceQuestionId:'past-2025-2-q7',title:'실기 유사 · 프록시' }), { label:'실기 유사 문제',title:'2025년 2회 · 7번 유형' });
assert.equal(wrongAnswerPresentation('exam', { similar:true,sourceQuestionId:'invalid',title:'정답 단서' }).title,'실기 유사 문제');
assert.equal(wrongAnswerPresentation('exam', { subject:'소프트웨어 설계',title:'프록시 패턴' }).title,'소프트웨어 설계 문제');
assert.equal(wrongAnswerPresentation('exam', { subject:'알 수 없는 분류',title:'정답 단서' }).title,'기출문제');
for (const type of ['C','Java','Python','SQL']) assert.deepEqual(wrongAnswerPresentation(type, { title:'기존 코드 제목' }), { label:type,title:'기존 코드 제목' });

const mockId = '\0wrong-title-attempts';
const server = await createServer({ configFile:false,plugins:[react(),{
  name:'wrong-title-attempts',enforce:'pre',
  resolveId(id) { if (id === '../hooks/usePracticeAttempts') return mockId; },
  load(id) { if (id === mockId) return 'let records=[];export function setRecords(value){records=value}export function usePracticeAttempts(){return {attempts:records,isLoading:false,error:"",refresh(){}}}'; },
}],optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false} });
try {
  const { practiceQuestions,previousQuestions,codeQuestions } = await server.ssrLoadModule('/src/data/studyData.js');
  const { restoredExamQuestions } = await server.ssrLoadModule('/src/data/restoredExams.js');
  const { similarExamQuestions } = await server.ssrLoadModule('/src/data/similarExams.js');
  const { default: Page } = await server.ssrLoadModule('/src/pages/WrongAnswersPage.jsx');
  const { setRecords } = await server.ssrLoadModule(mockId);
  const all = new Map([
    ...similarExamQuestions.map(q => [`exam:${q.id}`,q]),
    ...Object.entries(previousQuestions).flatMap(([type,qs]) => qs.map(q => [`${type}:${q.id}`,q])),
    ...restoredExamQuestions.map(q => [`exam:${q.id}`,q]),
    ...practiceQuestions.map(q => [`exam:${q.id}`,q]),
    ...Object.entries(codeQuestions).flatMap(([type,qs]) => qs.map(q => [`${type}:${q.id}`,q])),
  ]);
  setRecords([...all.keys()].map(key => {const [practice_type,question_id]=key.split(':');return {practice_type,question_id,is_correct:false};}));
  const html = renderToStaticMarkup(createElement(MemoryRouter,null,createElement(Page)));
  const rows = [...html.matchAll(/class="wrong-question-title">([^<]*)<\/span>/g)].map(m => m[1]);
  const escape = text => text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;');
  assert.equal(rows.length,all.size);
  for (const [i,[key,q]] of [...all].entries()) {
    const type=key.split(':')[0];
    const display=wrongAnswerPresentation(type,q);
    assert.equal(rows[i],escape(display.title),`${key}: 실제 목록 제목`);
    if (type !== 'exam') assert.equal(display.title,q.title,`${key}: 코드 제목 유지`);
    else if (q.restored) assert.match(display.title,/^\d{4}년 \d+회 · \d+번 문제$/);
    else if (q.similar) assert.match(display.title,/^\d{4}년 \d+회 · \d+번 유형$/);
    else assert(/^(소프트웨어 설계|소프트웨어 개발|데이터베이스 구축|정보시스템 구축 ?관리) 문제$/.test(display.title) || display.title === '기출문제',`${key}: 과목명만 표시`);
  }
  console.log(`PASS: 현재·보관 오답 ${all.size}문항의 실제 목록 제목 검증, 복원/유사 출처만 표시·일반 기출 과목명·코드 제목 유지`);
} finally { await server.close(); }
