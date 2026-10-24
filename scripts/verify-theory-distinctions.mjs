import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { questionConceptNotes } from '../src/data/plainConceptNotes.js';
import { getExamTheoryDistinctions, examTheoryDistinctionGroups } from '../src/data/examTheoryDistinctions.js';

const authId = '\0theory-distinction-auth';
const server = await createServer({ configFile: false, plugins: [react(), {
  name: 'theory-distinction-auth', enforce: 'pre',
  resolveId(id) { if (id === '../contexts/AuthContext') return authId; },
  load(id) { if (id === authId) return 'let auth={};export function useAuth(){return auth}export function setAuth(value){auth=value}'; },
}], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false } });
try {
  const { restoredExamQuestions: restored } = await server.ssrLoadModule('/src/data/restoredExams.js');
  const { similarExamQuestions: similar } = await server.ssrLoadModule('/src/data/similarExams.js');
  const { default: Panel } = await server.ssrLoadModule('/src/components/RestoredExamPanel.jsx');
  const { AnswerConceptNotes } = await server.ssrLoadModule('/src/components/ReadingText.jsx');
  const { setAuth } = await server.ssrLoadModule(authId);
  const banks = [restored.filter(q => !q.walkthrough), similar.filter(q => q.language === '이론·계산')];
  assert.deepEqual(banks.map(bank => bank.length), [111,50]);
  assert.deepEqual(banks.map(bank => bank.filter(q => getExamTheoryDistinctions(q).length).length), [92,32]);
  assert.deepEqual(banks.map(bank => bank.filter(q => questionConceptNotes(q).length).length), [19,18]);
  const targets = banks.flat();
  const additions = targets.filter(q => getExamTheoryDistinctions(q).length);
  assert.equal(Object.keys(examTheoryDistinctionGroups).length, additions.length);
  assert(Object.keys(examTheoryDistinctionGroups).every(id => additions.some(q => q.id === id)), '없는 문항·불필요한 매핑 금지');
  for (const q of targets) {
    const existing = questionConceptNotes(q);
    const notes = getExamTheoryDistinctions(q);
    assert(existing.length || notes.length, `${q.id}: 비코드 이론·계산 해설의 구별점 누락`);
    if (existing.length) assert.equal(notes.length,0,`${q.id}: 기존 구별점 중복 추가 금지`);
    assert.equal(new Set(notes.map(n => n.name)).size, notes.length);
    for (const note of notes) assert(note.meaning.length >= 20 && note.contrast.length >= 20, `${q.id}: 구체적인 뜻과 구별 기준`);
  }
  const codes = [...restored.filter(q => q.walkthrough),...similar.filter(q => q.language !== '이론·계산')];
  for (const q of codes) assert.deepEqual(getExamTheoryDistinctions(q),[],`${q.id}: 코드 해설은 변경하지 않음`);
  assert.deepEqual(getExamTheoryDistinctions({ id:'past-2026-2-q1' }),[], '일반 기출에 ID만으로 추가하지 않음');
  assert.deepEqual(getExamTheoryDistinctions({ id:'unknown',restored:true }),[], '알 수 없는 문항에 추측 연결 금지');
  const hash = id => getExamTheoryDistinctions(targets.find(q => q.id === id))[0];
  assert.equal(hash('similar-hash').name, '해싱과 충돌');
  assert.equal(hash('past-2026-2-q17').name, '암호학적 해시와 암호화');
  assert.notEqual(hash('similar-hash').contrast,hash('past-2026-2-q17').contrast, '해시 자료구조와 암호학적 해시를 문항별로 구별');
  const source = JSON.parse(readFileSync('src/data/restoredExamsSource.json','utf8')).flatMap(exam => exam.questions);
  for (const q of restored) assert.deepEqual(q.blocks,source.find(s => s.id === q.id).blocks,`${q.id}: 원문 문제 보존`);

  const escape = text => text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;');
  for (const role of ['pro','admin','user',undefined]) {
    const allowed = role === 'pro' || role === 'admin';
    setAuth({ appRole:role,isLoading:false,user:{id:'fixture-user'} });
    for (const q of additions) {
      const before = renderToStaticMarkup(createElement(Panel,{question:q}));
      assert(!before.includes('헷갈리기 쉬운 개념 구별'),`${q.id}: 제출 전 비노출`);
      const after = renderToStaticMarkup(createElement(Panel,{question:q,reviewAttempt:{is_correct:false}}));
      assert.equal(after.includes('헷갈리기 쉬운 개념 구별'),allowed,`${q.id}: 권한별 복습 표시`);
      if (allowed) {
        const text = after.replace(/<[^>]+>/g,'');
        for (const note of getExamTheoryDistinctions(q)) assert(text.includes(escape(note.contrast)),`${q.id}: 전체 구별 설명 렌더링`);
      }
    }
  }
  for (const q of targets.filter(q => questionConceptNotes(q).length)) {
    const html = renderToStaticMarkup(createElement(AnswerConceptNotes,{question:q}));
    assert(html.includes('정답 용어 정리') && !html.includes('헷갈리기 쉬운 개념 구별'),`${q.id}: 기존 용어 정리 유지`);
  }
  console.log('PASS: 복원 92·유사 32문항 구별점, 기존 37문항 유지 → 비코드 161문항 전체 표시, UNION 구별점은 SQL 주석 해설로 이동');
  console.log('PASS: 코드 259문항 제외·원문 보존·해시 문맥 분리·Pro/Admin 복습 허용·제출 전/User/미확인 비공개');
} finally { await server.close(); }
