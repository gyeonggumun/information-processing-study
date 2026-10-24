import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { readingPassages } from '../src/lib/readingText.js';
import { getPlainConcept, plainConceptNotes, questionConceptNotes } from '../src/data/plainConceptNotes.js';
import { refreshedWrittenQuestions } from '../src/data/practicalRefreshWritten.js';
import { refreshedCodeQuestions } from '../src/data/practicalRefreshCode.js';
import { similarExamQuestions } from '../src/data/similarExams.js';
import { buildConceptSections } from '../src/lib/studyConceptTable.js';

const examples = [
  '평균 대기시간은 3.33ms입니다. 1.33과 -1.33은 다릅니다. 순서를 확인합니다.',
  '주소는 172.20.36.0/22입니다. 마스크는 255.255.252.0입니다. 블록을 확인합니다.',
  'SELECT COUNT(*) FROM A; NULL은 0이 아닙니다. COUNT(DISTINCT x)를 확인합니다.',
  '  같은 공백  두 칸을 유지합니다.\n다음 줄도 그대로입니다.\n',
  '<script>alert(1)</script> HTML은 텍스트로 표시합니다.',
];
for (const text of [...examples, ...refreshedWrittenQuestions.map(q => q.explanation), ...Object.values(refreshedCodeQuestions).flatMap(qs => qs.flatMap(q => [q.explanation, ...(q.trace || q.steps)])), ...similarExamQuestions.flatMap(q => q.explanation)]) {
  assert.equal(readingPassages(text).join(''), text, '숫자·기호·공백·원문 보존');
}
assert(readingPassages('첫 문장입니다. 둘째 문장입니다. 셋째 문장입니다.').length >= 2);
assert(readingPassages(examples[0]).every(p => !p.endsWith('3.') && !p.endsWith('1.')));
assert.equal(getPlainConcept('Proxy (프록시)').name, 'Proxy');
assert.equal(getPlainConcept('MAC 주소'), undefined, '접근 통제 MAC와 하드웨어 주소 혼동 방지');
assert.equal(getPlainConcept('프록시와 어댑터'), undefined, '부분 문자열로 임의 연결하지 않음');
assert.equal(getPlainConcept('외래키').meaning.includes('같은 테이블'), true);
assert(getPlainConcept('외래키').meaning.includes('고유키'));
assert(getPlainConcept('동치 분할').meaning.includes('대표값'));
assert.deepEqual(questionConceptNotes({ code: 'printf("Proxy")', answerText: 'Proxy' }), [], '코드 문제에 답안 추측으로 개념 연결하지 않음');
assert.equal(questionConceptNotes({ acceptedAnswers: ['Proxy', '프록시', 'Proxy (프록시)'] }).length, 1);
assert.equal(plainConceptNotes.length, 69);
for (const n of plainConceptNotes) assert(n.meaning.length >= 20 && n.contrast.length >= 20 && n.meaning.endsWith('.') && n.contrast.endsWith('.') && n.names.every(name => getPlainConcept(name) === n));

const server = await createServer({ configFile: false, plugins: [react()], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false } });
try {
  const { default: Text, AnswerConceptNotes } = await server.ssrLoadModule('/src/components/ReadingText.jsx');
  const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
  for (const text of examples) {
    const html = renderToStaticMarkup(createElement(Text, null, text));
    assert.equal(html.replace(/<[^>]+>/gu, ''), escape(text));
  }
  const { subjects } = await server.ssrLoadModule('/src/data/studyData.js');
  const matched = new Set();
  let rows = 0, enriched = 0;
  for (const subject of subjects) for (const material of subject.materials) for (const section of buildConceptSections({ groups: material.detail?.groups })) for (const item of section.items) {
    rows++;
    if (!item.plainMeaning) continue;
    enriched++;
    const note = getPlainConcept(item.name);
    matched.add(note.name);
    assert.equal(item.plainMeaning, note.meaning);
  }
  for (const name of ['Proxy', 'RIP', 'OSPF', '기능적 응집도', '제어 결합도', '후보키', '외래키', '동치 분할']) assert(matched.has(name), `${name}: 개요·세부 학습의 주요 정의 연결`);
  assert(enriched > matched.size, '개요와 세부 카드에서 동일한 정의 재사용');
  let linked = 0;
  for (const q of refreshedWrittenQuestions) {
    const notes = questionConceptNotes(q);
    if (!notes.length) continue;
    const html = renderToStaticMarkup(createElement(AnswerConceptNotes, { question: q }));
    assert(html.includes('정답 용어 정리') && notes.every(n => html.includes(n.name)));
    linked++;
  }
  assert(linked > 180);
  console.log(`PASS: ${rows}개 학습 항목 구조 보존, ${matched.size}개 개념·${enriched}개 학습 항목과 ${linked}개 필답 해설에 쉬운 정의 연결, 숫자·IP·SQL·HTML·공백 보존`);
} finally { await server.close(); }
