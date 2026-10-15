import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'rolldown';

mkdirSync('tmp/pdfs', { recursive: true });
const output = resolve('tmp/pdfs/study-supplement-check.mjs');
const modulePath = (path) => JSON.stringify(resolve(path).replaceAll('\\', '/'));
await build({
  input: 'study-supplement-check-entry', platform: 'node',
  plugins: [{ name: 'verification-entry', resolveId: (id) => id === 'study-supplement-check-entry' ? '\0study-supplement-check-entry' : null,
    load: (id) => id === '\0study-supplement-check-entry' ? `
      export { subjects } from ${modulePath('src/data/studyData.js')};
      export { examSummaryCardIds } from ${modulePath('src/data/examSummaryCards.js')};
      export { supplementStudyMaterials, supplementSummaryCardIds } from ${modulePath('src/data/supplementStudyMaterials.js')};
      export { normalizeSummaryPreferences } from ${modulePath('src/lib/examSummaryPreferences.js')};
    ` : null }],
  output: { file: output, format: 'esm' },
});
const { subjects, examSummaryCardIds, supplementStudyMaterials, supplementSummaryCardIds, normalizeSummaryPreferences } = await import(pathToFileURL(output).href);
const ids = new Set();
const allPatterns = [];
let added = 0;
let selected = 0;
for (const subject of subjects) {
  for (const material of subject.materials) {
    assert(!ids.has(material.id), `중복 ID: ${material.id}`);
    ids.add(material.id);
    if (material.kind === '세부 학습') allPatterns.push(...material.detail.groups.flatMap((group) => group.patterns));
  }
  const materials = supplementStudyMaterials[subject.id];
  let subjectCards = 0;
  for (const material of materials) {
    assert(material.sourceReview.pages.every((page) => Number.isInteger(page) && page >= 1 && page <= 91));
    assert(material.detail.concept.length >= 40);
    assert(subject.materials.some((card) => card.id === material.id && card.kind === '전체 개요'));
    material.detail.groups.forEach((group, index) => {
      const id = `${material.id}--g${index + 1}-p1`;
      const card = subject.materials.find((item) => item.id === id);
      assert(card?.kind === '세부 학습', `누락된 학습 카드: ${id}`);
      assert(group.patterns.length >= 3 && group.patterns.length <= 8, `카드 분량: ${id}`);
      assert.equal(new Set(group.patterns.map(([name]) => name)).size, group.patterns.length);
      for (const pattern of group.patterns) assert(pattern.length === 4 && pattern.every((text) => typeof text === 'string' && text.trim().length >= 5), `설명·예시 누락: ${id}`);
      assert.equal(card.detail.visual.items.length, group.patterns.length, `도식 누락: ${id}`);
      assert.equal(examSummaryCardIds[subject.id].includes(id), group.practical === true, `요약 선정 불일치: ${id}`);
      subjectCards++;
    });
  }
  const selection = supplementSummaryCardIds[subject.id];
  assert.equal(new Set(examSummaryCardIds[subject.id]).size, examSummaryCardIds[subject.id].length);
  assert(examSummaryCardIds[subject.id].every((id) => subject.materials.some((card) => card.id === id && card.kind === '세부 학습')));
  added += subjectCards;
  selected += selection.length;
  console.log(`${subject.short}: 보강 세부 ${subjectCards}개 / 실기 요약 선정 ${selection.length}개`);
}

assert(added >= 55 && selected >= 36);
assert(!allPatterns.some(([name]) => name === '조건/결정 커버리지 (MC/DC)'));
assert(allPatterns.some(([name]) => name === '조건/결정 커버리지 (C/DC)'));
assert(allPatterns.some(([name]) => name === '변경 조건/결정 커버리지 (MC/DC)'));
assert(!allPatterns.some(([name]) => name === '점유와 대기·비선점'));
assert(allPatterns.some(([name]) => name === '점유와 대기 (Hold and Wait)'));
assert(allPatterns.some(([name]) => name === '비선점 (No Preemption)'));
assert(allPatterns.find(([name]) => name.startsWith('SHA-384'))?.[1].includes('384비트'));
assert(allPatterns.find(([name]) => name.startsWith('HashMap'))?.[2].includes('같은 키'));
assert.equal(30000 / 300 / 5, 20);
assert.equal((2 + 4 * 5 + 8) / 6, 5);
const holes = [100, 500, 200, 300, 600];
assert.deepEqual([holes.find((size) => size >= 212), Math.min(...holes.filter((size) => size >= 212)), Math.max(...holes)], [500, 300, 600]);

const defaultOrder = subjects.flatMap((subject) => examSummaryCardIds[subject.id].map((id) => `${subject.id}:${id}`));
const savedOrder = [defaultOrder[1], defaultOrder[0]];
const saved = { card_order: savedOrder, hidden_card_ids: [savedOrder[0]] };
const normalized = normalizeSummaryPreferences(saved, defaultOrder);
assert.deepEqual(normalized.cardOrder.slice(0, 2), savedOrder);
assert.deepEqual(normalized.hiddenCardIds, saved.hidden_card_ids);
assert.equal(normalized.cardOrder.length, defaultOrder.length);
console.log(`PASS: 보강 ${added}개·요약 신규 ${selected}개, 설명·예시·도식·참조·오개념 교정·계산·개인 설정 유지`);
