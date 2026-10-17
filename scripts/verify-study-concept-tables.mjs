import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { buildConceptSections, conceptTextParts } from '../src/lib/studyConceptTable.js';
import { studyUnderstandingNotes } from '../src/data/studyUnderstandingNotes.js';

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
assert.equal(buildConceptSections({ groups: [group] })[0].items[0].explanation, '상세 설명', '별도 보강이 없어도 원리 설명 보존');
for (const [groupName, actualName, noteName] of [
  ['응집도', '순차적 응집도 (Sequential)', '순차적'],
  ['결합도', '스탬프 결합도 (Stamp)', '스탬프'],
  ['정규형 단계', '제2정규형 (2NF)', '2NF'],
  ['블랙박스 테스트', '동치 분할 테스트', '동치 분할'],
  ['화이트박스와 결함 관리', '변경 조건/결정 커버리지 (MC/DC)', 'MC/DC'],
]) {
  const [section] = buildConceptSections({ groups: [{ name: groupName, patterns: [[actualName, '뜻']] }], notes: { [groupName]: { clues: [['정확히 연결한 구별 기준', noteName]] } } });
  assert.equal(section.items[0].hint, '정확히 연결한 구별 기준', `${actualName}: 명시적 별칭 연결`);
}
assert.equal(buildConceptSections({ groups: [{ name: '다른 주제', patterns: [['제2정규형', '뜻']] }], notes: { '다른 주제': { clues: [['잘못 연결되면 안 됨', '2NF']] } } })[0].items[0].hint, undefined, '별칭을 다른 주제에 적용하지 않음');
assert.equal(buildConceptSections({ groups: [{ name: '예시', patterns: [['State', '뜻']] }], notes: { 예시: { clues: [['전략 설명', 'Strategy']] } } })[0].items[0].hint, undefined, '유사 문자열을 임의로 연결하지 않음');

const server = await createServer({ configFile: false, plugins: [react()], server: { middlewareMode: true, hmr: false } });
try {
  const { subjects } = await server.ssrLoadModule('/src/data/studyData.js');
  const { default: Table } = await server.ssrLoadModule('/src/components/StudyConceptTable.jsx');
  const decode = (html) => html.replace(/<[^>]*>/g, '').replace(/&(amp|lt|gt|quot|#x27);/g, (_, key) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#x27': "'" })[key]);
  let materials = 0;
  let rows = 0;
  const enriched = new Set();
  for (const subject of subjects) {
    for (const material of subject.materials) {
      const groups = material.detail?.groups;
      if (!groups?.length) continue;
      const markup = renderToStaticMarkup(createElement(Table, { groups }));
      const text = decode(markup);
      assert.ok(markup.includes('scope="row"'));
      for (const section of groups) {
        if (section.question) assert.ok(text.includes(section.question), `${material.id}: 학습 질문 누락`);
        if (section.memory) assert.ok(text.includes(section.memory), `${material.id}: 기억 기준 누락`);
        for (const [name, meaning, detailText, example] of section.patterns) {
          assert.ok(text.includes(name), `${material.id}: 용어 누락 ${name}`);
          assert.ok(text.includes(meaning), `${material.id}: 설명 누락 ${name}`);
          if (detailText) assert.ok(text.includes(detailText), `${material.id}: 원리 설명 누락 ${name}`);
          if (example) assert.ok(text.includes(example), `${material.id}: 예시 누락 ${name}`);
          rows++;
        }
      }
      for (const [groupName, note] of Object.entries(studyUnderstandingNotes)) {
        if (!groups.some(section => section.name === groupName)) continue;
        assert.ok(text.includes(note.scenario), `${groupName}: 비교 상황 누락`);
        for (const [term, [explanation, contrast]] of Object.entries(note.terms)) {
          if (!text.includes(explanation)) continue;
          assert.ok(text.includes(contrast), `${groupName}/${term}: 구별 기준 누락`);
          enriched.add(`${groupName}:${term}`);
        }
      }
      materials++;
    }
  }
  assert.equal(subjects.length, 5);
  const expected = Object.entries(studyUnderstandingNotes).flatMap(([name, note]) => Object.keys(note.terms).map(term => `${name}:${term}`));
  for (const key of expected) assert.ok(enriched.has(key), `${key}: 실제 학습 항목에 연결되지 않은 보강 설명`);
  console.log(`PASS: 5과목 ${materials}개 자료·${rows}개 용어의 정의·원리·예시 보존, ${Object.keys(studyUnderstandingNotes).length}개 주제·${enriched.size}개 용어의 이해 설명과 구별 기준 연결, 별칭 오연결 방지 검증`);
} finally {
  await server.close();
}
