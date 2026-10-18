import { PDFDocument, PDFName, PDFHexString, StandardFonts, rgb } from 'pdf-lib';

const ASSET_ROOT = '/downloads/';
const assertActive = (signal) => { if (signal?.aborted) throw new DOMException('PDF 생성을 취소했습니다.', 'AbortError'); };

export function getSummaryPdfGuideIds(cardIds) {
  const selected = new Set(cardIds);
  const has = (prefix, numbers) => numbers.some((number) => selected.has(`${prefix}--g${number}-p1`));
  const guides = [];
  const nonPreemptive = has('cpu-scheduling-calculation', [4]);
  const preemptive = has('cpu-scheduling-calculation', [5]);
  if (has('cpu-scheduling-calculation', [1, 2]) || (nonPreemptive && preemptive)) guides.push('cpu-all');
  else if (nonPreemptive) guides.push('cpu-nonpreemptive');
  else if (preemptive) guides.push('cpu-preemptive');
  if (has('subnet-cidr-calculation', [1, 2, 4])) guides.push('subnet-address');
  if (has('subnet-cidr-calculation', [5])) guides.push('subnet-split');
  if (has('page-replacement-calculation', [1, 2])) guides.push('page-replacement');
  return guides;
}

export function selectSummaryPdfCards(cards, manifest) {
  if (!Array.isArray(cards) || !cards.length) throw new Error('PDF에 담을 카드가 없습니다. 필요한 카드를 복원해주세요.');
  if (manifest.version !== 1) throw new Error('PDF 자료 형식이 변경됐습니다. 페이지를 새로고침해주세요.');
  const seen = new Set();
  const entries = cards.map((card) => {
    const entry = manifest.cards[card.id];
    if (!entry || entry.signature !== card.signature || entry.subject !== card.subject || seen.has(card.id)) throw new Error('학습 자료가 갱신됐습니다. 페이지를 새로고침한 뒤 다시 다운로드해주세요.');
    seen.add(card.id);
    return entry;
  });
  // 조판 목록은 기존 5과목 순서입니다. 선택한 카드만 묶고 과목 안의 개인 순서는 유지합니다.
  const grouped = new Map([...new Set(Object.values(manifest.cards).map(entry => entry.subject))].map(subject => [subject, []]));
  for (const entry of entries) grouped.get(entry.subject).push(entry);
  return [...grouped.values()].flat();
}

function addBookmarks(document, bookmarks) {
  if (!bookmarks.length) return;
  const context = document.context;
  const root = context.nextRef();
  const refs = bookmarks.map(() => context.nextRef());
  bookmarks.forEach((bookmark, index) => {
    context.assign(refs[index], context.obj({
      Title: PDFHexString.fromText(bookmark.title), Parent: root,
      Dest: [bookmark.page.ref, PDFName.of('XYZ'), bookmark.x, bookmark.top, null],
      ...(index ? { Prev: refs[index - 1] } : {}), ...(index < refs.length - 1 ? { Next: refs[index + 1] } : {}),
    }));
  });
  context.assign(root, context.obj({ Type: PDFName.of('Outlines'), First: refs[0], Last: refs.at(-1), Count: refs.length }));
  document.catalog.set(PDFName.of('Outlines'), root);
}

export async function composePersonalSummaryPdf(cards, manifest, atlasBytes, { signal } = {}) {
  assertActive(signal);
  const entries = selectSummaryPdfCards(cards, manifest);
  const digest = await crypto.subtle.digest('SHA-256', atlasBytes);
  const hash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  if (hash !== manifest.sha256) throw new Error('PDF 자료 버전이 일치하지 않습니다. 페이지를 새로고침한 뒤 다시 시도해주세요.');
  const guides = getSummaryPdfGuideIds(cards.map((card) => card.id)).map((id) => manifest.guides[id]);
  if (guides.some((entry) => !entry)) throw new Error('계산 예제 자료를 찾을 수 없습니다. 잠시 후 다시 시도해주세요.');
  const source = await PDFDocument.load(atlasBytes);
  const document = await PDFDocument.create();
  const { pageWidth, pageHeight, margin, columnWidth, gap, bodyTop, bodyBottom } = manifest.layout;
  const parts = [manifest.header, manifest.footer, manifest.intro, ...entries, ...guides];
  for (const part of parts) {
    const page = source.getPage(part.page);
    if (!Number.isFinite(part.height) || part.height <= 0 || part.height > bodyTop - bodyBottom || Math.abs(page.getWidth() - part.width) > 0.02 || Math.abs(page.getHeight() - part.height) > 0.02) throw new Error('PDF 자료의 배치를 확인하지 못했습니다. 다시 시도해주세요.');
  }
  // 선택한 카드 페이지만 삽입하므로 삭제된 카드의 본문은 결과 파일에 포함되지 않습니다.
  const [header, footer, intro, ...embedded] = await document.embedPages(parts.map((part) => source.getPage(part.page)));
  const numberFont = await document.embedFont(StandardFonts.Helvetica);
  const bookmarks = [];
  let page;
  let column = 0;
  let columnTop = bodyTop;
  let y = bodyTop;
  const newPage = () => {
    page = document.addPage([pageWidth, pageHeight]);
    column = 0;
    columnTop = bodyTop;
    y = bodyTop;
  };
  newPage();
  page.drawPage(intro, { x: margin, y: y - intro.height });
  columnTop = y - intro.height - 12;
  y = columnTop;
  entries.forEach((entry, index) => {
    assertActive(signal);
    while (entry.height > y - bodyBottom) {
      if (column === 0) { column = 1; y = columnTop; }
      else newPage();
    }
    const x = margin + column * (columnWidth + gap);
    page.drawPage(embedded[index], { x, y: y - entry.height });
    bookmarks.push({ title: `${entry.subject} · ${entry.title}`, page, x, top: y });
    y -= entry.height + 12;
  });
  if (guides.length) {
    newPage();
    guides.forEach((entry, index) => {
      assertActive(signal);
      if (entry.height > y - bodyBottom) newPage();
      page.drawPage(embedded[entries.length + index], { x: margin, y: y - entry.height });
      bookmarks.push({ title: entry.title, page, x: margin, top: y });
      y -= entry.height + 16;
    });
  }
  document.getPages().forEach((item, index) => {
    item.drawPage(header, { x: margin, y: pageHeight - header.height - 8 });
    item.drawPage(footer, { x: margin, y: 13 });
    const label = `${index + 1} / ${document.getPageCount()}`;
    item.drawText(label, { x: pageWidth - margin - numberFont.widthOfTextAtSize(label, 7.5), y: 17, size: 7.5, font: numberFont, color: rgb(0.32, 0.39, 0.49) });
  });
  addBookmarks(document, bookmarks);
  document.setTitle('정보처리기사 실기 - 내 실기 요약');
  document.setAuthor('정처기학습 플랫폼');
  document.setLanguage('ko-KR');
  document.setSubject(`다운로드 시점의 남은 카드 ${entries.length}개, 과목별 정리·과목 내 개인 순서 반영`);
  assertActive(signal);
  return document.save();
}

export async function generatePersonalSummaryPdf(cards, { signal, fetchFn = globalThis.fetch } = {}) {
  if (!cards.length) throw new Error('PDF에 담을 카드가 없습니다.');
  assertActive(signal);
  const manifestResponse = await fetchFn(`${ASSET_ROOT}exam-summary-atlas.json`, { signal, cache: 'no-cache' });
  if (!manifestResponse.ok) throw new Error('PDF 자료 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
  const manifest = await manifestResponse.json();
  selectSummaryPdfCards(cards, manifest);
  const pdfResponse = await fetchFn(`${ASSET_ROOT}exam-summary-atlas.pdf`, { signal, cache: 'no-cache' });
  if (!pdfResponse.ok) throw new Error('PDF 자료를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
  return composePersonalSummaryPdf(cards, manifest, await pdfResponse.arrayBuffer(), { signal });
}
