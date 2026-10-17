import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { buildConceptSections, conceptTextParts } from '../src/lib/studyConceptTable.js';

const sample = '기본키는 NULL이 될 수 없고 중복될 수 없습니다. 외래키는 별도입니다.';
assert.equal(conceptTextParts(sample).map(part => part.text).join(''), sample);
assert.ok(conceptTextParts(sample).some(part => part.kind === 'caution'));
assert.ok(conceptTextParts(sample).some(part => part.kind === 'key' && part.text === 'NULL'));
assert.equal(conceptTextParts(sample).map(part => part.text).join(''), sample, '반복 호출에서도 원문 보존');
assert.deepEqual(buildConceptSections({}), []);
const visual = { title: '흐름', flow: true, items: [{ name: '입력', meaning: '30,000 LOC' }] };
assert.equal(buildConceptSections({ visual })[0].flow, true);
assert.deepEqual(buildConceptSections({ visual })[0].items, visual.items);
const group = { name: '예시', patterns: [['Factory Method (팩토리 메서드)', '생성 방법', '상세 설명', '예시 원문']] };
assert.equal(buildConceptSections({ groups: [group], notes: { 예시: { clues: [['하위 클래스가 결정', 'Factory Method']] } } })[0].items[0].hint, '하위 클래스가 결정');

const server = await createServer({ configFile: false, plugins: [react()], server: { middlewareMode: true, hmr: false } });
try {
  const { subjects } = await server.ssrLoadModule('/src/data/studyData.js');
  const { default: Table } = await server.ssrLoadModule('/src/components/StudyConceptTable.jsx');
  const decode = (html) => html.replace(/<[^>]*>/g, '').replace(/&(amp|lt|gt|quot|#x27);/g, (_, key) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#x27': "'" })[key]);
  let materials = 0;
  let rows = 0;
  for (const subject of subjects) {
    for (const material of subject.materials) {
      const groups = material.detail?.groups;
      if (!groups?.length) continue;
      const markup = renderToStaticMarkup(createElement(Table, { groups }));
      const text = decode(markup);
      assert.ok(markup.includes('scope="row"'));
      for (const section of groups) {
        for (const [name, meaning, , example] of section.patterns) {
          assert.ok(text.includes(name), `${material.id}: 용어 누락 ${name}`);
          assert.ok(text.includes(meaning), `${material.id}: 설명 누락 ${name}`);
          if (example) assert.ok(text.includes(example), `${material.id}: 예시 누락 ${name}`);
          rows++;
        }
      }
      materials++;
    }
  }
  assert.equal(subjects.length, 5);
  console.log(`PASS: 5과목 ${materials}개 자료·${rows}개 용어의 실제 React 표 렌더링, 설명·예시 원문 보존, 핵심 강조, 흐름·비교 단서 검증`);
} finally {
  await server.close();
}
