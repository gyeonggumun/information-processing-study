import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'rolldown';
import { addSummaryCard, normalizeSummaryPreferences } from '../src/lib/examSummaryPreferences.js';
import { selectSummaryPdfCards } from '../src/lib/personalSummaryPdf.js';
import { validateSummaryPdfAssets } from './validate-summary-pdf-assets.mjs';

mkdirSync('tmp/pdfs', { recursive: true });
const output = resolve('tmp/pdfs/summary-additions-check.mjs');
const modulePath = path => JSON.stringify(resolve(path).replaceAll('\\', '/'));
await build({
  input: 'summary-additions-entry', platform: 'node', external: ['react', 'react-dom/server', 'react-router-dom'],
  plugins: [{ name: 'summary-additions-fixture',
    resolveId(id) {
      if (id === 'summary-additions-entry') return '\0summary-additions-entry';
      if (id === '../contexts/AuthContext') return '\0summary-auth';
      if (id === '../contexts/FavoritesContext') return '\0summary-favorites';
      if (id === '../hooks/useExamSummaryPreferences') return '\0summary-preferences';
    },
    load(id) {
      if (id === '\0summary-auth') return 'export let role; export const setRole = value => {role=value}; export const useAuth = () => ({user:{id:"fixture-owner"},appRole:role});';
      if (id === '\0summary-favorites') return 'export const useFavorites = () => ({error:"",isFavorite:()=>false,toggleFavorite:()=>{}});';
      if (id === '\0summary-preferences') return `
        import {defaultSummaryOrder} from ${modulePath('src/data/examSummaryCatalog.js')};
        export let requestedUser;
        export const useExamSummaryPreferences = userId => {
          requestedUser = userId;
          return {preferences:{cardOrder:defaultSummaryOrder,hiddenCardIds:[]},hasLoaded:true,canEdit:true,isLoading:false};
        };`;
      if (id === '\0summary-additions-entry') return `
        import React from 'react';
        import {renderToString} from 'react-dom/server';
        import {MemoryRouter,Routes,Route} from 'react-router-dom';
        import StudyPage from ${modulePath('src/pages/StudyPage.jsx')};
        import {setRole} from '../contexts/AuthContext';
        export {requestedUser} from '../hooks/useExamSummaryPreferences';
        export * from ${modulePath('src/data/examSummaryCatalog.js')};
        export function renderStudy(role) {
          setRole(role);
          return renderToString(React.createElement(MemoryRouter,{initialEntries:['/study/software-design']},
            React.createElement(Routes,null,React.createElement(Route,{path:'/study/:subjectId',element:React.createElement(StudyPage)}))));
        }`;
    },
  }], output: { file: output, format: 'esm' },
});
const fixture = await import(pathToFileURL(output).href);
const { availableSummaryCards, availableSummaryOrder, defaultSummaryOrder, summaryCardByKey, renderStudy } = fixture;
assert.equal(availableSummaryOrder.length, new Set(availableSummaryOrder).size);
assert(availableSummaryOrder.length > defaultSummaryOrder.length && availableSummaryOrder.length <= 512);
assert(availableSummaryCards.every(({material}) => material.kind === '세부 학습' && material.detail));
for (const role of ['user', null, 'ADMIN', 'pro', 'admin']) {
  const html = renderStudy(role);
  const allowed = role === 'pro' || role === 'admin';
  assert.equal(html.includes('summary-add-button'), allowed, `${role}: 실제 학습 카드 버튼 표시`);
  assert.equal(fixture.requestedUser, allowed ? 'fixture-owner' : undefined, `${role}: 일반 사용자는 요약 설정 조회하지 않음`);
  if (allowed) assert(html.includes('실기 요약에 추가됨') && html.includes('실기 요약에 추가'));
}
const initial = normalizeSummaryPreferences(null, defaultSummaryOrder, availableSummaryOrder);
assert.deepEqual(initial.cardOrder, defaultSummaryOrder);
const customKey = availableSummaryOrder.find(key => !defaultSummaryOrder.includes(key));
const added = addSummaryCard(initial, customKey, availableSummaryOrder);
const reloaded = normalizeSummaryPreferences({card_order:added.cardOrder,hidden_card_ids:[]}, defaultSummaryOrder, availableSummaryOrder);
assert.equal(reloaded.cardOrder.at(-1), customKey);
assert.equal(addSummaryCard(reloaded, customKey, availableSummaryOrder), reloaded);
assert(summaryCardByKey.has(customKey), '실기 요약 조회 맵에서 추가 카드 유지');
const { manifest } = await validateSummaryPdfAssets();
const { subject, material } = summaryCardByKey.get(customKey);
const entry = manifest.cards[material.id];
assert.equal(entry.subject, subject.short);
assert.equal(selectSummaryPdfCards([{id:material.id,subject:subject.short,signature:entry.signature}], manifest).length, 1, '기본 목록 외 카드도 PDF 출력 가능');
console.log(`PASS: User 차단·Pro/Admin 버튼 렌더링, 기본 ${defaultSummaryOrder.length}개 유지, ${availableSummaryOrder.length}개 중 선택 추가·중복 방지·재조회·PDF 연결`);
