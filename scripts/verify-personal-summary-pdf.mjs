import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { PDFDocument, PDFName } from 'pdf-lib';
import { composePersonalSummaryPdf, generatePersonalSummaryPdf, getSummaryPdfGuideIds, selectSummaryPdfCards } from '../src/lib/personalSummaryPdf.js';
import { validateSummaryPdfAssets } from './validate-summary-pdf-assets.mjs';

const { data, manifest, atlas, cards } = await validateSummaryPdfAssets();
assert(cards.length > 0);
assert.equal(Object.keys(manifest.cards).length, cards.length);
assert.deepEqual(selectSummaryPdfCards(cards, manifest).map((card) => card.title), (data.atlasSections ?? data.sections).flatMap((section) => section.cards.map((card) => card.title)));
assert.throws(() => selectSummaryPdfCards([], manifest), /카드가 없습니다/);
assert.throws(() => selectSummaryPdfCards([cards[0], cards[0]], manifest), /갱신/);
assert.throws(() => selectSummaryPdfCards([{ ...cards[0], signature: 'stale' }], manifest), /갱신/);
assert.throws(() => selectSummaryPdfCards([{ ...cards[0], subject: 'other' }], manifest), /갱신/);
assert.deepEqual(getSummaryPdfGuideIds([]), []);
assert.deepEqual(getSummaryPdfGuideIds(['cpu-scheduling-calculation--g4-p1']), ['cpu-nonpreemptive']);
assert.deepEqual(getSummaryPdfGuideIds(['cpu-scheduling-calculation--g5-p1']), ['cpu-preemptive']);
assert.deepEqual(getSummaryPdfGuideIds(['cpu-scheduling-calculation--g4-p1', 'cpu-scheduling-calculation--g5-p1']), ['cpu-all']);
assert.deepEqual(getSummaryPdfGuideIds(['subnet-cidr-calculation--g5-p1']), ['subnet-split']);
const byId = new Map(cards.map((card) => [card.id, card]));
const selectedIds = ['security-named-terms-and-authentication--g3-p1', 'relational-model-and-keys--g1-p1', 'database-fundamentals-and-models--g2-p1', 'cpu-scheduling-calculation--g4-p1'];
const selected = selectedIds.map((id) => byId.get(id));
assert.deepEqual(selectSummaryPdfCards(selected, manifest).map((entry) => entry.title), [selectedIds[1], selectedIds[2], selectedIds[0], selectedIds[3]].map((id) => manifest.cards[id].title));
const subjectOrder = [...new Set(cards.map(card => card.subject))];
assert.equal(subjectOrder.length, 5);
const samples = subjectOrder.map(subject => cards.filter(card => card.subject === subject).slice(0, 2));
const interleaved = Object.freeze([1, 0].flatMap(index => [...samples].reverse().map(group => group[index])));
const originalIds = interleaved.map(card => card.id);
const grouped = selectSummaryPdfCards(interleaved, manifest);
assert.deepEqual(grouped.map(entry => entry.subject), subjectOrder.flatMap(subject => [subject, subject]), '섞인 카드를 5과목 순서로 묶음');
assert.deepEqual(grouped.map(entry => entry.title), samples.flatMap(group => [manifest.cards[group[1].id].title, manifest.cards[group[0].id].title]), '과목 안에서는 개인 순서 유지');
assert.deepEqual(interleaved.map(card => card.id), originalIds, '화면·계정의 원본 카드 순서는 변경하지 않음');
assert.equal(grouped.length, interleaved.length, '숨긴 카드나 선택하지 않은 카드를 추가하지 않음');
await assert.rejects(composePersonalSummaryPdf(selected, { ...manifest, sha256: 'wrong' }, atlas), /버전/);
const cancelled = new AbortController();
cancelled.abort();
await assert.rejects(composePersonalSummaryPdf(selected, manifest, atlas, { signal: cancelled.signal }), { name: 'AbortError' });
await assert.rejects(generatePersonalSummaryPdf(selected, { fetchFn: async () => new Response('', { status: 503 }) }), /불러오지/);
mkdirSync('output/pdf', { recursive: true });
for (const [name, selection] of [['personal-summary-example', selected], ['personal-summary-all', cards], ['personal-summary-grouped', interleaved], ['personal-summary-minimal', [byId.get('relational-model-and-keys--g1-p1')]], ['personal-summary-preemptive', [byId.get('cpu-scheduling-calculation--g5-p1')]]]) {
  const bytes = await composePersonalSummaryPdf(selection, manifest, atlas);
  const pdf = await PDFDocument.load(bytes);
  assert(pdf.getPageCount() > 0);
  assert.equal(pdf.getTitle(), '정보처리기사 실기 - 내 실기 요약');
  assert.equal(pdf.getSubject(), `다운로드 시점의 남은 카드 ${selection.length}개, 과목별 정리·과목 내 개인 순서 반영`);
  const bookmarks = [];
  const outline = pdf.catalog.lookup(PDFName.of('Outlines'));
  let ref = outline.get(PDFName.of('First'));
  while (ref) {
    const bookmark = pdf.context.lookup(ref);
    bookmarks.push(bookmark.lookup(PDFName.of('Title')).decodeText());
    ref = bookmark.get(PDFName.of('Next'));
  }
  const expectedBookmarks = [
    ...selectSummaryPdfCards(selection, manifest).map(entry => `${entry.subject} · ${entry.title}`),
    ...getSummaryPdfGuideIds(selection.map(card => card.id)).map(id => manifest.guides[id].title),
  ];
  assert.deepEqual(bookmarks, expectedBookmarks, `${name}: 실제 PDF 책갈피도 과목별 정렬`);
  writeFileSync(`output/pdf/${name}.pdf`, bytes);
  console.log(`${name}: ${selection.length}개 카드, ${pdf.getPageCount()}쪽, ${bytes.length}바이트`);
}
const requests = [];
const bytes = await generatePersonalSummaryPdf([selected[1]], { fetchFn: async (url) => { requests.push(url); return url.endsWith('.json') ? Response.json(manifest) : new Response(atlas); } });
assert.equal((await PDFDocument.load(bytes)).getPageCount(), 1);
assert.deepEqual(requests, ['/downloads/exam-summary-atlas.json', '/downloads/exam-summary-atlas.pdf']);
console.log('PASS: 과목별 묶음·과목 내 개인 순서·원본 불변·삭제 제외·계산 예제·버전 검증·취소·실제 PDF 책갈피 검증');
